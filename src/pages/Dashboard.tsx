import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Award, BookOpen, CheckCircle2, ChevronRight, CircleHelp, Clock3,
  Flame, Gem, Loader2, Target, Trophy, TrendingDown, TrendingUp,
  Zap,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth, getLevelFromXP } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useCourses } from '@/hooks/useDB';
import { fetchCourseBySlug } from '@/lib/db';
import { supabase } from '@/lib/supabase';
import XPBar from '@/components/XPBar';
import {
  buildGameMetrics, buildLearningPriorities,
  GAME_CATALOG, type GameMetric, type GameProgressSnapshot, type QuestionAttempt,
} from '@/lib/learningAnalytics';
import './dashboard-analytics.css';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.04 } } };
const I = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };
const LearningCharts = lazy(() => import('@/components/dashboard/LearningCharts'));

type CourseProgressRow = { course_id: number; completed_lessons: string[]; completed_quizzes: string[]; updated_at: string };
type DashboardRecords = {
  courseProgress: CourseProgressRow[];
  gameProgress: GameProgressSnapshot[];
  answers: QuestionAttempt[];
  activityCount: number | null;
  challengeCount: number | null;
};
type CourseCard = {
  course: any;
  progressRow: CourseProgressRow;
  totalLessons: number;
  completedLessons: number;
  progress: number | null;
  nextLesson: { title: string; href: string } | null;
  lastActivity: string | null;
};

async function loadAllGameAnswers(userId: string): Promise<QuestionAttempt[]> {
  const pageSize = 1000;
  const rows: QuestionAttempt[] = [];
  for (let offset = 0; ; offset += pageSize) {
    const { data, error } = await supabase.from('user_question_progress')
      .select('game_name,question_id,is_correct,answered_at,lesson_id')
      .eq('user_id', userId)
      .in('game_name', GAME_CATALOG.map(game => game.id))
      .order('answered_at', { ascending: true })
      .range(offset, offset + pageSize - 1);
    if (error) throw error;
    const page = (data ?? []) as QuestionAttempt[];
    rows.push(...page);
    if (page.length < pageSize) break;
  }
  return rows;
}

const number = (n: number) => n.toLocaleString();
const shortDate = (value?: string | null) => value
  ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(value))
  : 'No activity recorded';
const pct = (value: number | null) => value === null ? 'Not enough data' : `${value}%`;

function MetricCard({ icon: Icon, label, value, detail, tone }: { icon: any; label: string; value: string; detail: string; tone: string }) {
  return <div className="d-card la-metric">
    <span className="la-metric-icon" style={{ color: tone, background: `${tone}1A` }}><Icon size={19}/></span>
    <div className="min-w-0"><p className="la-muted">{label}</p><p className="la-metric-value">{value}</p><p className="la-muted la-small">{detail}</p></div>
  </div>;
}

