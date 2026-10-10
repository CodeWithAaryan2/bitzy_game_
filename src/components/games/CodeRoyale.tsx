/**
 * src/components/games/CodeRoyale.tsx
 * Live multiplayer battle-royale coding game. Host creates a room (6-char
 * code), friends join. Each round everyone gets the SAME question and a
 * countdown. Answer wrong (or too slow) and you lose a life. Lose all
 * lives = eliminated. Last coder standing wins the round pot.
 *
 * Host is authoritative: host's browser runs the round timer, tallies
 * answers, computes eliminations, and broadcasts the result to everyone.
 * This avoids any "everyone computes their own outcome" desync issues.
 *
 * v2 — battle royale feel pass: shrinking "storm" tension bar, kill feed,
 * placement badges (#N), danger pulse near timeout, reason-tagged
 * eliminations (wrong answer / timed out), streak counter, victory rank.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skull, Users, Zap, Trophy, Copy, Check, Loader2, Heart, Timer, Flame, Crown, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS, showRewardedAd } from '@/lib/ads';

interface RoyaleQuestion { id: string; template: string; answer: string; hint: string; }
interface Player {
  user_id: string;
  display_name: string;
  lives: number;
  score: number;
  eliminated: boolean;
  eliminatedRound?: number;
  placement?: number; // 1 = winner. Set once eliminated or game ends.
  streak: number; // consecutive correct answers, resets on wrong
}
interface AnswerSubmission { user_id: string; qIndex: number; answer: string; timeMs: number; }
interface KillFeedEntry { id: string; name: string; reason: 'wrong' | 'timeout'; placement: number; }

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const ROUND_SECONDS = 20;
const DANGER_SECONDS = 5; // pulse + shake below this
const MAX_LIVES = 3;

export default function CodeRoyale({ gameLevelId, onExit, onComplete, onAnswerResult }: { gameLevelId: number; onExit?: () => void; onComplete?: (xp: number, coins: number) => void; onAnswerResult?: (result: { questionIndex: number; isCorrect: boolean }) => void }) {
  const { user, profile } = useAuth() as any;
  const [phase, setPhase] = useState<'menu' | 'lobby' | 'round' | 'reveal' | 'finished'>('menu');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [players, setPlayers] = useState<Record<string, Player>>({});
  const [questions, setQuestions] = useState<RoyaleQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(ROUND_SECONDS);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [iWasEliminated, setIWasEliminated] = useState(false);
  const [myPlacement, setMyPlacement] = useState<number | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null); // for my own reveal flash
  // Ad-gated answer reveal (replaces plain-text hint) — same pattern as CodeDash.
  const [watchingAd, setWatchingAd] = useState(false);
  const autoAdFiredRef = useRef(false);
  const hasAnsweredRef = useRef(false);

  const roundStartRef = useRef<number>(0);
  const submissionsRef = useRef<Record<string, AnswerSubmission>>({});
  const timerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const totalPlayersRef = useRef<number>(0); // frozen at game start, used to compute placements
  const isHostRef = useRef(false); // mirrors isHost state — channel callbacks close over stale state otherwise
  const playersRef = useRef<Record<string, Player>>({});
  const resolvedRef = useRef(false); // guards against timeout-fire + all-answered-fire double-resolving same round

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'Player';

  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { playersRef.current = players; }, [players]);
  useEffect(() => { hasAnsweredRef.current = hasAnswered; }, [hasAnswered]);

  // local per-client countdown — every player ticks their own clock off roundStartRef,
  // not just the host. Host still owns resolution (timeout or all-answered).
  const startLocalTick = (roundQIndex: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    resolvedRef.current = false;
    autoAdFiredRef.current = false;
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartRef.current) / 1000);
      const remaining = ROUND_SECONDS - elapsed;
      setSecondsLeft(Math.max(remaining, 0));
      // Time's about to run out and this player hasn't answered — play the
      // ad now so it finishes and the answer auto-submits before the host
      // resolves the round at 0s.
      if (remaining <= DANGER_SECONDS && !autoAdFiredRef.current && !hasAnsweredRef.current) {
        autoAdFiredRef.current = true;
        revealAnswer();
      }
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (isHostRef.current && !resolvedRef.current) {
          resolvedRef.current = true;
          resolveRound(roundQIndex);
        }
      }
    }, 500);
  };

  // ── load question set ──
  useEffect(() => {
    supabase.from('game_levels').select('questions').eq('id', gameLevelId).single()
      .then(({ data }) => { if (data) setQuestions(JSON.parse(data.questions)); });
  }, [gameLevelId]);

  const alivePlayers = () => Object.values(players).filter(p => !p.eliminated);

  const setupChannel = (rid: string) => {
    const channel = supabase.channel(`royale:${rid}`, { config: { presence: { key: user.id } } });

    channel.on('broadcast', { event: 'roster' }, ({ payload }: any) => {
      setPlayers(payload.players);
    });

    channel.on('broadcast', { event: 'round_start' }, ({ payload }: any) => {
      submissionsRef.current = {};
      setHasAnswered(false);
      setAnswerInput('');
      setQIndex(payload.qIndex);
      roundStartRef.current = Date.now();
      setSecondsLeft(ROUND_SECONDS);
      setLastCorrect(null); setWatchingAd(false);
      setPhase('round');
      startLocalTick(payload.qIndex); // every client ticks its own clock, not just host
    });

    channel.on('broadcast', { event: 'answer' }, ({ payload }: AnswerSubmission | any) => {
      submissionsRef.current[payload.user_id] = payload;
      // host: resolve as soon as every alive player locked in — don't wait for clock
      if (isHostRef.current) {
        const aliveIds = Object.values(playersRef.current).filter(p => !p.eliminated).map(p => p.user_id);
        const allIn = aliveIds.length > 0 && aliveIds.every(id => submissionsRef.current[id]);
        if (allIn && !resolvedRef.current) {
          resolvedRef.current = true;
          if (timerRef.current) clearInterval(timerRef.current);
          resolveRound(payload.qIndex);
        }
      }
    });

    channel.on('broadcast', { event: 'round_result' }, ({ payload }: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setPlayers(payload.players);
      setKillFeed(payload.killFeed);
      const mine = payload.killFeed.find((k: KillFeedEntry) => k.id === user.id);
      setIWasEliminated(!!mine);
      setMyPlacement(mine ? mine.placement : null);
      const myAnswerWasCorrect = payload.correctIds.includes(user.id);
      setLastCorrect(myAnswerWasCorrect);
      onAnswerResult?.({ questionIndex: Number(payload.qIndex ?? qIndex), isCorrect: myAnswerWasCorrect });
      setPhase('reveal');
    });

    channel.on('broadcast', { event: 'game_over' }, ({ payload }: any) => {
      setPlayers(payload.players);
      setPhase('finished');
      const me = payload.players[user.id];
      if (me) {
        const bonus = payload.winnerId === user.id ? 80 : me.placement ? Math.max(10, 50 - me.placement * 8) : 20;
        onComplete?.(bonus, Math.round(bonus / 2));
      }
    });

    channel.subscribe();
    channelRef.current = channel;
    return channel;
  };

  const createRoom = async () => {
    if (!user) return;
    setLoading(true);
    const code = genCode();
    const { data, error: err } = await supabase.from('royale_rooms').insert({
      room_code: code, host_id: user.id, game_level_id: gameLevelId, status: 'waiting',
    }).select().single();
    if (err) { setError(err.message); setLoading(false); return; }

    await supabase.from('royale_participants').insert({
      room_id: data.id, user_id: user.id, display_name: myName, lives: MAX_LIVES, score: 0,
    });

    setRoomId(data.id); setRoomCode(code); setIsHost(true);
    const initialPlayers = { [user.id]: { user_id: user.id, display_name: myName, lives: MAX_LIVES, score: 0, eliminated: false, streak: 0 } };
    setPlayers(initialPlayers);
    setupChannel(data.id);
    setPhase('lobby');
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!user || !joinInput.trim()) return;
    setLoading(true); setError('');
    const code = joinInput.trim().toUpperCase();
    const { data: room, error: findErr } = await supabase.from('royale_rooms')
      .select('*').eq('room_code', code).eq('status', 'waiting').maybeSingle();
    if (findErr || !room) { setError('Room not found or already started.'); setLoading(false); return; }

    await supabase.from('royale_participants').upsert({
      room_id: room.id, user_id: user.id, display_name: myName, lives: MAX_LIVES, score: 0,
    }, { onConflict: 'room_id,user_id' });

    const { data: participants } = await supabase.from('royale_participants').select('*').eq('room_id', room.id);
    const pMap: Record<string, Player> = {};
    (participants || []).forEach((p: any) => {
      pMap[p.user_id] = { user_id: p.user_id, display_name: p.display_name, lives: p.lives, score: p.score, eliminated: p.lives <= 0, streak: 0 };
    });

    setRoomId(room.id); setRoomCode(room.room_code); setIsHost(false);
    setPlayers(pMap);
    const channel = setupChannel(room.id);
    channel.send({ type: 'broadcast', event: 'roster', payload: { players: pMap } });
    setPhase('lobby');
    setLoading(false);
  };

  // ── HOST ONLY: drive rounds ──
  const startNextRound = async (startIndex: number) => {
    if (!roomId) return;
    submissionsRef.current = {};
    channelRef.current?.send({ type: 'broadcast', event: 'round_start', payload: { qIndex: startIndex } });
    roundStartRef.current = Date.now();
    setQIndex(startIndex);
    setHasAnswered(false);
    setAnswerInput('');
    setSecondsLeft(ROUND_SECONDS);
    setLastCorrect(null); setWatchingAd(false);
    setPhase('round');
    startLocalTick(startIndex);
  };

  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

  const resolveRound = async (roundQIndex: number) => {
    const q = questions[roundQIndex];
    if (!q) return;
    const killFeed: KillFeedEntry[] = [];
    const correctIds: string[] = [];
    const nextPlayers: Record<string, Player> = { ...players };

    // placements assigned from the back: whoever dies in the round with the fewest
    // survivors remaining gets the worst placement. We compute a running counter.
    let aliveBeforeRound = Object.values(players).filter(p => !p.eliminated).length;
    const willBeEliminated: string[] = [];

    for (const p of Object.values(players)) {
      if (p.eliminated) continue;
      const sub = submissionsRef.current[p.user_id];
      const correct = sub && normalize(sub.answer) === normalize(q.answer);
      if (correct) {
        correctIds.push(p.user_id);
        const speedBonus = Math.max(0, 20 - Math.floor(sub.timeMs / 1000));
        nextPlayers[p.user_id] = { ...p, score: p.score + 10 + speedBonus, streak: p.streak + 1 };
      } else {
        const lives = p.lives - 1;
        const eliminated = lives <= 0;
        nextPlayers[p.user_id] = { ...p, lives, eliminated, streak: 0, eliminatedRound: eliminated ? roundQIndex : undefined };
        if (eliminated) willBeEliminated.push(p.user_id);
      }
    }

    // placement = position counting from last place. If 5 alive before round and 2 die,
    // they take places #5 and #4 (order between them by score, lower score dies "earlier").
    willBeEliminated.sort((a, b) => nextPlayers[a].score - nextPlayers[b].score);
    willBeEliminated.forEach((id, i) => {
      const placement = aliveBeforeRound - i;
      nextPlayers[id] = { ...nextPlayers[id], placement };
      const sub = submissionsRef.current[id];
      killFeed.push({ id, name: nextPlayers[id].display_name, reason: sub ? 'wrong' : 'timeout', placement });
    });

    if (timerRef.current) clearInterval(timerRef.current);
    setPlayers(nextPlayers);
    channelRef.current?.send({ type: 'broadcast', event: 'round_result', payload: { players: nextPlayers, killFeed, correctIds, qIndex: roundQIndex } });

    // persist
    for (const p of Object.values(nextPlayers)) {
      await supabase.from('royale_participants').update({ lives: p.lives, score: p.score })
        .eq('room_id', roomId).eq('user_id', p.user_id);
    }

    const mine = killFeed.find(k => k.id === user.id);
    setIWasEliminated(!!mine);
    setMyPlacement(mine ? mine.placement : null);
    setLastCorrect(correctIds.includes(user.id));
    setKillFeed(killFeed);
    setPhase('reveal');

    const stillAlive = Object.values(nextPlayers).filter(p => !p.eliminated);
    const isLastQuestion = roundQIndex + 1 >= questions.length;
    if (stillAlive.length <= 1 || isLastQuestion) {
      let finalPlayers = nextPlayers;
      if (stillAlive.length === 1) {
        finalPlayers = { ...nextPlayers, [stillAlive[0].user_id]: { ...stillAlive[0], placement: 1 } };
      } else if (isLastQuestion) {
        // sudden-death tie: rank remaining alive players by score, best gets #1
        const ranked = stillAlive.sort((a, b) => b.score - a.score);
        ranked.forEach((p, i) => { finalPlayers[p.user_id] = { ...p, placement: i + 1 }; });
      }
      const winner = Object.values(finalPlayers).find(p => p.placement === 1)
        ?? Object.values(finalPlayers).sort((a, b) => b.score - a.score)[0];
      setTimeout(async () => {
        await supabase.from('royale_rooms').update({ status: 'finished' }).eq('id', roomId);
        channelRef.current?.send({ type: 'broadcast', event: 'game_over', payload: { players: finalPlayers, winnerId: winner?.user_id } });
      }, 2800);
    }
  };

  const advanceFromReveal = () => {
    if (!isHost) return;
    const stillAlive = Object.values(players).filter(p => !p.eliminated);
    const isLastQuestion = qIndex + 1 >= questions.length;
    if (stillAlive.length <= 1 || isLastQuestion) return; // game_over already scheduled
    startNextRound(qIndex + 1);
  };

  const startGame = async () => {
    if (!roomId) return;
    totalPlayersRef.current = Object.keys(players).length;
    await supabase.from('royale_rooms').update({ status: 'racing', started_at: new Date().toISOString() }).eq('id', roomId);
    startNextRound(0);
  };

  const submitAnswer = (override?: string) => {
    if (hasAnswered || (!override && !answerInput.trim())) return;
    setHasAnswered(true);
    const finalAnswer = override ?? answerInput;
    const payload: AnswerSubmission = { user_id: user.id, qIndex, answer: finalAnswer, timeMs: Date.now() - roundStartRef.current };
    submissionsRef.current[user.id] = payload;
    channelRef.current?.send({ type: 'broadcast', event: 'answer', payload });
  };

  // Reveals the real answer directly (no hint) — watches a rewarded ad
  // first, then auto-fills and auto-submits the correct answer.
  const revealAnswer = async () => {
    if (hasAnsweredRef.current || watchingAd) return;
    setWatchingAd(true);
    await showRewardedAd(AD_UNITS.hint);
    setWatchingAd(false);
    const q = questions[qIndex];
    if (!q || hasAnsweredRef.current) return;
    setAnswerInput(q.answer);
    submitAnswer(q.answer);
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => () => {
    channelRef.current?.unsubscribe();
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const rankedPlayers = Object.values(players).sort((a, b) => {
    if (!!a.placement && !!b.placement) return a.placement - b.placement;
    if (a.placement) return 1; // has placement = already out, sink below alive
    if (b.placement) return -1;
    if (a.eliminated !== b.eliminated) return a.eliminated ? 1 : -1;
    return b.score - a.score;
  });

  const totalStart = totalPlayersRef.current || Object.keys(players).length;
  const stormPct = questions.length ? Math.round(((qIndex + 1) / questions.length) * 100) : 0;
  const inDanger = phase === 'round' && secondsLeft <= DANGER_SECONDS;

  // ───────────── MENU ─────────────
  if (phase === 'menu') return (
    <div className="max-w-md mx-auto space-y-4 text-center py-10">
      {onExit && <button onClick={onExit} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back</button>}
      <Skull className="w-10 h-10 mx-auto" style={{ color: '#8B5CF6' }} />
      <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Code Royale</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Same question, everyone at once. Miss it and lose a life. Last coder standing wins.</p>
      <button onClick={createRoom} disabled={loading} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Room'}
      </button>
      <div className="flex gap-2">
        <input value={joinInput} onChange={e => setJoinInput(e.target.value)} placeholder="Enter room code"
          className="flex-1 px-3 py-3 rounded-xl border text-center font-mono uppercase" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }} />
        <button onClick={joinRoom} disabled={loading} className="px-5 rounded-xl font-bold text-white" style={{ backgroundColor: '#1CB0F6' }}>Join</button>
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );

  // ───────────── LOBBY ─────────────
  if (phase === 'lobby') return (
    <div className="max-w-md mx-auto space-y-5 text-center py-10">
      {onExit && <button onClick={onExit} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back</button>}
      <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Room Code</p>
      <div className="flex items-center justify-center gap-2">
        <div className="text-4xl font-black tracking-widest" style={{ color: 'var(--text)' }}>{roomCode}</div>
        <button onClick={copyCode} className="p-2 rounded-lg" style={{ backgroundColor: 'var(--surface)' }}>
          {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
        </button>
      </div>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Share this code — need at least 2 players</p>

      <div className="d-card p-4 space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text)' }}>
          <Users className="w-4 h-4" /> Players ({Object.keys(players).length})
        </div>
        {Object.values(players).map(p => (
          <div key={p.user_id} className="flex items-center justify-between text-sm" style={{ color: 'var(--text-muted)' }}>
            <span>💀 {p.display_name}</span>
            <span className="flex gap-0.5">{Array.from({ length: MAX_LIVES }).map((_, i) => <Heart key={i} className="w-3.5 h-3.5" style={{ color: '#FF4B4B' }} fill="#FF4B4B" />)}</span>
          </div>
        ))}
      </div>

      {isHost ? (
        <button onClick={startGame} disabled={Object.keys(players).length < 2}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ backgroundColor: '#8B5CF6' }}>
          {Object.keys(players).length < 2 ? 'Waiting for more players...' : 'Drop In! 🪂'}
        </button>
      ) : (
        <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Waiting for host to start...</p>
      )}
    </div>
  );

  // ───────────── ROUND ─────────────
  if (phase === 'round') {
    const q = questions[qIndex];
    const iAmAlive = !players[user.id]?.eliminated;
    const myStreak = players[user.id]?.streak ?? 0;
    return (
      <motion.div
        className="max-w-2xl mx-auto space-y-6 py-8"
        animate={inDanger ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.4, repeat: inDanger ? Infinity : 0, repeatDelay: 0.6 }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onExit && <button onClick={onExit} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back</button>}
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text)' }}>
              <Skull className="w-4 h-4" style={{ color: '#8B5CF6' }} /> {alivePlayers().length}/{totalStart} alive
            </div>
          </div>
          <motion.div
            className="flex items-center gap-1.5 text-sm font-black"
            style={{ color: inDanger ? '#FF4B4B' : 'var(--text)' }}
            animate={inDanger ? { scale: [1, 1.15, 1] } : { scale: 1 }}
            transition={{ duration: 0.6, repeat: inDanger ? Infinity : 0 }}
          >
            <Timer className="w-4 h-4" /> {secondsLeft}s
          </motion.div>
        </div>

        {/* storm bar — how far into the match we are, not just this round's clock */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
            <span>Round {qIndex + 1} / {questions.length}</span>
            <span>Storm closing in</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
            <motion.div className="h-full rounded-full" style={{ backgroundColor: '#FF4B4B' }} animate={{ width: `${stormPct}%` }} transition={{ duration: 0.5 }} />
          </div>
        </div>

        <div className="d-progress h-2 rounded-full overflow-hidden">
          <motion.div className="d-progress-fill h-full rounded-full" style={{ backgroundColor: inDanger ? '#FF4B4B' : '#8B5CF6' }}
            animate={{ width: `${(secondsLeft / ROUND_SECONDS) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>

        {/* mini roster with lives */}
        <div className="flex flex-wrap gap-2">
          {rankedPlayers.map(p => (
            <div key={p.user_id} className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold"
              style={{ backgroundColor: p.eliminated ? 'var(--surface)' : 'rgba(139,92,246,0.12)', color: p.eliminated ? 'var(--text-muted)' : '#8B5CF6', textDecoration: p.eliminated ? 'line-through' : 'none' }}>
              {p.display_name} · {Array.from({ length: p.lives }).map(() => '❤️').join('')}
              {p.streak >= 3 && !p.eliminated && <Flame className="w-2.5 h-2.5" style={{ color: '#FFC800' }} />}
            </div>
          ))}
        </div>

        {!iAmAlive ? (
          <div className="d-card p-6 text-center">
            <Skull className="w-8 h-8 mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="font-bold" style={{ color: 'var(--text-muted)' }}>You're eliminated — watching the rest of the round.</p>
          </div>
        ) : q && (
          <div className="d-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Round {qIndex + 1}</p>
              {myStreak >= 2 && (
                <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#FFC800' }}>
                  <Flame className="w-3.5 h-3.5" /> {myStreak} streak
                </span>
              )}
            </div>
            <pre className="p-4 rounded-xl font-mono text-sm overflow-x-auto" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
              {q.template}
            </pre>
            <input value={answerInput} onChange={e => setAnswerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder={hasAnswered ? 'Answer locked in!' : 'Fill in the blank...'} autoFocus disabled={hasAnswered}
              className="w-full px-4 py-3 rounded-xl border font-mono disabled:opacity-50" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }} />
            {!hasAnswered && (
              watchingAd ? (
                <p className="flex items-center gap-2 text-xs font-bold" style={{ color: '#FF9600' }}>
                  <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Watching ad — answer incoming…
                </p>
              ) : (
                <WatchAdButton
                  adUnitId={AD_UNITS.hint}
                  label="Watch ad to reveal answer"
                  onReward={revealAnswer}
                  className="text-xs font-bold"
                  style={{ color: '#8B5CF6' }}
                />
              )
            )}
            <button onClick={() => submitAnswer()} disabled={hasAnswered}
              className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50" style={{ backgroundColor: inDanger ? '#FF4B4B' : '#8B5CF6' }}>
              {hasAnswered ? '✓ Locked In' : inDanger ? 'LOCK IN NOW!' : 'Lock In Answer'}
            </button>
          </div>
        )}
      </motion.div>
    );
  }

  // ───────────── REVEAL ─────────────
  if (phase === 'reveal') {
    return (
      <div className="max-w-md mx-auto space-y-4 text-center py-10">
        <AnimatePresence mode="wait">
          {iWasEliminated ? (
            <motion.div key="dead" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-2">
              <Skull className="w-12 h-12 mx-auto" style={{ color: '#FF4B4B' }} />
              <h2 className="font-display text-xl font-bold" style={{ color: '#FF4B4B' }}>Eliminated — #{myPlacement} place</h2>
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Out of lives — nice run though.</p>
            </motion.div>
          ) : lastCorrect ? (
            <motion.div key="alive" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-2">
              <Zap className="w-12 h-12 mx-auto" style={{ color: '#8B5CF6' }} />
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Nailed it — still in!</h2>
            </motion.div>
          ) : (
            <motion.div key="hit" initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="space-y-2">
              <Heart className="w-12 h-12 mx-auto" style={{ color: '#FF4B4B' }} />
              <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Missed it — lost a life</h2>
            </motion.div>
          )}
        </AnimatePresence>

        {/* kill feed */}
        {killFeed.length > 0 && (
          <div className="space-y-1">
            {killFeed.map(k => (
              <motion.div key={k.id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg text-left flex items-center gap-1.5" style={{ backgroundColor: 'rgba(255,75,76,0.1)', color: '#FF4B4B' }}>
                <Skull className="w-3 h-3" /> {k.name} eliminated {k.reason === 'timeout' ? '(ran out of time)' : '(wrong answer)'} · #{k.placement}
              </motion.div>
            ))}
          </div>
        )}

        <div className="space-y-1.5">
          {rankedPlayers.map(p => (
            <div key={p.user_id} className="d-card p-2.5 flex items-center justify-between"
              style={{ opacity: p.eliminated ? 0.5 : 1, borderColor: killFeed.some(k => k.id === p.user_id) ? '#FF4B4B' : 'var(--border)' }}>
              <span className="text-sm font-bold flex items-center gap-1.5" style={{ color: 'var(--text)', textDecoration: p.eliminated ? 'line-through' : 'none' }}>
                {p.eliminated && p.placement && <span style={{ color: 'var(--text-muted)' }}>#{p.placement}</span>}
                {p.display_name} {killFeed.some(k => k.id === p.user_id) && '💀'}
              </span>
              <span className="text-xs font-bold" style={{ color: '#FFC800' }}>{p.score} pts</span>
            </div>
          ))}
        </div>
        {isHost && (
          <button onClick={advanceFromReveal} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>
            {alivePlayers().length <= 1 || qIndex + 1 >= questions.length ? 'Finishing up...' : 'Next Round →'}
          </button>
        )}
        {!isHost && <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Waiting for host to continue...</p>}
      </div>
    );
  }

  // ───────────── FINISHED ─────────────
  const winner = rankedPlayers[0];
  const iWon = winner?.user_id === user.id;
  return (
    <div className="max-w-md mx-auto space-y-4 text-center py-10">
      <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <Trophy className="w-14 h-14 mx-auto" style={{ color: '#FFC800' }} />
      </motion.div>
      <h2 className="font-display text-2xl font-black" style={{ color: 'var(--text)' }}>
        {iWon ? 'VICTORY ROYALE! 🎉' : `You placed #${players[user.id]?.placement ?? rankedPlayers.findIndex(p => p.user_id === user.id) + 1}`}
      </h2>
      <div className="space-y-2">
        {rankedPlayers.map((p, i) => (
          <motion.div key={p.user_id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
            className="d-card p-3 flex items-center justify-between" style={{ borderColor: p.user_id === user.id ? '#8B5CF6' : 'var(--border)' }}>
            <span className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              {i === 0 ? <Crown className="w-4 h-4" style={{ color: '#FFC800' }} /> : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`} {p.display_name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{p.score} pts</span>
          </motion.div>
        ))}
      </div>
      <button onClick={() => onExit ? onExit() : setPhase('menu')} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#1CB0F6' }}>
        Back to Arena
      </button>
    </div>
  );
}