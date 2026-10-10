import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, ArrowRight, Flame, ListOrdered, Check, X, Sparkles } from 'lucide-react';
import type { CodeOrderPuzzle } from '@/data/codeOrderData';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

interface CodeOrderGameProps {
  puzzles: CodeOrderPuzzle[];
  onComplete: (score: number, correct: number, bestStreak: number) => void;
  onExit: () => void;
  /** Round to start on (Feature 1 — resume where the player left off). */
  initialIndex?: number;
  /** Called every time the player advances to a new round. */
  onProgress?: (index: number) => void;
  onAnswerResult?: (result: { questionIndex: number; isCorrect: boolean }) => void;
}

type LineTile = { text: string; originalIndex: number; placed: boolean };

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export default function CodeOrderGame({ puzzles, onComplete, onExit, initialIndex = 0, onProgress, onAnswerResult }: CodeOrderGameProps) {
  const [phase, setPhase] = useState<'ready' | 'playing' | 'gameover'>('ready');
  const [round, setRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [placedOrder, setPlacedOrder] = useState<number[]>([]); // original indices in chosen order
  const [tiles, setTiles] = useState<LineTile[]>([]);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [shake, setShake] = useState(false);
  // Watching the ad auto-places every remaining line in the correct order
  // directly — the real answer, not a hint. No points for this round.
  const [, setAnswerRevealed] = useState(false);

  const totalRounds = Math.min(puzzles.length, 6);
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(totalRounds - 1, 0));
  const puzzle = puzzles[round];

  const setupRound = useCallback((index: number) => {
    const p = puzzles[index];
    if (!p) return;
    const shuffled = shuffle(p.lines.map((text, i) => ({ text, originalIndex: i, placed: false })));
    setTiles(shuffled);
    setPlacedOrder([]);
    setMistakes(0);
    setFeedback(null);
    setAnswerRevealed(false);
  }, [puzzles]);

  const handleStart = () => {
    setPhase('playing');
    setRound(0);
    setScore(0);
    setCorrectCount(0);
    setStreak(0);
    setBestStreak(0);
    setRound(safeInitialIndex);
    setupRound(safeInitialIndex);
  };

  const handleRestart = () => {
    setPhase('ready');
  };

  const expectedNext = placedOrder.length; // index into puzzle.lines we expect next

  const handleTileClick = (tile: LineTile, tileIndex: number) => {
    if (phase !== 'playing' || feedback) return;

    if (tile.originalIndex === expectedNext) {
      // Correct line placed
      setTiles(prev => prev.map((t, i) => (i === tileIndex ? { ...t, placed: true } : t)));
      setPlacedOrder(prev => [...prev, tile.originalIndex]);

      const isLast = expectedNext === puzzle.lines.length - 1;
      if (isLast) {
        const mistakePenalty = mistakes * 5;
        const streakBonus = streak * 10;
        const points = Math.max(20, 50 - mistakePenalty + streakBonus);
        const newStreak = streak + 1;
        setStreak(newStreak);
        setBestStreak(prev => Math.max(prev, newStreak));
        setScore(prev => prev + points);
        setCorrectCount(prev => prev + 1);
        onAnswerResult?.({ questionIndex: round, isCorrect: true });
        setFeedback('correct');

        setTimeout(() => {
          const next = round + 1;
          if (next >= totalRounds) {
            setPhase('gameover');
          } else {
            setRound(next);
            setupRound(next);
            onProgress?.(next);
          }
        }, 1100);
      }
    } else {
      // Wrong line - shake, count mistake, reset streak
      setMistakes(prev => prev + 1);
      setStreak(0);
      onAnswerResult?.({ questionIndex: round, isCorrect: false });
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const progressPct = useMemo(() => {
    if (!puzzle) return 0;
    return (placedOrder.length / puzzle.lines.length) * 100;
  }, [placedOrder, puzzle]);

  // Watches a rewarded ad, then auto-places every remaining line in the
  // correct order — the real answer, not a hint. No points for the round.
  const handleRevealAnswer = () => {
    if (!puzzle || feedback) return;
    setAnswerRevealed(true);
    onAnswerResult?.({ questionIndex: round, isCorrect: false });
    setStreak(0);
    setPlacedOrder(puzzle.lines.map((_, i) => i));
    setTiles(prev => prev.map(t => ({ ...t, placed: true })));
    setFeedback('correct');
    setTimeout(() => {
      const next = round + 1;
      if (next >= totalRounds) {
        setPhase('gameover');
      } else {
        setRound(next);
        setupRound(next);
        onProgress?.(next);
      }
    }, 1100);
  };

  // ── Ready screen ──────────────────────────────────────
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#CE82FF] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <ListOrdered className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">Code Order</h2>
          <p className="text-sm g-muted mb-4">Tap the shuffled lines in the correct order to build working code!</p>

          <div className="b-card p-4 mb-4 max-w-xs mx-auto text-left">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-[#CE82FF]" />
              <span className="text-xs font-bold g-body">How to Play</span>
            </div>
            <ul className="text-xs g-body space-y-1">
              <li>- Read the shuffled code lines</li>
              <li>- Tap them in the order they should run</li>
              <li>- Wrong taps cost points but don't end the round</li>
              <li>- Build streaks across puzzles for bonus points!</li>
            </ul>
          </div>

          <button onClick={handleStart} className="btn-3d px-8 py-3 text-base font-bold" style={{ backgroundColor: '#CE82FF', color: 'white', boxShadow: '0 4px 0 0 #A855C7' }}>
            <ListOrdered className="w-5 h-5 inline mr-2" /> Start Building
          </button>
        </motion.div>
      </div>
    );
  }

  // ── Game over screen ──────────────────────────────────
  if (phase === 'gameover') {
    const allCorrect = correctCount >= totalRounds;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg" style={{ backgroundColor: allCorrect ? '#58CC02' : '#FF9600' }}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">
            {allCorrect ? 'Perfect Build!' : 'Round Complete!'}
          </h2>
          <p className="text-sm g-muted mb-4">{correctCount} of {totalRounds} puzzles solved</p>

          <div className="b-card p-4 mb-4 max-w-xs mx-auto grid grid-cols-2 gap-3 text-center">
            <div><p className="font-display text-2xl font-bold text-[#CE82FF]">{score}</p><p className="text-[10px] g-muted">Score</p></div>
            <div><p className="font-display text-2xl font-bold text-[#58CC02]">{correctCount}/{totalRounds}</p><p className="text-[10px] g-muted">Solved</p></div>
            <div><p className="font-display text-2xl font-bold text-[#FF9600]">{bestStreak}</p><p className="text-[10px] g-muted">Best Streak</p></div>
            <div><p className="font-display text-2xl font-bold text-[#1CB0F6]">{score}</p><p className="text-[10px] g-muted">Total Points</p></div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={handleRestart} className="btn-3d btn-3d-blue px-6 py-3 text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Play Again</button>
            <button onClick={() => onComplete(score, correctCount, bestStreak)} className="btn-3d btn-3d-green px-6 py-3 text-sm flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!puzzle) return null;

  // ── Playing screen ──────────────────────────────────
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => { onProgress?.(round); onExit(); }} className="text-xs g-muted font-medium">Exit</button>
          <div className="flex items-center gap-3">
            <span className="text-xs font-bold g-muted">{round + 1}/{totalRounds}</span>
            <div className="flex items-center gap-1"><Trophy className="w-4 h-4 text-[#FFC800]" /><span className="text-sm font-bold text-[#FFC800]">{score}</span></div>
            {streak > 0 && (
              <motion.div key={streak} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="flex items-center gap-1 px-2 py-0.5 bg-[#FF9600]/10 rounded-full border border-[#FF9600]/30">
                <Flame className="w-3 h-3 text-[#FF9600]" /><span className="text-[10px] font-bold text-[#FF9600]">{streak}x</span>
              </motion.div>
            )}
          </div>
        </div>
        <div className="h-2 g-track rounded-full overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg,#CE82FF,#A855C7)' }} animate={{ width: `${progressPct}%` }} transition={{ type: 'spring', stiffness: 120, damping: 18 }} />
        </div>
      </div>

      {/* Puzzle title */}
      <div className="mb-2 flex items-center justify-between">
        <p className="text-sm font-bold g-title">{puzzle.title}</p>
        <span className="text-[10px] g-muted uppercase font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--surface)' }}>{puzzle.language}</span>
      </div>

      {!feedback && (
        <div className="mb-2 flex justify-end">
          <WatchAdButton
            adUnitId={AD_UNITS.hint}
            label="Watch ad to reveal answer"
            onReward={handleRevealAnswer}
            className="text-[11px] font-bold"
            style={{ color: '#CE82FF' }}
          />
        </div>
      )}

      {/* Build area (correct lines placed so far) */}
      <div className="b-card p-3 mb-3 font-mono text-xs min-h-[100px] code-editor" style={{ overflowX: 'auto' }}>
        {placedOrder.length === 0 ? (
          <p className="g-muted italic">Tap the first line of code below to begin...</p>
        ) : (
          placedOrder.map((origIdx, i) => (
            <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="whitespace-pre text-green-400">
              {puzzle.lines[origIdx]}
            </motion.div>
          ))
        )}

        <AnimatePresence>
          {feedback === 'correct' && (
            <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 flex items-center gap-1.5 text-[#58CC02]">
              <Check className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold">{puzzle.explanation}</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Tile pool */}
      <div className={`flex-1 flex flex-col gap-2 ${shake ? 'animate-shake' : ''}`}>
        {tiles.map((tile, i) => (
          !tile.placed && (
            <motion.button
              key={`${puzzle.id}-${i}`}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleTileClick(tile, i)}
              className="w-full text-left font-mono text-xs px-3 py-2.5 rounded-xl border-2 transition-colors"
              style={{ backgroundColor: 'var(--surface)', borderColor: 'var(--border)', color: 'var(--text)' }}
            >
              {tile.text}
            </motion.button>
          )
        ))}
      </div>

      {mistakes > 0 && (
        <div className="mt-2 flex items-center gap-1.5 text-[10px] text-[#FF4B4B]">
          <X className="w-3 h-3" /> {mistakes} wrong tap{mistakes > 1 ? 's' : ''} this round (-{mistakes * 5} pts)
        </div>
      )}
    </div>
  );
}
