import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, Layers, ChevronRight, CheckCircle, Play, Zap, Loader2, Award, Lock, Crown, Infinity as InfinityIcon, Sparkles } from 'lucide-react';
import { useCourse } from '@/hooks/useDB';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import RazorpayButton from '@/components/RazorpayButton';

export default function CourseDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { data: course, loading } = useCourse(slug || '');
  const { hasCompletedLesson } = useGame();
  const { user, hasPurchasedCourse } = useAuth();
  const [certLoading, setCertLoading] = useState(false);

  const downloadCertificate = async () => {
    if (!course || !user) return;
    setCertLoading(true);
    // guaranteed-correct: we KNOW overallProgress===100 right here (that's why
    // this button is even showing), so create the certificate row directly
    // instead of relying on any recomputation on the next page.
    const { error } = await supabase.from('user_certificates').upsert({
      user_id: user.id,
      certificate_id: course.slug,
      title: course.title,
      issuer: 'Bitzy Academy',
    }, { onConflict: 'user_id,certificate_id' });
    setCertLoading(false);
    if (error) { console.error('certificate creation error', error); alert('Could not create certificate: ' + error.message); return; }
    navigate('/app/certificates', { state: { openSlug: course.slug } });
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }}/>
    </div>
  );

  if (!course) return (
    <div className="p-8 text-center">
      <p style={{ color: 'var(--text-muted)' }}>Course not found.</p>
    </div>
  );

  const allLessons = (course.modules ?? []).flatMap((m: any) => m.lessons ?? []);
  const totalLessons = allLessons.length;
  const completedCount = allLessons.filter((l: any) => hasCompletedLesson(course.id, l.id)).length;
  const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const nextLesson = allLessons.find((l: any) => !hasCompletedLesson(course.id, l.id));

  const isPremium = !!course.is_paid;
  const isPurchased = hasPurchasedCourse(course.id);
  const isLocked = isPremium && !isPurchased;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="h-32 rounded-3xl mb-6 relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${course.color || '#6366f1'}40, ${course.color || '#6366f1'}15)` }}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-6xl font-black" style={{ color: `${course.color || '#6366f1'}40` }}>
              {course.icon || course.title[0]}
            </span>
          </div>
          <div className="absolute bottom-4 left-6">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(0,0,0,0.3)', color: 'white' }}>
              {course.difficulty}
            </span>
          </div>
        </div>
        <h1 className="font-display text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>{course.title}</h1>
        <p className="text-sm mb-4" style={{ color: 'var(--text-muted)' }}>{course.long_description || course.description}</p>
        <div className="flex items-center gap-4 text-xs flex-wrap" style={{ color: 'var(--text-muted)' }}>
          <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5"/> {totalLessons} lessons</span>
          <span className="flex items-center gap-1"><Layers className="w-3.5 h-3.5"/> {course.modules?.length ?? 0} modules</span>
          <span className="flex items-center gap-1"><Zap className="w-3.5 h-3.5" style={{ color: '#FFC800' }}/> {course.xp_reward} XP</span>
          <span>Progress: {overallProgress}%</span>
        </div>
        <div className="d-progress mt-3 max-w-md h-2.5">
          <div className="d-progress-fill" style={{ width: `${overallProgress}%`, backgroundColor: course.color || '#6366f1' }}/>
        </div>

        {/* Premium gate — unpurchased paid course: show the buy card
            instead of Start/Resume Learning. */}
        {isLocked && (
          <div className="mt-4 p-5 rounded-2xl" style={{ background: 'linear-gradient(135deg, #6366f120, #6366f108)', border: '2px solid #6366f140' }}>
            <div className="flex items-center gap-2 mb-3">
              <Crown className="w-5 h-5" style={{ color: '#6366f1' }} />
              <span className="font-display font-bold" style={{ color: 'var(--text)' }}>Premium Course</span>
            </div>
            <div className="flex flex-wrap gap-3 mb-4 text-xs" style={{ color: 'var(--text-muted)' }}>
              <span className="flex items-center gap-1"><InfinityIcon className="w-3.5 h-3.5" /> Lifetime Access</span>
              <span className="flex items-center gap-1"><Award className="w-3.5 h-3.5" /> Certificate</span>
              <span className="flex items-center gap-1"><Sparkles className="w-3.5 h-3.5" /> AI Mentor</span>
              <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {totalLessons} Lessons + Projects</span>
            </div>
            <RazorpayButton
              courseId={course.id}
              courseTitle={course.title}
              basePrice={Number(course.price ?? 0)}
              discountPrice={course.discount_price > 0 ? Number(course.discount_price) : null}
              currency={course.currency || 'INR'}
            />
          </div>
        )}

        {/* Feature 7 — Resume Learning: jumps straight to the first
            not-yet-completed lesson instead of restarting from lesson 1. */}
        {!isLocked && totalLessons > 0 && overallProgress < 100 && nextLesson && (
          <button
            onClick={() => navigate(`/app/courses/${course.slug}/lessons/${nextLesson.slug}`)}
            className="mt-4 w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-3 rounded-2xl font-bold text-white text-sm transition-transform active:scale-95"
            style={{ backgroundColor: course.color || '#6366f1', boxShadow: `0 4px 0 ${course.color || '#6366f1'}99` }}>
            <Play className="w-4 h-4"/>
            {completedCount === 0 ? 'Start Learning' : `Resume Learning · ${nextLesson.title}`}
          </button>
        )}
        {!isLocked && totalLessons > 0 && (
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            {completedCount}/{totalLessons} lessons complete
          </p>
        )}

        {overallProgress === 100 && totalLessons > 0 && (
          <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl" style={{ background: 'linear-gradient(135deg, #58CC0220, #58CC0208)', border: '2px solid #58CC0240' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#58CC02' }}>
              <CheckCircle className="w-6 h-6 text-white"/>
            </div>
            <div className="flex-1">
              <p className="font-bold" style={{ color: '#58CC02' }}>Course Completed! 🎉</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>All {totalLessons} lessons done · {course.xp_reward} XP earned</p>
            </div>
            <button
              onClick={downloadCertificate}
              disabled={certLoading}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-white text-sm flex-shrink-0"
              style={{ backgroundColor: '#58CC02', opacity: certLoading ? 0.6 : 1 }}>
              {certLoading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Award className="w-4 h-4"/>} Download Certificate
            </button>
          </div>
        )}
        {overallProgress < 100 && totalLessons > 0 && (
          <div className="mt-4 flex items-center gap-3 p-4 rounded-2xl" style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--border)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: 'var(--border)' }}>
              <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }}/>
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm" style={{ color: 'var(--text-muted)' }}>Certificate Locked</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Complete all {totalLessons} lessons to unlock your certificate</p>
            </div>
            <button disabled className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm flex-shrink-0 cursor-not-allowed"
              style={{ backgroundColor: 'var(--border)', color: 'var(--text-muted)' }}>
              <Lock className="w-4 h-4"/> Locked
            </button>
          </div>
        )}
      </motion.div>

      {(course.modules ?? []).length === 0 && (
        <div className="d-card text-center py-12">
          <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: 'var(--text-muted)' }}/>
          <p className="font-bold" style={{ color: 'var(--text)' }}>No lessons yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            This course doesn't have any modules or lessons published yet.<br/>
            Check back soon, or ask an admin to add content from the Admin Panel.
          </p>
        </div>
      )}

      {(course.modules ?? []).map((mod: any) => (
        <motion.div key={mod.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="d-card overflow-hidden">
          <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}>
            <h3 className="font-display font-bold" style={{ color: 'var(--text)' }}>{mod.title}</h3>
            {mod.description && <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{mod.description}</p>}
          </div>
          <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
            {(mod.lessons ?? []).length === 0 && (
              <p className="px-5 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>No lessons in this module yet.</p>
            )}
            {(mod.lessons ?? []).map((lesson: any, lessonIdx: number) => {
              const done = hasCompletedLesson(course.id, lesson.id);
              // First lesson of the first module stays open as a free
              // preview even on a locked premium course.
              const isFreePreview = isLocked && course.modules[0]?.id === mod.id && lessonIdx === 0;
              const lessonLocked = isLocked && !isFreePreview;
              return (
                <div key={lesson.id}
                  onClick={() => !lessonLocked && navigate(`/app/courses/${course.slug}/lessons/${lesson.slug}`)}
                  className={`px-5 py-3.5 flex items-center gap-3 transition-colors ${lessonLocked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  onMouseEnter={e => { if (!lessonLocked) e.currentTarget.style.backgroundColor = 'var(--surface)'; }}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = 'transparent'}>
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0`}
                    style={{ backgroundColor: done ? '#58CC02' : 'var(--surface)' }}>
                    {lessonLocked ? <Lock className="w-4 h-4" style={{ color: 'var(--text-muted)' }}/> : done ? <CheckCircle className="w-4 h-4 text-white"/> : <Play className="w-4 h-4" style={{ color: 'var(--text-muted)' }}/>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate" style={{ color: done ? '#58CC02' : 'var(--text)' }}>{lesson.title}</p>
                    <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {lesson.type} · {lesson.xp_reward} XP{isFreePreview ? ' · Free Preview' : ''}
                    </p>
                  </div>
                  {!lessonLocked && <ChevronRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }}/>}
                </div>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}