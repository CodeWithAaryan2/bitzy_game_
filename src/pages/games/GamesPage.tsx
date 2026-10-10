/**
 * src/pages/games/GamesPage.tsx
 *
 * All game questions now come from the `game_levels` table in Supabase.
 * Admin creates/publishes levels via the Admin Panel.
 * No hardcoded data files used.
 */
import { useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Gamepad2, Zap, Trophy, Flame,
  Target, Swords, Keyboard, Bug, ListOrdered, Eye, Pencil,
  Brain, ChevronRight, Loader2, Skull, Rocket,
} from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { useAuth, getLevelFromXP } from '@/context/AuthContext';
import { useAllGameProgress } from '@/hooks/useGameProgress';
import { saveGameProgress } from '@/lib/gamification';
import { supabase } from '@/lib/supabase';
import QuizGame from '@/components/games/QuizGame';
import SpeedTypingGame from '@/components/games/SpeedTypingGame';
import BugHuntGame from '@/components/games/BugHuntGame';
import CodeOrderGame from '@/components/games/CodeOrderGame';
import CodePredictionGame from '@/components/games/CodePredictionGame';
import FillBlankGame from '@/components/games/FillBlankGame';
import CodeRaceGame from '@/components/games/CodeRaceGame';
import BugSquashArena from '@/components/games/BugSquashArena';
import CodeRoyale from '@/components/games/CodeRoyale';
import CodeDash from '@/components/games/CodeDash';
import { useGameLevels } from '@/hooks/useDB';

type ActiveGame = 'quiz' | 'battle' | 'typing' | 'bughunt' | 'codeorder' | 'prediction' | 'fillblank'
  | 'memory' | 'truthy' | 'sprint' | 'coderace' | 'bugsquash' | 'royale' | 'dash' | null;
type QuizTopic = string;

