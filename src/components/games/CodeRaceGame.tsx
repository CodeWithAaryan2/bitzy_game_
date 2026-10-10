/**
 * src/components/games/CodeRaceGame.tsx
 * Live multiplayer racing game. Host creates a room (gets a 6-char code),
 * friends join with that code. Everyone races the same fill-in-the-blank
 * Python questions. Progress is broadcast live via Supabase Realtime so
 * everyone sees each other's position update instantly.
 */
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Users, Zap, Trophy, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

interface RaceQuestion { id: string; template: string; answer: string; hint: string; }
interface Racer { user_id: string; display_name: string; current_question: number; finished: boolean; finish_time_ms?: number; placement?: number; }

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function CodeRaceGame({ gameLevelId, onExit, onComplete, onAnswerResult }: { gameLevelId: number; onExit?: () => void; onComplete?: (xp: number, coins: number) => void; onAnswerResult?: (result: { questionIndex: number; isCorrect: boolean }) => void }) {
  const { user, profile } = useAuth() as any;
  const [phase, setPhase] = useState<'menu' | 'lobby' | 'racing' | 'finished'>('menu');
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomCode, setRoomCode] = useState('');
  const [joinInput, setJoinInput] = useState('');
  const [racers, setRacers] = useState<Record<string, Racer>>({});
  const [questions, setQuestions] = useState<RaceQuestion[]>([]);
  const [qIndex, setQIndex] = useState(0);
  const [answerInput, setAnswerInput] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const startTimeRef = useRef<number>(0);
  const channelRef = useRef<any>(null);

  const myName = profile?.display_name || user?.email?.split('@')[0] || 'Player';

  // ── load question set ──
  useEffect(() => {
    supabase.from('game_levels').select('questions').eq('id', gameLevelId).single()
      .then(({ data }) => { if (data) setQuestions(JSON.parse(data.questions)); });
  }, [gameLevelId]);

  const setupChannel = (rid: string) => {
    const channel = supabase.channel(`race:${rid}`, { config: { presence: { key: user.id } } });

    channel.on('broadcast', { event: 'progress' }, ({ payload }: any) => {
      setRacers(prev => ({ ...prev, [payload.user_id]: payload }));
    });

    channel.on('broadcast', { event: 'start' }, () => {
      startTimeRef.current = Date.now();
      setPhase('racing');
      setQIndex(0);
    });

    channel.subscribe();
    channelRef.current = channel;
    return channel;
  };

  const createRoom = async () => {
    if (!user) return;
    setLoading(true);
    const code = genCode();
    const { data, error: err } = await supabase.from('race_rooms').insert({
      room_code: code, host_id: user.id, game_level_id: gameLevelId, status: 'waiting',
    }).select().single();
    if (err) { setError(err.message); setLoading(false); return; }

    await supabase.from('race_participants').insert({
      room_id: data.id, user_id: user.id, display_name: myName, current_question: 0,
    });

    setRoomId(data.id); setRoomCode(code);
    setRacers({ [user.id]: { user_id: user.id, display_name: myName, current_question: 0, finished: false } });
    setupChannel(data.id);
    setPhase('lobby');
    setLoading(false);
  };

  const joinRoom = async () => {
    if (!user || !joinInput.trim()) return;
    setLoading(true); setError('');
    const code = joinInput.trim().toUpperCase();
    const { data: room, error: findErr } = await supabase.from('race_rooms')
      .select('*').eq('room_code', code).eq('status', 'waiting').maybeSingle();
    if (findErr || !room) { setError('Room not found or already started.'); setLoading(false); return; }

    await supabase.from('race_participants').upsert({
      room_id: room.id, user_id: user.id, display_name: myName, current_question: 0,
    }, { onConflict: 'room_id,user_id' });

    const { data: participants } = await supabase.from('race_participants').select('*').eq('room_id', room.id);
    const rMap: Record<string, Racer> = {};
    (participants || []).forEach((p: any) => { rMap[p.user_id] = { user_id: p.user_id, display_name: p.display_name, current_question: p.current_question, finished: p.finished }; });

    setRoomId(room.id); setRoomCode(room.room_code);
    setRacers(rMap);
    const channel = setupChannel(room.id);
    channel.send({ type: 'broadcast', event: 'progress', payload: { user_id: user.id, display_name: myName, current_question: 0, finished: false } });
    setPhase('lobby');
    setLoading(false);
  };

  const startRace = async () => {
    if (!roomId) return;
    await supabase.from('race_rooms').update({ status: 'racing', started_at: new Date().toISOString() }).eq('id', roomId);
    channelRef.current?.send({ type: 'broadcast', event: 'start', payload: {} });
    startTimeRef.current = Date.now();
    setPhase('racing');
  };

  const submitAnswer = async (override?: string) => {
    const q = questions[qIndex];
    if (!q) return;
    const raw = override ?? answerInput;
    const correct = raw.trim().replace(/^["']|["']$/g, '') === q.answer.trim().replace(/^["']|["']$/g, '');
    onAnswerResult?.({ questionIndex: qIndex, isCorrect: correct });
    if (!correct) { setError('Not quite — try again!'); return; }
    setError('');
    setAnswerInput('');

    const nextIndex = qIndex + 1;
    const isFinished = nextIndex >= questions.length;
    setQIndex(nextIndex);

    const payload: Racer = { user_id: user.id, display_name: myName, current_question: nextIndex, finished: isFinished };
    if (isFinished) payload.finish_time_ms = Date.now() - startTimeRef.current;

    setRacers(prev => ({ ...prev, [user.id]: payload }));
    channelRef.current?.send({ type: 'broadcast', event: 'progress', payload });

    await supabase.from('race_participants').update({
      current_question: nextIndex, finished: isFinished,
      finish_time_ms: isFinished ? payload.finish_time_ms : null,
    }).eq('room_id', roomId).eq('user_id', user.id);

    if (isFinished) {
      setPhase('finished');
      const myPlace = [...Object.values(racers), payload]
        .sort((a, b) => (a.finish_time_ms || Infinity) - (b.finish_time_ms || Infinity))
        .findIndex(r => r.user_id === user.id);
      const bonus = myPlace === 0 ? 50 : myPlace === 1 ? 30 : 20;
      onComplete?.(bonus, Math.round(bonus / 2));
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true); setTimeout(() => setCopied(false), 1500);
  };

  useEffect(() => () => { channelRef.current?.unsubscribe(); }, []);

  const racerList = Object.values(racers).sort((a, b) => (b.current_question - a.current_question));

  // ───────────── MENU ─────────────
  if (phase === 'menu') return (
    <div className="max-w-md mx-auto space-y-4 text-center py-10">
      {onExit && <button onClick={onExit} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back</button>}
      <Zap className="w-10 h-10 mx-auto" style={{ color: '#FFC800' }} />
      <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Code Race</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Race your friends live — first to fill in all the blanks correctly wins!</p>
      <button onClick={createRoom} disabled={loading} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#58CC02' }}>
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
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Share this code with friends to join</p>

      <div className="d-card p-4 space-y-2 text-left">
        <div className="flex items-center gap-2 text-sm font-bold" style={{ color: 'var(--text)' }}>
          <Users className="w-4 h-4" /> Players ({racerList.length})
        </div>
        {racerList.map(r => (
          <div key={r.user_id} className="text-sm" style={{ color: 'var(--text-muted)' }}>🏃 {r.display_name}</div>
        ))}
      </div>

      <button onClick={startRace} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#58CC02' }}>
        Start Race! 🏁
      </button>
    </div>
  );

  // ───────────── RACING ─────────────
  if (phase === 'racing') {
    const q = questions[qIndex];
    return (
      <div className="max-w-2xl mx-auto space-y-6 py-8">
        {onExit && <button onClick={onExit} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back</button>}
        {/* live progress bars */}
        <div className="space-y-2">
          {racerList.map(r => (
            <div key={r.user_id} className="flex items-center gap-2">
              <span className="text-xs w-20 truncate" style={{ color: 'var(--text-muted)' }}>{r.display_name}</span>
              <div className="flex-1 h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
                <motion.div className="h-full rounded-full" style={{ backgroundColor: r.finished ? '#58CC02' : '#1CB0F6' }}
                  animate={{ width: `${(r.current_question / questions.length) * 100}%` }} />
              </div>
              {r.finished && <Trophy className="w-4 h-4" style={{ color: '#FFC800' }} />}
            </div>
          ))}
        </div>

        {q && (
          <div className="d-card p-6 space-y-4">
            <p className="text-xs uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>Question {qIndex + 1} / {questions.length}</p>
            <pre className="p-4 rounded-xl font-mono text-sm overflow-x-auto" style={{ backgroundColor: '#1e1e1e', color: '#d4d4d4' }}>
              {q.template}
            </pre>
            <input value={answerInput} onChange={e => setAnswerInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submitAnswer()}
              placeholder="Fill in the blank..." autoFocus
              className="w-full px-4 py-3 rounded-xl border font-mono" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)', color: 'var(--text)' }} />
            <WatchAdButton
              adUnitId={AD_UNITS.hint}
              label="Watch ad to reveal answer"
              onReward={() => { setAnswerInput(q.answer); submitAnswer(q.answer); }}
              className="text-xs font-bold"
              style={{ color: '#1CB0F6' }}
            />
            {error && <p className="text-sm text-red-500">{error}</p>}
            <button onClick={() => submitAnswer()} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#58CC02' }}>Submit</button>
          </div>
        )}
      </div>
    );
  }

  // ───────────── FINISHED ─────────────
  const finalRanking = [...racerList].sort((a, b) => {
    if (a.finished && !b.finished) return -1;
    if (!a.finished && b.finished) return 1;
    return (a.finish_time_ms || Infinity) - (b.finish_time_ms || Infinity);
  });

  return (
    <div className="max-w-md mx-auto space-y-4 text-center py-10">
      <Trophy className="w-12 h-12 mx-auto" style={{ color: '#FFC800' }} />
      <h2 className="font-display text-xl font-bold" style={{ color: 'var(--text)' }}>Race Finished!</h2>
      <div className="space-y-2">
        {finalRanking.map((r, i) => (
          <div key={r.user_id} className="d-card p-3 flex items-center justify-between">
            <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `#${i + 1}`} {r.display_name}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {r.finish_time_ms ? `${(r.finish_time_ms / 1000).toFixed(1)}s` : 'Did not finish'}
            </span>
          </div>
        ))}
      </div>
      <button onClick={() => onExit ? onExit() : setPhase('menu')} className="w-full py-3 rounded-xl font-bold text-white" style={{ backgroundColor: '#1CB0F6' }}>
        Back to Arena
      </button>
    </div>
  );
}