function EmptyPanel({ title, detail }: { title: string; detail: string }) {
  return <div className="la-empty"><CircleHelp size={21}/><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

export default function Dashboard({ embedded = false, refreshToken }: { embedded?: boolean; refreshToken?: number }) {
  const navigate = useNavigate();
  const { profile, user } = useAuth();
  const { gameState, isLoading: gameStateLoading } = useGame();
  const { data: courses, loading: coursesLoading, error: coursesError } = useCourses();
  const [records, setRecords] = useState<DashboardRecords | null>(null);
  const [recordsLoading, setRecordsLoading] = useState(true);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [recordsRevision, setRecordsRevision] = useState(0);
  const lastLoadedUser = useRef<string | null>(null);
  const [courseCards, setCourseCards] = useState<CourseCard[]>([]);
  const [courseDetailsLoading, setCourseDetailsLoading] = useState(false);
  const [courseDetailsError, setCourseDetailsError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!user?.id) {
      lastLoadedUser.current = null;
      setRecords(null);
      setRecordsLoading(false);
      return;
    }
    const isNewUser = lastLoadedUser.current !== user.id;
    if (isNewUser) { lastLoadedUser.current = user.id; setRecords(null); setCourseCards([]); }
    setRecordsLoading(isNewUser);
    setRecordsError(null);
    Promise.all([
      supabase.from('course_progress').select('course_id,completed_lessons,completed_quizzes,updated_at').eq('user_id', user.id),
      supabase.from('game_progress').select('game_name,current_level,current_score,highest_score,times_played,last_topic,updated_at').eq('user_id', user.id),
      loadAllGameAnswers(user.id),
      supabase.from('activity_logs').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
      supabase.from('challenge_submissions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
    ]).then(([courseResult, gameResult, answers, activityResult, challengeResult]) => {
      if (courseResult.error) throw courseResult.error;
      if (gameResult.error) throw gameResult.error;
      if (activityResult.error) throw activityResult.error;
      if (challengeResult.error) throw challengeResult.error;
      if (cancelled) return;
      setRecords({
        courseProgress: (courseResult.data ?? []) as CourseProgressRow[],
        gameProgress: (gameResult.data ?? []) as GameProgressSnapshot[],
        answers,
        activityCount: activityResult.count ?? null,
        challengeCount: challengeResult.count ?? null,
      });
      setRecordsLoading(false);
    }).catch((error: any) => {
      if (cancelled) return;
      setRecordsError(error?.message ?? 'Could not load your saved learning analytics.');
      setRecordsLoading(false);
    });
    return () => { cancelled = true; };
  }, [user?.id, recordsRevision]);

  useEffect(() => {
    if (refreshToken !== undefined) setRecordsRevision(value => value + 1);
  }, [refreshToken]);

  useEffect(() => {
    if (!user?.id) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const refreshSoon = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => setRecordsRevision(value => value + 1), 350);
    };
    const channel = supabase.channel(`profile-analytics:${user.id}`);
    for (const table of ['course_progress', 'game_progress', 'user_question_progress', 'activity_logs', 'challenge_submissions', 'user_achievements', 'profiles']) {
      channel.on('postgres_changes', { event: '*', schema: 'public', table, filter: `user_id=eq.${user.id}` }, refreshSoon);
    }
    channel.subscribe();
    const poll = embedded ? undefined : window.setInterval(() => { if (document.visibilityState === 'visible') refreshSoon(); }, 15000);
    window.addEventListener('focus', refreshSoon);
    document.addEventListener('visibilitychange', refreshSoon);
    return () => { if (timer) clearTimeout(timer); if (poll) window.clearInterval(poll); window.removeEventListener('focus', refreshSoon); document.removeEventListener('visibilitychange', refreshSoon); void supabase.removeChannel(channel); };
  }, [user?.id, embedded]);

  const courseSignature = useMemo(() => (records?.courseProgress ?? []).map(row =>
    `${row.course_id}:${row.updated_at}:${row.completed_lessons.join(',')}:${row.completed_quizzes.join(',')}`
  ).join('|'), [records?.courseProgress]);

  useEffect(() => {
    let cancelled = false;
    if (!records) { setCourseCards([]); setCourseDetailsLoading(false); return; }
    if (coursesLoading) return;
    if (coursesError || !courses) { setCourseDetailsError(true); setCourseDetailsLoading(false); return; }
    const progressRows = records.courseProgress;
    if (!progressRows.length) { setCourseCards([]); setCourseDetailsLoading(false); setCourseDetailsError(false); return; }
    setCourseDetailsLoading(true);
    setCourseDetailsError(false);
    Promise.all(progressRows.map(async progressRow => {
      const course = courses.find((item: any) => String(item.id) === String(progressRow.course_id));
      if (!course?.slug) return { course: course ?? { id: progressRow.course_id, title: 'Course' }, progressRow, totalLessons: 0, completedLessons: 0, progress: null, nextLesson: null, lastActivity: progressRow.updated_at } as CourseCard;
      const details: any = await fetchCourseBySlug(course.slug);
      if (!details) return { course, progressRow, totalLessons: 0, completedLessons: 0, progress: null, nextLesson: null, lastActivity: progressRow.updated_at } as CourseCard;
      const lessons = (details.modules ?? []).flatMap((module: any) => (module.lessons ?? []).map((lesson: any) => ({
        lesson,
        module,
        href: `/app/courses/${course.slug}/${module.slug}/${lesson.slug}`,
      })));
      const completed = new Set((progressRow.completed_lessons ?? []).map(String));
      const done = (item: any) => completed.has(String(item.lesson.id)) || completed.has(String(item.lesson.slug));
      const next = lessons.find((item: any) => !done(item));
      const completedLessons = lessons.filter(done).length;
      return {
        course,
        progressRow,
        totalLessons: lessons.length,
        completedLessons,
        progress: lessons.length ? Math.round(completedLessons / lessons.length * 100) : null,
        nextLesson: next ? { title: next.lesson.title, href: next.href } : null,
        lastActivity: progressRow.updated_at,
      } as CourseCard;
    })).then(result => {
      if (!cancelled) { setCourseCards(result); setCourseDetailsLoading(false); }
    }).catch(() => {
      if (!cancelled) { setCourseDetailsError(true); setCourseDetailsLoading(false); }
    });
    return () => { cancelled = true; };
  }, [records, courseSignature, courses, coursesLoading, coursesError]);

  const gameMetrics = useMemo(() => buildGameMetrics(records?.gameProgress ?? [], records?.answers ?? []), [records]);
  const priorities = useMemo(() => buildLearningPriorities(gameMetrics), [gameMetrics]);
  const chartComparison = useMemo(() => gameMetrics.filter(row => row.answers > 0).map(row => ({ name: row.title, Correct: row.correct, Incorrect: row.incorrect })), [gameMetrics]);
  const totalAnswers = records?.answers.length ?? 0;
  const totalCorrect = records?.answers.reduce((sum, row) => sum + Number(row.is_correct), 0) ?? 0;
  const overallAccuracy = totalAnswers ? Math.round(totalCorrect / totalAnswers * 100) : null;
  const xp = profile?.xp ?? 0;
  const levelInfo = getLevelFromXP(xp);
  const achievements = gameState.achievements.filter(row => row.completed).length;
  const enrolledCount = courseCards.length;
  const completedCourses = courseCards.filter(row => row.progress === 100).length;
  const totalLessons = courseCards.reduce((sum, row) => sum + row.totalLessons, 0);
  const completedLessons = courseCards.reduce((sum, row) => sum + row.completedLessons, 0);
  const coursePercent = totalLessons ? Math.round(completedLessons / totalLessons * 100) : null;
  const unfinishedCourse = courseCards.find(row => row.nextLesson);
  const weakGame: GameMetric | undefined = priorities.needsImprovement[0];
  const practiceGame: GameMetric | undefined = priorities.needsPractice[0];
  const recommendedCourse = unfinishedCourse;
  const recommendedGame = weakGame ?? practiceGame;
  const displayName = profile?.display_name ?? 'Learner';
  const busy = recordsLoading || coursesLoading || gameStateLoading || courseDetailsLoading;

  return (
    <motion.div variants={W} initial="hidden" animate="show" className={`learning-dashboard space-y-5 ${embedded ? 'la-embedded' : 'pb-10'}`}>
      {!embedded && <motion.header variants={I} className="la-hero">
        <div><p className="la-eyebrow">YOUR LEARNING ANALYTICS</p><h1 className="font-display">Hey, {displayName}.</h1><p className="la-muted">A clear view of what you have learned and what to do next.</p></div>
        <div className="la-hero-mark"><Activity size={24}/><span>Progress, grounded in your saved activity</span></div>
      </motion.header>}

      {recordsError && <div className="la-error" role="alert"><strong>Analytics could not be loaded.</strong><span>{recordsError}</span><button onClick={() => window.location.reload()}>Retry</button></div>}

      {!embedded && <motion.section variants={I} aria-label="Learning summary" className="la-summary-grid">
        <MetricCard icon={BookOpen} label="Course lessons" value={busy ? '…' : `${number(completedLessons)} / ${number(totalLessons)}`} detail={coursePercent === null ? 'No enrolled course lesson data' : `${coursePercent}% complete · ${number(Math.max(0, totalLessons - completedLessons))} remaining`} tone="#38BDF8"/>
        <MetricCard icon={Target} label="Saved answer accuracy" value={busy ? '…' : pct(overallAccuracy)} detail={totalAnswers ? `${number(totalCorrect)} correct of ${number(totalAnswers)} saved game answers` : 'Not enough answer records yet'} tone="#22D3EE"/>
        <MetricCard icon={Zap} label="Total XP" value={number(xp)} detail={`Level ${levelInfo.level} · ${levelInfo.xpToNext ? `${number(levelInfo.xpToNext)} XP to next` : 'Maximum level'}`} tone="#A78BFA"/>
        <MetricCard icon={Flame} label="Current streak" value={number(profile?.current_streak ?? 0)} detail="Saved consecutive-day streak" tone="#FB7185"/>
        <MetricCard icon={Award} label="Achievements" value={number(achievements)} detail="Unlocked from your profile" tone="#FBBF24"/>
        <MetricCard icon={Activity} label="Learning activity" value={records?.activityCount == null ? '—' : number(records.activityCount)} detail={records?.challengeCount == null ? 'Saved activity log entries' : `${number(records.challengeCount)} challenge submissions recorded`} tone="#34D399"/>
      </motion.section>}

      {!embedded && <motion.section variants={I} className="d-card la-level-card" aria-label="Level progress">
        <div className="la-level-heading"><div><p className="la-eyebrow">LEVEL PROGRESS</p><h2>Level {levelInfo.level}</h2><p className="la-muted">{levelInfo.xpToNext ? `${number(levelInfo.currentLevelXP)} XP earned in this level · ${number(levelInfo.xpToNext)} XP to level ${levelInfo.level + 1}` : 'You have reached the current level cap.'}</p></div><Trophy size={26} color="#A78BFA"/></div>
        <XPBar xp={xp} variant="full" className="mt-3"/>
      </motion.section>}

      <motion.section variants={I} className="d-card la-section" aria-labelledby="la-recommendation-title">
        <div className="la-section-title"><div><p className="la-eyebrow">YOUR NEXT BEST STEP</p><h2 id="la-recommendation-title">What should I focus on?</h2></div><Target size={22} color="#22D3EE"/></div>
        {busy ? <div className="la-loading"><Loader2 className="animate-spin"/>Building recommendations from your saved records…</div> : recordsError ? <EmptyPanel title="Recommendations are temporarily unavailable" detail="Your saved data could not be read. Retry to refresh this dashboard."/> : (
          <div className="la-recommendation-grid">
            <div className="la-recommendation la-needs"><div className="la-rec-label"><TrendingDown size={16}/> NEEDS IMPROVEMENT</div>
              {priorities.needsImprovement.length ? priorities.needsImprovement.slice(0, 3).map(row => <p key={row.id}><strong>{row.title}</strong> · {row.accuracy}% across {row.answers} saved answers ({row.incorrect} incorrect)</p>) : <p>{totalAnswers ? 'No game has enough saved answers at low accuracy to label it a weakness.' : 'Not enough data — no game is marked weak just for being unplayed.'}</p>}
            </div>
            <div className="la-recommendation la-practice"><div className="la-rec-label"><Target size={16}/> PRACTICE NEXT</div>
              {practiceGame ? <p><strong>{practiceGame.title}</strong> has {practiceGame.answers} saved answers at {practiceGame.accuracy}%. More attempts can make this signal clearer.</p> : <p>{priorities.needsImprovement.length ? 'Start with the low-accuracy game above.' : 'Not enough answer-level history to rank a game for practice yet.'}</p>}
            </div>
            <div className="la-recommendation la-well"><div className="la-rec-label"><TrendingUp size={16}/> DOING WELL</div>
              {priorities.doingWell.length ? priorities.doingWell.slice(0, 3).map(row => <p key={row.id}><strong>{row.title}</strong> · {row.accuracy}% across {row.answers} saved answers</p>) : <p>{totalAnswers ? 'More answer history is needed before calling a result consistently strong.' : 'Not enough data yet. Strengths appear only after saved answers.'}</p>}
            </div>
            <div className="la-recommendation la-next"><div className="la-rec-label"><ChevronRight size={16}/> RECOMMENDED NEXT STEP</div>
              {recommendedGame ? <><p><strong>Practice {recommendedGame.title}</strong>{recommendedGame.accuracy === null ? '' : ` · ${recommendedGame.accuracy}% from ${recommendedGame.answers} saved answers`}</p><button className="la-action" onClick={() => navigate('/app/games')}>Open Games Arena <ChevronRight size={15}/></button></> : recommendedCourse?.nextLesson ? <><p><strong>Continue {recommendedCourse.course.title}</strong> with “{recommendedCourse.nextLesson.title}” — your next unfinished saved lesson.</p><button className="la-action" onClick={() => navigate(recommendedCourse.nextLesson!.href)}>Continue Learning <ChevronRight size={15}/></button></> : courseCards.length ? <><p>Your enrolled lessons are complete or lesson data is unavailable. Browse available courses or practice a game.</p><button className="la-action" onClick={() => navigate('/app/courses')}>Explore courses <ChevronRight size={15}/></button></> : <><p>Start a course to create a saved learning path, or play a game to build answer history.</p><button className="la-action" onClick={() => navigate('/app/courses')}>Explore courses <ChevronRight size={15}/></button></>}
            </div>
          </div>
        )}
      </motion.section>

      <motion.section variants={I} className="d-card la-section" aria-labelledby="la-courses-title">
        <div className="la-section-title"><div><p className="la-eyebrow">COURSE PROGRESS</p><h2 id="la-courses-title">Your enrolled courses</h2></div><button className="la-link" onClick={() => navigate('/app/courses')}>Browse <ChevronRight size={15}/></button></div>
        {busy ? <div className="la-loading"><Loader2 className="animate-spin"/>Loading saved course progress…</div> : courseDetailsError ? <EmptyPanel title="Course lesson details are unavailable" detail="Saved course records loaded, but course/lesson metadata could not be retrieved."/> : !courseCards.length ? <EmptyPanel title="No enrolled courses yet" detail="Enroll in or start a course; its saved lesson progress will appear here."/> : <>
          <div className="la-course-overview"><span><strong>{completedCourses}</strong> completed of <strong>{enrolledCount}</strong> enrolled</span><span>{coursePercent === null ? 'Progress unavailable' : `${coursePercent}% of enrolled lessons complete`}</span></div>
          <div className="la-course-list">{courseCards.map(card => {
            const hasCourseActivity = card.completedLessons > 0 || card.progressRow.completed_quizzes.length > 0;
            const status = card.progress === 100 ? 'Completed' : hasCourseActivity ? 'In progress' : 'Not started';
            const color = status === 'Completed' ? '#34D399' : status === 'In progress' ? '#38BDF8' : '#94A3B8';
            return <article className="la-course" key={card.progressRow.course_id}>
              <div className="la-course-icon" style={{ color, background: `${color}1A` }}>{card.course.icon || <BookOpen size={20}/>}</div>
              <div className="la-course-main"><div className="la-course-heading"><div><h3>{card.course.title}</h3><p className="la-muted">{status} · {card.totalLessons ? `${card.completedLessons} complete, ${card.totalLessons - card.completedLessons} remaining` : 'Lesson count unavailable'}</p></div><strong style={{ color }}>{card.progress === null ? '—' : `${card.progress}%`}</strong></div>
                <div className="la-progress-track" role="progressbar" aria-label={`${card.course.title} progress`} aria-valuenow={card.progress ?? 0} aria-valuemin={0} aria-valuemax={100}><span style={{ width: `${card.progress ?? 0}%`, background: color }}/></div>
                <div className="la-course-footer"><span><Clock3 size={13}/> Last activity: {shortDate(card.lastActivity)}</span>{card.nextLesson ? <button className="la-action" onClick={() => navigate(card.nextLesson!.href)}>Continue Learning <ChevronRight size={14}/></button> : card.progress === 100 ? <span className="la-complete"><CheckCircle2 size={14}/> Course complete</span> : <button className="la-action" onClick={() => navigate(`/app/courses/${card.course.slug}`)}>Open course <ChevronRight size={14}/></button>}</div>
              </div>
            </article>;
          })}</div>
        </>}
      </motion.section>

      <motion.div variants={I}>
        <Suspense fallback={<div className="d-card la-loading"><Loader2 className="animate-spin"/>Loading learning charts…</div>}>
          <LearningCharts comparison={chartComparison} attempts={records?.answers ?? []} loading={busy}/>
        </Suspense>
      </motion.div>

      <motion.section variants={I} className="d-card la-section" aria-labelledby="la-games-title">
        <div className="la-section-title"><div><p className="la-eyebrow">GAME PERFORMANCE</p><h2 id="la-games-title">Every game, tracked separately</h2></div><button className="la-link" onClick={() => navigate('/app/games')}>Open Games Arena <ChevronRight size={15}/></button></div>
        <p className="la-muted la-data-note">Session counts, saved score fields, and answer accuracy are kept distinct. Accuracy and trends appear only when saved answer records exist; session history cannot recover past per-question outcomes that Bitzy did not record. Older single-player score fields may reflect the value saved by the former reward handler; new rounds store the game score. Multiplayer score callbacks do not expose comparable game scores.</p>
        {busy ? <div className="la-loading"><Loader2 className="animate-spin"/>Loading game statistics…</div> : recordsError ? <EmptyPanel title="Game analytics are unavailable" detail="Retry the dashboard to load this account’s saved game records."/> : <div className="la-game-grid">{gameMetrics.map(metric => <GameCard key={metric.id} metric={metric} onOpen={() => navigate('/app/games')}/>)}</div>}
      </motion.section>

      <motion.div variants={I} className="la-footnote"><Gem size={15}/> Saved records are scoped to your signed-in account. “Not enough data” means the underlying history is absent—not that your skill is low.</motion.div>
    </motion.div>
  );
}

