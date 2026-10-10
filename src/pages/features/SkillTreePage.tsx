import { useEffect, useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, ChevronRight, LockKeyhole, ShieldCheck, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useGame } from '@/context/GameContext';
import { useCourses } from '@/hooks/useDB';
import { fetchCourseBySlug } from '@/lib/db';
import { trpc } from '@/providers/trpc';
import './coding-rpg.css';

type CourseDetail = any;
const getSkill = (course: any): string | null => {
  const text = `${course.title ?? ''} ${course.slug ?? ''}`.toLowerCase();
  if (/javascript|\bjs\b|loop|algorithm/.test(text)) return 'loops';
  if (/python|html|css|syntax/.test(text)) return 'syntax';
  if (/react|logic|condition/.test(text)) return 'logic';
  if (/array|data-structure|index/.test(text)) return 'indexing';
  return null;
};

export default function SkillTreePage() {
  const coursesQuery = useCourses();
  const { gameState } = useGame();
  const rpg = trpc.codingRpg.state.useQuery();
  const [details, setDetails] = useState<CourseDetail[]>([]);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const courses = coursesQuery.data ?? [];

  useEffect(() => {
    let active = true;
    setDetailsError(null);
    Promise.all(courses.map((course: any) => fetchCourseBySlug(course.slug).catch(() => null))).then(items => {
      if (active) setDetails(items.filter(Boolean));
    }).catch(error => { if (active) setDetailsError(error?.message ?? 'Could not load course lessons.'); });
    return () => { active = false; };
  }, [courses]);

  const completion = useMemo(() => courses.map((course: any, index: number) => {
    const progress = gameState.courseProgress.find((p: any) => String(p.course_id) === String(course.id));
    const done = new Set((progress?.completed_lessons ?? []).map(String));
    const detail = details.find(d => String(d.id) === String(course.id) || d.slug === course.slug);
    const lessons = detail?.modules?.flatMap((m: any) => m.lessons ?? []) ?? [];
    const pct = lessons.length ? Math.round(lessons.filter((l: any) => done.has(String(l.id))).length / lessons.length * 100) : Number(progress?.overall_progress ?? 0);
    const key = getSkill(course);
    const assessed = key ? (rpg.data?.mastery ?? []).some((m: any) => m.skill_key === key) : false;
    const priorCourseDone = index === 0 || (() => {
      const prev = courses[index - 1];
      const prevProgress = gameState.courseProgress.find((p: any) => String(p.course_id) === String(prev.id));
      return (prevProgress?.overall_progress ?? 0) >= 100 && Boolean(rpg.data?.bossComplete);
    })();
    const status = !priorCourseDone ? 'locked' : pct >= 100 && assessed ? 'mastered' : pct > 0 ? 'in-progress' : 'available';
    return { course, detail, lessons, done, pct, key, assessed, status, locked: !priorCourseDone };
  }), [courses, details, gameState.courseProgress, rpg.data]);

  const isLoading = coursesQuery.loading || rpg.isLoading;
  return <div className="rpg-shell">
    <header><div className="rpg-kicker"><Sparkles size={14} style={{ display: 'inline', verticalAlign: '-2px' }}/> Progression map</div><h1 className="rpg-title">Skill Tree</h1><p className="rpg-subtitle">Every branch is built from published Bitzy courses and lessons. Complete lessons in order; course mastery additionally requires a verified assessment. Later courses unlock after the previous course is complete and the boss is cleared.</p></header>
    {isLoading ? <div className="rpg-empty" style={{ marginTop: 18 }}>Loading your courses and verified progress…</div> : coursesQuery.error ? <div className="rpg-error" style={{ marginTop: 18 }}>Could not load courses: {coursesQuery.error}</div> : rpg.error ? <div className="rpg-error" style={{ marginTop: 18 }}>Could not load secure RPG progress: {rpg.error.message}</div> : !courses.length ? <div className="rpg-empty" style={{ marginTop: 18 }}>No published courses yet. Your skill tree will populate when courses are available.</div> : <>
      <div className="rpg-stats" style={{ marginTop: 20 }}><div className="rpg-stat"><strong>{completion.filter(c => c.status === 'mastered').length}</strong><span className="rpg-muted">mastered courses</span></div><div className="rpg-stat"><strong>{completion.filter(c => c.status === 'available' || c.status === 'in-progress').length}</strong><span className="rpg-muted">open courses</span></div><div className="rpg-stat"><strong>{rpg.data?.bossComplete ? 'Cleared' : 'Locked'}</strong><span className="rpg-muted">boss gate</span></div></div>
      <section className="rpg-tree" style={{ marginTop: 20 }}>
        {completion.map((item, index) => <article className="rpg-course" key={item.course.id}>
          <div className={`rpg-node ${item.status === 'locked' ? 'locked' : ''} ${item.status === 'mastered' ? 'mastered' : ''}`} aria-label={`${item.course.title}, ${item.status}`}>
            {item.status === 'locked' ? <LockKeyhole size={19}/> : item.status === 'mastered' ? <ShieldCheck size={20}/> : item.status === 'available' ? <BookOpen size={20}/> : <Zap size={19}/>}
            <div style={{ flex: 1 }}><div className="rpg-between"><strong>{index + 1}. {item.course.title}</strong><span className={`rpg-tag ${item.status === 'mastered' ? 'good' : item.status === 'locked' ? 'bad' : 'mid'}`}>{item.status}</span></div><p className="rpg-muted" style={{ margin: '5px 0 9px' }}>{item.course.description || 'Explore the published lessons in this course.'}</p><div className="rpg-meter"><span style={{ width: `${Math.min(100, item.pct)}%` }}/></div><p className="rpg-muted" style={{ fontSize: '.75rem', margin: '5px 0 0' }}>{item.pct}% lesson progress{item.key ? ` · ${item.assessed ? 'verified assessment recorded' : `${item.key} assessment still needed`}` : ' · mastery assessment not mapped for this course'}</p></div>
          </div>
          {item.lessons.length > 0 ? <div className="rpg-lessons">{item.lessons.map((lesson: any, lessonIndex: number) => {
            const completed = item.done.has(String(lesson.id));
            const lessonLocked = item.locked || (lessonIndex > 0 && !item.done.has(String(item.lessons[lessonIndex - 1]?.id)));
            const moduleSlug = item.detail?.modules?.find((m: any) => String(m.id) === String(lesson.module_id))?.slug;
            const href = moduleSlug ? `/app/courses/${item.course.slug}/${moduleSlug}/${lesson.slug}` : `/app/courses/${item.course.slug}`;
            return lessonLocked ? <div key={lesson.id} className="rpg-lesson disabled" aria-disabled="true"><LockKeyhole size={15}/><span>{lesson.title}</span><span className="rpg-muted">Locked</span></div> : <Link key={lesson.id} className="rpg-lesson" to={href}><span>{completed ? <CheckCircle2 size={15} color="#68e4c3"/> : <ChevronRight size={15}/>}</span><span style={{ flex: 1 }}>{lesson.title}</span><span className="rpg-muted">{completed ? 'Complete' : lesson.xp_reward ? `+${lesson.xp_reward} XP` : 'Open'}</span></Link>;
          })}</div> : item.locked ? <p className="rpg-muted">Course unlock prerequisite: finish the previous course and clear the boss battle.</p> : <p className="rpg-muted">{detailsError ? `Lesson list unavailable: ${detailsError}` : 'Loading published lessons…'}</p>}
        </article>)}
      </section>
      <div className="rpg-note" style={{ marginTop: 18 }}><CheckCircle2 size={15} style={{ display: 'inline', verticalAlign: '-3px' }}/> A course is marked mastered only when its lessons are complete and a related verified assessment exists. Missing evidence stays unassessed.</div>
    </>}
  </div>;
}
