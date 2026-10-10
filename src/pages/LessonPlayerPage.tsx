// ── URL helpers ───────────────────────────────────────────────────────────────
function toJumpshareEmbed(url: string): string | null {
  const m = url.match(/jumpshare\.com\/(share|v)\/([\w-]+)/);
  return m ? `https://jumpshare.com/embed/${m[2]}` : null;
}
function isIbbShare(url: string) {
  return /^https?:\/\/ibb\.co\//.test(url) && !/i\.ibb\.co/.test(url);
}

// ── Media components ──────────────────────────────────────────────────────────
function LessonVideo({ src }: { src: string }) {
  const embed = toJumpshareEmbed(src);
  if (embed) return (
    <div className="rounded-2xl overflow-hidden border-2 mb-5" style={{ borderColor: 'var(--border)', backgroundColor: '#0a0a14' }}>
      <div className="px-4 py-2 flex items-center gap-2 border-b" style={{ borderColor: '#ffffff10' }}>
        <span className="w-2 h-2 rounded-full bg-red-500 inline-block"/>
        <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block"/>
        <span className="w-2 h-2 rounded-full bg-green-400 inline-block"/>
        <span className="text-[10px] font-bold ml-2" style={{ color: '#CE82FF' }}>🎬 VIDEO</span>
      </div>
      <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
        <iframe src={embed} allowFullScreen allow="autoplay; fullscreen"
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}/>
      </div>
    </div>
  );
  return (
    <div className="rounded-2xl overflow-hidden mb-5" style={{ backgroundColor: '#0a0a14' }}>
      <video src={src} controls playsInline className="w-full" style={{ maxHeight: 300 }}/>
    </div>
  );
}

function LessonImage({ src, alt }: { src: string; alt?: string }) {
  if (isIbbShare(src)) return (
    <div className="rounded-2xl overflow-hidden my-4 border" style={{ borderColor: 'var(--border)' }}>
      <iframe src={src} className="w-full" style={{ height: 320, border: 'none' }} title={alt || 'image'}/>
      {alt && <p className="px-4 py-2 text-xs" style={{ color: 'var(--text-muted)' }}>{alt}</p>}
    </div>
  );
  return (
    <figure className="my-4">
      <img src={src} alt={alt || ''} className="w-full rounded-2xl object-contain"
        style={{ maxHeight: 340, backgroundColor: 'var(--surface)' }}
        onError={e => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}/>
      {alt && <figcaption className="text-center text-xs mt-2" style={{ color: 'var(--text-muted)' }}>{alt}</figcaption>}
    </figure>
  );
}

