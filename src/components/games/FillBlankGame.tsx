import { useState } from 'react';
import { motion } from 'framer-motion';
import { Pencil, Zap, Trophy, RotateCcw, ArrowRight, Flame, CheckCircle2, XCircle } from 'lucide-react';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

interface BlankQuestion {
  id: string;
  code: string;
  language: string;
  blanks: { position: number; answer: string; hint: string }[];
  points: number;
}

interface FillBlankGameProps {
  questions: BlankQuestion[];
  onComplete: (score: number, correct: number, total: number) => void;
  onExit: () => void;
  /** Question index to start on (Feature 1 — resume where left off). */
  initialIndex?: number;
  /** Called every time the player advances to a new question. */
  onProgress?: (index: number) => void;
  onAnswerResult?: (result: { questionIndex: number; isCorrect: boolean }) => void;
}

export default function FillBlankGame({ questions, onComplete, onExit, initialIndex = 0, onProgress, onAnswerResult }: FillBlankGameProps) {
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(questions.length - 1, 0));
  const [current, setCurrent] = useState(safeInitialIndex);
  const [answers, setAnswers] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [phase, setPhase] = useState<'ready' | 'playing' | 'gameover'>('ready');
  // True when blanks were revealed via a rewarded ad instead of typed —
  // no points earned for that question.
  const [, setAutoRevealed] = useState(false);

  const q = questions[current];

  const initAnswers = () => {
    setAnswers(new Array(q.blanks.length).fill(''));
  };

  const handleStart = () => {
    setPhase('playing');
    initAnswers();
  };

  const handleCheck = () => {
    if (showResult) return;
    let correct = 0;
    q.blanks.forEach((b, i) => {
      if (answers[i]?.trim().toLowerCase() === b.answer.toLowerCase()) correct++;
    });
    const allCorrect = correct === q.blanks.length;
    onAnswerResult?.({ questionIndex: current, isCorrect: allCorrect });
    const points = allCorrect ? q.points + streak * 10 : correct * 30;
    setScore(prev => prev + points);
    setTotalCorrect(prev => prev + correct);
    if (allCorrect) {
      const ns = streak + 1;
      setStreak(ns);
      setBestStreak(prev => Math.max(prev, ns));
    } else {
      setStreak(0);
    }
    setShowResult(true);
  };

  const handleNext = () => {
    if (current < questions.length - 1) {
      const next = current + 1;
      setCurrent(next);
      setShowResult(false);
      setAutoRevealed(false);
      setAnswers(new Array(questions[next].blanks.length).fill(''));
      onProgress?.(next);
    } else {
      setPhase('gameover');
    }
  };

  // Watches a rewarded ad, then fills in the real answers directly (not a
  // hint). Counts as 0 correct for this question, same as a wrong guess.
  const handleRevealAnswer = () => {
    if (showResult) return;
    setAnswers(q.blanks.map(b => b.answer));
    onAnswerResult?.({ questionIndex: current, isCorrect: false });
    setAutoRevealed(true);
    setStreak(0);
    setShowResult(true);
  };

  const handleRestart = () => {
    setCurrent(0); setAnswers([]); setShowResult(false);
    setScore(0); setTotalCorrect(0); setStreak(0); setBestStreak(0); setPhase('ready');
  };

  const handleFinish = () => {
    const totalBlanks = questions.reduce((s, q) => s + q.blanks.length, 0);
    onComplete(score, totalCorrect, totalBlanks);
  };

  const renderCodeWithBlanks = () => {
    let parts: { text: string; isBlank: boolean; blankIdx?: number }[] = [];
    let lastIdx = 0;
    const sorted = [...q.blanks].sort((a, b) => a.position - b.position);

    sorted.forEach((b, i) => {
      if (b.position > lastIdx) {
        parts.push({ text: q.code.slice(lastIdx, b.position), isBlank: false });
      }
      parts.push({ text: '', isBlank: true, blankIdx: i });
      lastIdx = b.position;
    });
    if (lastIdx < q.code.length) parts.push({ text: q.code.slice(lastIdx), isBlank: false });

    return parts;
  };

  const allBlanksFilled = answers.every(a => a.trim().length > 0);

  // Ready
  if (phase === 'ready') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-2xl bg-[#00CDD7] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Pencil className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">Fill in the Blank</h2>
          <p className="text-sm g-muted mb-4">Complete the code by filling in missing parts!</p>
          <div className="b-card p-4 mb-4 max-w-xs mx-auto text-left">
            <div className="flex items-center gap-2 mb-2"><Pencil className="w-4 h-4 text-[#00CDD7]" /><span className="text-xs font-bold g-body">How to Play</span></div>
            <ul className="text-xs g-body space-y-1">
              <li>- Read the incomplete code</li>
              <li>- Type the missing code in the blanks</li>
              <li>- Get hints if you are stuck</li>
              <li>- All correct = maximum points!</li>
            </ul>
          </div>
          <button onClick={handleStart} className="btn-3d px-8 py-3 text-base font-bold" style={{ backgroundColor: '#00CDD7', color: 'white', boxShadow: '0 4px 0 0 #0099A3' }}>
            <Pencil className="w-5 h-5 inline mr-2" /> Start Coding
          </button>
        </motion.div>
      </div>
    );
  }

  // Game over
  if (phase === 'gameover') {
    const totalBlanks = questions.reduce((s, q) => s + q.blanks.length, 0);
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full bg-[#58CC02] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">Complete!</h2>
          <div className="b-card p-4 mb-4 max-w-xs mx-auto grid grid-cols-2 gap-3 text-center">
            <div><p className="font-display text-2xl font-bold text-[#00CDD7]">{score}</p><p className="text-[10px] g-muted">Score</p></div>
            <div><p className="font-display text-2xl font-bold text-[#58CC02]">{totalCorrect}/{totalBlanks}</p><p className="text-[10px] g-muted">Correct</p></div>
            <div><p className="font-display text-2xl font-bold text-[#FFC800]">{bestStreak}</p><p className="text-[10px] g-muted">Best Streak</p></div>
            <div><p className="font-display text-2xl font-bold text-[#FF9600]">{questions.length}</p><p className="text-[10px] g-muted">Questions</p></div>
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
          <motion.div className="h-full bg-[#00CDD7] rounded-full" animate={{ width: `${((current + (showResult ? 1 : 0)) / questions.length) * 100}%` }} />
        </div>
      </div>

      {/* Code with Blanks */}
      <motion.div key={current} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex-1 flex flex-col">
        <div className="bg-[#1a1a2e] rounded-2xl border-2 border-gray-800 p-4 mb-3 overflow-auto">
          <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-700">
            <div className="flex gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400/60" /><div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" /><div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" /></div>
            <span className="text-[10px] g-muted font-mono">{q.language}</span>
          </div>
          <div className="font-mono text-xs text-gray-300 leading-6 whitespace-pre-wrap">
            {renderCodeWithBlanks().map((part, i) => {
              if (!part.isBlank) return <span key={i}>{part.text}</span>;
              const bi = part.blankIdx!;
              const isCorrect = showResult && answers[bi]?.trim().toLowerCase() === q.blanks[bi].answer.toLowerCase();
              return (
                <span key={i}>
                  {!showResult ? (
                    <input
                      type="text"
                      value={answers[bi] || ''}
                      onChange={e => {
                        const na = [...answers];
                        na[bi] = e.target.value;
                        setAnswers(na);
                      }}
                      placeholder={q.blanks[bi].hint}
                      className="inline-block w-24 px-2 py-0.5 bg-gray-800 border-2 border-[#00CDD7] rounded text-center text-xs font-mono text-white focus:outline-none focus:border-[#58CC02] placeholder-gray-600"
                      spellCheck={false}
                    />
                  ) : (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${isCorrect ? 'bg-[#58CC02]/80/20 text-green-400 border border-green-500' : 'bg-[#FF4B4B]/80/20 text-red-400 border border-red-500'}`}>
                      {answers[bi] || '???'} {isCorrect ? <CheckCircle2 className="w-3 h-3 inline ml-1" /> : <XCircle className="w-3 h-3 inline ml-1" />}
                    </span>
                  )}
                </span>
              );
            })}
          </div>
        </div>

        {/* Check / Next button */}
        {!showResult ? (
          <div className="space-y-2">
            <button onClick={handleCheck} disabled={!allBlanksFilled} className="btn-3d w-full py-3 text-sm font-bold disabled:opacity-40" style={{ backgroundColor: '#00CDD7', color: 'white', boxShadow: '0 4px 0 0 #0099A3' }}>
              <CheckCircle2 className="w-4 h-4 inline mr-1" /> Check Answers
            </button>
            <div className="flex justify-center">
              <WatchAdButton
                adUnitId={AD_UNITS.hint}
                label="Watch ad to reveal answer"
                onReward={handleRevealAnswer}
                className="text-xs font-bold"
                style={{ color: '#00CDD7' }}
              />
            </div>
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Show correct answers */}
            <div className="mb-3 p-3 bg-[#1CB0F6]/8 rounded-2xl border-2 border-[#1CB0F6]/25">
              <p className="text-xs font-bold g-blue mb-1">Correct Answers:</p>
              {q.blanks.map((b, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="text-blue-500 font-mono">Blank {i + 1}:</span>
                  <code className="g-green font-bold">{b.answer}</code>
                  {answers[i]?.trim().toLowerCase() !== b.answer.toLowerCase() && <span className="text-red-400">(you wrote: {answers[i] || 'nothing'})</span>}
                </div>
              ))}
            </div>
            <button onClick={handleNext} className="btn-3d btn-3d-green w-full py-3 text-sm font-bold">
              {current < questions.length - 1 ? 'Next' : 'See Results'} <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}
