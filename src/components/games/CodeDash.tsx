/**
 * src/components/games/CodeDash.tsx
 * Multiplayer coding runner. Friends race side-by-side on a horizontal
 * track. Every player gets the SAME question at the SAME time. Correct +
 * fast answer = big jump forward. Wrong or slow = stumble, lose ground.
 * First runner to cross finish line (or furthest at time cap) wins.
 *
 * Visual DNA: Chrome-dino / Doodle-Jump energy — runners visibly leap
 * across the track, screen shakes on stumble, confetti + camera zoom on
 * finish. Not a quiz screen with a progress bar; feels like a race.
 *
 * Same host-authoritative pattern as CodeRoyale: host's browser is source
 * of truth for timing + scoring, broadcasts state to everyone else.
 */
import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Rocket, Users, Copy, Check, Loader2, Timer, Flag, Flame, PlayCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS, showRewardedAd } from '@/lib/ads';

interface DashQuestion { id: string; template: string; answer: string; hint: string; }
interface Runner {
  user_id: string;
  display_name: string;
  progress: number; // 0-100, position on track
  streak: number;
  finished: boolean;
  finishRank?: number;
  lastJump: 'idle' | 'jump' | 'stumble';
}
interface AnswerSubmission { user_id: string; qIndex: number; answer: string; timeMs: number; }

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();
const QUESTION_SECONDS = 12; // faster than Royale — races feel snappy, not quiz-like
const DANGER_SECONDS = 4;
const JUMP_BASE = 8;      // min progress gain per correct answer
const JUMP_SPEED_BONUS = 10; // extra progress for fast correct answers
const STUMBLE_PENALTY = 5;   // progress lost on wrong/timeout
const FINISH_LINE = 100;