// ── Markdown renderer ─────────────────────────────────────────────────────────
function MarkdownContent({ content }: { content: string }) {
  const inline = (text: string, key?: number): React.ReactNode => {
    const parts: React.ReactNode[] = [];
    const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g;
    let last = 0; let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      if (m.index > last) parts.push(text.slice(last, m.index));
      const tok = m[0];
      if (tok.startsWith('`'))
        parts.push(<code key={m.index} className="px-1.5 py-0.5 rounded-lg font-mono text-xs font-medium" style={{ backgroundColor: 'var(--surface)', color: '#CE82FF', border: '1px solid var(--border)' }}>{tok.slice(1,-1)}</code>);
      else if (tok.startsWith('**'))
        parts.push(<strong key={m.index} className="font-bold" style={{ color: 'var(--text)' }}>{tok.slice(2,-2)}</strong>);
      else
        parts.push(<em key={m.index} className="italic" style={{ color: 'var(--text-muted)' }}>{tok.slice(1,-1)}</em>);
      last = m.index + tok.length;
    }
    if (last < text.length) parts.push(text.slice(last));
    return parts.length <= 1 ? parts[0] : <React.Fragment key={key}>{parts}</React.Fragment>;
  };

  const renderLine = (line: string, i: number): React.ReactNode => {
    if (line.startsWith('### ')) return (
      <h3 key={i} className="font-display font-bold text-base mt-6 mb-2 flex items-center gap-2" style={{ color: 'var(--text)' }}>
        <span className="w-1 h-4 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: '#1CB0F6' }}/>
        {inline(line.slice(4))}
      </h3>
    );
    if (line.startsWith('## ')) return (
      <h2 key={i} className="font-display font-bold text-xl mt-8 mb-3" style={{ color: '#58CC02' }}>
        {inline(line.slice(3))}
      </h2>
    );
    if (line.startsWith('# ')) return (
      <h1 key={i} className="font-display font-black text-2xl mt-6 mb-3 pb-2" style={{ color: 'var(--text)', borderBottom: '2px solid var(--border)' }}>
        {inline(line.slice(2))}
      </h1>
    );
    if (line.trim() === '---') return <hr key={i} className="my-6" style={{ borderColor: 'var(--border)' }}/>;
    if (line.startsWith('> 💡')) return (
      <div key={i} className="flex gap-3 p-4 rounded-2xl my-3" style={{ backgroundColor: 'rgba(252,211,77,0.15)', border: '1.5px solid #FCD34D' }}>
        <span className="text-lg flex-shrink-0">💡</span>
        <p className="text-sm leading-relaxed" style={{ color: '#92400E' }}>{inline(line.slice(5))}</p>
      </div>
    );
    if (line.startsWith('> ⚠️')) return (
      <div key={i} className="flex gap-3 p-4 rounded-2xl my-3" style={{ backgroundColor: 'rgba(253,164,175,0.15)', border: '1.5px solid #FDA4AF' }}>
        <span className="text-lg flex-shrink-0">⚠️</span>
        <p className="text-sm leading-relaxed" style={{ color: '#9F1239' }}>{inline(line.slice(6))}</p>
      </div>
    );
    if (line.startsWith('> ')) return (
      <blockquote key={i} className="border-l-4 pl-4 my-2 py-1" style={{ borderColor: '#1CB0F6' }}>
        <p className="text-sm italic" style={{ color: 'var(--text-muted)' }}>{inline(line.slice(2))}</p>
      </blockquote>
    );
    if (line.startsWith('- ')) return (
      <div key={i} className="flex items-start gap-2.5 my-1">
        <span className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#58CC02' }}/>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>{inline(line.slice(2))}</p>
      </div>
    );
    const numMatch = line.match(/^(\d+)\.\s(.+)/);
    if (numMatch) return (
      <div key={i} className="flex items-start gap-3 my-1">
        <span className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ backgroundColor: '#1CB0F6' }}>{numMatch[1]}</span>
        <p className="text-sm leading-relaxed pt-0.5" style={{ color: 'var(--text)' }}>{inline(numMatch[2])}</p>
      </div>
    );
    const imgMatch = line.match(/^!\[([^\]]*)\]\(([^)]+)\)$/);
    if (imgMatch) return <LessonImage key={i} src={imgMatch[2]} alt={imgMatch[1]}/>;
    const vidMatch = line.match(/^@video\(([^)]+)\)$/);
    if (vidMatch) return <LessonVideo key={i} src={vidMatch[1]}/>;
    if (line.trim() === '') return <div key={i} className="h-3"/>;
    return <p key={i} className="text-sm leading-[1.85] my-1" style={{ color: 'var(--text)' }}>{inline(line)}</p>;
  };

  const blocks: React.ReactNode[] = [];
  const lines = content.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim() || 'code';
      const codeLines: string[] = [];
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) { codeLines.push(lines[i]); i++; }
      blocks.push(
        <div key={`cb-${i}`} className="rounded-2xl overflow-hidden my-4 border" style={{ borderColor: 'var(--border)' }}>
          <div className="px-4 py-2 flex items-center gap-3" style={{ backgroundColor: '#0f172a' }}>
            <div className="flex gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"/>
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
              <span className="w-2.5 h-2.5 rounded-full bg-green-400"/>
            </div>
            <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#58CC02' }}>{lang}</span>
          </div>
          <pre className="p-5 text-xs overflow-x-auto" style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
            <code>{codeLines.join('\n')}</code>
          </pre>
        </div>
      );
    } else {
      blocks.push(renderLine(line, i));
    }
    i++;
  }
  return <div>{blocks}</div>;
}

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, ArrowLeft, ArrowRight, Zap, HelpCircle, Loader2, BookOpen, Clock, ChevronRight } from 'lucide-react';
import { useLesson, useQuizByLesson } from '@/hooks/useDB';
import { useGame } from '@/context/GameContext';
import { useAuth } from '@/context/AuthContext';