const gameCategories = [
  {
    label: '🧠 Knowledge', color: '#58CC02',
    games: [
      { id: 'quiz' as ActiveGame,       title: 'Code Quiz',       desc: 'Test your knowledge fast!',       icon: Target,   color: '#58CC02', bg: 'rgba(88,204,2,0.12)', shadow: '#45A301' },
      { id: 'truthy' as ActiveGame,     title: 'True or False',   desc: 'Quick-fire true/false rounds!',   icon: Brain,    color: '#CE82FF', bg: 'rgba(206,130,255,0.12)', shadow: '#B563F5' },
      { id: 'prediction' as ActiveGame, title: 'Code Prediction', desc: 'Predict the output!',             icon: Eye,      color: '#FF9600', bg: 'rgba(255,150,0,0.12)', shadow: '#E88700' },
    ],
  },
  {
    label: '⚔️ Challenge', color: '#FF4B4B',
    games: [
      { id: 'bughunt' as ActiveGame,   title: 'Bug Hunt',       desc: 'Find and squash bugs!',        icon: Bug,      color: '#FF9600', bg: 'rgba(255,150,0,0.12)', shadow: '#E88700' },
      { id: 'fillblank' as ActiveGame, title: 'Fill the Blank', desc: 'Complete the missing code!',   icon: Pencil,   color: '#00C6B6', bg: 'rgba(0,198,182,0.12)', shadow: '#00A896' },
    ],
  },
  {
    label: '⚡ Speed', color: '#1CB0F6',
    games: [
      { id: 'typing' as ActiveGame,    title: 'Speed Typing',  desc: 'Race to type code fast!',    icon: Keyboard, color: '#1CB0F6', bg: 'rgba(28,176,246,0.12)', shadow: '#0C9BDE' },
      { id: 'codeorder' as ActiveGame, title: 'Code Order',    desc: 'Arrange lines in order!',    icon: ListOrdered, color: '#FF4B4B', bg: 'rgba(255,75,75,0.12)', shadow: '#E54343' },
    ],
  },
  {
    label: '👥 Multiplayer', color: '#7C3AED',
    games: [
      { id: 'coderace' as ActiveGame,  title: 'Code Race',        desc: 'Live race your friends in real time!',    icon: Swords, color: '#7C3AED', bg: 'rgba(124,58,237,0.12)', shadow: '#6D28D9' },
      { id: 'bugsquash' as ActiveGame, title: 'Bug Squash Arena', desc: 'Race to fix bugs live — friends included!', icon: Bug,    color: '#FF4B4B', bg: 'rgba(255,75,75,0.12)', shadow: '#E54343' },
      { id: 'royale' as ActiveGame,    title: 'Code Royale',      desc: 'Battle royale — last coder standing wins!', icon: Skull,  color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', shadow: '#7C3AED' },
      { id: 'dash' as ActiveGame,      title: 'Code Dash',        desc: 'Race friends across the track — fast answers = big leaps!', icon: Rocket, color: '#1CB0F6', bg: 'rgba(28,176,246,0.12)', shadow: '#0C9BDE' },
    ],
  },
];

function EmptyGameState({ gameType }: { gameType: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full py-20 text-center px-6">
      <Gamepad2 className="w-16 h-16 mb-4 opacity-30" style={{ color: 'var(--text-muted)' }}/>
      <h2 className="font-display text-xl font-bold mb-2" style={{ color: 'var(--text)' }}>No levels yet!</h2>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        No published <strong>{gameType}</strong> levels found.<br/>
        Admin can add levels from the Admin Panel → Game Levels.
      </p>
    </div>
  );
}

export default function GamesPage() {
  const { addXP, addCoins, checkAchievements } = useGame();
  const { profile, user } = useAuth();
  const levelInfo = getLevelFromXP(profile?.xp ?? 0);
  const [activeGame, setActiveGame] = useState<ActiveGame>(null);
  const [quizTopic, setQuizTopic] = useState<QuizTopic>('mixed');
  // Exact question index to resume on — set when opening a game that has
  // an in-progress (not fully finished) session saved.
  const [resumeIndex, setResumeIndex] = useState(0);
  const analyticsSession = useRef(`${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const answerSequence = useRef(0);

  // Load ALL published game levels once
  const { data: allLevels, loading } = useGameLevels();

  // Feature 1/6 — universal per-game resume: one query loads progress for
  // every game (memory, quiz, bughunt, coderace... and anything added
  // later), keyed only by the game's own id string. No game name hardcoded.
  const { progressMap, reload: reloadGameProgress } = useAllGameProgress();

  // Opening a game resumes the exact question the user was on, and the
  // topic they were playing, if they left mid-session.
  const openGame = (gameId: ActiveGame) => {
    const gp = gameId ? progressMap[gameId] : null;
    if (gp?.last_topic) setQuizTopic(gp.last_topic);
    setResumeIndex(gp && gp.current_level > 0 ? gp.current_level : 0);
    analyticsSession.current = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    answerSequence.current = 0;
    setActiveGame(gameId);
  };

  const exitGame = () => {
    setActiveGame(null);
    reloadGameProgress(); // menu badge reflects whatever question they were last on
  };

  // Feature 1 — called every time the player moves to a new question
  // inside a game, so exiting (or closing the tab) at ANY point resumes
  // on that exact question next time, not just after a full round.
  const pingProgress = (index: number) => {
    if (!user || !activeGame) return;
    saveGameProgress(user.id, activeGame, {
      score: 0,
      topic: quizTopic,
      questionIndex: index,
      isProgressPing: true,
    });
  };

  const recordAnswerResult = async ({ isCorrect }: { questionIndex: number; isCorrect: boolean }) => {
    if (!user?.id || !activeGame) return;
    const attempt = ++answerSequence.current;
    const { error } = await supabase.from('user_question_progress').insert({
      user_id: user.id,
      question_id: `game:${analyticsSession.current}:${attempt}`,
      game_name: activeGame,
      selected_answer: null,
      is_correct: Boolean(isCorrect),
      xp_earned: 0,
    });
    if (error) console.error('[game analytics] Could not save answer result:', error.message);
  };

  const handleComplete = async (xp: number, coins: number, recordedScore: number = xp) => {
    await addXP(xp, 'game');
    await addCoins(coins);
    // Feature 1 — universal game progress: save under the game's own id,
    // works identically for every current and future game. A full finish
    // resets the resume position (questionIndex: 0) so the next open
    // starts a fresh round instead of re-resuming the just-finished one.
    if (user && activeGame) {
      await saveGameProgress(user.id, activeGame, {
        score: recordedScore,
        xpEarned: xp,
        coinsEarned: coins,
        topic: quizTopic,
        questionIndex: 0,
      });
      await checkAchievements();
      await reloadGameProgress();
    }
    exitGame();
  };
  // Helper: get questions from DB levels for a game type + optional topic
  const getQuestions = (gameType: string, topic?: string) => {
    let levels = (allLevels ?? []).filter((l: any) => l.game_type === gameType);
    if (topic && topic !== 'mixed') levels = levels.filter((l: any) => l.topic === topic);
    return levels.flatMap((l: any) => l.questions ?? []);
  };

  // Live-room games (coderace/bugsquash/royale/dash) pick ONE level record —
  // its `id` is passed to the game which loads `questions` itself — rather
  // than flattening questions across levels like the solo games above.
  // Matches on `topic` first (existing convention in this file), falls back
  // to `language` (used by the seeded royale/bugsquash/dash levels), then
  // just takes the first available level for that game_type.
  const getRoomLevel = (gameType: string, topic: string) => {
    const levels = (allLevels ?? []).filter((l: any) => l.game_type === gameType);
    return (
      levels.find((l: any) => l.topic === topic) ||
      levels.find((l: any) => l.language === topic) ||
      levels[0]
    );
  };

  // Topic picker options — built from whatever `topic` values actually exist
  // on published levels, not a hardcoded guess. Previously this was a fixed
  // list of 7 topics regardless of what's really in Supabase, so picking one
  // with zero content just silently showed an empty game. 'mixed' (all
  // topics combined) is only offered when there's more than one real topic
  // to mix — with a single topic it's a duplicate of that topic anyway.
  const availableTopics = Array.from(
    new Set(
      (allLevels ?? [])
        .filter((l: any) => !activeGame || l.game_type === activeGame)
        .map((l: any) => l.topic ?? l.language)
        .filter(Boolean)
    )
  ) as string[];

  const topicOptions: string[] =
    availableTopics.length > 1
      ? ['mixed', ...availableTopics]
      : availableTopics;

  // ── Adapters: admin's Game Levels form saves a simple flat schema per
  // question (documented in AdminPage's schemaHint), but several game
  // components expect a richer nested shape. Without these adapters, admin-
  // created content either shows blank (truthy — missing `question` field)
  // or straight up can't render (bughunt/fillblank need arrays the admin
  // schema doesn't have at all). These convert one into the other so
  // anything created in Admin actually plays correctly. ──

  const adaptTruthy = (q: any) => ({
    ...q,
    question: q.statement,          // QuizGame renders `question.question` — admin only gives `statement`
    options: ['True', 'False'],
    correctIndex: q.isTrue ? 0 : 1,
  });

  // CodePredictionGame requires real multiple-choice (options + correctIndex);
  // admin only captures a single correct `output` string. Synthesize 3
  // plausible-looking wrong answers so existing content is actually playable,
  // and shuffle so the correct answer isn't always in the same position.
  const adaptPrediction = (q: any) => {
    const GENERIC_WRONG = ['Error', 'None', 'undefined', 'NaN', 'True', 'False', '0', '[]', '{}'];
    const pool = GENERIC_WRONG.filter(g => g !== q.output);
    const distractors = [...pool].sort(() => Math.random() - 0.5).slice(0, 3);
    const entries = [{ text: q.output, correct: true }, ...distractors.map(d => ({ text: d, correct: false }))]
      .sort(() => Math.random() - 0.5);
    return {
      ...q,
      options: entries.map(e => e.text),
      correctIndex: entries.findIndex(e => e.correct),
    };
  };

  const adaptBugHunt = (q: any, topic: string) => ({
    ...q,
    buggyCode: q.code,
    fixedCode: q.code, // admin doesn't capture a separate fixed version — best effort
    language: topic !== 'mixed' ? topic : 'python',
    description: 'Find the bug in this code!',
    bugs: [{ line: q.bugLine, hint: q.explanation, explanation: q.explanation }],
    points: 50,
  });

  const adaptFillBlank = (q: any) => {
    const idx = (q.template ?? '').indexOf('___');
    const code = (q.template ?? '').replace('___', '');
    return {
      ...q,
      code,
      language: 'python',
      blanks: [{ position: idx >= 0 ? idx : 0, answer: q.answer, hint: q.hint }],
      points: 20,
    };
  };

  // Admin schema only stores { id, code, language }; SpeedTypingGame also
  // wants a `description` field for its header — synthesize one if absent.
  const adaptTyping = (q: any) => ({
    ...q,
    code: q.code,
    language: q.language || 'javascript',
    description: q.description || 'Type this snippet as fast and accurately as you can!',
  });

  const adaptCodeOrder = (q: any, topic: string) => ({
    ...q,
    title: q.hint || 'Arrange the code in the correct order',
    language: topic !== 'mixed' ? topic : 'javascript',
    lines: q.lines,
    explanation: q.hint,
  });

  // ── Render active game ──────────────────────────────────────────────────────
  if (activeGame) {
    const quizQs       = getQuestions('quiz', quizTopic);
    const truthyQs     = getQuestions('truthy').map(adaptTruthy);
    const predictionQs = getQuestions('prediction', quizTopic).map(adaptPrediction);
    const bugQs        = getQuestions('bughunt', quizTopic).map((q: any) => adaptBugHunt(q, quizTopic));
    const fillQs       = getQuestions('fillblank', quizTopic).map(adaptFillBlank);
    const orderQs      = getQuestions('codeorder', quizTopic).map((q: any) => adaptCodeOrder(q, quizTopic));
    const typingQs      = getQuestions('typing', quizTopic).map(adaptTyping);

    if (activeGame === 'quiz') {
      if (!quizQs.length) return <EmptyGameState gameType="quiz"/>;
      return <div className="h-full"><QuizGame title={`${quizTopic.toUpperCase()} Quiz`} questions={quizQs}
        initialIndex={resumeIndex} onProgress={pingProgress} onAnswerResult={recordAnswerResult}
        onComplete={(score, _t, correct) => handleComplete(Math.round(score / 10), correct * 10, score)}
        onExit={exitGame}/></div>;
    }
    if (activeGame === 'truthy') {
      if (!truthyQs.length) return <EmptyGameState gameType="true or false"/>;
      return <div className="h-full"><QuizGame title="True or False"
        questions={truthyQs}
        initialIndex={resumeIndex} onProgress={pingProgress} onAnswerResult={recordAnswerResult}
        onComplete={(score, _t, correct) => handleComplete(Math.round(score / 10), correct * 10, score)}
        onExit={exitGame}/></div>;
    }
    if (activeGame === 'prediction') {
      if (!predictionQs.length) return <EmptyGameState gameType="code prediction"/>;
      return <div className="h-full"><CodePredictionGame questions={predictionQs}
        initialIndex={resumeIndex} onProgress={pingProgress} onAnswerResult={recordAnswerResult}
        onComplete={(score) => handleComplete(Math.round(score / 2), Math.round(score / 5), score)}
        onExit={exitGame}/></div>;
    }
    if (activeGame === 'bughunt') {
      if (!bugQs.length) return <EmptyGameState gameType="bug hunt"/>;
      return <div className="h-full"><BugHuntGame snippets={bugQs}
        initialIndex={resumeIndex} onProgress={pingProgress} onAnswerResult={recordAnswerResult}
        onComplete={(score) => handleComplete(Math.round(score / 2), Math.round(score / 5), score)}
        onExit={exitGame}/></div>;
    }
    if (activeGame === 'fillblank') {
      if (!fillQs.length) return <EmptyGameState gameType="fill the blank"/>;
      return <div className="h-full"><FillBlankGame questions={fillQs}
        initialIndex={resumeIndex} onProgress={pingProgress} onAnswerResult={recordAnswerResult}
        onComplete={(score, correct) => handleComplete(score, correct * 10, score)}
        onExit={exitGame}/></div>;
    }
    if (activeGame === 'codeorder') {
      if (!orderQs.length) return <EmptyGameState gameType="code order"/>;
      return <div className="h-full"><CodeOrderGame puzzles={orderQs}
        initialIndex={resumeIndex} onProgress={pingProgress} onAnswerResult={recordAnswerResult}
        onComplete={(score, correct) => handleComplete(score, correct * 10, score)}
        onExit={exitGame}/></div>;
    }
    if (activeGame === 'typing') {
      if (!typingQs.length) return <EmptyGameState gameType="speed typing"/>;
      return <div className="h-full"><SpeedTypingGame snippets={typingQs}
        initialIndex={resumeIndex} onProgress={pingProgress} onAnswerResult={recordAnswerResult}
        onComplete={(wpm, accuracy) => handleComplete(Math.round(wpm * (accuracy / 100)), Math.round(wpm / 3), Math.round(wpm * (accuracy / 100)))}
        onExit={exitGame}/></div>;
    }
    if (activeGame === 'coderace') {
      const raceLevels = (allLevels ?? []).filter((l: any) => l.game_type === 'coderace');
      const topicMatch = raceLevels.find((l: any) => l.topic === quizTopic) || raceLevels[0];
      if (!topicMatch) return <EmptyGameState gameType="code race"/>;
      return <div className="h-full"><CodeRaceGame gameLevelId={topicMatch.id} onExit={exitGame} onComplete={handleComplete} onAnswerResult={recordAnswerResult}/></div>;
    }
    if (activeGame === 'bugsquash') {
      const level = getRoomLevel('bugsquash', quizTopic);
      if (!level) return <EmptyGameState gameType="bug squash arena"/>;
      return <div className="h-full"><BugSquashArena gameLevelId={level.id} onExit={exitGame} onComplete={handleComplete} onAnswerResult={recordAnswerResult}/></div>;
    }
    if (activeGame === 'royale') {
      const level = getRoomLevel('royale', quizTopic);
      if (!level) return <EmptyGameState gameType="code royale"/>;
      return <div className="h-full"><CodeRoyale gameLevelId={level.id} onExit={exitGame} onComplete={handleComplete} onAnswerResult={recordAnswerResult}/></div>;
    }
    if (activeGame === 'dash') {
      const level = getRoomLevel('dash', quizTopic);
      if (!level) return <EmptyGameState gameType="code dash"/>;
      return <div className="h-full"><CodeDash gameLevelId={level.id} onExit={exitGame} onComplete={handleComplete} onAnswerResult={recordAnswerResult}/></div>;
    }
    // Fallback exit for unhandled game types
    exitGame();
    return null;
  }

  // ── Game catalogue ──────────────────────────────────────────────────────────
  const xp    = profile?.xp ?? 0;
  const streak = profile?.current_streak ?? 0;

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <div className="text-center pt-2">
        <motion.div className="w-16 h-16 rounded-2xl mx-auto mb-3 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #CE82FF, #B563F5)', boxShadow: '0 5px 0 #9B45E0' }}
          animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2.5 }}>
          <Gamepad2 className="w-8 h-8 text-white"/>
        </motion.div>
        <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>Games Arena</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Learn by playing. Earn real XP!</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[{ icon: Zap, color: '#FFC800', val: xp.toLocaleString(), label: 'Total XP' },
          { icon: Trophy, color: '#CE82FF', val: `Lv ${levelInfo.level}`, label: 'Level' },
          { icon: Flame, color: '#FF4B4B', val: streak, label: 'Streak' }].map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="d-card p-3 text-center">
              <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: s.color }}/>
              <p className="font-display text-lg font-bold" style={{ color: 'var(--text)' }}>{s.val}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</p>
            </div>
          );
        })}
      </div>

      {/* Topic picker */}
      {topicOptions.length > 0 && (
        <div>
          <p className="text-xs font-bold mb-2" style={{ color: 'var(--text-muted)' }}>TOPIC</p>
          <div className="flex gap-2 flex-wrap">
            {topicOptions.map(t => (
              <button key={t} onClick={() => setQuizTopic(t)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold border-2 transition-all capitalize"
                style={{ borderColor: quizTopic === t ? '#CE82FF' : 'var(--border)', backgroundColor: quizTopic === t ? 'rgba(206,130,255,0.12)' : 'var(--white)', color: quizTopic === t ? '#CE82FF' : 'var(--text-muted)' }}>
                {t}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && (
        <div className="flex justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }}/>
        </div>
      )}

      {/* Game categories — only show games (and categories) that actually
          have at least one published level. Nothing hardcoded is shown if
          there's no real content behind it. */}
      {!loading && gameCategories.map(cat => {
        const availableGames = cat.games.filter(
          game => (allLevels ?? []).some((l: any) => l.game_type === game.id)
        );
        if (availableGames.length === 0) return null;

        return (
          <div key={cat.label}>
            <p className="text-xs font-bold mb-3" style={{ color: cat.color }}>{cat.label}</p>
            <div className="grid grid-cols-1 gap-3">
              {availableGames.map(game => {
                const Icon = game.icon;
                const levelCount = (allLevels ?? []).filter((l: any) => l.game_type === game.id).length;
                // Feature 6 — "Continue Level X" replaces "Start Game" the
                // moment there's any saved progress for this game.
                const gp = progressMap[game.id as string];
                return (
                  <motion.button key={game.id} whileTap={{ scale: 0.97 }}
                    onClick={() => openGame(game.id)}
                    className="d-card p-4 flex items-center gap-4 cursor-pointer text-left w-full transition-all"
                    style={{ borderColor: 'var(--border)' }}>
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: game.bg, boxShadow: `0 4px 0 ${game.shadow}` }}>
                      <Icon className="w-7 h-7" style={{ color: game.color }}/>
                    </div>
                    <div className="flex-1">
                      <p className="font-display font-bold" style={{ color: 'var(--text)' }}>{game.title}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{game.desc}</p>
                      {gp && gp.current_level > 0 ? (
                        <p className="text-[10px] mt-1 font-bold" style={{ color: game.color }}>
                          ▶ Continue · Question {gp.current_level + 1}
                        </p>
                      ) : (
                        <p className="text-[10px] mt-1 font-bold" style={{ color: 'var(--text-muted)' }}>
                          ▶ Start Game · {levelCount} level{levelCount !== 1 ? 's' : ''} available
                        </p>
                      )}
                    </div>
                    <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--text-muted)' }}/>
                  </motion.button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Nothing published anywhere yet */}
      {!loading && gameCategories.every(
        cat => !cat.games.some(game => (allLevels ?? []).some((l: any) => l.game_type === game.id))
      ) && (
        <div className="flex flex-col items-center justify-center py-16 text-center px-6">
          <Gamepad2 className="w-14 h-14 mb-4 opacity-30" style={{ color: 'var(--text-muted)' }}/>
          <h2 className="font-display text-lg font-bold mb-1" style={{ color: 'var(--text)' }}>No games published yet</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Admin can add levels from the Admin Panel → Game Levels.
          </p>
        </div>
      )}
    </div>
  );
}