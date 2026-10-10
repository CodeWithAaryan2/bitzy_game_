import { useMemo } from 'react';
import { Activity, BrainCircuit, Compass, ShieldCheck, Sparkles } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import './coding-rpg.css';

const SKILLS = [
  { key: 'syntax', title: 'Syntax & expressions', advice: 'Practice completing assignments and reading parser-level errors.' },
  { key: 'loops', title: 'Loops & boundaries', advice: 'Trace loop start, stopping condition, and final iteration.' },
  { key: 'conditions', title: 'Conditions', advice: 'Distinguish assignment from comparison and test both branches.' },
  { key: 'indexing', title: 'Indexing', advice: 'Write out valid indexes for arrays of lengths 0, 1, and 3.' },
  { key: 'logic', title: 'Boolean logic', advice: 'Use truth tables to compare AND, OR, and NOT.' },
];

export default function DeveloperDNAPage() {
  const { data, isLoading, error } = trpc.codingRpg.state.useQuery();
  const summary = useMemo(() => {
    const attempts = data?.attempts ?? [];
    const mastery = new Map((data?.mastery ?? []).map((m: any) => [m.skill_key, m]));
    const perSkill = new Map<string, { correct: number; total: number }>();
    for (const item of attempts) {
      const entry = perSkill.get(item.skill_key) ?? { correct: 0, total: 0 };
      entry.total += 1;
      if (item.is_correct) entry.correct += 1;
      perSkill.set(item.skill_key, entry);
    }
    const assessed = SKILLS.filter(skill => mastery.has(skill.key));
    const strength = [...assessed].sort((a, b) => Number((mastery.get(b.key) as any)?.verified_assessments ?? 0) - Number((mastery.get(a.key) as any)?.verified_assessments ?? 0))[0];
    const recentAssessed = assessed.filter(skill => (perSkill.get(skill.key)?.total ?? 0) > 0);
    const weakness = [...recentAssessed].sort((a, b) => {
      const aa = perSkill.get(a.key) ?? { correct: 0, total: 0 };
      const bb = perSkill.get(b.key) ?? { correct: 0, total: 0 };
      return (aa.total ? aa.correct / aa.total : 1) - (bb.total ? bb.correct / bb.total : 1);
    })[0];
    const recommendations = SKILLS.filter(s => !mastery.has(s.key)).slice(0, 2);
    if (weakness && !recommendations.some(s => s.key === weakness.key)) recommendations.push(weakness);
    return { attempts, mastery, perSkill, assessed, strength, weakness, recommendations };
  }, [data]);

  return <div className="rpg-shell">
    <header><div className="rpg-kicker"><BrainCircuit size={14} style={{ display: 'inline', verticalAlign: '-2px' }}/> Learning profile</div><h1 className="rpg-title">Developer DNA</h1><p className="rpg-subtitle">A transparent snapshot from verified Bitzy assessments. Unassessed means there is not enough evidence yet—not a zero score.</p></header>
    {isLoading ? <div className="rpg-empty" style={{ marginTop: 20 }}>Loading verified learning data…</div> : error ? <div className="rpg-error" style={{ marginTop: 20 }}>Could not load Developer DNA: {error.message}</div> : <>
      <section className="rpg-stats" style={{ marginTop: 22 }}>
        <div className="rpg-stat"><strong>{summary.assessed.length}/{SKILLS.length}</strong><span className="rpg-muted">skills assessed</span></div>
        <div className="rpg-stat"><strong>{summary.attempts.length}</strong><span className="rpg-muted">attempts in recent history</span></div>
        <div className="rpg-stat"><strong>{data?.bossComplete ? 'Cleared' : 'In progress'}</strong><span className="rpg-muted">Apprentice boss</span></div>
      </section>
      <div className="rpg-grid">
        <section className="rpg-card"><div className="rpg-between"><h2>Supported skills</h2><span className="rpg-pill"><ShieldCheck size={14}/> Verified only</span></div>
          <div className="rpg-list">{SKILLS.map(skill => {
            const mastery: any = summary.mastery.get(skill.key);
            const record = summary.perSkill.get(skill.key) ?? { correct: 0, total: 0 };
            return <article className="rpg-card" key={skill.key} style={{ padding: 13 }}>
              <div className="rpg-between"><strong>{skill.title}</strong><span className={`rpg-tag ${mastery ? 'good' : 'mid'}`}>{mastery ? 'Assessed' : 'Unassessed'}</span></div>
              {mastery ? <><p className="rpg-muted">{Number(mastery.verified_assessments)} distinct verified assessment{Number(mastery.verified_assessments) === 1 ? '' : 's'}{record.total ? ` · ${record.correct}/${record.total} correct attempts in recent history` : ' · no attempts for this skill in recent history'}</p>{record.total > 0 && <div className="rpg-meter" aria-label={`${skill.title} observed answer accuracy`}><span style={{ width: `${Math.round(record.correct / record.total * 100)}%` }}/></div>}</> : <p className="rpg-muted">No verified assessment recorded yet. No mastery score assigned.</p>}
            </article>;
          })}</div>
        </section>
        <aside className="rpg-card"><h2><Activity size={17} style={{ display: 'inline', verticalAlign: '-3px' }}/> Your signals</h2>
          {summary.strength ? <div className="rpg-note success"><strong>Practice strength</strong><p>{summary.strength.title}: most verified successful assessments recorded so far. This is an activity signal, not a skill rating.</p></div> : <div className="rpg-note">Strengths appear after your first verified assessment.</div>}
          {summary.weakness ? <div className="rpg-note warn"><strong>Review opportunity</strong><p>{summary.weakness.title}: revisit this topic based on recorded attempts.</p></div> : <div className="rpg-note">No assessed weak spot yet. We will not infer one from missing data.</div>}
          <h3 style={{ marginTop: 18 }}><Compass size={16} style={{ display: 'inline', verticalAlign: '-3px' }}/> Recommended next</h3>
          {summary.recommendations.length ? summary.recommendations.map(skill => <div className="rpg-note" key={skill.key}><strong>{skill.title}</strong><p>{skill.advice}</p></div>) : <div className="rpg-note"><Sparkles size={15} style={{ display: 'inline', verticalAlign: '-3px' }}/> All supported skills have at least one verified assessment. Keep practicing to deepen evidence.</div>}
        </aside>
      </div>
      <section className="rpg-card" style={{ marginTop: 16 }}><div className="rpg-between"><h2>Assessment history</h2><span className="rpg-pill">Most recent 200</span></div>
        {summary.attempts.length ? summary.attempts.slice(0, 24).map((item: any) => <div className="rpg-history" key={item.attempt_id}><span className={`rpg-tag ${item.is_correct ? 'good' : 'bad'}`}>{item.is_correct ? 'Verified' : 'Try again'}</span><span>{SKILLS.find(s => s.key === item.skill_key)?.title ?? item.skill_key} · {item.assessment_id.startsWith('boss-') ? `Boss stage ${item.assessment_id.slice(-1)}` : 'Bug Detective'} · {item.hints_used} hints</span><time className="rpg-muted">{new Date(item.created_at).toLocaleDateString()}</time></div>) : <div className="rpg-empty">Your assessment history will appear here after your first submission.</div>}
      </section>
    </>}
  </div>;
}