export default function LessonPlayerPage() {
  const { courseSlug, lessonSlug } = useParams();
  const navigate = useNavigate();
  const { completeLesson, hasCompletedLesson, spendEnergy } = useGame();
  const { refreshProfile } = useAuth();
  const [justCompleted, setJustCompleted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showBanner, setShowBanner] = useState(false);

  const { data: result, loading } = useLesson(courseSlug || '', lessonSlug || '');
  const lessonId = result?.lesson?.id ?? null;
  const { data: quiz } = useQuizByLesson(lessonId);

  useEffect(() => { setJustCompleted(false); setSubmitting(false); setShowBanner(false); }, [lessonSlug]);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Loader2 className="w-8 h-8 animate-spin" style={{ color: '#58CC02' }}/>
      <p className="text-sm font-medium" style={{ color: 'var(--text-muted)' }}>Loading lesson…</p>
    </div>
  );

  if (!result) return (
    <div className="text-center py-20">
      <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-20" style={{ color: 'var(--text-muted)' }}/>
      <p className="font-bold" style={{ color: 'var(--text-muted)' }}>Lesson not found.</p>
    </div>
  );

  const { lesson, module: mod, course, prevLesson, nextLesson, totalLessons } = result;
  const isCompleted = hasCompletedLesson(course.id, lesson.id);
  const isDone = isCompleted || justCompleted;

  const handleComplete = async () => {
    if (isDone || submitting) return;
    setSubmitting(true);
    try {
      await spendEnergy(lesson.energy_cost || 1);
      await completeLesson(course.id, lesson.id, totalLessons, lesson.xp_reward, lesson.coin_reward);
      await refreshProfile();
      setJustCompleted(true);
      setShowBanner(true);
      setTimeout(() => setShowBanner(false), 4000);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const codeExamples = (() => {
    try { const e = JSON.parse(lesson.code_examples || '[]'); return Array.isArray(e) ? e : []; }
    catch { return []; }
  })();

  return (
    <div className="max-w-2xl mx-auto pb-10">

      {/* ── Top nav ── */}
      <div className="flex items-center gap-3 mb-6 pt-1">
        <button onClick={() => navigate(`/app/courses/${courseSlug}`)}
          className="w-9 h-9 rounded-2xl flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 active:scale-95"
          style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--border)' }}>
          <ArrowLeft className="w-4 h-4" style={{ color: 'var(--text-muted)' }}/>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider truncate" style={{ color: 'var(--text-muted)' }}>
            {course.title} · {mod?.title}
          </p>
          <h1 className="font-display font-bold text-base truncate" style={{ color: 'var(--text)' }}>{lesson.title}</h1>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl flex-shrink-0"
          style={{ backgroundColor: 'rgba(255,200,0,0.12)', border: '1.5px solid #FFC800' }}>
          <Zap className="w-3.5 h-3.5" style={{ color: '#FFC800' }}/>
          <span className="text-xs font-bold" style={{ color: '#B8860B' }}>{lesson.xp_reward} XP</span>
        </div>
      </div>

      {/* ── Completed banner ── */}
      {isDone && !justCompleted && (
        <div className="flex items-center gap-3 p-4 rounded-2xl mb-5"
          style={{ background: 'linear-gradient(135deg, #F0FFE5, #E5F6FF)', border: '2px solid #58CC02' }}>
          <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: '#58CC02' }}/>
          <div>
            <p className="font-bold text-sm" style={{ color: '#45A301' }}>Lesson Completed! 🎉</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>You already completed this lesson and earned {lesson.xp_reward} XP</p>
          </div>
        </div>
      )}

      {/* ── Just completed celebration banner ── */}
      <AnimatePresence>
        {showBanner && (
          <motion.div initial={{ opacity: 0, y: -20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-2xl mb-5 text-center"
            style={{ background: 'linear-gradient(135deg, #58CC02, #45A301)', boxShadow: '0 8px 32px #58CC0240' }}>
            <div className="text-3xl mb-1">🎉</div>
            <p className="font-display font-black text-white text-lg">Lesson Complete!</p>
            <p className="text-white/80 text-sm">+{lesson.xp_reward} XP earned</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Meta chips ── */}
      <div className="flex gap-2 flex-wrap mb-5">
        {lesson.type && (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold capitalize"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }}>
            📖 {lesson.type}
          </span>
        )}
        {lesson.duration && (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
            style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)', border: '1.5px solid var(--border)' }}>
            <Clock className="w-3 h-3"/> {lesson.duration}
          </span>
        )}
        {isDone && (
          <span className="px-3 py-1 rounded-full text-[10px] font-bold flex items-center gap-1"
            style={{ backgroundColor: 'rgba(88,204,2,0.12)', color: '#45A301', border: '1.5px solid #58CC02' }}>
            <CheckCircle2 className="w-3 h-3"/> Completed
          </span>
        )}
      </div>

      {/* ── Standalone media ── */}
      {(lesson as any).video_url && <LessonVideo src={(lesson as any).video_url}/>}
      {(lesson as any).image_url && !((lesson as any).video_url) && (
        <LessonImage src={(lesson as any).image_url} alt={lesson.title}/>
      )}

      {/* ── Main content card ── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="d-card mb-5" style={{ padding: '1.5rem' }}>
        <MarkdownContent content={lesson.content}/>
      </motion.div>

      {/* ── Code examples ── */}
      {codeExamples.length > 0 && (
        <div className="space-y-4 mb-5">
          <p className="text-xs font-bold uppercase tracking-wider px-1" style={{ color: 'var(--text-muted)' }}>
            💻 Code Examples
          </p>
          {codeExamples.map((ex: any, i: number) => (
            <div key={i} className="rounded-2xl overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              <div className="px-4 py-2 flex items-center gap-3" style={{ backgroundColor: '#0f172a' }}>
                <div className="flex gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-yellow-400"/>
                  <span className="w-2.5 h-2.5 rounded-full bg-green-400"/>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#58CC02' }}>{ex.language || 'code'}</span>
              </div>
              <pre className="p-5 text-xs overflow-x-auto" style={{ backgroundColor: '#1a1a2e', color: '#e2e8f0', lineHeight: 1.7, margin: 0 }}>
                <code>{ex.code}</code>
              </pre>
              {ex.explanation && (
                <div className="px-4 py-3 flex items-start gap-2" style={{ backgroundColor: 'var(--surface)', borderTop: '1px solid var(--border)' }}>
                  <span className="text-sm flex-shrink-0">💬</span>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--text-muted)' }}>{ex.explanation}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── Quiz CTA ── */}
      {quiz && (
        <motion.button initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate(`/app/quiz/${quiz.id}?courseId=${course.id}`)}
          className="w-full flex items-center gap-4 p-4 rounded-2xl mb-5 transition-all active:scale-98"
          style={{ background: 'linear-gradient(135deg, #E5F6FF, #EBF2FF)', border: '2px solid #1CB0F6' }}>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#1CB0F6', boxShadow: '0 4px 0 #0C9BDE' }}>
            <HelpCircle className="w-5 h-5 text-white"/>
          </div>
          <div className="flex-1 text-left">
            <p className="font-bold text-sm" style={{ color: '#0C9BDE' }}>Take Lesson Quiz</p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{quiz.questions?.length || 0} questions · +{quiz.xp_reward} XP</p>
          </div>
          <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: '#1CB0F6' }}/>
        </motion.button>
      )}

      {/* ── Bottom action area ── */}
      <div className="mt-6 space-y-3">

        {/* Complete / Completed button */}
        {isDone ? (
          <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-3"
            style={{
              background: 'linear-gradient(135deg, #F0FFE5, #DCFFD0)',
              border: '2.5px solid #58CC02',
            }}>
            <CheckCircle2 className="w-6 h-6" style={{ color: '#58CC02' }}/>
            <span className="font-display font-black text-lg" style={{ color: '#45A301' }}>
              Completed ✓
            </span>
          </div>
        ) : (
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={handleComplete}
            disabled={submitting}
            className="w-full py-4 rounded-2xl font-display font-black text-lg text-white flex items-center justify-center gap-3 transition-all"
            style={{
              background: 'linear-gradient(135deg, #58CC02, #45A301)',
              boxShadow: '0 5px 0 #45A301',
              opacity: submitting ? 0.7 : 1,
            }}>
            {submitting
              ? <><Loader2 className="w-5 h-5 animate-spin"/> Saving…</>
              : <>Mark as Complete <Zap className="w-5 h-5"/></>}
          </motion.button>
        )}

        {/* Prev / Next nav */}
        <div className="flex gap-3">
          {prevLesson ? (
            <button
              onClick={() => navigate(`/app/courses/${courseSlug}/lessons/${prevLesson.slug}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm transition-all active:scale-95"
              style={{ border: '2px solid var(--border)', color: 'var(--text-muted)', backgroundColor: 'var(--white)' }}>
              <ArrowLeft className="w-4 h-4"/> Previous
            </button>
          ) : (
            <div className="flex-1"/>
          )}
          {nextLesson && (
            <button
              onClick={() => navigate(`/app/courses/${courseSlug}/lessons/${nextLesson.slug}`)}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm text-white transition-all active:scale-95"
              style={{ background: 'linear-gradient(135deg, #1CB0F6, #0C9BDE)', boxShadow: '0 4px 0 #0C9BDE' }}>
              Next Lesson <ArrowRight className="w-4 h-4"/>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}