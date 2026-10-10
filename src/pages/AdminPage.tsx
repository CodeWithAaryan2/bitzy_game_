/**
 * src/pages/AdminPage.tsx
 *
 * Full admin panel: Courses · Quizzes · Challenges · Game Levels · Players
 * All content is PRIVATE (isPublished=false) until you click "Publish".
 * Only accessible to admin role / aaryanpandeyop@gmail.com
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, BookOpen, HelpCircle, Swords, Gamepad2,
  Users, Plus, Pencil, Trash2, Eye, EyeOff, Check,
  X, ArrowLeft, BarChart3, Tag,
  Save, Loader2, RefreshCw, AlertTriangle, Crown, IndianRupee,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { importCourseMarkdown } from '@/lib/importCourseMarkdown';
import { importGameLevelsMarkdown } from '@/lib/importGameLevelsMarkdown';
import PlayerTagBadge from '@/components/PlayerTagBadge';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Course {
  id: number; slug: string; title: string; description: string;
  long_description?: string; icon?: string; color?: string;
  difficulty: string; category?: string; tags?: string;
  estimated_hours: number; xp_reward: number; coin_reward: number;
  order: number; is_published: boolean; createdAt: string;
  // Premium fields — db/003_payment_system.sql
  is_paid?: boolean; price?: number; discount_price?: number;
  currency?: string; thumbnail?: string; preview_video?: string;
  total_sales?: number; total_revenue?: number;
}
interface Quiz {
  id: number; lesson_id: number; course_id: number; title: string;
  description?: string; questions: string; passing_score: number;
  xp_reward: number; coin_reward: number; is_published: boolean;
}
interface Challenge {
  id: number; slug: string; title: string; description: string;
  difficulty: string; category?: string; problem_statement: string;
  constraints?: string; examples?: string; starter_code?: string;
  hints?: string; test_cases?: string; xp_reward: number;
  coin_reward: number; is_published: boolean;
}
interface GameLevel {
  id: number; title: string; topic: string; difficulty: string;
  game_type: string; questions: string; xp_reward: number;
  coin_reward: number; order: number; is_published: boolean;
}
interface PlayerProfile {
  id: number; user_id: string; display_name: string | null;
  level: number; xp: number; coins: number;
  current_streak: number; role: string; created_at: string;
  custom_tag: string | null; custom_tag_color: string | null;
}

// ─── Small helpers ────────────────────────────────────────────────────────────
type Tab = 'overview' | 'courses' | 'quizzes' | 'challenges' | 'gamelevels' | 'players' | 'projects';

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'courses', label: 'Courses', icon: BookOpen },
  { id: 'quizzes', label: 'Quizzes', icon: HelpCircle },
  { id: 'challenges', label: 'Challenges', icon: Swords },
  { id: 'gamelevels', label: 'Game Levels', icon: Gamepad2 },
  { id: 'players', label: 'Players', icon: Users },
  { id: 'projects', label: 'Projects', icon: Gamepad2 },
];

const DIFFICULTY_OPTS = ['Easy', 'Medium', 'Hard'];
const COURSE_DIFFICULTY_OPTS = ['Beginner', 'Easy', 'Medium', 'Hard', 'Expert'];
const GAME_TYPE_OPTS = ['quiz', 'fillblank', 'prediction', 'bughunt', 'codeorder', 'truthy', 'coderace', 'typing'];
function PublishBadge({ pub }: { pub: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${pub ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
      {pub ? <Eye size={11} /> : <EyeOff size={11} />}
      {pub ? 'Public' : 'Private'}
    </span>
  );
}

function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-5 py-3 rounded-xl shadow-xl text-sm flex items-center gap-2">
      <Check size={14} className="text-green-400" />{msg}
    </motion.div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

const inputCls = "w-full rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#58CC02] focus:border-transparent";
const textareaCls = inputCls + " min-h-[80px] resize-y";
const selectCls = inputCls;

// ─── Main AdminPage ───────────────────────────────────────────────────────────
export default function AdminPage() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>('overview');
  const [toast, setToast] = useState('');
  const showToast = useCallback((m: string) => setToast(m), []);

  useEffect(() => {
    if (!isAdmin) navigate('/app/dashboard', { replace: true });
  }, [isAdmin, navigate]);

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-[var(--surface)] pb-20">
      {/* Header */}
      <div className="bg-[var(--surface)] border-b border-[var(--border)] sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors">
            <ArrowLeft size={18} />
          </button>
          <Shield size={20} className="text-[#58CC02]" />
          <h1 className="font-extrabold text-lg">Admin Panel</h1>
          <span className="ml-auto text-xs text-[var(--text-muted)] bg-[var(--surface)] px-2 py-1 rounded-full">aaryanpandeyop@gmail.com</span>
        </div>
        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto pb-2">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition-all ${tab === t.id ? 'bg-[#58CC02] text-white' : 'text-[var(--text-muted)] hover:bg-[var(--border)]'}`}>
                <Icon size={14} />{t.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'overview' && <OverviewTab />}
        {tab === 'courses' && <CoursesTab showToast={showToast} />}
        {tab === 'quizzes' && <QuizzesTab showToast={showToast} />}
        {tab === 'challenges' && <ChallengesTab showToast={showToast} />}
        {tab === 'gamelevels' && <GameLevelsTab showToast={showToast} />}
        {tab === 'players' && <PlayersTab showToast={showToast} />}
        {tab === 'projects' && <ProjectsAdminTab showToast={showToast} />}
      </div>

      <AnimatePresence>
        {toast && <Toast key="toast" msg={toast} onClose={() => setToast('')} />}
      </AnimatePresence>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    // Fetch stats directly from supabase (counts)
    async function load() {
      const [users, courses, quizzes, challenges, gameLevels] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('courses').select('*', { count: 'exact', head: true }),
        supabase.from('quizzes').select('*', { count: 'exact', head: true }),
        supabase.from('challenges').select('*', { count: 'exact', head: true }),
        supabase.from('game_levels').select('*', { count: 'exact', head: true }),
      ]);
      setStats({
        users: users.count ?? 0,
        courses: courses.count ?? 0,
        quizzes: quizzes.count ?? 0,
        challenges: challenges.count ?? 0,
        gameLevels: gameLevels.count ?? 0,
      });
    }
    load();
  }, []);

  const cards = [
    { label: 'Total Users', value: stats?.users, icon: Users, color: '#1CB0F6' },
    { label: 'Courses', value: stats?.courses, icon: BookOpen, color: '#58CC02' },
    { label: 'Quizzes', value: stats?.quizzes, icon: HelpCircle, color: '#FF9600' },
    { label: 'Challenges', value: stats?.challenges, icon: Swords, color: '#FF4B4B' },
    { label: 'Game Levels', value: stats?.gameLevels, icon: Gamepad2, color: '#CE82FF' },
  ];

  return (
    <div>
      <h2 className="text-2xl font-extrabold mb-6">Dashboard</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {cards.map(c => {
          const Icon = c.icon;
          return (
            <div key={c.label} className="bg-[var(--surface)] rounded-2xl border border-[var(--border)] p-5 flex flex-col gap-2 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: c.color + '20' }}>
                <Icon size={18} style={{ color: c.color }} />
              </div>
              <span className="text-3xl font-extrabold">{stats ? c.value : '—'}</span>
              <span className="text-xs text-[var(--text-muted)] font-medium">{c.label}</span>
            </div>
          );
        })}
      </div>
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-2xl p-5 flex gap-3">
        <AlertTriangle size={20} className="text-amber-500 shrink-0 mt-0.5" />
        <div className="text-sm text-amber-800">
          <strong>Publishing rules:</strong> Any content you create starts as <em>Private</em> — only visible to you (admin).
          Click the <strong>Publish</strong> button on any item to make it visible to all users.
          Unpublish at any time to hide it again.
        </div>
      </div>
    </div>
  );
}