function GameCard({ metric, onOpen }: { metric: GameMetric; onOpen: () => void }) {
  return <article className="la-game-card">
    <div className="la-game-head"><div><h3>{metric.title}</h3><span className="la-muted la-small">{metric.trackedSessions ? `${metric.trackedSessions} tracked session${metric.trackedSessions === 1 ? '' : 's'}` : 'No saved session yet'}</span></div><button aria-label={`Open ${metric.title}`} className="la-icon-button" onClick={onOpen}><ChevronRight size={17}/></button></div>
    <div className="la-game-stats"><div><span>Attempted*</span><strong>{number(metric.trackedSessions)}</strong></div><div><span>Completed</span><strong>{number(metric.completedSessions)}</strong></div><div><span>Accuracy</span><strong className={metric.accuracy !== null && metric.accuracy < 60 && metric.answers >= 3 ? 'la-low' : ''}>{pct(metric.accuracy)}</strong></div></div>
    {metric.accuracy !== null && <div className="la-answer-detail"><span>{metric.correct} correct</span><span>{metric.incorrect} incorrect</span><span>{metric.answers} saved answers</span></div>}
    {metric.bestScore !== null && <p className="la-score-line">Best saved score <strong>{number(metric.bestScore)}</strong><span> · latest {number(metric.latestScore ?? 0)}</span></p>}
    {metric.hasResumableSession && <p className="la-resume"><span className="la-pulse"/> In-progress round saved</p>}
    {metric.lastTopic && <p className="la-muted la-small">Last topic recorded: {metric.lastTopic}</p>}
    {!metric.answers && <p className="la-muted la-small">Answer accuracy: Not enough data</p>}
    <p className="la-muted la-small">*Attempted sessions = completed rounds plus a saved resumable round.</p>
    {metric.lastPlayedAt && <p className="la-muted la-small">Last saved: {shortDate(metric.lastPlayedAt)}</p>}
  </article>;
}