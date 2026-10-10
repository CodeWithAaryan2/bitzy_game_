import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Swords, Zap, Trophy, Timer, ArrowRight, RotateCcw, Code2, Shield } from 'lucide-react';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS, showRewardedAd } from '@/lib/ads';

interface BattleChallenge {
  id: string;
  title: string;
  description: string;
  starterCode: string;
  testCases: { input: string; expected: string }[];
  hints: string[];
}

interface CodeBattleGameProps {
  challenges: BattleChallenge[];
  onComplete: (playerHealth: number, opponentHealth: number, wins: number) => void;
  onExit: () => void;
}

const AI_OPPONENTS = [
  { name: 'BugBot', avatar: '🤖', color: '#FF4B4B', title: 'Code Destroyer' },
  { name: 'SyntaxSage', avatar: '🧙', color: '#CE82FF', title: 'Logic Master' },
  { name: 'AlgoAce', avatar: '🦅', color: '#1CB0F6', title: 'Speed Demon' },
  { name: 'NullKnight', avatar: '⚔️', color: '#FF9600', title: 'Bug Hunter' },
];

export default function CodeBattleGame({ challenges, onComplete, onExit }: CodeBattleGameProps) {
  const [round, setRound] = useState(0);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [phase, setPhase] = useState<'battle' | 'coding' | 'result' | 'gameover'>('battle');
  const [code, setCode] = useState('');
  const [output, setOutput] = useState('');
  const [wins, setWins] = useState(0);
  const [showDamage, setShowDamage] = useState<'player' | 'opponent' | null>(null);
  const [opponentTyping, setOpponentTyping] = useState(false);
  // "Hints" are gone — watching the ad now reveals the full answer/solution
  // guide directly, all at once, instead of one hint at a time.
  const [answerRevealed, setAnswerRevealed] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [timeLeft, setTimeLeft] = useState(120);

  const opponent = AI_OPPONENTS[round % AI_OPPONENTS.length];
  const challenge = challenges[round % challenges.length];

  useEffect(() => {
    if (phase === 'coding' && challenge) {
      setCode(challenge.starterCode);
      setTimeLeft(120);
      setAnswerRevealed(false);
      setShowAnswer(false);
    }
  }, [phase, round, challenge]);

  // Timer
  useEffect(() => {
    if (phase !== 'coding') return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase]);

  const handleTimeout = useCallback(async () => {
    // Time's up — show the rewarded ad directly (no button), then reveal
    // the answer/solution guide once it finishes.
    await showRewardedAd(AD_UNITS.hint);
    setAnswerRevealed(true);
    setShowAnswer(true);
    setPhase('result');
    setOutput('Time\'s up! The opponent solved it faster.');
    const damage = 25;
    setPlayerHealth(prev => Math.max(0, prev - damage));
    setShowDamage('player');
    // timeout handled
    setTimeout(() => setShowDamage(null), 800);
  }, [opponent.name]);

  const handleSubmit = () => {
    if (phase !== 'coding') return;
    if (timerRef.current) clearInterval(timerRef.current);

    // Simulate checking solution
    setOpponentTyping(true);
    setTimeout(() => {
      setOpponentTyping(false);
      const playerCorrect = code.trim().length > 10 && code.includes('return');
      const aiCorrect = Math.random() > 0.3; // AI has 70% chance to solve

      if (playerCorrect && !aiCorrect) {
        const damage = 30 + Math.floor(timeLeft / 5);
        setOpponentHealth(prev => Math.max(0, prev - damage));
        setShowDamage('opponent');
        setOutput(`✓ Correct! You dealt ${damage} damage to ${opponent.name}!`);
        // win logged
        setWins(prev => prev + 1);
      } else if (playerCorrect && aiCorrect) {
        const playerSpeed = timeLeft;
        const aiSpeed = Math.floor(Math.random() * 60) + 30;
        if (playerSpeed > aiSpeed) {
          const damage = 20;
          setOpponentHealth(prev => Math.max(0, prev - damage));
          setShowDamage('opponent');
          setOutput(`✓ You were faster! ${damage} damage!`);
          // speed win
          setWins(prev => prev + 1);
        } else {
          const damage = 20;
          setPlayerHealth(prev => Math.max(0, prev - damage));
          setShowDamage('player');
          setOutput(`✓ Correct, but ${opponent.name} was faster! You took ${damage} damage.`);
          // opponent faster
        }
      } else if (!playerCorrect && aiCorrect) {
        const damage = 25;
        setPlayerHealth(prev => Math.max(0, prev - damage));
        setShowDamage('player');
        setOutput(`✗ Your solution didn't work. ${opponent.name} dealt ${damage} damage!`);
        // wrong answer
      } else {
        setOutput(`✗ Neither solved it! No damage dealt.`);
        // both failed
      }
      setPhase('result');
      setTimeout(() => setShowDamage(null), 800);
    }, 1500);
  };

  const handleNextRound = () => {
    if (playerHealth <= 0 || opponentHealth <= 0) {
      setPhase('gameover');
    } else if (round < challenges.length - 1) {
      setRound(prev => prev + 1);
      setPhase('battle');
      setOutput('');
    } else {
      setPhase('gameover');
    }
  };

  const handleStartCoding = () => {
    setPhase('coding');
  };

  const handleFinish = () => {
    onComplete(playerHealth, opponentHealth, wins);
  };

  const handleRestart = () => {
    setRound(0);
    setPlayerHealth(100);
    setOpponentHealth(100);
    setPhase('battle');
    setCode('');
    setOutput('');
    setWins(0);
    setTimeLeft(120);
  };

  // Battle intro screen
  if (phase === 'battle') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <p className="text-xs font-bold g-muted mb-2">ROUND {round + 1} / {challenges.length}</p>
          <div className="flex items-center gap-6 mb-6">
            {/* Player */}
            <motion.div
              animate={{ x: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[#58CC02] flex items-center justify-center text-2xl shadow-lg">
                <Code2 className="w-8 h-8 text-white" />
              </div>
              <p className="text-xs font-bold g-body mt-1">You</p>
            </motion.div>

            {/* VS */}
            <div className="text-center">
              <Swords className="w-8 h-8 text-[#FF4B4B]" />
              <p className="text-lg font-black text-[#FF4B4B]">VS</p>
            </div>

            {/* Opponent */}
            <motion.div
              animate={{ x: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-center"
            >
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
                style={{ backgroundColor: opponent.color }}
              >
                <Shield className="w-8 h-8 text-white" />
              </div>
              <p className="text-xs font-bold g-body mt-1">{opponent.name}</p>
            </motion.div>
          </div>

          <h2 className="font-display text-xl font-bold g-title mb-1">{opponent.title}</h2>
          <p className="text-sm g-muted mb-4">{challenge?.title || 'Loading...'}</p>

          {/* Health bars */}
          <div className="flex gap-4 mb-4 max-w-xs mx-auto">
            <div className="flex-1">
              <div className="h-3 g-track rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#58CC02] rounded-full"
                  animate={{ width: `${playerHealth}%` }}
                />
              </div>
              <p className="text-[10px] g-muted mt-1">You: {playerHealth} HP</p>
            </div>
            <div className="flex-1">
              <div className="h-3 g-track rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: opponent.color }}
                  animate={{ width: `${opponentHealth}%` }}
                />
              </div>
              <p className="text-[10px] g-muted mt-1">{opponent.name}: {opponentHealth} HP</p>
            </div>
          </div>

          <button onClick={handleStartCoding} className="btn-3d btn-3d-red px-8 py-3 text-base font-bold">
            <Swords className="w-5 h-5 inline mr-2" /> Start Battle!
          </button>
        </motion.div>
      </div>
    );
  }

  // Game over screen
  if (phase === 'gameover') {
    const victory = opponentHealth <= 0 || playerHealth > opponentHealth;
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
          <motion.div
            animate={victory ? { y: [0, -10, 0] } : {}}
            transition={{ repeat: Infinity, duration: 2 }}
            className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center text-4xl shadow-lg"
            style={{ backgroundColor: victory ? '#58CC02' : '#FF4B4B' }}
          >
            {victory ? <Trophy className="w-10 h-10 text-white" /> : <Swords className="w-10 h-10 text-white" />}
          </motion.div>

          <h2 className="font-display text-2xl font-bold g-title mb-1">
            {victory ? 'Victory!' : 'Defeat!'}
          </h2>
          <p className="text-sm g-muted mb-4">
            {victory ? 'You defeated all opponents!' : 'Your opponent was stronger this time.'}
          </p>

          <div className="b-card p-4 mb-4 max-w-xs mx-auto">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="font-display text-xl font-bold text-[#58CC02]">{wins}</p>
                <p className="text-[10px] g-muted">Wins</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold" style={{ color: opponent.color }}>{playerHealth}</p>
                <p className="text-[10px] g-muted">Your HP</p>
              </div>
              <div>
                <p className="font-display text-xl font-bold text-[#FFC800]">{Math.max(0, opponentHealth)}</p>
                <p className="text-[10px] g-muted">Enemy HP</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <button onClick={handleRestart} className="btn-3d btn-3d-blue px-6 py-3 text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Battle Again
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
      {/* Battle Header */}
      <div className="flex-shrink-0 mb-3">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onExit} className="text-xs g-muted font-medium hover:opacity-70">Exit</button>
          <span className="text-xs font-bold g-muted">Round {round + 1}</span>
        </div>

        {/* Health bars */}
        <div className="flex gap-3 items-center">
          <div className="flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <Code2 className="w-3 h-3 text-[#58CC02]" />
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-light)' }}>You</span>
              <span className="text-[10px] g-muted ml-auto">{playerHealth} HP</span>
            </div>
            <div className="h-2.5 g-track rounded-full overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <motion.div
                className="h-full bg-[#58CC02] rounded-full"
                animate={{ width: `${playerHealth}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>

          <Swords className="w-5 h-5 text-[#FF4B4B] flex-shrink-0" />

          <div className="flex-1">
            <div className="flex items-center gap-1 mb-0.5">
              <Shield className="w-3 h-3" style={{ color: opponent.color }} />
              <span className="text-[10px] font-bold" style={{ color: 'var(--text-light)' }}>{opponent.name}</span>
              {opponentTyping && (
                <span className="text-[10px] text-[#FF4B4B] animate-pulse ml-auto">coding...</span>
              )}
            </div>
            <div className="h-2.5 g-track rounded-full overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: opponent.color }}
                animate={{ width: `${opponentHealth}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Damage flash effect */}
        <AnimatePresence>
          {showDamage === 'player' && (
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-red-500 pointer-events-none z-40"
            />
          )}
          {showDamage === 'opponent' && (
            <motion.div
              initial={{ opacity: 0.6 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-green-500 pointer-events-none z-40"
            />
          )}
        </AnimatePresence>
      </div>

      {/* Challenge Description */}
      {phase === 'coding' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col">
          <div className="b-card p-3 mb-2">
            <h3 className="font-display text-sm font-bold g-title mb-1">{challenge.title}</h3>
            <p className="text-xs g-body leading-relaxed">{challenge.description}</p>
            {challenge.testCases.length > 0 && (
              <div className="mt-2 p-2 rounded-xl bg-[var(--surface)] text-[var(--text)]">
                <p className="text-[10px] font-bold g-muted mb-1">Example:</p>
                <p className="text-[10px] font-mono g-body">Input: {challenge.testCases[0].input}</p>
                <p className="text-[10px] font-mono text-green-600">Expected: {challenge.testCases[0].expected}</p>
              </div>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-between mb-2">
            <div className={`flex items-center gap-1 ${timeLeft <= 15 ? 'text-red-500 animate-pulse' : 'g-muted'}`}>
              <Timer className="w-4 h-4" />
              <span className="text-sm font-bold">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
            </div>
            {answerRevealed ? (
              <button
                onClick={() => setShowAnswer(s => !s)}
                className="text-xs font-bold text-[#1CB0F6] hover:text-blue-600"
              >
                {showAnswer ? 'Hide Answer' : 'Show Answer'}
              </button>
            ) : (
              <WatchAdButton
                adUnitId={AD_UNITS.hint}
                label="Watch ad for answer"
                onReward={() => { setAnswerRevealed(true); setShowAnswer(true); }}
                className="text-xs font-bold text-[#1CB0F6] hover:text-blue-600"
              />
            )}
          </div>

          {showAnswer && challenge.hints.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-2 p-2 rounded-xl border" style={{ backgroundColor: 'rgba(255,200,0,0.12)', borderColor: 'rgba(255,200,0,0.3)' }}>
              <p className="text-[10px] font-bold uppercase mb-1" style={{ color: 'var(--yellow-dark, #C99A00)' }}>Answer</p>
              {challenge.hints.map((h, i) => (
                <p key={i} className="text-xs font-semibold" style={{ color: 'var(--yellow-dark, #C99A00)' }}>{h}</p>
              ))}
            </motion.div>
          )}

          {/* Code Editor */}
          <textarea
            value={code}
            onChange={e => setCode(e.target.value)}
            className="code-editor flex-1 min-h-[200px] p-4 resize-none focus:outline-none text-gray-200"
            spellCheck={false}
          />

          {/* Result */}
          <AnimatePresence>
            {output && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-3 rounded-2xl mb-2 text-sm font-medium ${
                  output.includes('✓') ? 'bg-green-50 border-2 border-green-200 text-green-700' :
                  output.includes('✗') ? 'bg-red-50 border-2 border-red-200 text-red-700' :
                  'bg-blue-50 border-2 border-blue-200 text-blue-700'
                }`}
              >
                {output}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Buttons */}
          <div className="flex gap-2 flex-shrink-0">
            {phase === 'coding' && !output && (
              <button onClick={handleSubmit} className="btn-3d btn-3d-red flex-1 py-3 text-sm font-bold">
                <Zap className="w-4 h-4 inline mr-1" /> Submit Solution
              </button>
            )}
            {phase === 'coding' && output && (
              <button onClick={handleNextRound} className="btn-3d btn-3d-green flex-1 py-3 text-sm font-bold">
                {playerHealth <= 0 || opponentHealth <= 0 || round >= challenges.length - 1 ? 'See Results' : 'Next Round'}
                <ArrowRight className="w-4 h-4 inline ml-1" />
              </button>
            )}
          </div>
        </motion.div>
      )}

      {/* Result screen */}
      {phase === 'result' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col items-center justify-center">
          <div className={`text-6xl mb-4 ${output.includes('✓') ? '' : ''}`}>
            {output.includes('✓') ? '⚔️' : '💥'}
          </div>
          <p className="text-sm font-medium g-body text-center mb-4 max-w-xs">{output}</p>
          <button onClick={handleNextRound} className="btn-3d btn-3d-green px-6 py-3 text-sm font-bold">
            {playerHealth <= 0 || opponentHealth <= 0 || round >= challenges.length - 1 ? 'See Results' : 'Next Round'}
          </button>
        </motion.div>
      )}
    </div>
  );
}