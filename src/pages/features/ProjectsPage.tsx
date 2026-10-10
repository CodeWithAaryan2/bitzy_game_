import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Clock, Zap, ChevronRight,
  ExternalLink, Lock, ArrowLeft, Trophy, Loader2, UploadCloud,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { useProjects } from '@/hooks/useDB';
import WatchAdButton from '@/components/WatchAdButton';
import { AD_UNITS } from '@/lib/ads';

const W = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
const I = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const STORAGE_KEY = 'bitzy_project_progress_v2';
const PROOF_KEY = 'bitzy_project_proof_v1';

function loadProgress(): Record<string, string[]> {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}'); } catch { return {}; }
}
function saveProgress(d: Record<string, string[]>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(d));
}

// proof = { link?: string, fileName?: string, fileDataUrl?: string, note?: string }
type Proof = { link?: string; fileName?: string; fileDataUrl?: string; note?: string };

function loadProof(): Record<string, Proof> {
  try { return JSON.parse(localStorage.getItem(PROOF_KEY) ?? '{}'); } catch { return {}; }
}
function saveProof(d: Record<string, Proof>) {
  localStorage.setItem(PROOF_KEY, JSON.stringify(d));
}

// ── Proof Submission Panel ────────────────────────────────────
function ProofPanel({ project, proof, onSaveProof }: {
  project: any;
  proof: Proof | undefined;
  onSaveProof: (p: Proof) => void;
}) {
  const [link, setLink] = useState(proof?.link ?? '');
  const [note, setNote] = useState(proof?.note ?? '');
  const [fileName, setFileName] = useState(proof?.fileName ?? '');
  const [fileDataUrl, setFileDataUrl] = useState(proof?.fileDataUrl ?? '');
  const [saved, setSaved] = useState(!!proof?.link || !!proof?.fileDataUrl);

  const hasProof = link.trim().length > 0 || fileDataUrl.length > 0;

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // 5MB cap to keep localStorage sane
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large — please upload something under 5MB (e.g. a screenshot).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setFileName(file.name);
      setFileDataUrl(reader.result as string);
      setSaved(false);
    };
    reader.readAsDataURL(file);
  };

  const submit = () => {
    if (!hasProof) return;
    onSaveProof({ link: link.trim(), note: note.trim(), fileName, fileDataUrl });
    setSaved(true);
  };

  return (
    <div className="d-card !p-4" style={{ borderColor: saved ? '#58CC02' : project.difficulty_color }}>
      <div className="flex items-center gap-2 mb-2">
        <UploadCloud className="w-4 h-4" style={{ color: project.difficulty_color }} />
        <p className="font-bold text-sm">Submit proof of completion</p>
      </div>
      <p className="text-xs mb-3" style={{ color: 'var(--text-muted)' }}>
        Before you can claim your reward, show us what you built — a live link, a repo, or a screenshot.
      </p>

      <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Link (GitHub, deployed site, CodeSandbox, etc.)
      </label>
      <input
        type="url"
        value={link}
        onChange={(e) => { setLink(e.target.value); setSaved(false); }}
        placeholder="https://github.com/you/your-project"
        className="w-full mt-1 mb-3 px-3 py-2 rounded-xl text-xs border-2"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      />

      <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Or upload a screenshot / file
      </label>
      <div className="mt-1 mb-3">
        <input
          id={`proof-file-${project.slug}`}
          type="file"
          accept="image/*,.pdf"
          onChange={handleFile}
          className="hidden"
        />
        <label
          htmlFor={`proof-file-${project.slug}`}
          className="flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold cursor-pointer border-2 border-dashed"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          <UploadCloud className="w-3.5 h-3.5" />
          {fileName ? fileName : 'Choose a file'}
        </label>
      </div>

      <label className="text-[10px] font-bold uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
        Notes (optional)
      </label>
      <textarea
        value={note}
        onChange={(e) => { setNote(e.target.value); setSaved(false); }}
        placeholder="Anything you want us to know about your submission"
        rows={2}
        className="w-full mt-1 mb-3 px-3 py-2 rounded-xl text-xs border-2 resize-none"
        style={{ borderColor: 'var(--border)', backgroundColor: 'var(--surface)' }}
      />

      <button
        onClick={submit}
        disabled={!hasProof}
        className="w-full py-2.5 rounded-2xl text-xs font-bold text-white disabled:opacity-40"
        style={{ backgroundColor: project.difficulty_color, boxShadow: `0 3px 0 ${project.difficulty_color}80` }}
      >
        {saved ? '✓ Proof submitted' : 'Submit proof'}
      </button>
    </div>
  );
}