export default function CodeDash({ gameLevelId, onExit, onComplete, onAnswerResult }: { gameLevelId: number; onExit?: () => void; onComplete?: (xp: number, coins: number) => void; onAnswerResult?: (result: { questionIndex: number; isCorrect: boolean }) => void }) {
  const { user, profile } = useAuth() as any;
  const [phase, setPhase] = useState<'menu' | 'lobby' | 'race' | 'finished'>('menu');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [runners, setRunners] = useState<Record<string, Runner>>({});
  const [questions, setQuestions] = useState<DashQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [hasAnswered, setHasAnswered] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(QUESTION_SECONDS);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [myLastResult, setMyLastResult] = useState<'jump' | 'stumble' | null>(null);
  // Ad-gated answer reveal (replaces plain-text hint): watching the ad
  // fills in and submits the real answer directly. Also fires
  // automatically once this player's local timer hits zero unanswered.
  const [watchingAd, setWatchingAd] = useState(false);
  const autoAdFiredRef = useRef(false);

  const roundStartRef = useRef<number>(0);
  const submissionsRef = useRef<Record<string, AnswerSubmission>>({});
  const timerRef = useRef<any>(null);
  const channelRef = useRef<any>(null);
  const isHostRef = useRef(false);
  const runnersRef = useRef<Record<string, Runner>>({});
  const resolvedRef = useRef(false);
  const hasAnsweredRef = useRef(false);

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'Player';

  useEffect(() => { isHostRef.current = isHost; }, [isHost]);
  useEffect(() => { runnersRef.current = runners; }, [runners]);
  useEffect(() => { hasAnsweredRef.current = hasAnswered; }, [hasAnswered]);

  useEffect(() => {
    supabase.from('game_levels').select('questions').eq('id', gameLevelId).single()
      .then(({ data }) => { if (data) setQuestions(JSON.parse(data.questions)); });
  }, [gameLevelId]);

  const startLocalTick = (idx: number) => {
    if (timerRef.current) clearInterval(timerRef.current);
    resolvedRef.current = false;
    autoAdFiredRef.current = false;
    timerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - roundStartRef.current) / 1000);
      const remaining = QUESTION_SECONDS - elapsed;
      setSecondsLeft(Math.max(remaining, 0));
      // Time's about to run out and this player hasn't answered — show the
      // ad now so it finishes and the answer auto-submits before the host
      // resolves the round at 0s.
      if (remaining <= DANGER_SECONDS && !autoAdFiredRef.current && !hasAnsweredRef.current) {
        autoAdFiredRef.current = true;
        revealAnswer();
      }
      if (remaining <= 0) {
        clearInterval(timerRef.current);
        if (isHostRef.current && !resolvedRef.current) { resolvedRef.current = true; resolveQuestion(idx); }
      }
    }, 500);
  };

  const setupChannel = (rid: string) => {
    const channel = supabase.channel(`dash:${rid}`, { config: { presence: { key: user.id } } });

    channel.on('broadcast', { event: 'roster' }, ({ payload }: any) => setRunners(payload.runners));

    channel.on('broadcast', { event: 'question_start' }, ({ payload }: any) => {
      submissionsRef.current = {};
      setHasAnswered(false);
      setAnswerInput('');
      setMyLastResult(null); setWatchingAd(false);
      setQIndex(payload.qIndex);
      roundStartRef.current = Date.now();
      setSecondsLeft(QUESTION_SECONDS);
      setPhase('race');
      startLocalTick(payload.qIndex);
    });

    channel.on('broadcast', { event: 'answer' }, ({ payload }: AnswerSubmission | any) => {
      submissionsRef.current[payload.user_id] = payload;
      if (isHostRef.current) {
        const activeIds = Object.values(runnersRef.current).filter(r => !r.finished).map(r => r.user_id);
        const allIn = activeIds.length > 0 && activeIds.every(id => submissionsRef.current[id]);
        if (allIn && !resolvedRef.current) { resolvedRef.current = true; if (timerRef.current) clearInterval(timerRef.current); resolveQuestion(payload.qIndex); }
      }
    });

    channel.on('broadcast', { event: 'question_result' }, ({ payload }: any) => {
      if (timerRef.current) clearInterval(timerRef.current);
      setRunners(payload.runners);
      const mine = payload.runners[user.id];
      setMyLastResult(mine?.lastJump === 'stumble' ? 'stumble' : mine?.lastJump === 'jump' ? 'jump' : null);
      onAnswerResult?.({ questionIndex: Number(payload.qIndex ?? qIndex), isCorrect: mine?.lastJump === 'jump' });
      if (payload.raceOver) {
        setPhase('finished');
        const me = payload.runners[user.id];
        if (me) {
          const bonus = me.finishRank === 1 ? 80 : me.finishRank ? Math.max(15, 55 - me.finishRank * 10) : 15;
          onComplete?.(bonus, Math.round(bonus / 2));
        }
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
    const { data, error: err } = await supabase.from('dash_rooms').insert({
      room_code: code, host_id: user.id, game_level_id: gameLevelId, status: 'waiting',
    }).select().single();
    if (err) { setError(err.message); setLoading(false); return; }
    await supabase.from('dash_runners').insert({ room_id: data.id, user_id: user.id, display_name: myName, progress: 0 });
    setRoomId(data.id); setRoomCode(code); setIsHost(true);
    const initial = { [user.id]: { user_id: user.id, display_name: myName, progress: 0, streak: 0, finished: false, lastJump: 'idle' as const } };
    setRunners(initial);
    setupChannel(data.id);
    setPhase('lobby');
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!user || !joinInput.trim()) return;
    setLoading(true); setError('');
    const code = joinInput.trim().toUpperCase();
    const { data: room, error: findErr } = await supabase.from('dash_rooms')
      .select('*').eq('room_code', code).eq('status', 'waiting').maybeSingle();
    if (findErr || !room) { setError('Room not found or already started.'); setLoading(false); return; }
    await supabase.from('dash_runners').upsert({ room_id: room.id, user_id: user.id, display_name: myName, progress: 0 }, { onConflict: 'room_id,user_id' });
    const { data: existing } = await supabase.from('dash_runners').select('*').eq('room_id', room.id);
    const rMap: Record<string, Runner> = {};
    (existing || []).forEach((r: any) => { rMap[r.user_id] = { user_id: r.user_id, display_name: r.display_name, progress: r.progress, streak: 0, finished: r.progress >= FINISH_LINE, lastJump: 'idle' }; });
    setRoomId(room.id); setRoomCode(room.room_code); setIsHost(false);
    setRunners(rMap);
    const channel = setupChannel(room.id);
    channel.send({ type: 'broadcast', event: 'roster', payload: { runners: rMap } });
    setPhase('lobby');
    setLoading(false);
  };

  const startNextQuestion = (idx: number) => {
    if (!roomId) return;
    submissionsRef.current = {};
    channelRef.current?.send({ type: 'broadcast', event: 'question_start', payload: { qIndex: idx } });
    roundStartRef.current = Date.now();
    setQIndex(idx);
    setHasAnswered(false);
    setAnswerInput('');
    setMyLastResult(null); setWatchingAd(false);
    setSecondsLeft(QUESTION_SECONDS);
    setPhase('race');
    startLocalTick(idx);
  };

  const normalize = (s: string) => s.trim().replace(/\s+/g, ' ');

  const resolveQuestion = async (idx: number) => {
    const q = questions[idx];
    if (!q) return;
    const nextRunners: Record<string, Runner> = { ...runners };
    let anyFinishedThisRound = false;

    for (const r of Object.values(runners)) {
      if (r.finished) continue;
      const sub = submissionsRef.current[r.user_id];
      const correct = sub && normalize(sub.answer) === normalize(q.answer);
      if (correct) {
        const speedBonus = Math.round(JUMP_SPEED_BONUS * Math.max(0, 1 - sub.timeMs / (QUESTION_SECONDS * 1000)));
        const gain = JUMP_BASE + speedBonus;
        const progress = Math.min(FINISH_LINE, r.progress + gain);
        const finished = progress >= FINISH_LINE;
        if (finished) anyFinishedThisRound = true;
        nextRunners[r.user_id] = { ...r, progress, streak: r.streak + 1, finished, lastJump: 'jump' };
      } else {
        const progress = Math.max(0, r.progress - STUMBLE_PENALTY);
        nextRunners[r.user_id] = { ...r, progress, streak: 0, lastJump: 'stumble' };
      }
    }

    // rank anyone who crossed the line this round, in order of who submitted fastest among finishers
    if (anyFinishedThisRound) {
      const alreadyRanked = Object.values(nextRunners).filter(r => r.finishRank).length;
      const newlyFinished = Object.values(nextRunners)
        .filter(r => r.finished && !r.finishRank)
        .sort((a, b) => (submissionsRef.current[a.user_id]?.timeMs ?? 9e9) - (submissionsRef.current[b.user_id]?.timeMs ?? 9e9));
      newlyFinished.forEach((r, i) => { nextRunners[r.user_id] = { ...nextRunners[r.user_id], finishRank: alreadyRanked + i + 1 }; });
    }

    setRunners(nextRunners);

    for (const r of Object.values(nextRunners)) {
      await supabase.from('dash_runners').update({ progress: r.progress }).eq('room_id', roomId).eq('user_id', r.user_id);
    }

    const stillRacing = Object.values(nextRunners).filter(r => !r.finished);
    const isLastQuestion = idx + 1 >= questions.length;
    const raceOver = stillRacing.length === 0 || isLastQuestion;

    let finalRunners = nextRunners;
    if (raceOver && isLastQuestion && stillRacing.length > 0) {
      // time/questions ran out with people still on track — rank by progress
      const alreadyRanked = Object.values(finalRunners).filter(r => r.finishRank).length;
      const ranked = stillRacing.sort((a, b) => b.progress - a.progress);
      ranked.forEach((r, i) => { finalRunners[r.user_id] = { ...finalRunners[r.user_id], finishRank: alreadyRanked + i + 1 }; });
    }

    channelRef.current?.send({ type: 'broadcast', event: 'question_result', payload: { runners: finalRunners, raceOver, qIndex: idx } });

    if (raceOver) {
      await supabase.from('dash_rooms').update({ status: 'finished' }).eq('id', roomId);
    } else {
      setTimeout(() => startNextQuestion(idx + 1), 1800); // brief beat to see the jump before next Q
    }
  };

  const startRace = async () => {
    if (!roomId) return;
    await supabase.from('dash_rooms').update({ status: 'racing', started_at: new Date().toISOString() }).eq('id', roomId);
    startNextQuestion(0);
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
  // first, then auto-fills and auto-submits the correct answer for this
  // player. Runs manually (button tap) or automatically once this
  // player's clock is about to hit zero unanswered, since the ad needs a
  // moment to play before the host resolves the round at 0s.
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

  const copyCode = () => { navigator.clipboard.writeText(roomCode); setCopied(true); setTimeout(() => setCopied(false), 1500); };

  useEffect(() => () => { channelRef.current?.unsubscribe(); if (timerRef.current) clearInterval(timerRef.current); }, []);

  const rankedRunners = Object.values(runners).sort((a, b) => {
    if (a.finishRank && b.finishRank) return a.finishRank - b.finishRank;
    if (a.finishRank) return -1;
    if (b.finishRank) return 1;
    return b.progress - a.progress;
  });

  const inDanger = phase === 'race' && secondsLeft <= DANGER_SECONDS;
  const lanes = Object.values(runners).sort((a, b) => (a.finishRank ?? 99) - (b.finishRank ?? 99) || b.progress - a.progress);

  // ───────────── MENU ─────────────
  if (phase === 'menu') return (
    <div className="max-w-md mx-auto space-y-4 text-center py-10">
      {onExit && <button onClick={onExit} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back</button>}
      <Rocket className="w-10 h-10 mx-auto" style={{ color: '#1CB0F6' }} />
      <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Code Dash</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Race friends across the track. Answer fast to leap ahead — miss it and stumble back.</p>
      <button onClick={createRoom} disabled={loading} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#1CB0F6' }}>
        {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Create Race'}
      </button>
      <div className="flex gap-2">
        <input value={joinInput} onChange={e => setJoinInput(e.target.value)} placeholder="Enter room code"
          className="flex-1 px-3 py-3 rounded-xl border text-center font-mono uppercase" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }} />
        <button onClick={joinRoom} disabled={loading} className="px-5 rounded-xl font-bold text-white" style={{ backgroundColor: '#8B5CF6' }}>Join</button>
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
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Share this code — need at least 2 racers</p>
      <div className="d-card p-4 space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text)' }}><Users className="w-4 h-4" /> Racers ({Object.keys(runners).length})</div>
        {Object.values(runners).map(r => <div key={r.user_id} className="text-sm" style={{ color: 'var(--text-muted)' }}>🏃 {r.display_name}</div>)}
      </div>
      {isHost ? (
        <button onClick={startRace} disabled={Object.keys(runners).length < 2}
          className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-40" style={{ backgroundColor: '#1CB0F6' }}>
          {Object.keys(runners).length < 2 ? 'Waiting for racers...' : 'On your marks! 🏁'}
        </button>
      ) : <p className="text-sm font-bold" style={{ color: 'var(--text-muted)' }}>Waiting for host to start...</p>}
    </div>
  );

  // ───────────── RACE ─────────────
  if (phase === 'race') {
    const q = questions[qIndex];
    const iAmFinished = runners[user.id]?.finished;
    const myStreak = runners[user.id]?.streak ?? 0;
    return (
      <motion.div className="max-w-2xl mx-auto space-y-5 py-8"
        animate={inDanger ? { x: [0, -3, 3, -2, 2, 0] } : { x: 0 }}
        transition={{ duration: 0.4, repeat: inDanger ? Infinity : 0, repeatDelay: 0.6 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {onExit && <button onClick={onExit} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back</button>}
            <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text)' }}>
              <Flag className="w-4 h-4" style={{ color: '#1CB0F6' }} /> Question {qIndex + 1}
            </div>
          </div>
          <motion.div className="flex items-center gap-1.5 text-sm font-black" style={{ color: inDanger ? '#FF4B4B' : 'var(--text)' }}
            animate={inDanger ? { scale: [1, 1.15, 1] } : { scale: 1 }} transition={{ duration: 0.6, repeat: inDanger ? Infinity : 0 }}>
            <Timer className="w-4 h-4" /> {secondsLeft}s
          </motion.div>
        </div>

        {/* the track — this is the game, not a sidebar stat */}
        <div className="d-card p-4 space-y-2.5">
          {lanes.map(r => (
            <div key={r.user_id} className="relative h-9 rounded-full" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="absolute inset-y-0 left-0 rounded-full opacity-15" style={{ width: `${r.progress}%`, backgroundColor: r.user_id === user.id ? '#1CB0F6' : '#8B5CF6' }} />
              <motion.div
                className="absolute top-1/2 flex items-center gap-1 text-lg"
                style={{ transform: 'translateY(-50%)' }}
                animate={{ left: `calc(${Math.min(r.progress, 96)}% - 4px)` }}
                transition={{ type: 'spring', stiffness: 120, damping: 14 }}
              >
                <motion.span
                  animate={r.lastJump === 'jump' ? { y: [0, -14, 0] } : r.lastJump === 'stumble' ? { rotate: [0, -20, 10, 0], x: [0, -6, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {r.user_id === user.id ? '🏃' : '🚶'}
                </motion.span>
              </motion.div>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold" style={{ color: 'var(--text-muted)' }}>{r.display_name}</span>
              <Flag className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: '#FFC800' }} />
            </div>
          ))}
        </div>

        <div className="d-progress h-2 rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: inDanger ? '#FF4B4B' : '#1CB0F6' }}
            animate={{ width: `${(secondsLeft / QUESTION_SECONDS) * 100}%` }} transition={{ duration: 0.4 }} />
        </div>

        {iAmFinished ? (
          <div className="d-card p-6 text-center">
            <Flag className="w-8 h-8 mx-auto mb-2" style={{ color: '#FFC800' }} />
            <p className="font-bold" style={{ color: 'var(--text-muted)' }}>You crossed the line — watching the rest finish.</p>
          </div>
        ) : q && (
          <div className="d-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Answer fast — speed = distance</p>
              {myStreak >= 2 && <span className="flex items-center gap-1 text-xs font-bold" style={{ color: '#FFC800' }}><Flame className="w-3.5 h-3.5" /> {myStreak} streak</span>}
            </div>
            <pre className="p-4 rounded-xl font-mono text-sm overflow-x-auto" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>{q.template}</pre>
            <input value={answerInput} onChange={e => setAnswerInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder={hasAnswered ? 'Locked in — leaping!' : 'Fill in the blank...'} autoFocus disabled={hasAnswered}
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
                  style={{ color: '#1CB0F6' }}
                />
              )
            )}
            <button onClick={() => submitAnswer()} disabled={hasAnswered}
              className="w-full py-3 rounded-xl font-bold text-white disabled:opacity-50" style={{ backgroundColor: inDanger ? '#FF4B4B' : '#1CB0F6' }}>
              {hasAnswered ? '✓ Locked In' : inDanger ? 'JUMP NOW!' : 'Lock In & Jump'}
            </button>
          </div>
        )}

        <AnimatePresence>
          {myLastResult && (
            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ opacity: 0 }}
              className="text-center text-sm font-bold" style={{ color: myLastResult === 'jump' ? '#1CB0F6' : '#FF4B4B' }}>
              {myLastResult === 'jump' ? '⚡ Nice leap!' : '💥 Stumbled — lost ground!'}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  // ───────────── FINISHED ─────────────
  const winner = rankedRunners[0];
  const iWon = winner?.user_id === user.id;
  return (
    <div className="max-w-md mx-auto space-y-4 text-center py-10">
      <motion.div initial={{ scale: 0.5, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', bounce: 0.5 }}>
        <Flag className="w-14 h-14 mx-auto" style={{ color: '#FFC800' }} />
      </motion.div>
      <h2 className="font-display text-2xl font-black" style={{ color: 'var(--text)' }}>
        {iWon ? 'YOU WON THE RACE! 🏆' : `You finished #${runners[user.id]?.finishRank ?? rankedRunners.findIndex(r => r.user_id === user.id) + 1}`}
      </h2>
      <div className="space-y-2">
        {rankedRunners.map((r, i) => (
          <motion.div key={r.user_id} initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.08 }}
            className="d-card p-3 flex items-center justify-between" style={{ borderColor: r.user_id === user.id ? '#1CB0F6' : 'var(--border)' }}>
            <span className="font-bold text-sm flex items-center gap-1.5" style={{ color: 'var(--text)' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`} {r.display_name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{Math.round(r.progress)}% track</span>
          </motion.div>
        ))}
      </div>
      <button onClick={() => onExit ? onExit() : setPhase('menu')} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#1CB0F6' }}>
        Back to Arena
      </button>
    </div>
  );
}