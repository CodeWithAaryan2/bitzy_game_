import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Zap, Trophy, RotateCcw, ArrowRight, Flame, CheckCircle2, XCircle } from 'lucide-react';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

interface PredictionQuestion {
  id: string;
  code: string;
  language: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface CodePredictionGameProps {
  questions: PredictionQuestion[];
  onComplete: (score: number, correct: number, streak: number) => void;
  onExit: () => void;
  /** Question index to start on (Feature 1 — resume where left off). */
  initialIndex?: number;
  /** Called every time the player advances to a new question. */
  onProgress?: (index: number) => void;
  onAnswerResult?: (result: { questionIndex: number; isCorrect: boolean }) => void;
}

export default function CodePredictionGame({ questions, onComplete, onExit, initialIndex = 0, onProgress, onAnswerResult }: CodePredictionGameProps) {
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(questions.length - 1, 0));
  const [current, setCurrent] = useState(safeInitialIndex);
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'gameover'>('ready');
  // True when the answer was revealed via a rewarded ad instead of picked.
  const [autoRevealed, setAutoRevealed] = useState(false);

  const q = questions[current];

  const handleAnswer = (idx: number) => {
    if (showResult) return;
    setSelected(idx);
    setShowResult(true);

    const isCorrect = idx === q.correctIndex;
    onAnswerResult?.({ questionIndex: current, isCorrect });
    if (isCorrect) {
      const points = 100 + streak * 20;
      setScore(prev => prev + points);
      setCorrectCount(prev => prev + 1);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(prev => Math.max(prev, newStreak));
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      const next = current + 1;
      setCurrent(next);
      setSelected(null);
      setShowResult(false);
      setAutoRevealed(false);
      onProgress?.(next);
    } else {
      setPhase('gameover');
    }
  };

  // Watches a rewarded ad, then shows the real answer directly (not a
  // hint). Counts as not-correct, same as a wrong guess.
  const handleRevealAnswer = () => {
    if (showResult) return;
    setSelected(q.correctIndex);
    setShowResult(true);
    setAutoRevealed(true);
    onAnswerResult?.({ questionIndex: current, isCorrect: false });
    setStreak(0);
  };

  const handleStart = () => { setPhase('playing'); };

  const handleRestart = () => {
    setCurrent(0); setSelected(null); setShowResult(false);
    setScore(0); setCorrectCount(0); setStreak(0); setBestStreak(0); setPhase('ready');
  };

  const handleFinish = () => { onComplete(score, correctCount, bestStreak); };