// ─── Generic list + form shell ────────────────────────────────────────────────
function SectionShell<T extends { id: number; is_published: boolean }>({
  title, items, loading, onRefresh, onTogglePublish, onDelete, renderRow, renderForm, formTitle, headerExtra,
}: {
  title: string;
  items: T[];
  loading: boolean;
  onRefresh: () => void;
  onTogglePublish: (item: T) => void;
  onDelete: (id: number) => void;
  renderRow: (item: T) => React.ReactNode;
  renderForm: (item: Partial<T> | null, onClose: () => void, onSave: (data: Partial<T>) => void) => React.ReactNode;
  formTitle: string;
  headerExtra?: React.ReactNode;
}) {
  const [editing, setEditing] = useState<Partial<T> | null>(null);
  const [creating, setCreating] = useState(false);
  const [confirmDel, setConfirmDel] = useState<number | null>(null);

  const openCreate = () => { setEditing(null); setCreating(true); };
  const openEdit = (item: T) => { setEditing(item); setCreating(true); };
  const closeForm = () => { setCreating(false); setEditing(null); };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold">{title}</h2>
        <div className="flex gap-2">
          <button onClick={onRefresh} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors text-[var(--text-muted)]">
            <RefreshCw size={16} />
          </button>
          {headerExtra}
          <button onClick={openCreate}
            className="flex items-center gap-1.5 bg-[#58CC02] hover:bg-[#45A301] text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            <Plus size={14} /> New
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-[var(--border)]">
          <Plus size={32} className="mx-auto mb-2 opacity-30" />
          <p className="font-medium">No {title.toLowerCase()} yet. Create one!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(item => (
            <div key={item.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="flex-1 min-w-0">{renderRow(item)}</div>
              <PublishBadge pub={item.is_published} />
              <div className="flex gap-1 shrink-0">
                <button onClick={() => onTogglePublish(item)}
                  title={item.is_published ? 'Unpublish' : 'Publish'}
                  className={`p-2 rounded-lg text-xs font-bold transition-all ${item.is_published ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}>
                  {item.is_published ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
                <button onClick={() => openEdit(item)} className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-all">
                  <Pencil size={14} />
                </button>
                <button onClick={() => setConfirmDel(item.id)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirm */}
      <AnimatePresence>
        {confirmDel !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="font-bold text-lg mb-2">Delete this item?</h3>
              <p className="text-[var(--text-muted)] text-sm mb-5">This cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmDel(null)}
                  className="flex-1 border border-[var(--border)] rounded-xl py-2 text-sm font-semibold hover:bg-[var(--surface)] transition-all">
                  Cancel
                </button>
                <button onClick={() => { onDelete(confirmDel); setConfirmDel(null); }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-bold transition-all">
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form modal */}
      <AnimatePresence>
        {creating && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
            onClick={(e) => { if (e.target === e.currentTarget) closeForm(); }}>
            <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
              className="bg-[var(--surface)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
              <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
                <h3 className="font-extrabold text-lg">{editing ? `Edit ${formTitle}` : `New ${formTitle}`}</h3>
                <button onClick={closeForm} className="p-2 rounded-lg hover:bg-[var(--border)] transition-colors">
                  <X size={18} />
                </button>
              </div>
              <div className="p-6">
                {renderForm(editing, closeForm, (_data) => {
                  closeForm();
                  onRefresh();
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Courses Tab (Courses → Modules → Lessons) ───────────────────────────────
interface CourseModule { id: number; course_id: number; title: string; description: string; order: number; is_boss_module: boolean; }
interface CourseLesson { id: number; module_id: number; course_id: number; title: string; slug: string; description: string; content: string; type: string; duration: string; xp_reward: number; coin_reward: number; order: number; is_published: boolean; code_examples?: string; image_url?: string; video_url?: string; }
type CView = 'list' | 'modules' | 'lessons';

function CoursesTab({ showToast }: { showToast: (m: string) => void }) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [lessons, setLessons] = useState<CourseLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [mLoad, setMLoad] = useState(false);
  const [lLoad, setLLoad] = useState(false);
  const [view, setView] = useState<CView>('list');
  const [aC, setAC] = useState<Course | null>(null);
  const [aM, setAM] = useState<CourseModule | null>(null);
  const [showCF, setShowCF] = useState(false); const [editC, setEditC] = useState<Course | null>(null);
  const [showMF, setShowMF] = useState(false); const [editM, setEditM] = useState<CourseModule | null>(null);
  const [showLF, setShowLF] = useState(false); const [editL, setEditL] = useState<CourseLesson | null>(null);
  const [del, setDel] = useState<{ table: string; id: number } | null>(null);
  const [importing, setImporting] = useState(false);
  const mdInputRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const result = await importCourseMarkdown(text);
      showToast(result.message);
      if (result.ok) loadC();
    } catch (err: any) {
      showToast('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      if (mdInputRef.current) mdInputRef.current.value = '';
    }
  };

  const loadC = async () => { setLoading(true); const { data, error } = await supabase.from('courses').select('*').order('order', { ascending: true }); if (error) console.error('courses load err', error); setCourses((data as Course[]) ?? []); setLoading(false); };
  const loadM = async (cid: number) => { setMLoad(true); const { data, error } = await supabase.from('course_modules').select('*').eq('course_id', cid).order('order', { ascending: true }); if (error) console.error('modules err', error); setModules((data as CourseModule[]) ?? []); setMLoad(false); };
  const loadL = async (mid: number) => { setLLoad(true); const { data, error } = await supabase.from('course_lessons').select('*').eq('module_id', mid).order('order', { ascending: true }); if (error) console.error('lessons err', error); setLessons((data as CourseLesson[]) ?? []); setLLoad(false); };

  useEffect(() => { loadC(); }, []);

  const doDelete = async () => {
    if (!del) return;
    const { error } = await supabase.from(del.table).delete().eq('id', del.id);
    if (error) { console.error('delete err', error); showToast('Error: ' + error.message); setDel(null); return; }
    showToast('Deleted!'); setDel(null);
    if (del.table === 'courses') loadC();
    if (del.table === 'course_modules') loadM(aC!.id as number);
    if (del.table === 'course_lessons') loadL(aM!.id);
  };

  const BC = () => (
    <div className="flex items-center gap-1.5 mb-4 text-sm flex-wrap">
      <button onClick={() => { setView('list'); setAC(null); setAM(null); }} className={view === 'list' ? 'font-bold text-[var(--text)]' : 'text-blue-500 hover:underline font-medium'}>Courses</button>
      {aC && <><span className="text-[var(--text-muted)]">/</span><button onClick={() => { setView('modules'); setAM(null); loadM(aC.id as number); }} className={view === 'modules' ? 'font-bold text-[var(--text)]' : 'text-blue-500 hover:underline font-medium'}>{aC.title}</button></>}
      {aM && <><span className="text-[var(--text-muted)]">/</span><span className="font-bold text-[var(--text)]">{aM.title}</span></>}
    </div>
  );

  const Modal = ({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) => (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
        <motion.div initial={{ y: 60, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 60, opacity: 0 }}
          className="bg-[var(--surface)] rounded-t-3xl sm:rounded-2xl w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
          <div className="sticky top-0 bg-[var(--surface)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
            <h3 className="font-extrabold text-lg">{title}</h3>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-[var(--border)]"><X size={18} /></button>
          </div>
          <div className="p-6">{children}</div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );

  const DelConfirm = () => !del ? null : (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full shadow-xl">
        <h3 className="font-bold text-lg mb-2">Delete this item?</h3>
        <p className="text-[var(--text-muted)] text-sm mb-5">This cannot be undone.</p>
        <div className="flex gap-3">
          <button onClick={() => setDel(null)} className="flex-1 border border-[var(--border)] rounded-xl py-2 text-sm font-semibold hover:bg-[var(--surface)]">Cancel</button>
          <button onClick={doDelete} className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-bold">Delete</button>
        </div>
      </motion.div>
    </motion.div>
  );

  if (view === 'list') return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold">Courses</h2>
        <div className="flex gap-2">
          <button onClick={loadC} className="p-2 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)]"><RefreshCw size={16} /></button>
          <input ref={mdInputRef} type="file" accept=".md,text/markdown" className="hidden" onChange={handleImportFile} />
          <button onClick={() => mdInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-bold">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <BookOpen size={14} />} {importing ? 'Importing...' : 'Import .md'}
          </button>
          <button onClick={() => { setEditC(null); setShowCF(true); }} className="flex items-center gap-1.5 bg-[#58CC02] hover:bg-[#45A301] text-white px-4 py-2 rounded-xl text-sm font-bold"><Plus size={14} /> New Course</button>
        </div>
      </div>
      {loading ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div> : (
        <div className="space-y-2">
          {courses.map(c => (
            <div key={c.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0" style={{ backgroundColor: (c.color ?? '#6366f1') + '20' }}>{c.icon ?? '📚'}</div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-sm flex items-center gap-1.5">
                  {c.title}
                  {c.is_paid && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-600">
                      <Crown size={10} /> {c.currency || 'INR'} {(c.discount_price ?? 0) > 0 ? c.discount_price : c.price ?? 0}
                    </span>
                  )}
                </div>
                <div className="text-xs text-[var(--text-muted)]">
                  {c.difficulty} · {c.category} · {c.estimated_hours}h · {c.xp_reward} XP
                  {c.is_paid && <> · {c.total_sales ?? 0} sales · {c.currency || 'INR'} {c.total_revenue ?? 0} revenue</>}
                </div>
              </div>
              <PublishBadge pub={c.is_published} />
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={async () => { const { error } = await supabase.from('courses').update({ is_published: !c.is_published }).eq('id', c.id); if (error) { console.error('publish toggle err', error); showToast('Error: ' + error.message); return; } showToast(c.is_published ? 'Set private' : 'Published!'); loadC(); }} className={`p-2 rounded-lg transition-all ${c.is_published ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}>{c.is_published ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                <button onClick={() => { setAC(c); setView('modules'); loadM(c.id as number); }} className="px-3 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold flex items-center gap-1"><BookOpen size={12} /> Modules</button>
                <button onClick={() => { setEditC(c); setShowCF(true); }} className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-muted)]"><Pencil size={14} /></button>
                <button onClick={() => setDel({ table: 'courses', id: c.id as number })} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {courses.length === 0 && <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-[var(--border)]"><Plus size={32} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No courses yet.</p></div>}
        </div>
      )}
      {showCF && <Modal title={editC ? 'Edit Course' : 'New Course'} onClose={() => setShowCF(false)}><CourseForm initial={editC} onClose={() => setShowCF(false)} onSave={async d => {
        if (editC) {
          const { error } = await supabase.from('courses').update(d).eq('id', editC.id);
          if (error) { console.error('course update err', error); showToast('Error: ' + error.message); return; }
          showToast('Updated!');
        } else {
          const { error } = await supabase.from('courses').insert({ ...d, is_published: false });
          if (error) { console.error('course insert err', error); showToast('Error: ' + error.message); return; }
          showToast('Created!');
        }
        setShowCF(false); loadC();
      }} /></Modal>}
      <DelConfirm />
    </div>
  );

  if (view === 'modules') return (
    <div>
      <BC />
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-extrabold">Modules</h2><p className="text-xs text-[var(--text-muted)]">in {aC?.title}</p></div>
        <div className="flex gap-2">
          <button onClick={() => loadM(aC!.id as number)} className="p-2 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)]"><RefreshCw size={16} /></button>
          <button onClick={() => { setEditM(null); setShowMF(true); }} className="flex items-center gap-1.5 bg-[#1CB0F6] hover:bg-[#0C9BDE] text-white px-4 py-2 rounded-xl text-sm font-bold"><Plus size={14} /> New Module</button>
        </div>
      </div>
      {mLoad ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div> : (
        <div className="space-y-2">
          {modules.map((m, i) => (
            <div key={m.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">{m.order || i + 1}</div>
              <div className="flex-1 min-w-0"><div className="font-bold text-sm">{m.title}</div><div className="text-xs text-[var(--text-muted)] truncate">{m.description || 'No description'}{m.is_boss_module ? ' · 🏆 Boss' : ''}</div></div>
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={() => { setAM(m); setView('lessons'); loadL(m.id); }} className="px-3 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold">📖 Lessons</button>
                <button onClick={() => { setEditM(m); setShowMF(true); }} className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-muted)]"><Pencil size={14} /></button>
                <button onClick={() => setDel({ table: 'course_modules', id: m.id })} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {modules.length === 0 && <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-[var(--border)]"><Plus size={32} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No modules yet.</p></div>}
        </div>
      )}
      {showMF && <Modal title={editM ? 'Edit Module' : 'New Module'} onClose={() => setShowMF(false)}><ModuleForm initial={editM} nextOrder={modules.length + 1} onClose={() => setShowMF(false)} onSave={async d => {
        if (editM) {
          const { error } = await supabase.from('course_modules').update(d).eq('id', editM.id);
          if (error) { console.error('module update err', error); showToast('Error: ' + error.message); return; }
          showToast('Updated!');
        } else {
          const { error } = await supabase.from('course_modules').insert({ ...d, course_id: aC!.id });
          if (error) { console.error('module insert err', error); showToast('Error: ' + error.message); return; }
          showToast('Created!');
        }
        setShowMF(false); loadM(aC!.id as number);
      }} /></Modal>}
      <DelConfirm />
    </div>
  );

  if (view === 'lessons') return (
    <div>
      <BC />
      <div className="flex items-center justify-between mb-4">
        <div><h2 className="text-xl font-extrabold">Lessons</h2><p className="text-xs text-[var(--text-muted)]">in {aM?.title}</p></div>
        <div className="flex gap-2">
          <button onClick={() => loadL(aM!.id)} className="p-2 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)]"><RefreshCw size={16} /></button>
          <button onClick={() => { setEditL(null); setShowLF(true); }} className="flex items-center gap-1.5 bg-[#FF9600] hover:bg-[#E08600] text-white px-4 py-2 rounded-xl text-sm font-bold"><Plus size={14} /> New Lesson</button>
        </div>
      </div>
      {lLoad ? <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div> : (
        <div className="space-y-2">
          {lessons.map((l, i) => (
            <div key={l.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">{l.order || i + 1}</div>
              <div className="flex-1 min-w-0"><div className="font-bold text-sm">{l.title}</div><div className="text-xs text-[var(--text-muted)]">{l.type} · {l.duration} · {l.xp_reward} XP · <span className="font-mono">{l.slug}</span></div></div>
              <PublishBadge pub={l.is_published} />
              <div className="flex gap-1 flex-shrink-0">
                <button onClick={async () => { const { error } = await supabase.from('course_lessons').update({ is_published: !l.is_published }).eq('id', l.id); if (error) { console.error('lesson publish toggle err', error); showToast('Error: ' + error.message); return; } showToast(l.is_published ? 'Set private' : 'Published!'); loadL(aM!.id); }} className={`p-2 rounded-lg transition-all ${l.is_published ? 'bg-yellow-50 hover:bg-yellow-100 text-yellow-700' : 'bg-green-50 hover:bg-green-100 text-green-700'}`}>{l.is_published ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                <button onClick={() => { setEditL(l); setShowLF(true); }} className="p-2 rounded-lg bg-[var(--surface)] hover:bg-[var(--border)] text-[var(--text-muted)]"><Pencil size={14} /></button>
                <button onClick={() => setDel({ table: 'course_lessons', id: l.id })} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
          {lessons.length === 0 && <div className="text-center py-12 text-[var(--text-muted)] bg-[var(--surface)] rounded-2xl border border-[var(--border)]"><Plus size={32} className="mx-auto mb-2 opacity-30" /><p className="font-medium">No lessons yet.</p></div>}
        </div>
      )}
      {showLF && <Modal title={editL ? 'Edit Lesson' : 'New Lesson'} onClose={() => setShowLF(false)}><LessonForm initial={editL} nextOrder={lessons.length + 1} onClose={() => setShowLF(false)} onSave={async d => {
        if (editL) {
          const { error } = await supabase.from('course_lessons').update(d).eq('id', editL.id);
          if (error) { console.error('lesson update err', error); showToast('Error: ' + error.message); return; }
          showToast('Updated!');
        } else {
          const { error } = await supabase.from('course_lessons').insert({ ...d, module_id: aM!.id, course_id: aC!.id, is_published: false });
          if (error) { console.error('lesson insert err', error); showToast('Error: ' + error.message); return; }
          showToast('Created!');
        }
        setShowLF(false); loadL(aM!.id);
      }} /></Modal>}
      <DelConfirm />
    </div>
  );
  return null;
}

function CourseForm({ initial, onClose, onSave }: { initial: Course | null; onClose: () => void; onSave: (d: any) => void }) {
  const [d, setD] = useState({
    slug: initial?.slug ?? '', title: initial?.title ?? '', description: initial?.description ?? '', long_description: initial?.long_description ?? '', icon: initial?.icon ?? '📚', color: initial?.color ?? '#6366f1', difficulty: initial?.difficulty ?? 'Beginner', category: initial?.category ?? 'Frontend', tags: initial?.tags ?? '', estimated_hours: initial?.estimated_hours ?? 0, xp_reward: initial?.xp_reward ?? 500, coin_reward: initial?.coin_reward ?? 250, order: initial?.order ?? 0,
    // Premium fields — db/003_payment_system.sql (integer rupees, not decimal)
    is_paid: initial?.is_paid ?? false, price: initial?.price ?? 0, discount_price: initial?.discount_price ?? 0,
    currency: initial?.currency ?? 'INR', thumbnail: initial?.thumbnail ?? '', preview_video: initial?.preview_video ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: any) => setD(p => ({ ...p, [k]: e.target.value }));
  const save = async () => {
    if (!d.slug || !d.title) return alert('Slug and title required');
    if (d.is_paid && Number(d.price) <= 0) return alert('Paid courses need a price greater than 0');
    setSaving(true); await onSave(d); setSaving(false);
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title *"><input className={inputCls} value={d.title} onChange={set('title')} /></Field>
        <Field label="Slug *"><input className={inputCls} value={d.slug} onChange={set('slug')} placeholder="e.g. intro-to-react" /></Field>
      </div>
      <Field label="Short Description *"><textarea className={textareaCls} value={d.description} onChange={set('description')} /></Field>
      <Field label="Long Description"><textarea className={textareaCls} value={d.long_description} onChange={set('long_description')} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Difficulty"><select className={selectCls} value={d.difficulty} onChange={set('difficulty')}>{COURSE_DIFFICULTY_OPTS.map(o => <option key={o}>{o}</option>)}</select></Field>
        <Field label="Category"><input className={inputCls} value={d.category} onChange={set('category')} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Icon emoji"><input className={inputCls} value={d.icon} onChange={set('icon')} /></Field>
        <Field label="Color"><input className={inputCls} type="color" value={d.color} onChange={set('color')} /></Field>
        <Field label="Order"><input className={inputCls} type="number" value={d.order} onChange={set('order')} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Est. Hours"><input className={inputCls} type="number" value={d.estimated_hours} onChange={set('estimated_hours')} /></Field>
        <Field label="XP Reward"><input className={inputCls} type="number" value={d.xp_reward} onChange={set('xp_reward')} /></Field>
        <Field label="Coin Reward"><input className={inputCls} type="number" value={d.coin_reward} onChange={set('coin_reward')} /></Field>
      </div>
      <Field label="Tags (comma-separated)"><input className={inputCls} value={d.tags} onChange={set('tags')} /></Field>

      {/* ── Premium / Pricing — this is the paid/unpaid switch ── */}
      <div className="rounded-xl border-2 p-4 space-y-4" style={{ borderColor: d.is_paid ? '#6366f1' : 'var(--border)', backgroundColor: d.is_paid ? '#6366f108' : 'transparent' }}>
        <label className="flex items-center justify-between cursor-pointer">
          <span className="flex items-center gap-1.5 font-bold text-sm"><Crown size={14} className={d.is_paid ? 'text-indigo-600' : 'text-[var(--text-muted)]'} /> Paid Course</span>
          <span className="relative inline-block w-11 h-6">
            <input type="checkbox" className="sr-only peer" checked={d.is_paid} onChange={e => setD(p => ({ ...p, is_paid: e.target.checked }))} />
            <span className="absolute inset-0 rounded-full bg-gray-300 peer-checked:bg-indigo-600 transition-colors" />
            <span className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
          </span>
        </label>
        {d.is_paid && (
          <>
            <div className="grid grid-cols-3 gap-4">
              <Field label="Price *"><input className={inputCls} type="number" min={0} value={d.price} onChange={set('price')} placeholder="999" /></Field>
              <Field label="Discount Price"><input className={inputCls} type="number" min={0} value={d.discount_price} onChange={set('discount_price')} placeholder="0 = no discount" /></Field>
              <Field label="Currency"><input className={inputCls} value={d.currency} onChange={set('currency')} /></Field>
            </div>
            <Field label="Thumbnail URL"><input className={inputCls} value={d.thumbnail} onChange={set('thumbnail')} placeholder="https://..." /></Field>
            <Field label="Preview Video URL"><input className={inputCls} value={d.preview_video} onChange={set('preview_video')} placeholder="https://... (shown before purchase)" /></Field>
            {initial && (
              <p className="text-xs text-[var(--text-muted)] flex items-center gap-1"><IndianRupee size={11} /> {initial.total_sales ?? 0} sales so far · {d.currency} {initial.total_revenue ?? 0} lifetime revenue</p>
            )}
          </>
        )}
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 border border-[var(--border)] rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--surface)]">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 bg-[#58CC02] hover:bg-[#45A301] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{initial ? 'Save Changes' : 'Create (Private)'}</button>
      </div>
    </div>
  );
}

function ModuleForm({ initial, nextOrder, onClose, onSave }: { initial: CourseModule | null; nextOrder: number; onClose: () => void; onSave: (d: any) => void }) {
  const [d, setD] = useState({ title: initial?.title ?? '', description: initial?.description ?? '', order: initial?.order ?? nextOrder, is_boss_module: initial?.is_boss_module ?? false });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: any) => setD(p => ({ ...p, [k]: e.target.value }));
  const save = async () => { if (!d.title) return alert('Title required'); setSaving(true); await onSave(d); setSaving(false); };
  return (
    <div className="space-y-4">
      <Field label="Module Title *"><input className={inputCls} value={d.title} onChange={set('title')} placeholder="e.g. Python Basics" /></Field>
      <Field label="Description"><textarea className={textareaCls} value={d.description} onChange={set('description')} placeholder="What this module covers..." /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Order"><input className={inputCls} type="number" value={d.order} onChange={set('order')} /></Field>
        <Field label="Boss Module?"><label className="flex items-center gap-2 mt-2 cursor-pointer"><input type="checkbox" checked={d.is_boss_module} onChange={e => setD(p => ({ ...p, is_boss_module: e.target.checked }))} className="w-4 h-4 rounded" /><span className="text-sm font-medium">&#127942; Boss module</span></label></Field>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 border border-[var(--border)] rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--surface)]">Cancel</button>
        <button onClick={save} disabled={saving} className="flex-1 bg-[#1CB0F6] hover:bg-[#0C9BDE] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2">{saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{initial ? 'Save Changes' : 'Create Module'}</button>
      </div>
    </div>
  );
}

// ─── ENHANCED LESSON FORM with rich editor ──────────────────────────────────
function LessonForm({ initial, nextOrder, onClose, onSave }: { initial: CourseLesson | null; nextOrder: number; onClose: () => void; onSave: (d: any) => void }) {
  const [tab, setTab] = useState<'meta' | 'content' | 'code'>('meta');
  const [preview, setPreview] = useState(false);
  const [d, setD] = useState({
    title: initial?.title ?? '', slug: initial?.slug ?? '', description: initial?.description ?? '',
    content: initial?.content ?? '', type: initial?.type ?? 'reading', duration: initial?.duration ?? '10 min',
    xp_reward: initial?.xp_reward ?? 20, coin_reward: initial?.coin_reward ?? 10, order: initial?.order ?? nextOrder,
    code_examples: initial?.code_examples ?? '[]',
    image_url: initial?.image_url ?? '', video_url: initial?.video_url ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [jsonErr, setJsonErr] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const set = (k: string) => (e: any) => setD(p => ({ ...p, [k]: e.target.value }));
  const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const save = async () => { if (!d.title || !d.slug) return alert('Title and slug required'); try { JSON.parse(d.code_examples); } catch { return alert('Code examples JSON invalid'); } setSaving(true); await onSave(d); setSaving(false); };

  // ── block inserter ──
  const insert = (before: string, after = '', placeholder = '') => {
    const ta = taRef.current; if (!ta) return;
    const start = ta.selectionStart; const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end) || placeholder;
    const newVal = ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
    setD(p => ({ ...p, content: newVal }));
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    });
  };
  const insertLine = (prefix: string, placeholder = 'Text here') => {
    const ta = taRef.current; if (!ta) return;
    const pos = ta.selectionStart;
    const lineStart = ta.value.lastIndexOf('\n', pos - 1) + 1;
    const lineEnd = ta.value.indexOf('\n', pos);
    const end = lineEnd === -1 ? ta.value.length : lineEnd;
    const line = ta.value.slice(lineStart, end);
    const newLine = line.startsWith(prefix) ? line.slice(prefix.length) : prefix + (line || placeholder);
    const newVal = ta.value.slice(0, lineStart) + newLine + ta.value.slice(end);
    setD(p => ({ ...p, content: newVal }));
    requestAnimationFrame(() => { ta.focus(); ta.selectionStart = ta.selectionEnd = lineStart + newLine.length; });
  };

  // ── markdown → html for preview ──
  const mdToHtml = (md: string) => {
    return md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>')
      .replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-3 mb-1.5 text-[#58CC02]">$1</h2>')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold mt-2 mb-1">$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="bg-[var(--surface)] px-1 rounded font-mono text-xs text-pink-600">$1</code>')
      .replace(/^```[\w]*\n([\s\S]*?)```$/gm, '<pre class="bg-gray-900 text-green-400 p-3 rounded-xl text-xs font-mono my-2 overflow-x-auto"><code>$1</code></pre>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
      .replace(/^> (.+)$/gm, '<blockquote class="border-l-4 border-[#1CB0F6] pl-3 italic text-[var(--text-muted)] my-1">$1</blockquote>')
      .replace(/^---$/gm, '<hr class="my-3 border-[var(--border)]"/>')
      .replace(/\n\n/g, '</p><p class="mb-2">')
      .replace(/^(?!<[hpbcl])/gm, '')
  };

  const TOOLBAR = [
    { label: 'H1', tip: 'Heading 1', action: () => insertLine('# ', 'Heading 1') },
    { label: 'H2', tip: 'Heading 2', action: () => insertLine('## ', 'Heading 2') },
    { label: 'H3', tip: 'Heading 3', action: () => insertLine('### ', 'Heading 3') },
    { label: '|', tip: '', action: () => { } },
    { label: 'B', tip: 'Bold', action: () => insert('**', '**', 'bold text'), style: 'font-bold' },
    { label: 'I', tip: 'Italic', action: () => insert('*', '*', 'italic text'), style: 'italic' },
    { label: '`', tip: 'Inline code', action: () => insert('`', '`', 'code') },
    { label: '|', tip: '', action: () => { } },
    { label: '•', tip: 'Bullet list', action: () => insertLine('- ', 'List item') },
    { label: '1.', tip: 'Numbered list', action: () => insertLine('1. ', 'List item') },
    { label: '❝', tip: 'Quote', action: () => insertLine('> ', 'Quote text') },
    { label: '|', tip: '', action: () => { } },
    { label: '</>', tip: 'Code block', action: () => { const ta = taRef.current; if (!ta) return; const sel = ta.value.slice(ta.selectionStart, ta.selectionEnd) || 'your code here'; insert('```js\n', '\n```', sel); } },
    { label: '—', tip: 'Divider', action: () => { const ta = taRef.current; if (!ta) return; const v = ta.value; const ins = '\n---\n'; const nv = v.slice(0, ta.selectionStart) + ins + v.slice(ta.selectionEnd); setD(p => ({ ...p, content: nv })); } },
    { label: '💡', tip: 'Tip box', action: () => insert('\n> 💡 **Tip:** ', '\n', 'tip text here') },
    { label: '⚠️', tip: 'Warning', action: () => insert('\n> ⚠️ **Warning:** ', '\n', 'warning text') },
    { label: '🖼️', tip: 'Image', action: () => insert('\n![', '](https://ibb.co/your-id)\n', 'Alt text') },
    { label: '🎬', tip: 'Video (10-20s)', action: () => insert('\n@video(https://jumpshare.com/share/', '\n', 'your-id)') },
  ];

  return (
    <div className="space-y-4">
      {/* tabs */}
      <div className="flex gap-1 bg-[var(--surface)] p-1 rounded-xl">
        {(['meta', 'content', 'code'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${tab === t ? 'bg-[var(--surface)] shadow text-[var(--text)]' : 'text-[var(--text-muted)]'}`}>
            {t === 'meta' ? '⚙️ Info' : t === 'content' ? '📝 Content' : '💻 Code'}
          </button>
        ))}
      </div>

      {/* META */}
      {tab === 'meta' && (
        <div className="space-y-4">
          <Field label="Title *"><input className={inputCls} value={d.title} onChange={e => setD(p => ({ ...p, title: e.target.value, slug: p.slug || slugify(e.target.value) }))} placeholder="e.g. What is Python?" /></Field>
          <Field label="Slug *"><input className={inputCls} value={d.slug} onChange={set('slug')} placeholder="what-is-python" /></Field>
          <Field label="Description"><textarea className={textareaCls} value={d.description} onChange={set('description')} placeholder="Short summary shown in lesson list" /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Type"><select className={selectCls} value={d.type} onChange={set('type')}>{['reading', 'video', 'coding', 'quiz', 'exercise'].map(t => <option key={t}>{t}</option>)}</select></Field>
            <Field label="Duration"><input className={inputCls} value={d.duration} onChange={set('duration')} placeholder="10 min" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="XP Reward"><input className={inputCls} type="number" value={d.xp_reward} onChange={set('xp_reward')} /></Field>
            <Field label="Coin Reward"><input className={inputCls} type="number" value={d.coin_reward} onChange={set('coin_reward')} /></Field>
            <Field label="Order"><input className={inputCls} type="number" value={d.order} onChange={set('order')} /></Field>
          </div>
        </div>
      )}

      {/* CONTENT — rich block editor */}
      {tab === 'content' && (
        <div className="space-y-2">
          {/* toolbar */}
          <div className="flex flex-wrap gap-1 p-2 bg-[var(--surface)] border border-[var(--border)] rounded-xl">
            {TOOLBAR.map((btn, i) => btn.label === '|'
              ? <div key={i} className="w-px h-6 bg-[var(--border)] mx-0.5 self-center" />
              : (
                <button key={i} type="button" title={btn.tip} onClick={btn.action}
                  className={`px-2 py-1 rounded-lg text-xs font-bold hover:bg-[var(--surface)] hover:shadow transition-all text-[var(--text)] ${btn.style ?? ''}`}>
                  {btn.label}
                </button>
              )
            )}
            <div className="flex-1" />
            <button type="button" onClick={() => setPreview(p => !p)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${preview ? 'bg-[#1CB0F6] text-white' : 'bg-[var(--surface)] text-[var(--text-muted)] border border-[var(--border)]'}`}>
              {preview ? '✏️ Edit' : '👁 Preview'}
            </button>
          </div>

          {/* editor / preview */}
          {preview ? (
            <div className="min-h-[340px] p-4 border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] prose prose-sm max-w-none overflow-y-auto"
              dangerouslySetInnerHTML={{ __html: '<p class="mb-2">' + mdToHtml(d.content) + '</p>' }}
            />
          ) : (
            <textarea
              ref={taRef}
              className="w-full font-mono text-sm p-3 border-2 border-[var(--border)] rounded-xl focus:outline-none focus:border-[#1CB0F6] resize-none leading-relaxed"
              style={{ minHeight: 340 }}
              value={d.content}
              onChange={set('content')}
              placeholder={"## Lesson Title\n\nWrite your lesson content here...\n\n- Bullet point\n- Another point\n\n**Bold text** and *italic text*\n\n```js\nconsole.log('code block')\n```"}
              onKeyDown={e => {
                // Tab = 2 spaces
                if (e.key === 'Tab') {
                  e.preventDefault();
                  const ta = e.currentTarget;
                  const s = ta.selectionStart;
                  const newVal = d.content.slice(0, s) + '  ' + d.content.slice(ta.selectionEnd);
                  setD(p => ({ ...p, content: newVal }));
                  requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = s + 2; });
                }
                // Enter after bullet auto-continues list
                if (e.key === 'Enter') {
                  const ta = e.currentTarget;
                  const pos = ta.selectionStart;
                  const lineStart = d.content.lastIndexOf('\n', pos - 1) + 1;
                  const line = d.content.slice(lineStart, pos);
                  const bulletMatch = line.match(/^(- |\d+\. )/);
                  if (bulletMatch) {
                    e.preventDefault();
                    const prefix = bulletMatch[0];
                    const ins = '\n' + prefix;
                    const nv = d.content.slice(0, pos) + ins + d.content.slice(pos);
                    setD(p => ({ ...p, content: nv }));
                    requestAnimationFrame(() => { ta.selectionStart = ta.selectionEnd = pos + ins.length; });
                  }
                }
              }}
            />
          )}
          <div className="flex items-center justify-between text-xs text-[var(--text-muted)] px-1">
            <span>Markdown format · toolbar above for quick formatting</span>
            <span>{d.content.length} chars · ~{Math.max(1, Math.ceil(d.content.split(' ').length / 200))} min read</span>
          </div>
          {/* Media URLs */}
          <div className="border-t border-[var(--border)] pt-3 space-y-3">
            <p className="text-xs font-bold text-[var(--text-muted)]">MEDIA (optional)</p>
            <Field label="Image URL">
              <input className={inputCls} value={d.image_url} onChange={set('image_url')} placeholder="https://ibb.co/LdpsrPkY  or  https://i.ibb.co/xxx/img.jpg" />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Paste your <strong>ibb.co</strong> share link or direct <strong>i.ibb.co</strong> link</p>
              {d.image_url && (
                d.image_url.includes('i.ibb.co') || (!d.image_url.includes('ibb.co'))
                  ? <img src={d.image_url} alt="preview" className="mt-2 rounded-xl max-h-32 object-cover w-full" onError={e => (e.currentTarget.style.display = 'none')} />
                  : <div className="mt-2 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--border)', height: 180 }}><iframe src={d.image_url} className="w-full h-full" style={{ border: 'none' }} title="preview" /></div>
              )}
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Or use ![Alt](url) inline in content above</p>
            </Field>
            <Field label="Video URL (10–20 seconds only)">
              <input className={inputCls} value={d.video_url} onChange={set('video_url')} placeholder="https://jumpshare.com/share/a5LtZ7wxm4UvaA5k7IQz" />
              <p className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>Paste your <strong>Jumpshare</strong> share link (10–20 seconds only)</p>
              {d.video_url && (() => {
                const m = d.video_url.match(/jumpshare\.com\/(share|v)\/([\w-]+)/);
                const embed = m ? `https://jumpshare.com/embed/${m[2]}` : null;
                return embed
                  ? <div className="mt-2 rounded-xl overflow-hidden" style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe src={embed} allowFullScreen allow="autoplay; fullscreen"
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }} />
                  </div>
                  : <p className="text-red-500 text-xs mt-1">⚠ Not a valid Jumpshare link</p>;
              })()}
              <p className="text-[10px] text-[var(--text-muted)] mt-1">Max 10–20 seconds. Use @video(url) inline in content to position it</p>
            </Field>
          </div>
        </div>
      )}

      {/* CODE EXAMPLES */}
      {tab === 'code' && (
        <div className="space-y-2">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            JSON array of code examples shown alongside lesson. Each item: <code className="bg-amber-100 px-1 rounded">{`{"language":"python","code":"...","explanation":"..."}`}</code>
          </div>
          <Field label="Code Examples (JSON)">
            <textarea className={textareaCls + ' font-mono text-xs min-h-[280px]'} value={d.code_examples}
              onChange={e => { setD(p => ({ ...p, code_examples: e.target.value })); try { JSON.parse(e.target.value); setJsonErr(''); } catch (ex: any) { setJsonErr(ex.message); } }}
              placeholder='[{"language":"python","code":"print(\"hello\")","explanation":"Basic print statement"}]' />
            {jsonErr && <p className="text-red-500 text-xs mt-1">⚠ {jsonErr}</p>}
          </Field>
          {/* quick add helper */}
          <div className="flex gap-2 flex-wrap">
            {['python', 'javascript', 'typescript', 'c', 'html', 'css', 'sql'].map(lang => (
              <button key={lang} type="button" onClick={() => {
                try {
                  const arr = JSON.parse(d.code_examples);
                  arr.push({ language: lang, code: '# your code here', explanation: 'Explain what this does' });
                  setD(p => ({ ...p, code_examples: JSON.stringify(arr, null, 2) }));
                  setJsonErr('');
                } catch { alert('Fix JSON errors first'); }
              }} className="px-2 py-1 bg-[var(--surface)] hover:bg-[var(--border)] rounded-lg text-xs font-bold text-[var(--text-muted)]">
                + {lang}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 border border-[var(--border)] rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--surface)]">Cancel</button>
        <button onClick={save} disabled={saving || !!jsonErr} className="flex-1 bg-[#FF9600] hover:bg-[#E08600] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}{initial ? 'Save Changes' : 'Create Lesson'}
        </button>
      </div>
    </div>
  );
}

// ─── Quizzes Tab ──────────────────────────────────────────────────────────────
function QuizzesTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('quizzes').select('*').order('id', { ascending: true });
    setItems((data as Quiz[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const togglePublish = async (q: Quiz) => {
    await supabase.from('quizzes').update({ is_published: !q.is_published }).eq('id', q.id);
    showToast(q.is_published ? 'Quiz set to private' : 'Quiz published!');
    load();
  };
  const del = async (id: number) => {
    await supabase.from('quizzes').delete().eq('id', id);
    showToast('Quiz deleted');
    load();
  };

  return (
    <SectionShell
      title="Quizzes" items={items} loading={loading}
      onRefresh={load} onTogglePublish={togglePublish} onDelete={del}
      formTitle="Quiz"
      renderRow={(q) => (
        <div>
          <div className="font-bold text-sm">{q.title}</div>
          <div className="text-xs text-[var(--text-muted)]">Course #{q.course_id} · Pass {q.passing_score}% · {q.xp_reward} XP</div>
        </div>
      )}
      renderForm={(item, onClose, onSave) => (
        <QuizForm initial={item as Quiz | null} onClose={onClose} onSave={async (d) => {
          if (item && (item as Quiz).id) {
            await supabase.from('quizzes').update(d).eq('id', (item as Quiz).id);
            showToast('Quiz updated!');
          } else {
            await supabase.from('quizzes').insert({ ...d, is_published: false });
            showToast('Quiz created! (private — publish when ready)');
          }
          onSave(d);
        }} />
      )}
    />
  );
}

// ─── ENHANCED QUIZ FORM with course/lesson selection ────────────────────────
function QuizForm({ initial, onClose, onSave }: { initial: Quiz | null; onClose: () => void; onSave: (d: any) => void }) {
  const [d, setD] = useState({
    lesson_id: initial?.lesson_id ?? null as number | null,
    course_id: initial?.course_id ?? null as number | null,
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    questions: initial?.questions ?? '[]',
    passing_score: initial?.passing_score ?? 70,
    xp_reward: initial?.xp_reward ?? 50,
    coin_reward: initial?.coin_reward ?? 25,
  });
  const [saving, setSaving] = useState(false);
  const [jsonErr, setJsonErr] = useState('');
  const [courses, setCourses] = useState<{ id: number; title: string }[]>([]);
  const [lessons, setLessons] = useState<{ id: number; title: string; slug: string }[]>([]);
  const set = (k: string) => (e: any) => setD(prev => ({ ...prev, [k]: e.target.value }));

  useEffect(() => {
    supabase.from('courses').select('id,title').order('title').then(({ data }) => setCourses(data ?? []));
  }, []);

  useEffect(() => {
    if (!d.course_id) { setLessons([]); return; }
    supabase.from('course_lessons').select('id,title,slug').eq('course_id', d.course_id).order('order')
      .then(({ data }) => setLessons(data ?? []));
  }, [d.course_id]);

  const validateJson = (v: string) => {
    try { JSON.parse(v); setJsonErr(''); } catch (e: any) { setJsonErr(e.message); }
  };

  const save = async () => {
    if (!d.title) return alert('Title required');
    try { JSON.parse(d.questions); } catch { return alert('Questions JSON is invalid'); }
    setSaving(true);
    await onSave({ ...d, lesson_id: null });
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Field label="Title *"><input className={inputCls} value={d.title} onChange={set('title')} placeholder="e.g. Python Basics Quiz" /></Field>
      <Field label="Description"><textarea className={textareaCls} value={d.description} onChange={set('description')} placeholder="Short description of this quiz" /></Field>

      <div className="p-3 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-700">
        Pick a course (and optionally a lesson) to link this quiz. The quiz will appear on that lesson page.
      </div>

      <Field label="Course">
        <select className={selectCls} value={d.course_id ?? ''} onChange={e => setD(p => ({ ...p, course_id: e.target.value ? Number(e.target.value) : null, lesson_id: null }))}>
          <option value="">— Select a course —</option>
          {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </Field>

      <Field label="Lesson (optional — attach to a specific lesson)">
        <select className={selectCls} value={d.lesson_id ?? ''} onChange={e => setD(p => ({ ...p, lesson_id: e.target.value ? Number(e.target.value) : null }))} disabled={!d.course_id}>
          <option value="">— No specific lesson (standalone quiz) —</option>
          {lessons.map(l => <option key={l.id} value={l.id}>{l.title}</option>)}
        </select>
        {!d.course_id && <p className="text-xs text-[var(--text-muted)] mt-1">Select a course first</p>}
      </Field>

      <div className="grid grid-cols-3 gap-4">
        <Field label="Passing %"><input className={inputCls} type="number" value={d.passing_score} onChange={set('passing_score')} /></Field>
        <Field label="XP Reward"><input className={inputCls} type="number" value={d.xp_reward} onChange={set('xp_reward')} /></Field>
        <Field label="Coin Reward"><input className={inputCls} type="number" value={d.coin_reward} onChange={set('coin_reward')} /></Field>
      </div>

      <Field label="Questions JSON *">
        <textarea className={textareaCls + ' min-h-[200px] font-mono text-xs'} value={d.questions}
          onChange={(e) => { setD(p => ({ ...p, questions: e.target.value })); validateJson(e.target.value); }}
          placeholder='[{"question":"What does print() do?","options":["Prints output","Deletes file","Returns value","None"],"correctIndex":0,"explanation":"print() displays text to console"}]' />
        {jsonErr && <p className="text-red-500 text-xs mt-1">⚠ {jsonErr}</p>}
        <p className="text-xs text-[var(--text-muted)] mt-1">Each item: <code className="bg-[var(--surface)] px-1 rounded">{`{"question":"","options":[],"correctIndex":0,"explanation":""}`}</code></p>
      </Field>

      <div className="flex gap-2 flex-wrap">
        <button type="button" onClick={() => {
          try {
            const arr = JSON.parse(d.questions);
            arr.push({ "question": "", "options": ["", "", "", ""], "correctIndex": 0, "explanation": "" });
            setD(p => ({ ...p, questions: JSON.stringify(arr, null, 2) }));
            setJsonErr('');
          } catch { alert('Fix JSON errors first'); }
        }} className="px-3 py-1.5 bg-[var(--surface)] hover:bg-[var(--border)] rounded-lg text-xs font-bold text-[var(--text-muted)]">
          + Add Question
        </button>
      </div>

      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 border border-[var(--border)] rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--surface)] transition-all">Cancel</button>
        <button onClick={save} disabled={saving || !!jsonErr}
          className="flex-1 bg-[#58CC02] hover:bg-[#45A301] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {initial ? 'Save Changes' : 'Create (Private)'}
        </button>
      </div>
    </div>
  );
}

// ─── Challenges Tab ───────────────────────────────────────────────────────────
function ChallengesTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('challenges').select('*').order('id', { ascending: true });
    setItems((data as Challenge[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const togglePublish = async (c: Challenge) => {
    await supabase.from('challenges').update({ is_published: !c.is_published }).eq('id', c.id);
    showToast(c.is_published ? 'Challenge set to private' : 'Challenge published!');
    load();
  };
  const del = async (id: number) => {
    await supabase.from('challenges').delete().eq('id', id);
    showToast('Challenge deleted');
    load();
  };

  return (
    <SectionShell
      title="Challenges" items={items} loading={loading}
      onRefresh={load} onTogglePublish={togglePublish} onDelete={del}
      formTitle="Challenge"
      renderRow={(c) => (
        <div>
          <div className="font-bold text-sm">{c.title}</div>
          <div className="text-xs text-[var(--text-muted)]">{c.difficulty} · {c.category} · {c.xp_reward} XP</div>
        </div>
      )}
      renderForm={(item, onClose, onSave) => (
        <ChallengeForm initial={item as Challenge | null} onClose={onClose} onSave={async (d) => {
          if (item && (item as Challenge).id) {
            await supabase.from('challenges').update(d).eq('id', (item as Challenge).id);
            showToast('Challenge updated!');
          } else {
            await supabase.from('challenges').insert({ ...d, is_published: false });
            showToast('Challenge created! (private — publish when ready)');
          }
          onSave(d);
        }} />
      )}
    />
  );
}

function ChallengeForm({ initial, onClose, onSave }: { initial: Challenge | null; onClose: () => void; onSave: (d: any) => void }) {
  const [d, setD] = useState({
    slug: initial?.slug ?? '',
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    difficulty: initial?.difficulty ?? 'Easy',
    category: initial?.category ?? 'Arrays',
    problem_statement: initial?.problem_statement ?? '',
    constraints: initial?.constraints ?? '',
    examples: initial?.examples ?? '',
    starter_code: initial?.starter_code ?? '',
    hints: initial?.hints ?? '',
    test_cases: initial?.test_cases ?? '[]',
    xp_reward: initial?.xp_reward ?? 50,
    coin_reward: initial?.coin_reward ?? 25,
  });
  const [saving, setSaving] = useState(false);
  const set = (k: string) => (e: any) => setD(prev => ({ ...prev, [k]: e.target.value }));

  const save = async () => {
    if (!d.slug || !d.title) return alert('Slug and title required');
    setSaving(true);
    await onSave(d);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title *"><input className={inputCls} value={d.title} onChange={set('title')} /></Field>
        <Field label="Slug *"><input className={inputCls} value={d.slug} onChange={set('slug')} /></Field>
      </div>
      <Field label="Short Description"><textarea className={textareaCls} value={d.description} onChange={set('description')} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Difficulty">
          <select className={selectCls} value={d.difficulty} onChange={set('difficulty')}>
            {DIFFICULTY_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Category"><input className={inputCls} value={d.category} onChange={set('category')} /></Field>
      </div>
      <Field label="Problem Statement *"><textarea className={textareaCls + ' min-h-[120px]'} value={d.problem_statement} onChange={set('problem_statement')} /></Field>
      <Field label="Constraints"><textarea className={textareaCls} value={d.constraints} onChange={set('constraints')} /></Field>
      <Field label="Examples"><textarea className={textareaCls} value={d.examples} onChange={set('examples')} /></Field>
      <Field label="Starter Code"><textarea className={textareaCls + ' font-mono text-xs'} value={d.starter_code} onChange={set('starter_code')} /></Field>
      <Field label="Hints"><textarea className={textareaCls} value={d.hints} onChange={set('hints')} /></Field>
      <Field label="Test Cases (JSON)"><textarea className={textareaCls + ' font-mono text-xs'} value={d.test_cases} onChange={set('test_cases')} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="XP Reward"><input className={inputCls} type="number" value={d.xp_reward} onChange={set('xp_reward')} /></Field>
        <Field label="Coin Reward"><input className={inputCls} type="number" value={d.coin_reward} onChange={set('coin_reward')} /></Field>
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 border border-[var(--border)] rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--surface)] transition-all">Cancel</button>
        <button onClick={save} disabled={saving}
          className="flex-1 bg-[#58CC02] hover:bg-[#45A301] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {initial ? 'Save Changes' : 'Create (Private)'}
        </button>
      </div>
    </div>
  );
}

// ─── Game Levels Tab ──────────────────────────────────────────────────────────
const GAME_LEVELS_MD_TEMPLATE = `# Game Levels Import

## Level
title: JavaScript Basics — Round 1
topic: javascript
difficulty: Easy
game_type: quiz
xp_reward: 50
coin_reward: 25

### Item
question: What does console.log() do?
options: Prints to console | Deletes a variable | Returns a value | Does nothing
correctIndex: 0
explanation: console.log() outputs text to the console for debugging.

### Item
question: Which keyword declares a constant in JS?
options: let | var | const | static
correctIndex: 2
explanation: const declares a block-scoped variable that can't be reassigned.

## Level
title: Fill the Blank — Loops
topic: javascript
difficulty: Medium
game_type: fillblank
xp_reward: 60
coin_reward: 30

### Item
template: for (let i = 0; i ___ 10; i++) { }
answer: <
hint: Comparison operator meaning "less than"
`;

function downloadGameLevelsTemplate() {
  const blob = new Blob([GAME_LEVELS_MD_TEMPLATE], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'game-levels-template.md';
  a.click();
  URL.revokeObjectURL(url);
}

function GameLevelsTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<GameLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const mdInputRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('game_levels').select('*').order('order', { ascending: true });
    setItems((data as GameLevel[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const togglePublish = async (g: GameLevel) => {
    await supabase.from('game_levels').update({ is_published: !g.is_published }).eq('id', g.id);
    showToast(g.is_published ? 'Level set to private' : 'Level published!');
    load();
  };
  const del = async (id: number) => {
    await supabase.from('game_levels').delete().eq('id', id);
    showToast('Level deleted');
    load();
  };

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const result = await importGameLevelsMarkdown(text);
      showToast(result.message);
      if (result.ok) load();
    } catch (err: any) {
      showToast('Import failed: ' + err.message);
    } finally {
      setImporting(false);
      if (mdInputRef.current) mdInputRef.current.value = '';
    }
  };

  return (
    <SectionShell
      title="Game Levels" items={items} loading={loading}
      onRefresh={load} onTogglePublish={togglePublish} onDelete={del}
      formTitle="Game Level"
      headerExtra={
        <>
          <input ref={mdInputRef} type="file" accept=".md,text/markdown" className="hidden" onChange={handleImportFile} />
          <button onClick={downloadGameLevelsTemplate} title="Download a starter .md template"
            className="flex items-center gap-1.5 border border-[var(--border)] hover:bg-[var(--surface)] text-[var(--text-muted)] px-3 py-2 rounded-xl text-sm font-bold transition-all">
            Template
          </button>
          <button onClick={() => mdInputRef.current?.click()} disabled={importing}
            className="flex items-center gap-1.5 bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-bold transition-all">
            {importing ? <Loader2 size={14} className="animate-spin" /> : <Gamepad2 size={14} />} {importing ? 'Importing...' : 'Import .md'}
          </button>
        </>
      }
      renderRow={(g) => (
        <div>
          <div className="font-bold text-sm">{g.title}</div>
          <div className="text-xs text-[var(--text-muted)]">{g.game_type} · {g.topic} · {g.difficulty} · {g.xp_reward} XP</div>
        </div>
      )}
      renderForm={(item, onClose, onSave) => (
        <GameLevelForm initial={item as GameLevel | null} onClose={onClose} onSave={async (d) => {
          if (item && (item as GameLevel).id) {
            await supabase.from('game_levels').update(d).eq('id', (item as GameLevel).id);
            showToast('Level updated!');
          } else {
            await supabase.from('game_levels').insert({ ...d, is_published: false });
            showToast('Level created! (private — publish when ready)');
          }
          onSave(d);
        }} />
      )}
    />
  );
}

function GameLevelForm({ initial, onClose, onSave }: { initial: GameLevel | null; onClose: () => void; onSave: (d: any) => void }) {
  const [d, setD] = useState({
    title: initial?.title ?? '',
    topic: initial?.topic ?? 'javascript',
    difficulty: initial?.difficulty ?? 'Easy',
    game_type: initial?.game_type ?? 'quiz',
    questions: initial?.questions ?? '[]',
    xp_reward: initial?.xp_reward ?? 50,
    coin_reward: initial?.coin_reward ?? 25,
    order: initial?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [jsonErr, setJsonErr] = useState('');
  const set = (k: string) => (e: any) => setD(prev => ({ ...prev, [k]: e.target.value }));

  const schemaHint: Record<string, string> = {
    quiz: '{ "id":"", "question":"", "options":[], "correctIndex":0, "explanation":"" }',
    fillblank: '{ "id":"", "template":"console.log(___)", "answer":"hello", "hint":"" }',
    prediction: '{ "id":"", "code":"", "output":"", "explanation":"" }',
    bughunt: '{ "id":"", "code":"", "bugLine":3, "explanation":"" }',
    codeorder: '{ "id":"", "lines":[], "hint":"" }',
    truthy: '{ "id":"", "statement":"", "isTrue":true, "explanation":"" }',
    coderace: '{ "id":"", "template":"code with ___ blank", "answer":"", "hint":"" }',
    typing: '{ "id":"", "code":"snippet to type", "language":"javascript" }',
  };

  const validateJson = (v: string) => {
    try { JSON.parse(v); setJsonErr(''); } catch (e: any) { setJsonErr(e.message); }
  };

  const save = async () => {
    if (!d.title) return alert('Title required');
    try { JSON.parse(d.questions); } catch { return alert('Questions JSON is invalid'); }
    setSaving(true);
    await onSave(d);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <Field label="Level Title *"><input className={inputCls} value={d.title} onChange={set('title')} /></Field>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Game Type">
          <select className={selectCls} value={d.game_type} onChange={set('game_type')}>
            {GAME_TYPE_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Topic"><input className={inputCls} value={d.topic} onChange={set('topic')} placeholder="javascript / python / html…" /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Difficulty">
          <select className={selectCls} value={d.difficulty} onChange={set('difficulty')}>
            {DIFFICULTY_OPTS.map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="XP Reward"><input className={inputCls} type="number" value={d.xp_reward} onChange={set('xp_reward')} /></Field>
        <Field label="Coin Reward"><input className={inputCls} type="number" value={d.coin_reward} onChange={set('coin_reward')} /></Field>
      </div>
      <Field label="Order (display position)"><input className={inputCls} type="number" value={d.order} onChange={set('order')} /></Field>
      <Field label="Questions JSON *">
        <textarea className={textareaCls + ' min-h-[200px] font-mono text-xs'} value={d.questions}
          onChange={(e) => { setD(p => ({ ...p, questions: e.target.value })); validateJson(e.target.value); }} />
        {jsonErr && <p className="text-red-500 text-xs mt-1">⚠ {jsonErr}</p>}
        <div className="text-xs text-[var(--text-muted)] mt-1">
          Schema for <strong>{d.game_type}</strong>: <code className="bg-[var(--surface)] px-1 rounded">{schemaHint[d.game_type]}</code>
        </div>
      </Field>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 border border-[var(--border)] rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--surface)] transition-all">Cancel</button>
        <button onClick={save} disabled={saving || !!jsonErr}
          className="flex-1 bg-[#58CC02] hover:bg-[#45A301] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {initial ? 'Save Changes' : 'Create (Private)'}
        </button>
      </div>
    </div>
  );
}

const TAG_COLOR_PRESETS = ['#1CB0F6', '#58CC02', '#FF9600', '#FF4B4B', '#CE82FF', '#FFC800', '#00CDD7'];

// ─── Players Tab ──────────────────────────────────────────────────────────────
function PlayersTab({ showToast }: { showToast: (m: string) => void }) {
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [confirmId, setConfirmId] = useState<number | null>(null);
  // Which player's tag editor is currently open, plus the draft values
  // for it (text + color) before saving.
  const [tagEditId, setTagEditId] = useState<number | null>(null);
  const [tagDraft, setTagDraft] = useState('');
  const [tagColorDraft, setTagColorDraft] = useState(TAG_COLOR_PRESETS[0]);
  const [savingTag, setSavingTag] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('xp', { ascending: false });
    setPlayers((data as PlayerProfile[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const del = async (id: number) => {
    const p = players.find(x => x.id === id);
    if (!p) return;
    const { error } = await supabase.auth.admin.deleteUser(p.user_id);
    if (error) await supabase.from('profiles').delete().eq('id', id);
    setPlayers(prev => prev.filter(x => x.id !== id));
    showToast('Player removed');
  };

  const openTagEditor = (p: PlayerProfile) => {
    setTagEditId(p.id);
    setTagDraft(p.custom_tag ?? '');
    setTagColorDraft(p.custom_tag_color ?? TAG_COLOR_PRESETS[0]);
  };

  // Give (or clear) a custom tag on any player — this is the "admin can
  // give any tag to anyone" feature. Empty text clears the tag.
  const saveTag = async (id: number) => {
    const p = players.find(x => x.id === id);
    if (!p) return;
    setSavingTag(true);
    const trimmed = tagDraft.trim();
    const { error } = await supabase.from('profiles')
      .update({ custom_tag: trimmed || null, custom_tag_color: trimmed ? tagColorDraft : null })
      .eq('id', id);
    setSavingTag(false);
    if (error) { showToast('Failed to save tag'); return; }
    setPlayers(prev => prev.map(x => x.id === id ? { ...x, custom_tag: trimmed || null, custom_tag_color: trimmed ? tagColorDraft : null } : x));
    setTagEditId(null);
    showToast(trimmed ? `Tagged "${p.display_name ?? 'player'}" as "${trimmed}"` : 'Tag cleared');
  };

  const filtered = players.filter(p =>
    (p.display_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    p.user_id.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-extrabold">Players ({players.length})</h2>
        <button onClick={load} className="p-2 rounded-lg hover:bg-[var(--border)] text-[var(--text-muted)]"><RefreshCw size={16} /></button>
      </div>
      <input className={inputCls + ' mb-4'} placeholder="Search by name or ID…" value={search} onChange={e => setSearch(e.target.value)} />
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-[var(--text-muted)]" /></div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p, idx) => {
            // rank is by global xp order — players array is already sorted
            // by xp desc from the query above, so index 0 = #1.
            const rank = players.findIndex(x => x.id === p.id) + 1;
            return (
              <div key={p.id} className="bg-[var(--surface)] border border-[var(--border)] rounded-xl px-4 py-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#58CC02] to-[#1CB0F6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                    {(p.display_name ?? '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-sm truncate">{p.display_name ?? 'Anonymous'}</div>
                    <div className="text-xs text-[var(--text-muted)]">Lv {p.level} · {p.xp} XP · {p.coins} coins · streak {p.current_streak}</div>
                    <div className="mt-1"><PlayerTagBadge role={p.role} rank={rank} tag={p.custom_tag} tagColor={p.custom_tag_color} size="xs" /></div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${p.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-[var(--surface)] text-[var(--text-muted)]'}`}>{p.role}</span>
                  <button onClick={() => openTagEditor(p)} title="Give a tag" className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 transition-all">
                    <Tag size={14} />
                  </button>
                  <button onClick={() => setConfirmId(p.id)} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 transition-all">
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Inline tag editor */}
                <AnimatePresence>
                  {tagEditId === p.id && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
                      className="mt-3 pt-3 border-t border-[var(--border)] overflow-hidden">
                      <label className="text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wide mb-1 block">Custom tag (blank = remove)</label>
                      <input className={inputCls + ' mb-2'} placeholder="e.g. Legend, Beta Tester, VIP…" value={tagDraft}
                        onChange={e => setTagDraft(e.target.value)} maxLength={24} />
                      <div className="flex items-center gap-2 mb-3">
                        {TAG_COLOR_PRESETS.map(c => (
                          <button key={c} onClick={() => setTagColorDraft(c)}
                            className="w-6 h-6 rounded-full border-2 transition-transform"
                            style={{ backgroundColor: c, borderColor: tagColorDraft === c ? 'var(--text)' : 'transparent', transform: tagColorDraft === c ? 'scale(1.15)' : 'scale(1)' }} />
                        ))}
                      </div>
                      {tagDraft.trim() && (
                        <div className="mb-3"><PlayerTagBadge role={p.role} rank={rank} tag={tagDraft.trim()} tagColor={tagColorDraft} /></div>
                      )}
                      <div className="flex gap-2">
                        <button onClick={() => setTagEditId(null)} className="flex-1 border border-[var(--border)] rounded-lg py-2 text-xs font-semibold hover:bg-[var(--border)]">Cancel</button>
                        <button onClick={() => saveTag(p.id)} disabled={savingTag}
                          className="flex-1 bg-[#1CB0F6] hover:bg-[#189CD8] disabled:opacity-60 text-white rounded-lg py-2 text-xs font-bold flex items-center justify-center gap-1.5">
                          {savingTag ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />} Save Tag
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      )}
      <AnimatePresence>
        {confirmId !== null && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="bg-[var(--surface)] rounded-2xl p-6 max-w-sm w-full shadow-xl">
              <h3 className="font-bold text-lg mb-2">Remove player?</h3>
              <p className="text-[var(--text-muted)] text-sm mb-5">This deletes their account and all data. Cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => setConfirmId(null)}
                  className="flex-1 border border-[var(--border)] rounded-xl py-2 text-sm font-semibold hover:bg-[var(--surface)] transition-all">Cancel</button>
                <button onClick={() => { del(confirmId); setConfirmId(null); }}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white rounded-xl py-2 text-sm font-bold transition-all">Delete</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Projects Admin Tab ───────────────────────────────────────────────────────
interface Project {
  id: number; slug: string; title: string; emoji: string;
  description: string; difficulty: string; difficulty_color: string;
  hours: number; xp_reward: number; coin_reward: number;
  tech_stack: string; stack_colors: string; min_xp: number;
  steps: string; preview_bg: string; category: string;
  resources: string; order: number; is_published: boolean;
}

function ProjectsAdminTab({ showToast }: { showToast: (m: string) => void }) {
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from('projects').select('*').order('order', { ascending: true });
    setItems((data as Project[]) ?? []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const togglePublish = async (p: Project) => {
    await supabase.from('projects').update({ is_published: !p.is_published }).eq('id', p.id);
    showToast(p.is_published ? 'Project set to private' : 'Project published!');
    load();
  };
  const del = async (id: number) => {
    await supabase.from('projects').delete().eq('id', id);
    showToast('Project deleted');
    load();
  };

  return (
    <SectionShell
      title="Projects" items={items} loading={loading}
      onRefresh={load} onTogglePublish={togglePublish} onDelete={del}
      formTitle="Project"
      renderRow={(p) => (
        <div>
          <div className="font-bold text-sm">{p.emoji} {p.title}</div>
          <div className="text-xs text-[var(--text-muted)]">{p.difficulty} · {p.category} · {p.hours}h · {p.xp_reward} XP</div>
        </div>
      )}
      renderForm={(item, onClose, onSave) => (
        <ProjectForm initial={item as Project | null} onClose={onClose} onSave={async (d) => {
          if (item && (item as Project).id) {
            await supabase.from('projects').update(d).eq('id', (item as Project).id);
            showToast('Project updated!');
          } else {
            await supabase.from('projects').insert({ ...d, is_published: false });
            showToast('Project created! (private — publish when ready)');
          }
          onSave(d);
        }} />
      )}
    />
  );
}

function ProjectForm({ initial, onClose, onSave }: { initial: Project | null; onClose: () => void; onSave: (d: any) => void }) {
  const [d, setD] = useState({
    slug: initial?.slug ?? '',
    title: initial?.title ?? '',
    emoji: initial?.emoji ?? '🛠️',
    description: initial?.description ?? '',
    difficulty: initial?.difficulty ?? 'Beginner',
    difficulty_color: initial?.difficulty_color ?? '#58CC02',
    hours: initial?.hours ?? 2,
    xp_reward: initial?.xp_reward ?? 400,
    coin_reward: initial?.coin_reward ?? 200,
    min_xp: initial?.min_xp ?? 0,
    tech_stack: initial?.tech_stack ?? '["HTML","CSS","JS"]',
    stack_colors: initial?.stack_colors ?? '["#E34C26","#264DE4","#F7DF1E"]',
    steps: initial?.steps ?? '[]',
    resources: initial?.resources ?? '[{"label":"MDN Web Docs","url":"https://developer.mozilla.org"}]',
    preview_bg: initial?.preview_bg ?? 'linear-gradient(135deg,#667eea,#764ba2)',
    category: initial?.category ?? 'Web',
    order: initial?.order ?? 0,
  });
  const [saving, setSaving] = useState(false);
  const [stepsErr, setStepsErr] = useState('');
  const set = (k: string) => (e: any) => setD(prev => ({ ...prev, [k]: e.target.value }));

  const validateSteps = (v: string) => {
    try { JSON.parse(v); setStepsErr(''); } catch (e: any) { setStepsErr(e.message); }
  };

  const save = async () => {
    if (!d.slug || !d.title) return alert('Slug and title required');
    try { JSON.parse(d.steps); JSON.parse(d.tech_stack); JSON.parse(d.stack_colors); JSON.parse(d.resources); }
    catch (e: any) { return alert('JSON error: ' + e.message); }
    setSaving(true);
    await onSave(d);
    setSaving(false);
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Field label="Title *"><input className={inputCls} value={d.title} onChange={set('title')} /></Field>
        <Field label="Slug *"><input className={inputCls} value={d.slug} onChange={set('slug')} placeholder="my-cool-project" /></Field>
      </div>
      <Field label="Description *"><textarea className={textareaCls} value={d.description} onChange={set('description')} /></Field>
      <div className="grid grid-cols-3 gap-4">
        <Field label="Emoji"><input className={inputCls} value={d.emoji} onChange={set('emoji')} /></Field>
        <Field label="Difficulty">
          <select className={selectCls} value={d.difficulty} onChange={set('difficulty')}>
            {['Beginner', 'Intermediate', 'Advanced'].map(o => <option key={o}>{o}</option>)}
          </select>
        </Field>
        <Field label="Diff Color"><input className={inputCls} type="color" value={d.difficulty_color} onChange={set('difficulty_color')} /></Field>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Category"><input className={inputCls} value={d.category} onChange={set('category')} /></Field>
        <Field label="Est. Hours"><input className={inputCls} type="number" value={d.hours} onChange={set('hours')} /></Field>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Field label="XP Reward"><input className={inputCls} type="number" value={d.xp_reward} onChange={set('xp_reward')} /></Field>
        <Field label="Coin Reward"><input className={inputCls} type="number" value={d.coin_reward} onChange={set('coin_reward')} /></Field>
        <Field label="Min XP to unlock"><input className={inputCls} type="number" value={d.min_xp} onChange={set('min_xp')} /></Field>
      </div>
      <Field label="Preview BG (CSS gradient)">
        <input className={inputCls} value={d.preview_bg} onChange={set('preview_bg')} placeholder="linear-gradient(135deg,#667eea,#764ba2)" />
        <div className="h-4 rounded mt-1" style={{ background: d.preview_bg }} />
      </Field>
      <Field label="Tech Stack (JSON array)">
        <input className={inputCls} value={d.tech_stack} onChange={set('tech_stack')} placeholder='["HTML","CSS","JS"]' />
      </Field>
      <Field label="Stack Colors (JSON array)">
        <input className={inputCls} value={d.stack_colors} onChange={set('stack_colors')} placeholder='["#E34C26","#264DE4","#F7DF1E"]' />
      </Field>
      <Field label="Steps (JSON) *">
        <textarea className={textareaCls + ' min-h-[180px] font-mono text-xs'} value={d.steps}
          onChange={e => { setD(p => ({ ...p, steps: e.target.value })); validateSteps(e.target.value); }} />
        {stepsErr && <p className="text-red-500 text-xs mt-1">⚠ {stepsErr}</p>}
        <p className="text-xs text-[var(--text-muted)] mt-1">Array of: {`{ "id": "s1", "title": "", "desc": "", "hint": "" }`}</p>
      </Field>
      <Field label="Resources (JSON)">
        <textarea className={textareaCls + ' font-mono text-xs'} value={d.resources} onChange={set('resources')} />
        <p className="text-xs text-[var(--text-muted)] mt-1">Array of: {`{ "label": "MDN", "url": "https://..." }`}</p>
      </Field>
      <Field label="Order"><input className={inputCls} type="number" value={d.order} onChange={set('order')} /></Field>
      <div className="flex gap-3 pt-2">
        <button onClick={onClose} className="flex-1 border border-[var(--border)] rounded-xl py-2.5 text-sm font-semibold hover:bg-[var(--surface)] transition-all">Cancel</button>
        <button onClick={save} disabled={saving || !!stepsErr}
          className="flex-1 bg-[#58CC02] hover:bg-[#45A301] disabled:opacity-60 text-white rounded-xl py-2.5 text-sm font-bold transition-all flex items-center justify-center gap-2">
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {initial ? 'Save Changes' : 'Create (Private)'}
        </button>
      </div>
    </div>
  );
}