// ── Project Workspace ─────────────────────────────────────────
function ProjectWorkspace({ project, progress, proof, onStepToggle, onSaveProof, onComplete, onBack }: {
  project: any; progress: string[]; proof: Proof | undefined;
  onStepToggle: (id: string) => void;
  onSaveProof: (p: Proof) => void;
  onComplete: () => void;
  onBack: () => void;
}) {
  const [activeHint, setActiveHint] = useState<string | null>(null);
  const done = project.steps.length > 0 && project.steps.every((s: any) => progress.includes(s.id));
  const pct  = project.steps.length ? Math.round((progress.length / project.steps.length) * 100) : 0;
  const hasProof = !!(proof?.link || proof?.fileDataUrl);

  return (
    <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: 'var(--surface)' }}>
          <ArrowLeft className="w-4 h-4"/>
        </button>
        <div className="flex-1">
          <h2 className="font-display font-bold text-lg">{project.emoji} {project.title}</h2>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{project.category} · {project.hours}h est.</p>
        </div>
      </div>

      <div className="d-card !p-4">
        <div className="flex justify-between text-xs font-bold mb-2">
          <span>Progress</span>
          <span style={{ color: project.difficulty_color }}>{progress.length}/{project.steps.length} steps</span>
        </div>
        <div className="d-progress h-3 rounded-full overflow-hidden">
          <motion.div className="d-progress-fill h-full rounded-full"
            style={{ backgroundColor: project.difficulty_color }}
            animate={{ width: `${pct}%` }} transition={{ type: 'spring', stiffness: 200, damping: 22 }}/>
        </div>
        <div className="flex justify-between mt-2 text-[10px]" style={{ color: 'var(--text-muted)' }}>
          <span>🏆 {project.xp_reward} XP on completion</span>
          <span>💎 {project.coin_reward} coins</span>
        </div>
      </div>

      <div className="space-y-3">
        {project.steps.map((step: any, i: number) => {
          const completed = progress.includes(step.id);
          const isNext    = !completed && progress.length === i;
          const locked    = !completed && progress.length < i;
          return (
            <motion.div key={step.id} layout className="d-card overflow-hidden"
              style={{ borderColor: completed ? project.difficulty_color : isNext ? project.difficulty_color + '60' : 'var(--border)', opacity: locked ? 0.5 : 1 }}>
              <div className="p-4">
                <div className="flex items-start gap-3">
                  <button onClick={() => !locked && onStepToggle(step.id)} disabled={locked}
                    className="flex-shrink-0 mt-0.5 transition-transform active:scale-90">
                    {completed
                      ? <CheckCircle2 className="w-6 h-6" style={{ color: project.difficulty_color }}/>
                      : <Circle className="w-6 h-6" style={{ color: isNext ? project.difficulty_color : 'var(--border)' }}/>}
                  </button>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-lg"
                        style={{ backgroundColor: project.difficulty_color + '20', color: project.difficulty_color }}>
                        Step {i + 1}
                      </span>
                      {isNext  && <span className="text-[10px] font-bold text-green-500">← Do this next</span>}
                      {locked  && <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>🔒 Complete previous first</span>}
                    </div>
                    <p className="font-bold text-sm mt-1">{step.title}</p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{step.desc}</p>
                    {!locked && step.hint && (
                      activeHint === step.id ? (
                        <button onClick={() => setActiveHint(null)}
                          className="text-[10px] font-bold mt-2" style={{ color: '#1CB0F6' }}>
                          ▲ Hide hint
                        </button>
                      ) : (
                        <WatchAdButton
                          adUnitId={AD_UNITS.hint}
                          label="💡 Show hint"
                          onReward={() => setActiveHint(step.id)}
                          className="text-[10px] font-bold mt-2"
                          style={{ color: '#1CB0F6' }}
                        />
                      )
                    )}
                    <AnimatePresence>
                      {activeHint === step.id && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                          <div className="mt-2 p-3 rounded-2xl text-xs" style={{ backgroundColor: 'rgba(28,176,246,0.10)', color: '#0C7AB8' }}>
                            💡 {step.hint}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {done && (
        <>
          <ProofPanel project={project} proof={proof} onSaveProof={onSaveProof} />

          <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            className="d-card text-center py-6"
            style={{
              borderColor: hasProof ? '#58CC02' : 'var(--border)',
              backgroundColor: hasProof ? 'rgba(88,204,2,0.12)' : 'var(--surface)',
            }}>
            <div className="text-4xl mb-2">{hasProof ? '🎉' : '⏳'}</div>
            <h3 className="font-display font-bold text-lg" style={{ color: hasProof ? '#58CC02' : 'var(--text-muted)' }}>
              {hasProof ? 'All steps done!' : 'Almost there!'}
            </h3>
            <p className="text-sm mt-1 mb-4" style={{ color: hasProof ? '#4A9E2E' : 'var(--text-muted)' }}>
              {hasProof ? 'Claim your XP reward now' : 'Submit proof above to unlock your reward'}
            </p>
            <button onClick={onComplete} disabled={!hasProof}
              className="d-btn d-btn-md d-btn-green mx-auto flex items-center gap-2 disabled:opacity-40">
              <Trophy className="w-4 h-4"/> Claim {project.xp_reward} XP + {project.coin_reward} 💎
            </button>
          </motion.div>
        </>
      )}

      {project.resources?.length > 0 && (
        <div className="d-card !p-4">
          <p className="font-bold text-sm mb-2">📚 Helpful Resources</p>
          <div className="space-y-1.5">
            {project.resources.map((r: any) => (
              <a key={r.url} href={r.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs font-bold py-2 px-3 rounded-xl"
                style={{ backgroundColor: 'var(--surface)', color: '#2B7FFF' }}>
                <ExternalLink className="w-3 h-3"/> {r.label}
              </a>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

// ── Project Card ──────────────────────────────────────────────
function ProjectCard({ project, userXP, progress, onOpen }: {
  project: any; userXP: number; progress: string[]; onOpen: () => void;
}) {
  const locked  = userXP < (project.min_xp ?? 0);
  const started = progress.length > 0;
  const done    = project.steps.length > 0 && progress.length === project.steps.length;
  const pct     = project.steps.length ? Math.round((progress.length / project.steps.length) * 100) : 0;

  return (
    <motion.div variants={I} className="d-card overflow-hidden"
      style={{ borderColor: done ? '#58CC02' : started ? project.difficulty_color + '50' : 'var(--border)', opacity: locked ? 0.65 : 1 }}>
      <div className="h-2" style={{ background: project.preview_bg }}/>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl flex-shrink-0">{project.emoji}</div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-display font-bold">{project.title}</h3>
              {done   && <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: '#58CC02' }}/>}
              {locked && <Lock className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--text-muted)' }}/>}
            </div>
            <p className="text-xs mb-2" style={{ color: 'var(--text-muted)' }}>{project.description}</p>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {(project.techStack ?? []).map((tech: string, i: number) => (
                <span key={tech} className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
                  style={{ backgroundColor: (project.stackColors?.[i] ?? '#888') + 'CC' }}>{tech}</span>
              ))}
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" style={{ color: 'var(--text-muted)' }}/>
                <span style={{ color: 'var(--text-muted)' }}>{project.hours}h</span>
              </span>
              <span className="flex items-center gap-1">
                <Zap className="w-3.5 h-3.5" style={{ color: '#FFC800' }}/>
                <span className="font-bold" style={{ color: '#FFC800' }}>{project.xp_reward} XP</span>
              </span>
              <span className="ml-auto font-bold text-[10px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: project.difficulty_color + '20', color: project.difficulty_color }}>
                {project.difficulty}
              </span>
            </div>
          </div>
        </div>

        {started && !done && (
          <div className="mt-3">
            <div className="flex justify-between text-[10px] mb-1 font-bold" style={{ color: 'var(--text-muted)' }}>
              <span>Progress</span><span style={{ color: project.difficulty_color }}>{pct}%</span>
            </div>
            <div className="d-progress h-1.5">
              <div className="d-progress-fill" style={{ width: `${pct}%`, backgroundColor: project.difficulty_color }}/>
            </div>
          </div>
        )}

        <div className="mt-3">
          {locked ? (
            <div className="py-2.5 rounded-2xl text-xs font-bold text-center" style={{ backgroundColor: 'var(--surface)', color: 'var(--text-muted)' }}>
              🔒 Need {project.min_xp} XP to unlock
            </div>
          ) : done ? (
            <button onClick={onOpen} className="w-full py-2.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-1"
              style={{ backgroundColor: 'rgba(88,204,2,0.12)', color: '#58CC02' }}>
              <CheckCircle2 className="w-3.5 h-3.5"/> Completed ✓
            </button>
          ) : (
            <button onClick={onOpen} className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-bold text-white"
              style={{ backgroundColor: project.difficulty_color, boxShadow: `0 3px 0 ${project.difficulty_color}80` }}>
              {started ? '▶ Continue Project' : '🚀 Start Project'} <ChevronRight className="w-3.5 h-3.5"/>
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────
export default function ProjectsPage() {
  const { profile } = useAuth();
  const { showXPPopup, addXP, addCoins } = useGame();
  const { data: projects, loading } = useProjects();
  const [filter, setFilter] = useState('All');
  const [openProject, setOpenProject] = useState<any>(null);
  const [progress, setProgress] = useState<Record<string, string[]>>(loadProgress);
  const [proofs, setProofs] = useState<Record<string, Proof>>(loadProof);
  const [completedIds, setCompletedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('bitzy_completed_projects') ?? '[]'); } catch { return []; }
  });

  const xp      = profile?.xp ?? 0;
  const list    = projects ?? [];
  const filters = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const filtered = list.filter((p: any) => filter === 'All' || p.difficulty === filter);

  const toggleStep = (project: any, stepId: string) => {
    setProgress(prev => {
      const cur  = prev[project.slug] ?? [];
      const next = cur.includes(stepId) ? cur.filter((s: string) => s !== stepId) : [...cur, stepId];
      const updated = { ...prev, [project.slug]: next };
      saveProgress(updated);
      return updated;
    });
  };

  const saveProjectProof = (project: any, p: Proof) => {
    setProofs(prev => {
      const updated = { ...prev, [project.slug]: p };
      saveProof(updated);
      return updated;
    });
  };

  const handleComplete = async (project: any) => {
    if (completedIds.includes(project.slug)) return;
    const proof = proofs[project.slug];
    const hasProof = !!(proof?.link || proof?.fileDataUrl);
    if (!hasProof) {
      // Guard: no reward without proof, even if UI is bypassed somehow.
      return;
    }
    const next = [...completedIds, project.slug];
    setCompletedIds(next);
    localStorage.setItem('bitzy_completed_projects', JSON.stringify(next));
    await addXP(project.xp_reward, `project_${project.slug}`);
    await addCoins(project.coin_reward);
    showXPPopup(project.xp_reward, 'xp', `🏆 Project complete! +${project.xp_reward} XP!`);
    setOpenProject(null);
  };

  const startedCount = list.filter((p: any) => (progress[p.slug]?.length ?? 0) > 0).length;
  const doneCount    = completedIds.length;

  if (openProject) {
    return (
      <AnimatePresence mode="wait">
        <ProjectWorkspace
          key={openProject.slug}
          project={openProject}
          progress={progress[openProject.slug] ?? []}
          proof={proofs[openProject.slug]}
          onStepToggle={(id) => toggleStep(openProject, id)}
          onSaveProof={(p) => saveProjectProof(openProject, p)}
          onComplete={() => handleComplete(openProject)}
          onBack={() => setOpenProject(null)}
        />
      </AnimatePresence>
    );
  }

  return (
    <motion.div variants={W} initial="hidden" animate="show" className="space-y-5">
      <motion.div variants={I}>
        <h1 className="font-display text-2xl font-bold mb-1">🛠️ Projects</h1>
        <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Build real projects · Earn XP · Grow your portfolio</p>
      </motion.div>

      <motion.div variants={I} className="d-card !p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="font-display font-bold text-sm">Your Progress</span>
          <span className="text-xs font-bold" style={{ color: '#FFC800' }}>{xp} XP</span>
        </div>
        <div className="flex gap-3">
          {[
            { label: 'Unlocked',    val: list.filter((p: any) => xp >= (p.min_xp ?? 0)).length, color: '#58CC02' },
            { label: 'In Progress', val: startedCount, color: '#1CB0F6' },
            { label: 'Completed',   val: doneCount,    color: '#CE82FF' },
          ].map(s => (
            <div key={s.label} className="flex-1 text-center p-2 rounded-2xl" style={{ backgroundColor: 'var(--surface)' }}>
              <div className="font-display font-bold text-lg" style={{ color: s.color }}>{s.val}</div>
              <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{s.label}</div>
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={I} className="flex gap-2 overflow-x-auto pb-1">
        {filters.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="flex-shrink-0 px-4 py-2 rounded-2xl border-2 text-xs font-bold transition-all"
            style={{ borderColor: filter === f ? '#58CC02' : 'var(--border)', backgroundColor: filter === f ? '#F0FFE5' : 'var(--white)', color: filter === f ? '#58CC02' : 'var(--text-muted)' }}>
            {f}
          </button>
        ))}
      </motion.div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" style={{ color: 'var(--text-muted)' }}/></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 d-card">
          <div className="text-4xl mb-3">🛠️</div>
          <p className="font-bold" style={{ color: 'var(--text-muted)' }}>No projects published yet.</p>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Admin can add projects from the Admin Panel.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((p: any) => (
            <ProjectCard key={p.id} project={p} userXP={xp}
              progress={progress[p.slug] ?? []}
              onOpen={() => setOpenProject(p)}/>
          ))}
        </div>
      )}
    </motion.div>
  );
}