  // Ready
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#FF9600] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Eye className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">Code Prediction</h2>
          <p className="text-sm g-muted mb-4">Predict what the code will output!</p>
          <div className="b-card p-4 mb-4 max-w-xs mx-auto text-left">
            <div className="flex items-center gap-2 mb-2"><Eye className="w-4 h-4 text-[#FF9600]" /><span className="text-xs font-bold g-body">How to Play</span></div>
            <ul className="text-xs g-body space-y-1">
              <li>- Read the code snippet carefully</li>
              <li>- Predict what it will output</li>
              <li>- Streaks multiply your points!</li>
            </ul>
          </div>
          <button onClick={handleStart} className="btn-3d px-8 py-3 text-base font-bold" style={{ backgroundColor: '#FF9600', color: 'white', boxShadow: '0 4px 0 0 #D67A00' }}>
            <Eye className="w-5 h-5 inline mr-2" /> Start Predicting
          </button>
        </motion.div>
      </div>
    );
  }

  // Game over
  if (phase === 'gameover') {
    const percent = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#58CC02] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">Done!</h2>
          <div className="b-card p-4 mb-4 max-w-xs mx-auto grid grid-cols-2 gap-3 text-center">
            <div><p className="font-display text-2xl font-bold text-[#FF9600]">{score}</p><p className="text-[10px] g-muted">Score</p></div>
            <div><p className="font-display text-2xl font-bold text-[#58CC02]">{correctCount}/{questions.length}</p><p className="text-[10px] g-muted">Correct</p></div>
            <div><p className="font-display text-2xl font-bold text-[#FFC800]">{bestStreak}</p><p className="text-[10px] g-muted">Best Streak</p></div>
            <div><p className="font-display text-2xl font-bold text-[#1CB0F6]">{percent}%</p><p className="text-[10px] g-muted">Accuracy</p></div>
          </div>
          <div className="flex gap-3 justify-center">
            <button onClick={handleRestart} className="btn-3d btn-3d-blue px-6 py-3 text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4" /> Retry</button>
            <button onClick={handleFinish} className="btn-3d btn-3d-green px-6 py-3 text-sm flex items-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => { onProgress?.(current); onExit(); }} className="text-xs g-muted font-medium">Exit</button>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1"><Zap className="w-4 h-4 text-[#FFC800]" /><span className="text-sm font-bold text-[#FFC800]">{score}</span></div>
            {streak > 1 && <div className="flex items-center gap-1 px-2 py-0.5 bg-[#FF9600]/8 rounded-full border border-[#FF9600]/25"><Flame className="w-3 h-3 text-[#FF9600]" /><span className="text-[10px] font-bold text-[#FF9600]">{streak}x</span></div>}
            <span className="text-xs font-bold g-muted">{current + 1}/{questions.length}</span>
          </div>
        </div>
        <div className="h-2 g-track rounded-full overflow-hidden">
          <motion.div className="h-full bg-[#FF9600] rounded-full" animate={{ width: `${((current + (showResult ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Code Display */}
      <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
        <div className="bg-[#1a1a2e] rounded-2xl border-2 border-gray-800 p-4 mb-3">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400/60" /><div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" /></div>
            <span className="text-[10px] g-muted font-mono">{q.language}</span>
          </div>
          <pre className="text-xs font-mono text-gray-300 whitespace-pre-wrap">{q.code}</pre>
        </div>

        <p className="text-sm font-bold g-body mb-2">What will this output?</p>

        {!showResult && (
          <div className="mb-2 flex justify-end">
            <WatchAdButton
              adUnitId={AD_UNITS.hint}
              label="Watch ad to reveal answer"
              onReward={handleRevealAnswer}
              className="text-[11px] font-bold"
              style={{ color: '#FF9600' }}
            />
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const isSelected = i === selected;
            let cls = 'b-card w-full p-3 text-left text-sm font-medium border-2 transition-all ';
            if (showResult) {
              if (isCorrect) cls += 'bg-[#58CC02]/8 border-[#58CC02]';
              else if (isSelected && !isCorrect) cls += 'bg-[#FF4B4B]/8 border-[#FF4B4B]';
              else cls += 'g-track opacity-50';
            } else {
              cls += 'hover:border-[#FF9600]/50 cursor-pointer';
            }
            return (
              <motion.button key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                whileTap={!showResult ? { scale: 0.98 } : {}} onClick={() => handleAnswer(i)} disabled={showResult} className={cls}>
                <div className="flex items-center gap-3">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${showResult && isCorrect ? 'bg-[#58CC02] text-white' : showResult && isSelected ? 'bg-[#FF4B4B] text-white' : 'g-track g-muted'}`}>
                    {showResult && isCorrect ? <CheckCircle2 className="w-4 h-4" /> : showResult && isSelected ? <XCircle className="w-4 h-4" /> : String.fromCharCode(65 + i)}
                  </span>
                  <code className="text-xs font-mono g-body">{opt}</code>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Explanation */}
        <AnimatePresence>
          {showResult && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 p-3 bg-[#1CB0F6]/8 rounded-2xl border-2 border-[#1CB0F6]/25">
              {autoRevealed && (
                <p className="text-[10px] font-bold mb-1" style={{ color: '#FF9600' }}>Answer revealed — no points earned</p>
              )}
              <p className="text-xs g-blue font-medium mb-1">Explanation</p>
              <p className="text-xs g-body">{q.explanation}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {showResult && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-3">
            <button onClick={handleNext} className="btn-3d btn-3d-green w-full py-3 text-sm font-bold">
              {current < questions.length - 1 ? 'Next' : 'See Results'} <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
