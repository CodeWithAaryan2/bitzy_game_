import { useMemo, useState } from 'react';
import { Bug, Check, CircleHelp, LoaderCircle, ScanSearch, ShieldAlert, Sparkles } from 'lucide-react';
import { createAssessmentRequestId, detectCodeMistakes } from '@/ai/debugger';
import { trpc } from '@/providers/trpc';
import './coding-rpg.css';

const labels: Record<string, string> = { syntax: 'Syntax', loops: 'Loops', conditions: 'Conditions', indexing: 'Indexing', logic: 'Logic' };

export default function BugDetectivePage() {
  const utils = trpc.useUtils();
  const catalog = trpc.codingRpg.catalog.useQuery();
  const state = trpc.codingRpg.state.useQuery();
  const submit = trpc.codingRpg.submit.useMutation({ onSuccess: () => utils.codingRpg.state.invalidate() });
  const [code, setCode] = useState('for (let i = 0; i <= items.length; i++) {\n  console.log(items[i]);\n}');
  const [selectedId, setSelectedId] = useState('detective-loop');
  const [selectedAnswer, setSelectedAnswer] = useState('');
  const [freeAnswer, setFreeAnswer] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);
  const findings = useMemo(() => detectCodeMistakes(code), [code]);
  const allChallenges = catalog.data?.challenges ?? [];
  const detectiveChallenges = allChallenges.filter(item => item.id.startsWith('detective-') && !item.id.startsWith('detective-practice-'));
  const current = allChallenges.find(item => item.id === selectedId) ?? detectiveChallenges[0];
  const history = (state.data?.attempts ?? []).filter((item: any) => String(item.assessment_id).startsWith('detective-')).slice(0, 12);
  const historyName = (id: string) => allChallenges.find(item => item.id === id)?.title ?? id;

  const analyze = () => {
    if (findings[0]) {
      setSelectedId(findings[0].assessmentId); setSubmissionKey(null); submit.reset();
      setSelectedAnswer(''); setFreeAnswer(''); setHintsShown(0);
    }
  };
  const chooseChallenge = (id: string) => {
    setSelectedId(id); setSelectedAnswer(''); setFreeAnswer(''); setHintsShown(0); setSubmissionKey(null); submit.reset();
  };
  const startPractice = () => {
    if (!current) return;
    const practice = allChallenges.find(item => item.id === `detective-practice-${current.skillKey}`);
    if (practice) { setSelectedId(practice.id); setSelectedAnswer(''); setFreeAnswer(''); setHintsShown(0); setSubmissionKey(null); submit.reset(); }
  };
  const returnToAssessment = () => {
    if (!current) return;
    const assessment = detectiveChallenges.find(item => item.skillKey === current.skillKey);
    if (assessment) chooseChallenge(assessment.id);
  };
  const answer = current?.kind === 'choice' ? selectedAnswer : freeAnswer;
  const submitAnswer = async () => {
    if (!current || !answer.trim() || submit.isPending) return;
    try {
      const key = submissionKey ?? createAssessmentRequestId();
      setSubmissionKey(key);
      await submit.mutateAsync({ assessmentId: current.id, answer, hintsUsed: hintsShown, submissionKey: key });
      setSubmissionKey(null);
    } catch { /* error state is shown below */ }
  };

  return <div className="rpg-shell">
    <header>
      <div className="rpg-kicker"><Bug size={14} style={{ display: 'inline', verticalAlign: '-2px' }} /> AI training lab</div>
      <h1 className="rpg-title">Bug Detective</h1>
      <p className="rpg-subtitle">Paste a small snippet for fast, explainable checks, then practice the concept. The scanner uses bounded local rules; it never runs your code. Verified answers—not guesses—update your mastery.</p>
    </header>
    <div className="rpg-grid">
      <section className="rpg-card" aria-labelledby="scan-heading">
        <div className="rpg-between"><h2 id="scan-heading">Inspect a snippet</h2><span className="rpg-pill"><ShieldAlert size={14}/> No code execution</span></div>
        <label className="rpg-muted" htmlFor="bug-code">Paste JavaScript or TypeScript</label>
        <textarea id="bug-code" className="rpg-code" value={code} maxLength={12000} onChange={e => setCode(e.target.value)} spellCheck={false} />
        <div className="rpg-row" style={{ marginTop: 12 }}>
          <button className="rpg-btn cyan" onClick={analyze}><ScanSearch size={16}/> Analyze code</button>
          <button className="rpg-btn secondary" onClick={() => { setCode(''); setSelectedId('detective-loop'); }}>Clear</button>
          <span className="rpg-muted" style={{ fontSize: '.8rem' }}>{code.length}/12000</span>
        </div>
        {findings.length > 0 ? <div className="rpg-list" style={{ marginTop: 14 }}>
          {findings.map((finding, i) => <article className="rpg-note warn" key={`${finding.category}-${i}`}>
            <div className="rpg-between"><strong>{finding.title}</strong><span className="rpg-pill">Likely · line {finding.line}</span></div>
            <p>{finding.english}</p><p lang="hi">{finding.hinglish}</p>
            <button className="rpg-btn secondary" onClick={() => chooseChallenge(finding.assessmentId)}><Sparkles size={14}/> Practice this skill</button>
          </article>)}
        </div> : <div className="rpg-note" style={{ marginTop: 14 }}><CircleHelp size={16} style={{ display: 'inline', verticalAlign: '-3px' }}/> No supported pattern detected. This is not a proof that the code is bug-free; choose a topic and practice below.</div>}
      </section>
      <aside className="rpg-card">
        <h2>Verified mastery</h2>
        <p className="rpg-muted">Skills are counted only after the server validates an assessment.</p>
        <div className="rpg-stats" style={{ marginTop: 12 }}>
          <div className="rpg-stat"><strong>{state.data?.mastery?.length ?? '—'}</strong><span className="rpg-muted">assessed skills</span></div>
          <div className="rpg-stat"><strong>{history.length}</strong><span className="rpg-muted">detective attempts</span></div>
          <div className="rpg-stat"><strong>{state.data ? `${history.filter((a: any) => a.is_correct).length}/${history.length}` : '—'}</strong><span className="rpg-muted">correct / attempts</span></div>
        </div>
        <h3 style={{ marginTop: 22 }}>Choose a practice</h3>
        <div className="rpg-list" role="list">
          {detectiveChallenges.map(item => <button key={item.id} className={`rpg-choice ${item.id === current?.id ? 'selected' : ''}`} onClick={() => chooseChallenge(item.id)}>
            <span className="rpg-between"><strong>{item.title}</strong><span className="rpg-pill">{labels[item.skillKey] ?? item.skillKey}</span></span>
          </button>)}
        </div>
      </aside>
    </div>
    {catalog.error && <div role="alert" className="rpg-error" style={{ marginTop: 16 }}>Could not load assessment exercises: {catalog.error.message}</div>}
    {current && <section className="rpg-card" style={{ marginTop: 16 }}>
      <div className="rpg-between"><div><div className="rpg-kicker">Targeted exercise · {labels[current.skillKey] ?? current.skillKey}</div><h2 style={{ marginTop: 7 }}>{current.title}</h2></div><span className="rpg-pill">Assessment-backed</span></div>
      <p className="rpg-muted">{current.prompt}</p>
      {current.snippet && <pre className="rpg-code" style={{ minHeight: 'auto', whiteSpace: 'pre-wrap' }}>{current.snippet}</pre>}
      {current.id.startsWith('detective-practice-') && <button className="rpg-btn secondary" style={{ marginBottom: 12 }} onClick={returnToAssessment}>← Return to concept assessment</button>}
      {current.choices?.map(choice => <button key={choice.value} className={`rpg-choice ${selectedAnswer === choice.value ? 'selected' : ''}`} onClick={() => { if (selectedAnswer !== choice.value) { setSubmissionKey(null); submit.reset(); } setSelectedAnswer(choice.value); }}>{choice.label}</button>)}
      {!current.choices && <label className="rpg-muted">Your answer<textarea className="rpg-input" rows={3} value={freeAnswer} maxLength={1500} onChange={e => { if (freeAnswer !== e.target.value) { setSubmissionKey(null); submit.reset(); } setFreeAnswer(e.target.value); }} /></label>}
      <div className="rpg-row" style={{ margin: '12px 0' }}>
        <button className="rpg-btn secondary" onClick={() => setHintsShown(n => Math.min(3, n + 1))} disabled={hintsShown >= 3}>Show hint {Math.min(hintsShown + 1, 3)} of 3</button>
        <button className="rpg-btn" onClick={submitAnswer} disabled={!answer.trim() || submit.isPending}>{submit.isPending ? <><LoaderCircle size={15}/> Checking…</> : 'Check answer'}</button>
        {submit.data?.correct && <span className="rpg-tag good"><Check size={13}/> Verified</span>}
      </div>
      {hintsShown > 0 && <div className="rpg-note">{current.hints.slice(0, hintsShown).map((hint, i) => <p key={i}><strong>Hint {i + 1}:</strong> {hint}</p>)}</div>}
      {submit.error && <div role="alert" className="rpg-error">{submit.error.message}</div>}
      {submit.data && <div className={`rpg-note ${submit.data.correct ? 'success' : 'error'}`} role="status"><strong>{submit.data.correct ? (current.id.startsWith('detective-practice-') ? 'Practice verified' : 'Assessment verified') : 'Not quite yet'}</strong><p>{submit.data.explanation}</p><p lang="hi">{submit.data.hinglish}</p>{submit.data.correct && !current.id.startsWith('detective-practice-') && <><p className="rpg-muted">Next, try the separate targeted exercise. Its answer is independently validated and recorded.</p><button className="rpg-btn purple" onClick={startPractice}>Start validated practice</button></>}</div>}
    </section>}
    <section className="rpg-card" style={{ marginTop: 16 }}>
      <div className="rpg-between"><h2>Mistake & assessment history</h2><span className="rpg-pill">This account only</span></div>
      {state.isLoading ? <p className="rpg-muted">Loading your history…</p> : state.error ? <div className="rpg-error">Could not load history. {state.error.message}</div> : history.length === 0 ? <div className="rpg-empty">No detective attempts yet. Complete a verified exercise to start your history.</div> : history.map((item: any) => <div className="rpg-history" key={item.attempt_id}><span className={`rpg-tag ${item.is_correct ? 'good' : 'bad'}`}>{item.is_correct ? 'Correct' : 'Review'}</span><span>{historyName(item.assessment_id)} · {labels[item.skill_key] ?? item.skill_key}</span><time className="rpg-muted">{new Date(item.created_at).toLocaleDateString()}</time></div>)}
    </section>
  </div>;
}
