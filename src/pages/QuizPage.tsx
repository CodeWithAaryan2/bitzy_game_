import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, ArrowRight, RotateCcw, Trophy, Loader2 } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { useQuiz } from '@/hooks/useDB';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';

/* eslint-disable @typescript-eslint/no-explicit-any */
const tbl = (name: string) => supabase.from(name) as any;

export default function QuizPage() {
  const { quizId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { data: quiz, loading } = useQuiz(quizId ? Number(quizId) : null);
  const courseId = searchParams.get('courseId') || '';
  const { completeQuiz } = useGame();
  const { user } = useAuth();

  const [currentQ, setCurrentQ] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const resumedRef = useRef(false);

  // Feature 2 — question-level resume: if the user refreshes mid-quiz,
  // pick up on the same question instead of restarting from Question 1.
  useEffect(() => {
    if (!user || !quiz || resumedRef.current) return;
    resumedRef.current = true;
    (async () => {
      const { data } = await tbl('course_progress')
        .select('last_quiz_id,last_question_index')
        .eq('user_id', user.id)
        .eq('course_id', Number(courseId) || 0)
        .maybeSingle();
      const total = quiz.questions?.length ?? 0;
      if (data?.last_quiz_id === quiz.id && data.last_question_index > 0 && data.last_question_index < total) {
        setCurrentQ(data.last_question_index);
      }
    })();
  }, [user, quiz, courseId]);

  // Persists which question the user is on, so a refresh resumes here
  // rather than restarting the quiz.
  const saveResumePoint = async (questionIndex: number) => {
    if (!user || !quiz) return;
    try {
      await tbl('course_progress').upsert({
        user_id: user.id,
        course_id: Number(courseId) || 0,
        last_quiz_id: quiz.id,
        last_question_index: questionIndex,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id,course_id', ignoreDuplicates: false });
    } catch (e) {
      console.error('[QuizPage] saveResumePoint failed (non-blocking):', e);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }}/>
    </div>
  );

  if (!quiz) return (
    <div className="p-8 text-center" style={{ color: 'var(--text-muted)' }}>Quiz not found.</div>
  );

  const questions = quiz.questions ?? [];
  const question = questions[currentQ];
  const progress = ((currentQ + 1) / questions.length) * 100;

  const handleSelect = (index: number) => { if (!submitted) setSelected(index); };

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    const newAnswers = [...answers, selected];
    setAnswers(newAnswers);
  };

  const handleFinish = (finalAnswers: number[]) => {
    const correct = finalAnswers.filter((a, i) => a === questions[i]?.correctIndex).length;
    const finalScore = Math.round((correct / questions.length) * 100);
    setScore(finalScore);
    setShowResult(true);
    if (finalScore >= (quiz.passing_score ?? 70)) {
      // Dynamic XP (Feature 3): read the reward straight off the quiz record.
      completeQuiz(courseId ? Number(courseId) : 0, String(quiz.id), finalScore, quiz.xp_reward, quiz.coin_reward);
    }
  };

  const handleNext = () => {
    if (currentQ < questions.length - 1) {
      const nextQ = currentQ + 1;
      saveResumePoint(nextQ);
      setCurrentQ(nextQ);
      setSelected(null);
      setSubmitted(false);
    } else {
      handleFinish([...answers, selected ?? 0]);
    }
  };

  if (showResult) {
    const correct = answers.filter((a, i) => a === questions[i]?.correctIndex).length;
    const passed = score >= (quiz.passing_score ?? 70);
    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="max-w-md mx-auto text-center py-10 space-y-5">
        <div className="w-20 h-20 rounded-3xl mx-auto flex items-center justify-center"
          style={{ backgroundColor: passed ? '#58CC02' : '#FF4B4B', boxShadow: `0 6px 0 ${passed ? '#45A301' : '#E54343'}` }}>
          {passed ? <Trophy className="w-10 h-10 text-white"/> : <RotateCcw className="w-10 h-10 text-white"/>}
        </div>
        <div>
          <h2 className="font-display text-2xl font-black" style={{ color: 'var(--text)' }}>
            {passed ? 'Quiz Passed! 🎉' : 'Not Quite!'}
          </h2>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {correct}/{questions.length} correct · {score}%
          </p>
        </div>
        <div className="d-card p-5">
          <div className="h-4 rounded-full overflow-hidden mb-2" style={{ backgroundColor: 'var(--surface)' }}>
            <motion.div className="h-full rounded-full" initial={{ width: 0 }} animate={{ width: `${score}%` }} transition={{ duration: 1 }}
              style={{ backgroundColor: passed ? '#58CC02' : '#FF4B4B' }}/>
          </div>
          <p className="font-display text-3xl font-black" style={{ color: passed ? '#58CC02' : '#FF4B4B' }}>{score}%</p>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Pass: {quiz.passing_score ?? 70}%</p>
        </div>
        <div className="flex gap-3">
          {!passed && (
            <button onClick={() => { setCurrentQ(0); setAnswers([]); setShowResult(false); setSelected(null); setSubmitted(false); }}
              className="flex-1 py-3 rounded-xl border-2 font-bold text-sm" style={{ borderColor: 'var(--border)', color: 'var(--text)' }}>
              Try Again
            </button>
          )}
          <button onClick={() => navigate(-1)}
            className="flex-1 py-3 rounded-xl font-bold text-sm text-white" style={{ backgroundColor: '#58CC02', boxShadow: '0 4px 0 #45A301' }}>
            {passed ? 'Continue →' : 'Back'}
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="max-w-lg mx-auto space-y-5 pt-2">
      {/* Progress */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>Question {currentQ + 1} of {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--surface)' }}>
          <motion.div className="h-full rounded-full" animate={{ width: `${progress}%` }} style={{ backgroundColor: '#1CB0F6' }}/>
        </div>
      </div>

      {/* Question */}
      <AnimatePresence mode="wait">
        <motion.div key={currentQ} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
          className="d-card p-5">
          <p className="font-display font-bold text-base mb-5" style={{ color: 'var(--text)' }}>{question?.question}</p>
          <div className="space-y-3">
            {(question?.options ?? []).map((opt: string, i: number) => {
              let borderColor = 'var(--border)';
              let bg = 'var(--white)';
              let textColor = 'var(--text)';
              if (submitted) {
                if (i === question.correctIndex) { borderColor = '#58CC02'; bg = '#F0FFE5'; textColor = '#58CC02'; }
                else if (i === selected) { borderColor = '#FF4B4B'; bg = '#FFE8E8'; textColor = '#FF4B4B'; }
              } else if (i === selected) {
                borderColor = '#1CB0F6'; bg = '#E5F6FF'; textColor = '#1CB0F6';
              }
              return (
                <button key={i} onClick={() => handleSelect(i)} disabled={submitted}
                  className="w-full text-left p-3.5 rounded-2xl border-2 font-medium text-sm transition-all"
                  style={{ borderColor, backgroundColor: bg, color: textColor }}>
                  <div className="flex items-center gap-3">
                    <span className="w-7 h-7 rounded-xl border-2 flex items-center justify-center text-xs font-bold flex-shrink-0"
                      style={{ borderColor, color: textColor }}>
                      {String.fromCharCode(65 + i)}
                    </span>
                    {opt}
                    {submitted && i === question.correctIndex && <CheckCircle className="w-4 h-4 ml-auto" style={{ color: '#58CC02' }}/>}
                    {submitted && i === selected && i !== question.correctIndex && <XCircle className="w-4 h-4 ml-auto" style={{ color: '#FF4B4B' }}/>}
                  </div>
                </button>
              );
            })}
          </div>

          {submitted && question?.explanation && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 rounded-xl text-xs" style={{ backgroundColor: 'rgba(88,204,2,0.12)', color: '#45A301' }}>
              💡 {question.explanation}
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Action button */}
      <button
        onClick={submitted ? handleNext : handleSubmit}
        disabled={selected === null && !submitted}
        className="w-full py-4 rounded-2xl font-display font-bold text-lg text-white transition-all disabled:opacity-40"
        style={{ backgroundColor: '#58CC02', boxShadow: '0 4px 0 #45A301' }}>
        {submitted ? (currentQ < questions.length - 1 ? <span className="flex items-center justify-center gap-2">Next <ArrowRight className="w-5 h-5"/></span> : 'See Results') : 'Check Answer'}
      </button>
    </div>
  );
}