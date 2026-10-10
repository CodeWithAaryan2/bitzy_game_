import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Timer, Zap, Trophy, RotateCcw, ArrowRight, Target, Keyboard, Flame, PlayCircle } from 'lucide-react';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS, showRewardedAd } from '@/lib/ads';

interface CodeSnippet {
  code: string;
  language: string;
  description: string;
}

interface SpeedTypingGameProps {
  snippets: CodeSnippet[];
  onComplete: (wpm: number, accuracy: number, totalScore: number) => void;
  onExit: () => void;
  /** Snippet index to start on (Feature 1 — resume where left off). */
  initialIndex?: number;
  /** Called every time the player advances to a new snippet. */
  onProgress?: (index: number) => void;
  onAnswerResult?: (result: { questionIndex: number; isCorrect: boolean }) => void;
}

const SNIPPET_TIME_LIMIT = 60; // seconds per snippet

export default function SpeedTypingGame({ snippets, onComplete, onExit, initialIndex = 0, onProgress, onAnswerResult }: SpeedTypingGameProps) {
  const safeInitialIndex = Math.min(Math.max(initialIndex, 0), Math.max(snippets.length - 1, 0));
  const [currentIdx, setCurrentIdx] = useState(safeInitialIndex);
  const [userInput, setUserInput] = useState('');
  const [phase, setPhase] = useState<'ready' | 'typing' | 'snippet-done' | 'gameover'>('ready');
  const [snippetTime, setSnippetTime] = useState(0);
  const [totalChars, setTotalChars] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [bestWpm, setBestWpm] = useState(0);
  const [streak, setStreak] = useState(0);
  const [results, setResults] = useState<{ snippet: string; wpm: number; accuracy: number; time: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(SNIPPET_TIME_LIMIT);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  // Ad-gated "reveal answer" — watching the ad auto-types the rest of the
  // snippet directly, instead of a hint. Also auto-fires once time is
  // almost up so the ad + auto-completion lands before the hard cutoff.
  const [watchingAd, setWatchingAd] = useState(false);
  const autoAdFiredRef = useRef(false);
  const revealedRef = useRef(false);
  const recordedSnippetRef = useRef<number | null>(null);
  const userInputRef = useRef('');
  useEffect(() => { userInputRef.current = userInput; }, [userInput]);

  const snippet = snippets[currentIdx];
  const isDone = phase === 'snippet-done' || phase === 'gameover';

  // Countdown timer
  useEffect(() => {
    if (phase !== 'typing') return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - snippetTime) / 1000);
      const remaining = Math.max(0, SNIPPET_TIME_LIMIT - elapsed);
      setTimeLeft(remaining);
      if (remaining === 0) {
        // Time's up - auto-finish this snippet
        const timeTaken = (Date.now() - snippetTime) / 1000;
        const typed = userInput.length;
        const correct = userInput.split('').filter((c, i) => c === snippet.code[i]).length;
        const finalWpm = timeTaken > 0 ? Math.round((typed / 5) / (timeTaken / 60)) : 0;
        const finalAccuracy = typed > 0 ? Math.round((correct / typed) * 100) : 0;
        setWpm(finalWpm);
        setAccuracy(finalAccuracy);
        setTotalChars(prev => prev + typed);
        setBestWpm(prev => Math.max(prev, finalWpm));
        setStreak(prev => prev + 1);
        setResults(prev => [...prev, { snippet: snippet.description, wpm: finalWpm, accuracy: finalAccuracy, time: timeTaken }]);
        if (recordedSnippetRef.current !== currentIdx) { recordedSnippetRef.current = currentIdx; onAnswerResult?.({ questionIndex: currentIdx, isCorrect: false }); }
        if (currentIdx < snippets.length - 1) {
          setPhase('snippet-done');
        } else {
          setPhase('gameover');
        }
      } else if (remaining <= 5 && !autoAdFiredRef.current && userInputRef.current !== snippet.code) {
        // About to run out — play the rewarded ad now, then auto-type the
        // rest of the snippet directly (no hint), before the hard cutoff.
        autoAdFiredRef.current = true;
        revealAnswer();
      }
    }, 100);
    return () => clearInterval(interval);
  }, [phase, snippetTime, currentIdx, snippet, userInput]);

  const handleStart = useCallback(() => {
    setPhase('typing');
    setSnippetTime(Date.now());
    setUserInput('');
    setTimeLeft(SNIPPET_TIME_LIMIT);
    autoAdFiredRef.current = false;
    setWatchingAd(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  // Start game on any keypress when in ready phase
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (phase === 'ready' && e.key.length === 1) handleStart();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, handleStart]);

  const handleInput = (val: string) => {
    if (phase !== 'typing') return;
    setUserInput(val);

    const elapsed = (Date.now() - snippetTime) / 1000 / 60;
    const charsTyped = val.length;
    const correct = val.split('').filter((c, i) => c === snippet.code[i]).length;

    if (elapsed > 0) {
      const currentWpm = Math.round((charsTyped / 5) / elapsed);
      setWpm(currentWpm);
    }

    setAccuracy(charsTyped > 0 ? Math.round((correct / charsTyped) * 100) : 100);
    // Check if completed exactly
    if (val === snippet.code) {
      const timeTaken = (Date.now() - snippetTime) / 1000;
      const chars = snippet.code.length;
      const finalWpm = Math.round((chars / 5) / (timeTaken / 60));
      const finalAccuracy = Math.round((correct / chars) * 100);

      setWpm(finalWpm);
      setAccuracy(finalAccuracy);
      setTotalChars(prev => prev + chars);
      setBestWpm(prev => Math.max(prev, finalWpm));
      setStreak(prev => prev + 1);
      setResults(prev => [...prev, { snippet: snippet.description, wpm: finalWpm, accuracy: finalAccuracy, time: timeTaken }]);
      if (recordedSnippetRef.current !== currentIdx) { recordedSnippetRef.current = currentIdx; onAnswerResult?.({ questionIndex: currentIdx, isCorrect: !revealedRef.current }); }

      if (currentIdx < snippets.length - 1) {
        // Auto-advance to next snippet with brief celebration
        const next = currentIdx + 1;
        setTimeout(() => {
          setCurrentIdx(next);
          revealedRef.current = false; recordedSnippetRef.current = null;
          setPhase('typing');
          setUserInput('');
          setSnippetTime(Date.now());
          setTimeLeft(SNIPPET_TIME_LIMIT);
          setWpm(0);
          setAccuracy(100);
          autoAdFiredRef.current = false;
          setWatchingAd(false);
          inputRef.current?.focus();
          onProgress?.(next);
        }, 800);
        setPhase('snippet-done'); // show brief done state for 800ms
      } else {
        setPhase('gameover');
      }
    }
  };

  // Watches a rewarded ad, then auto-types the rest of the snippet
  // directly (the real answer, not a hint/tip).
  const revealAnswer = async () => {
    if (watchingAd || userInputRef.current === snippet.code) return;
    setWatchingAd(true);
    await showRewardedAd(AD_UNITS.hint);
    revealedRef.current = true;
    setWatchingAd(false);
    if (phase === 'typing') handleInput(snippet.code);
  };

  const handleNext = () => {
    if (currentIdx < snippets.length - 1) {
      const next = currentIdx + 1;
      setCurrentIdx(next);
      revealedRef.current = false; recordedSnippetRef.current = null;
      setPhase('typing');
      setUserInput('');
      setSnippetTime(Date.now());
      setTimeLeft(SNIPPET_TIME_LIMIT);
      setWpm(0);
      setAccuracy(100);
      autoAdFiredRef.current = false;
      setWatchingAd(false);
      inputRef.current?.focus();
      onProgress?.(next);
    }
  };

  const handleFinish = () => {
    const avgWpm = Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length);
    const avgAccuracy = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length);
    const totalScore = avgWpm * (avgAccuracy / 100);
    onComplete(avgWpm, avgAccuracy, Math.round(totalScore));
  };

  const handleRestart = () => {
    setCurrentIdx(0);
    revealedRef.current = false; recordedSnippetRef.current = null;
    setUserInput('');
    setPhase('ready');
    setWpm(0);
    setAccuracy(100);
    setBestWpm(0);
    setStreak(0);
    setResults([]);
    setTotalChars(0);
    setTimeLeft(SNIPPET_TIME_LIMIT);
  };

  const renderCode = () => {
    return snippet.code.split('').map((char, i) => {
      let bgClass = '';
      if (i < userInput.length) {
        bgClass = userInput[i] === char ? 'bg-[#58CC02]/30 text-[#58CC02]' : 'bg-[#FF4B4B]/30 text-[#FF4B4B]';
      } else if (i === userInput.length && phase === 'typing') {
        bgClass = 'bg-[#58CC02]/20 border-b-2 border-[#58CC02]';
      }
      return (
        <span key={i} className={`${bgClass} rounded px-[1px] font-mono text-sm`}>
          {char === '\n' ? '↵\n' : char === ' ' ? '\u00A0' : char}
        </span>
      );
    });
  };

  // Ready screen — click anywhere to start
  if (phase === 'ready') {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[50vh] px-4 cursor-pointer select-none"
        onClick={handleStart}
      >
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#1CB0F6' }}>
            <Keyboard className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">Speed Typing</h2>
          <p className="text-sm g-body mb-4">Type code snippets before time runs out!</p>

          <div className="b-card p-4 mb-4 max-w-xs mx-auto text-left">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 g-red" />
              <span className="text-xs font-bold g-title">How to play</span>
            </div>
            <ul className="text-xs g-body space-y-1">
              <li>- Type the shown code exactly as it appears</li>
              <li>- Green = correct, Red = wrong character</li>
              <li>- You have {SNIPPET_TIME_LIMIT} seconds per snippet</li>
              <li>- Complete all {snippets.length} snippets</li>
            </ul>
          </div>

          <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ repeat: Infinity, duration: 1.5 }}
            className="btn-3d btn-3d-blue px-8 py-3 text-base font-bold inline-flex items-center gap-2">
            <Zap className="w-5 h-5" /> Tap to Start Race
          </motion.div>
          <p className="text-xs g-muted mt-3">or press any key</p>
        </motion.div>
      </div>
    );
  }

  // Game over screen
  if (phase === 'gameover') {
    const avgWpm = Math.round(results.reduce((s, r) => s + r.wpm, 0) / results.length);
    const avgAccuracy = Math.round(results.reduce((s, r) => s + r.accuracy, 0) / results.length);
    const isGreat = avgWpm >= 40 && avgAccuracy >= 90;

    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg" style={{ backgroundColor: '#58CC02' }}>
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-display text-2xl font-bold g-title mb-1">Race Complete!</h2>
          <p className="text-sm g-body mb-4">{isGreat ? 'Amazing typing skills!' : 'Keep practicing to improve!'}</p>

          <div className="b-card p-4 mb-4 max-w-xs mx-auto">
            <div className="grid grid-cols-2 gap-3 text-center mb-3">
              <div>
                <p className="font-display text-2xl font-bold g-blue">{avgWpm}</p>
                <p className="text-[10px] g-muted">Avg WPM</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold g-green">{avgAccuracy}%</p>
                <p className="text-[10px] g-muted">Accuracy</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold g-yellow">{bestWpm}</p>
                <p className="text-[10px] g-muted">Best WPM</p>
              </div>
              <div>
                <p className="font-display text-2xl font-bold g-orange">{totalChars}</p>
                <p className="text-[10px] g-muted">Chars Typed</p>
              </div>
            </div>

            <div className="space-y-1 g-border border-t pt-2">
              {results.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs">
                  <span className="g-muted truncate flex-1 text-left">{r.snippet}</span>
                  <span className="font-bold g-blue ml-2">{r.wpm}wpm</span>
                  <span className="g-green ml-1">{r.accuracy}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={handleRestart} className="btn-3d btn-3d-blue px-6 py-3 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Race Again
            </button>
            <button onClick={handleFinish} className="btn-3d btn-3d-green px-6 py-3 text-sm flex items-center gap-2">
              Continue <ArrowRight className="w-4 h-4" />
            </button>
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
          <button onClick={() => { onProgress?.(currentIdx); onExit(); }} className="text-xs g-muted font-medium">Exit</button>
          <span className="text-xs font-bold g-muted">{currentIdx + 1} / {snippets.length}</span>
        </div>

        {/* Progress */}
        <div className="g-track h-2 rounded-full overflow-hidden mb-2">
          <motion.div className="h-full rounded-full" style={{ backgroundColor: '#1CB0F6' }}
            animate={{ width: `${((currentIdx + (isDone ? 1 : 0)) / snippets.length) * 100}%` }} />
        </div>

        {/* Stats row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Zap className="w-4 h-4 g-yellow" />
              <span className="text-sm font-bold g-yellow">{wpm} WPM</span>
            </div>
            <div className="flex items-center gap-1">
              <Target className="w-4 h-4 g-green" />
              <span className="text-sm font-bold g-green">{accuracy}%</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Timer */}
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border ${timeLeft <= 10 ? 'border-[#FF4B4B]/30 bg-[#FF4B4B]/10' : 'g-border'}`}>
              <Timer className={`w-3.5 h-3.5 ${timeLeft <= 10 ? 'g-red' : 'g-muted'}`} />
              <span className={`text-sm font-bold ${timeLeft <= 10 ? 'g-red' : 'g-muted'}`}>{timeLeft}s</span>
            </div>
            {streak > 1 && (
              <div className="flex items-center gap-1 px-2 py-0.5 rounded-full border border-[#FF9600]/30" style={{ backgroundColor: '#FF9600' + '10' }}>
                <Flame className="w-3 h-3 g-orange" />
                <span className="text-[10px] font-bold g-orange">{streak}x streak</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-xs g-body mb-2 font-medium">{snippet.description}</p>

      {/* Code display */}
      <div className="flex-1 g-code rounded-2xl border-2 p-4 overflow-auto mb-3 relative" style={{ borderColor: '#1e1e2e' }}>
        <div className="flex items-center gap-2 mb-2 pb-2 g-border border-b">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/60" />
          </div>
          <span className="text-[10px] g-muted font-mono">{snippet.language}</span>
        </div>
        <pre className="whitespace-pre-wrap font-mono text-sm leading-6">{renderCode()}</pre>

        {/* Hidden input for capturing keystrokes — scoped to this box only,
            so it doesn't float over the header and block the Exit button. */}
        {phase === 'typing' && (
          <textarea
            ref={inputRef}
            value={userInput}
            onChange={e => handleInput(e.target.value)}
            className="absolute inset-0 opacity-0"
            spellCheck={false}
            autoComplete="off"
            autoCapitalize="off"
          />
        )}
      </div>

      {/* Snippet done */}
      {phase === 'snippet-done' && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
          <div className="b-card p-3 mb-3 inline-block">
            <p className="text-sm font-bold g-green">{wpm} WPM</p>
            <p className="text-xs g-muted">{accuracy}% accuracy</p>
          </div>
          <div>
            <button onClick={handleNext} className="btn-3d btn-3d-green px-6 py-3 text-sm font-bold">
              Next Snippet <ArrowRight className="w-4 h-4 inline ml-1" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Ad-gated answer reveal + tap-to-focus hint */}
      {phase === 'typing' && (
        <div className="mt-auto flex flex-col items-center gap-1.5">
          {watchingAd ? (
            <p className="flex items-center gap-2 text-xs font-bold" style={{ color: '#FF9600' }}>
              <PlayCircle className="w-3.5 h-3.5 animate-pulse" /> Watching ad — typing the answer…
            </p>
          ) : (
            <WatchAdButton
              adUnitId={AD_UNITS.hint}
              label="Watch ad to reveal answer"
              onReward={revealAnswer}
              className="text-xs font-bold"
              style={{ color: '#1CB0F6' }}
            />
          )}
          <p className="text-center text-[10px] g-muted">Click anywhere and start typing</p>
        </div>
      )}
    </div>
  );
}
