import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sparkles, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const PET_STAGES = [
  { level: 1, name: 'Byte', emoji: '🥚', desc: 'A mysterious egg...', color: '#FFC800', minXP: 0 },
  { level: 2, name: 'Bitzy Jr.', emoji: '🐣', desc: 'A tiny coder hatches!', color: '#58CC02', minXP: 200 },
  { level: 3, name: 'Codeling', emoji: '🐥', desc: 'Starting to understand loops!', color: '#1CB0F6', minXP: 500 },
  { level: 4, name: 'Debugger', emoji: '🦊', desc: 'Hunting bugs like a pro!', color: '#FF9600', minXP: 1000 },
  { level: 5, name: 'Bit Beast', emoji: '🦁', desc: 'A fearsome full-stack beast!', color: '#CE82FF', minXP: 2000 },
  { level: 6, name: 'Code Dragon', emoji: '🐉', desc: 'Legendary master of all code!', color: '#FF4B4B', minXP: 5000 },
];

const MOODS = [
  { id: 'happy', emoji: '😄', label: 'Happy', threshold: 80 },
  { id: 'neutral', emoji: '😊', label: 'Content', threshold: 50 },
  { id: 'tired', emoji: '😴', label: 'Tired', threshold: 20 },
  { id: 'hungry', emoji: '😤', label: 'Hungry', threshold: 0 },
];

const PET_ACTIONS = [
  { id: 'study', label: 'Study Together', emoji: '📚', desc: '+20 happiness', xpCost: 0, happinessGain: 20, color: '#58CC02' },
  { id: 'play', label: 'Play Games', emoji: '🎮', desc: '+30 happiness', xpCost: 0, happinessGain: 30, color: '#CE82FF' },
  { id: 'feed', label: 'Feed Snack', emoji: '🍎', desc: '+25 happiness', xpCost: 5, happinessGain: 25, color: '#FF9600' },
  { id: 'evolve', label: 'Evolve!', emoji: '✨', desc: 'Requires XP milestone', xpCost: 0, happinessGain: 0, color: '#FFC800' },
];

const PET_SAYINGS: Record<string, string[]> = {
  happy: [
    'Let\'s write some amazing code today! 🚀',
    'I\'m so proud of your progress! 💪',
    'You\'re becoming a real developer! ⭐',
    'Want to tackle a challenge together? ⚔️',
  ],
  neutral: [
    'Ready to learn something new? 📖',
    'A little practice goes a long way! 🌱',
    'You\'ve got this! I believe in you! 💙',
  ],
  tired: [
    'I need some study time! 😴',
    'Feed me some code exercises! 🍎',
    'Let\'s do a quick lesson together! 📚',
  ],
  hungry: [
    'I\'m getting rusty without practice! 😤',
    'Complete a lesson to cheer me up! 🙏',
    'My debugging skills need a workout! 🐛',
  ],
};

const PET_BONUSES: Record<string, { label: string; value: string }[]> = {
  happy: [{ label: 'XP Boost', value: '+10%' }, { label: 'Coin Bonus', value: '+5%' }],
  neutral: [{ label: 'XP Boost', value: '+5%' }],
  tired: [],
  hungry: [{ label: 'XP Penalty', value: '-5%' }],
};

