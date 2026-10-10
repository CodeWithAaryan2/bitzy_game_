/**
 * src/pages/CertificatesPage.tsx
 * Lists every published course. Locked (grayed out, no download) until the
 * user hits 100% progress on that course — at which point a real certificate
 * row exists in user_certificates and the user can view + download it.
 */
import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Download, Lock, Loader2, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import CertificateCard from '@/components/CertificateCard';

interface CourseRow { id: number; slug: string; title: string; }
interface CertRow { certificate_id: string; title: string; issued_at: string; }

export default function CertificatesPage() {
  const { user, profile } = useAuth() as any;
  const location = useLocation();
  const openSlug = (location.state as any)?.openSlug as string | undefined;
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [certs, setCerts] = useState<CertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<{ course: CourseRow; cert: CertRow } | null>(null);
  const [downloading, setDownloading] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      if (!user) { setLoading(false); return; }
      const [{ data: courseData }, { data: certData }, { data: progressData }, { data: allLessons }] = await Promise.all([
        supabase.from('courses').select('id,slug,title').eq('is_published', true),
        supabase.from('user_certificates').select('certificate_id,title,issued_at').eq('user_id', user.id),
        supabase.from('course_progress').select('course_id,completed_lessons').eq('user_id', user.id),
        supabase.from('course_lessons').select('id,course_id'),
      ]);
      let certList = certData ?? [];

      // ── live lesson-count-per-course, computed from actual data — never trust
      // the stored/stale course_progress.overall_progress snapshot ──
      const totalByCourse: Record<number, number> = {};
      (allLessons ?? []).forEach((l: any) => { totalByCourse[l.course_id] = (totalByCourse[l.course_id] || 0) + 1; });

      const progressByCourse: Record<number, number> = {};
      (progressData ?? []).forEach((p: any) => { progressByCourse[p.course_id] = (p.completed_lessons || []).length; });

      // ── Backfill: any course where completed_lessons >= actual total lessons
      // but no certificate row exists yet (e.g. completed before this feature
      // existed, or stored overall_progress was stale) gets one created now ──
      const certSlugs = new Set(certList.map(c => c.certificate_id));
      const missing = (courseData ?? []).filter(c => {
        const total = totalByCourse[c.id] || 0;
        const done = progressByCourse[c.id] || 0;
        return total > 0 && done >= total && !certSlugs.has(c.slug);
      });

      if (missing.length > 0) {
        const inserts = missing.map(c => ({
          user_id: user.id, certificate_id: c.slug, title: c.title, issuer: 'Bitzy Academy',
        }));
        const { data: inserted, error: backfillErr } = await supabase
          .from('user_certificates').upsert(inserts, { onConflict: 'user_id,certificate_id' }).select('certificate_id,title,issued_at');
        if (backfillErr) console.error('certificate backfill error', backfillErr);
        else certList = [...certList, ...(inserted ?? [])];
      }

      setCourses(courseData ?? []);
      setCerts(certList);
      setLoading(false);

      if (openSlug) {
        const course = (courseData ?? []).find(c => c.slug === openSlug);
        const cert = certList.find(c => c.certificate_id === openSlug);
        if (course && cert) setActive({ course, cert });
      }
    })();
  }, [user]);

  const certFor = (slug: string) => certs.find(c => c.certificate_id === slug) || null;

  const openCertificate = (course: CourseRow) => {
    const cert = certFor(course.slug);
    if (!cert) return; // locked — should never be called, button is disabled
    setActive({ course, cert });
  };

  const download = async () => {
    if (!certRef.current) return;
    setDownloading(true);
    try {
      // Both must be installed: npm install html2canvas jspdf
      const html2canvas = (await import('html2canvas')).default;
      const { jsPDF } = await import('jspdf');

      // Wait for web fonts (Playfair Display, Dancing Script) AND every <img>
      // inside the certificate to fully finish loading. Capturing before
      // fonts/images are ready is the #1 cause of a "wrong" looking export —
      // html2canvas just draws whatever's on screen at that exact instant.
      await document.fonts.ready;
      const imgs = Array.from(certRef.current.querySelectorAll('img'));
      await Promise.all(imgs.map(img => img.complete ? Promise.resolve() : new Promise(res => { img.onload = res; img.onerror = res; })));
      // one extra frame so the browser has actually painted the loaded fonts/images
      await new Promise(res => requestAnimationFrame(() => requestAnimationFrame(res)));

      const canvas = await html2canvas(certRef.current, { scale: 2, backgroundColor: '#faf7f0', useCORS: true, logging: false });
      const imgData = canvas.toDataURL('image/png');

      // Certificate is a fixed 1536x1024 (3:2) design — make a matching
      // landscape PDF page sized exactly to that ratio, image fills the page.
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width, canvas.height] });
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
      pdf.save(`bitzy-certificate-${active?.course.slug}.pdf`);
    } catch (e) {
      console.error('certificate download error', e);
      alert('Could not generate certificate PDF. Make sure html2canvas and jspdf are installed (npm install html2canvas jspdf).');
    } finally {
      setDownloading(false);
    }
  };

  if (loading) return (
    <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--text-muted)' }} /></div>
  );

  if (active) {
    const certId = `BITZY-${new Date(active.cert.issued_at).getFullYear()}-${String(active.course.id).padStart(4, '0')}`;
    const dateStr = new Date(active.cert.issued_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
    const userName = profile?.display_name || user?.email?.split('@')[0] || 'Student';
    return (
      <div className="max-w-5xl mx-auto space-y-4">
        <button onClick={() => setActive(null)} className="text-sm font-semibold" style={{ color: 'var(--text-muted)' }}>← Back to certificates</button>

        {/* Visible preview only — scaled down purely with CSS zoom for display,
            this copy is NEVER captured so scaling can't affect the export. */}
        <div style={{ overflow: 'auto', border: '1px solid var(--border)', borderRadius: 16 }}>
          <div style={{ zoom: 0.5 }}>
            <CertificateCard userName={userName} courseName={active.course.title} dateIssued={dateStr} certificateId={certId} />
          </div>
        </div>

        {/* Hidden full-size, untransformed copy used ONLY for html2canvas capture.
            Positioned in-flow but pushed behind everything with z-index and
            made non-interactive — NOT display:none (html2canvas can't measure
            that) and not a huge negative offset (some browsers mis-report the
            capture bounds for elements far outside the viewport). */}
        <div style={{ position: 'absolute', top: 0, left: 0, zIndex: -9999, opacity: 0.01, pointerEvents: 'none' }} aria-hidden="true">
          <CertificateCard ref={certRef} userName={userName} courseName={active.course.title} dateIssued={dateStr} certificateId={certId} />
        </div>

        <button onClick={download} disabled={downloading}
          className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-white"
          style={{ backgroundColor: '#58CC02', opacity: downloading ? 0.6 : 1 }}>
          {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {downloading ? 'Generating...' : 'Download Certificate (PDF)'}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--text)' }}>My Certificates</h1>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Complete a course 100% to unlock its certificate — auto-generated with your name.</p>

      <div className="space-y-2">
        {courses.map(c => {
          const cert = certFor(c.slug);
          const unlocked = !!cert;
          return (
            <div key={c.id} onClick={() => unlocked && openCertificate(c)}
              className="d-card flex items-center gap-3 px-5 py-4"
              style={{ cursor: unlocked ? 'pointer' : 'default', opacity: unlocked ? 1 : 0.55 }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: unlocked ? '#58CC0220' : 'var(--surface)' }}>
                {unlocked ? <Award className="w-5 h-5" style={{ color: '#58CC02' }} /> : <Lock className="w-5 h-5" style={{ color: 'var(--text-muted)' }} />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm" style={{ color: 'var(--text)' }}>{c.title}</div>
                <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {unlocked ? `Certificate earned · ${new Date(cert!.issued_at).toLocaleDateString()}` : 'Complete this course to unlock certificate'}
                </div>
              </div>
              {unlocked && <Download className="w-4 h-4" style={{ color: 'var(--text-muted)' }} />}
            </div>
          );
        })}
        {courses.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No courses available yet.</div>
        )}
      </div>
    </div>
  );
}