export default function PetPage() {
  const { profile, isLoading } = useAuth();
  const { showXPPopup, addXP } = useGame();

  const xp = profile?.xp ?? 0;
  const [happiness, setHappiness] = useState(() => {
    const saved = localStorage.getItem('bitzy_pet_happiness');
    return saved ? parseInt(saved) : 70;
  });
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [showEvolution, setShowEvolution] = useState(false);
  const [sayingIdx, setSayingIdx] = useState(0);
  const [petting, setPetting] = useState(false);

  // Real (live) stage vs CONFIRMED (displayed) stage — kept separate on
  // purpose. Without this, the pet's appearance would silently flip the
  // moment ANY XP-granting action (Study, Play — even lessons/quizzes done
  // elsewhere in the app) happened to cross a threshold, which looked like
  // it was "evolving on every click" with no warning or celebration. Now
  // the pet only visually evolves when you deliberately hit "Evolve!" and
  // confirm it in the modal — XP can keep accumulating quietly in the
  // background without the pet's look changing out from under you.
  const liveStage = PET_STAGES.reduce((best, stage) =>
    xp >= stage.minXP ? stage : best, PET_STAGES[0]);

  const [confirmedLevel, setConfirmedLevel] = useState<number>(() => {
    const saved = localStorage.getItem('bitzy_pet_confirmed_stage');
    // First time ever loading this: don't regress an existing user back to
    // the egg — start them confirmed at whatever their real stage already
    // is. After that, growth only advances through the Evolve button.
    return saved ? parseInt(saved) : liveStage.level;
  });
  useEffect(() => {
    localStorage.setItem('bitzy_pet_confirmed_stage', String(confirmedLevel));
  }, [confirmedLevel]);

  const petStage = PET_STAGES.find(s => s.level === confirmedLevel) ?? PET_STAGES[0];
  const nextStage = PET_STAGES.find(s => s.level === confirmedLevel + 1);
  const readyToEvolve = !!nextStage && xp >= nextStage.minXP;

  const getMood = () => {
    if (happiness >= 80) return MOODS[0];
    if (happiness >= 50) return MOODS[1];
    if (happiness >= 20) return MOODS[2];
    return MOODS[3];
  };
  const mood = getMood();
  const sayings = PET_SAYINGS[mood.id] ?? PET_SAYINGS.neutral;

  // Decay happiness over time (per session)
  useEffect(() => {
    const interval = setInterval(() => {
      setHappiness(h => {
        const newH = Math.max(0, h - 1);
        localStorage.setItem('bitzy_pet_happiness', String(newH));
        return newH;
      });
    }, 30000); // -1 every 30 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    localStorage.setItem('bitzy_pet_happiness', String(happiness));
  }, [happiness]);

  // Cycle sayings
  useEffect(() => {
    const t = setInterval(() => setSayingIdx(i => (i + 1) % sayings.length), 5000);
    return () => clearInterval(t);
  }, [sayings.length]);

  const handleAction = (action: typeof PET_ACTIONS[0]) => {
    if (action.id === 'evolve') {
      if (readyToEvolve) {
        setShowEvolution(true);
      } else {
        showXPPopup(0, 'xp', `Need ${nextStage?.minXP ?? 0} XP to evolve!`);
      }
      return;
    }
    const newH = Math.min(100, happiness + action.happinessGain);
    setHappiness(newH);
    setLastAction(action.id);
    if (action.id === 'study') {
      addXP(5, 'pet_study');
      showXPPopup(5, 'xp', '+5 XP! Your pet helped you study! 📚');
    } else if (action.id === 'play') {
      addXP(3, 'pet_play');
      showXPPopup(3, 'xp', '+3 XP! Play time boosts creativity! 🎮');
    }
    setTimeout(() => setLastAction(null), 2000);
  };

  const handlePet = () => {
    setPetting(true);
    setHappiness(h => Math.min(100, h + 5));
    setTimeout(() => setPetting(false), 800);
  };

  const xpToNext = nextStage ? nextStage.minXP - xp : 0;
  const progressToNext = nextStage ? Math.min(100, ((xp - petStage.minXP) / (nextStage.minXP - petStage.minXP)) * 100) : 100;

  // Wait for the real profile to finish loading before allowing any pet
  // action. Without this, a brand-new user (whose profile row may still be
  // in the middle of being created right after signup) could tap an action
  // button while `profile` was still null — addXP() would then silently
  // no-op internally (it needs a real profile row to update), making
  // Actions look completely broken for new players specifically.
  if (isLoading || !profile) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#58CC02] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={I}>
        <h1 className="font-display text-2xl font-bold mb-1">🐾 Your Companion</h1>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Your pet grows as you learn! Keep it happy for XP bonuses.
        </p>
      </motion.div>

      {/* Pet display */}
      <motion.div variants={I} className="d-card p-6 text-center relative overflow-hidden"
        style={{ borderColor: petStage.color + '40' }}>
        {/* Background glow */}
        <div className="absolute inset-0 rounded-3xl opacity-5"
          style={{ background: `radial-gradient(circle at center, ${petStage.color}, transparent)` }} />

        {/* Mood badge */}
        <div className="absolute top-4 right-4 flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold"
          style={{ backgroundColor: petStage.color + '20', color: petStage.color }}>
          {mood.emoji} {mood.label}
        </div>

        {/* Pet emoji */}
        <motion.button
          onClick={handlePet}
          className="text-8xl mb-2 block mx-auto cursor-pointer select-none"
          animate={petting
            ? { scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] }
            : { y: [0, -6, 0] }
          }
          transition={petting
            ? { duration: 0.6 }
            : { repeat: Infinity, duration: 2.5, ease: 'easeInOut' }
          }
        >
          {petStage.emoji}
        </motion.button>

        <h2 className="font-display text-2xl font-bold mb-0.5" style={{ color: petStage.color }}>
          {petStage.name}
        </h2>
        <p className="text-xs mb-1" style={{ color: 'var(--text-muted)' }}>{petStage.desc}</p>
        <p className="text-[10px] mb-4" style={{ color: 'var(--text-muted)' }}>Tap to pet! 🐾</p>

        {/* Happiness bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold mb-1.5">
            <div className="flex items-center gap-1">
              <Heart className="w-3.5 h-3.5" style={{ color: '#FF4B4B' }} />
              <span style={{ color: 'var(--text-muted)' }}>Happiness</span>
            </div>
            <span style={{ color: happiness > 50 ? '#58CC02' : happiness > 20 ? '#FF9600' : '#FF4B4B' }}>
              {happiness}%
            </span>
          </div>
          <div className="d-progress h-3.5">
            <motion.div
              className="d-progress-fill"
              style={{ backgroundColor: happiness > 50 ? '#58CC02' : happiness > 20 ? '#FF9600' : '#FF4B4B' }}
              animate={{ width: `${happiness}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>

        {/* Active bonuses */}
        {PET_BONUSES[mood.id].length > 0 && (
          <div className="flex justify-center gap-2 mb-4">
            {PET_BONUSES[mood.id].map(bonus => (
              <div key={bonus.label} className="flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: bonus.value.startsWith('+') ? '#F0FFE5' : '#FFE8E8', color: bonus.value.startsWith('+') ? '#58CC02' : '#FF4B4B' }}>
                <Sparkles className="w-3 h-3" />
                {bonus.label} {bonus.value}
              </div>
            ))}
          </div>
        )}

        {/* Saying bubble */}
        <AnimatePresence mode="wait">
          <motion.div
            key={sayingIdx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-xs italic px-4 py-2 rounded-2xl"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}
          >
            💬 "{sayings[sayingIdx]}"
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Evolution progress */}
      {nextStage && (
        <motion.div variants={I} className="d-card p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{petStage.emoji}</span>
              <ChevronRight className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />
              <span className="text-xl opacity-50">{nextStage.emoji}</span>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold" style={{ color: nextStage.color }}>
                {xpToNext} XP to evolve
              </div>
            </div>
          </div>
          <div className="d-progress h-3">
            <motion.div
              className="d-progress-fill"
              style={{ backgroundColor: nextStage.color }}
              initial={{ width: 0 }}
              animate={{ width: `${progressToNext}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <p className="text-[10px] mt-1.5 text-center" style={{ color: 'var(--text-muted)' }}>
            Evolve to <strong>{nextStage.name}</strong> at {nextStage.minXP} XP
          </p>
        </motion.div>
      )}

      {/* Actions */}
      <motion.div variants={I}>
        <h2 className="font-display font-bold mb-3 text-sm">🎮 Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          {PET_ACTIONS.map(action => (
            <motion.button
              key={action.id}
              whileTap={{ scale: 0.95 }}
              whileHover={{ scale: 1.02 }}
              onClick={() => handleAction(action)}
              className="d-card p-3 text-left relative overflow-hidden"
              style={{ borderColor: action.color + '40' }}
            >
              <AnimatePresence>
                {lastAction === action.id && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 2 }}
                    className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl"
                    style={{ backgroundColor: action.color + '30' }}
                  >
                    <span className="font-display font-bold" style={{ color: action.color }}>
                      +{action.happinessGain} 💖
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="text-2xl mb-1.5">{action.emoji}</div>
              <div className="font-display font-bold text-xs mb-0.5">{action.label}</div>
              <div className="text-[10px]" style={{ color: action.color }}>{action.desc}</div>
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* All evolutions */}
      <motion.div variants={I} className="d-card p-4">
        <h2 className="font-display font-bold mb-3 text-sm">🌟 Evolution Path</h2>
        <div className="flex items-center justify-between">
          {PET_STAGES.map((stage, i) => {
            const reached = xp >= stage.minXP;
            return (
              <div key={stage.level} className="flex flex-col items-center gap-1 flex-1">
                <motion.div
                  className="text-2xl"
                  style={{ opacity: reached ? 1 : 0.35, filter: reached ? 'none' : 'grayscale(1)' }}
                  animate={reached ? { y: [0, -3, 0] } : {}}
                  transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}
                >
                  {stage.emoji}
                </motion.div>
                <div className="text-[8px] text-center font-bold" style={{ color: reached ? stage.color : 'var(--text-muted)' }}>
                  {stage.name}
                </div>
                {i < PET_STAGES.length - 1 && (
                  <div className="absolute" />
                )}
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Evolution modal */}
      <AnimatePresence>
        {showEvolution && nextStage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="d-card w-full max-w-xs text-center p-8"
            >
              <motion.div
                className="text-8xl mb-4"
                animate={{ rotate: [0, -20, 20, -10, 10, 0], scale: [1, 1.2, 1.2, 1] }}
                transition={{ duration: 1 }}
              >
                {nextStage.emoji}
              </motion.div>
              <h2 className="font-display text-2xl font-bold mb-2" style={{ color: nextStage.color }}>
                Evolution! ✨
              </h2>
              <p className="font-bold mb-1">{petStage.name} → {nextStage.name}</p>
              <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{nextStage.desc}</p>
              <button
                className="d-btn d-btn-md w-full text-white"
                style={{ backgroundColor: nextStage.color, boxShadow: `0 4px 0 ${nextStage.color}80` }}
                onClick={() => {
                  setShowEvolution(false);
                  setConfirmedLevel(nextStage.level); // pet's appearance only changes now, on deliberate confirm
                  addXP(100, 'pet_evolution');
                  showXPPopup(100, 'xp', `🌟 Evolved to ${nextStage.name}! +100 XP!`);
                }}
              >
                Amazing! 🎉
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}