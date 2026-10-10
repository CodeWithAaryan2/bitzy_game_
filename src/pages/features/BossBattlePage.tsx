import { useMemo, useState } from 'react';
import { Check, ChevronRight, LoaderCircle, LockKeyhole, Swords, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useGame } from '@/context/GameContext';
import { createAssessmentRequestId } from '@/ai/debugger';
import { Link } from 'react-router-dom';
import { trpc } from '@/providers/trpc';
import './coding-rpg.css';

export default function BossBattlePage() {
  const utils = trpc.useUtils();
  const { refreshProfile } = useAuth();
  const { refreshGameState, showXPPopup } = useGame();
  const catalog = trpc.codingRpg.catalog.useQuery();
  const state = trpc.codingRpg.state.useQuery();
  const submit = trpc.codingRpg.submit.useMutation({ onSuccess: async result => { await utils.codingRpg.state.invalidate(); if (result.xpAwarded > 0 || result.coinsAwarded > 0) { await refreshProfile(); await refreshGameState(); if (result.xpAwarded > 0) showXPPopup(result.xpAwarded, 'xp', 'Logic Warden defeated!'); if (result.coinsAwarded > 0) showXPPopup(result.coinsAwarded, 'coin', 'Boss reward received!'); } } });
  const [stage, setStage] = useState(1);
  const [choice, setChoice] = useState('');
  const [code, setCode] = useState('');
  const [hintsShown, setHintsShown] = useState(0);
  const [submissionKey, setSubmissionKey] = useState<string | null>(null);
  const stages = useMemo(() => [1, 2, 3, 4].map(n => catalog.data?.challenges.find(item => item.id === `boss-apprentice-stage-${n}`)).filter(Boolean), [catalog.data]);
  const current: any = stages[stage - 1];
  const attempts = state.data?.attempts ?? [];
  const passed = (n: number) => attempts.some((a: any) => a.assessment_id === `boss-apprentice-stage-${n}` && a.is_correct);
  const unlocked = (n: number) => n === 1 ? Boolean(state.data?.mastery?.length) : passed(n - 1);
  const bossAttempts = attempts.filter((a: any) => String(a.assessment_id).startsWith('boss-apprentice-stage-'));
  const bossCorrect = bossAttempts.filter((a: any) => a.is_correct).length;
  const accuracy = bossAttempts.length ? Math.round(bossCorrect / bossAttempts.length * 100) : null;
  const answer = current?.kind === 'choice' ? choice : code;

  const changeStage = (value: number) => {
    if (!unlocked(value)) return;
    setStage(value); setChoice(''); setCode(''); setHintsShown(0); setSubmissionKey(null); submit.reset();
  };
  const check = async () => {
    if (!current || !answer.trim() || submit.isPending) return;
    try {
      const key = submissionKey ?? createAssessmentRequestId();
      setSubmissionKey(key);
      await submit.mutateAsync({ assessmentId: current.id, answer, hintsUsed: hintsShown, submissionKey: key });
      setSubmissionKey(null);
    } catch { /* displayed from mutation; preserve the key for a safe retry */ }
  };

  return <div className="rpg-shell">
    <header><div className="rpg-kicker"><Swords size={14} style={{ display: 'inline', verticalAlign: '-2px' }}/> Boss arena</div><h1 className="rpg-title">The Logic Warden</h1><p className="rpg-subtitle">Four verified stages: predict output, identify a bug, complete code, and solve the final challenge. Answers are checked against a fixed server-side rubric—submitted code is never executed.</p></header>
    <div className="rpg-stage" aria-label="Boss battle stages">{[1, 2, 3, 4].map(n => <button key={n} className={`${stage === n ? 'active' : ''} ${!unlocked(n) ? 'locked' : ''}`} onClick={() => changeStage(n)} disabled={!unlocked(n)} aria-current={stage === n ? 'step' : undefined}><span>{passed(n) ? '✓ ' : !unlocked(n) ? '🔒 ' : ''}Stage {n}</span></button>)}</div>
    <section className="rpg-card">
      {state.isLoading ? <div className="rpg-empty">Loading your verified progress…</div> : state.error ? <div role="alert" className="rpg-error">Your private boss progress could not be loaded: {state.error.message}</div> : !catalog.data && catalog.isLoading ? <div className="rpg-empty">Loading battle rules…</div> : catalog.error ? <div className="rpg-error">Could not load boss stages: {catalog.error.message}</div> : current && !unlocked(stage) ? <div className="rpg-empty"><LockKeyhole size={20} style={{ display: 'inline', verticalAlign: '-5px' }}/> Clear one Bug Detective assessment to unlock stage 1. <p><Link className="rpg-btn cyan" to="/app/bug-detective">Open Bug Detective</Link></p></div> : current ? <>
        <div className="rpg-between"><div><div className="rpg-kicker">{current.title}</div><h2>{stage === 4 ? 'Final challenge' : `Trial ${stage}`}</h2></div><span className={`rpg-tag ${passed(stage) ? 'good' : unlocked(stage) ? 'mid' : 'bad'}`}>{passed(stage) ? 'Stage passed' : 'One-time reward on boss clear'}</span></div>
        <p className="rpg-muted">{current.prompt}</p>
        {current.snippet && <pre className="rpg-code" style={{ minHeight: 'auto', whiteSpace: 'pre-wrap' }}>{current.snippet}</pre>}
        {current.choices?.map((item: any) => <button key={item.value} className={`rpg-choice ${choice === item.value ? 'selected' : ''}`} onClick={() => { if (choice !== item.value) { setSubmissionKey(null); submit.reset(); } setChoice(item.value); }}>{item.label}</button>)}
        {!current.choices && <label className="rpg-muted">Your code answer<textarea className="rpg-input" rows={4} maxLength={1500} value={code} onChange={e => { if (code !== e.target.value) { setSubmissionKey(null); submit.reset(); } setCode(e.target.value); }} placeholder="Enter the expression or code line…" /></label>}
        <div className="rpg-row" style={{ margin: '14px 0' }}><button className="rpg-btn secondary" disabled={hintsShown >= 3} onClick={() => setHintsShown(h => Math.min(3, h + 1))}>Hint {Math.min(hintsShown + 1, 3)} / 3</button><button className="rpg-btn" disabled={!answer.trim() || submit.isPending || passed(stage)} onClick={check}>{submit.isPending ? <><LoaderCircle size={15}/> Validating…</> : passed(stage) ? <><Check size={15}/> Passed</> : 'Submit stage'}</button>{stage < 4 && passed(stage) && <button className="rpg-btn cyan" onClick={() => changeStage(stage + 1)}>Next stage <ChevronRight size={16}/></button>}</div>
        {hintsShown > 0 && <div className="rpg-note">{current.hints.slice(0, hintsShown).map((hint: string, i: number) => <p key={i}><strong>Hint {i + 1}:</strong> {hint}</p>)}</div>}
        {submit.error && <div role="alert" className="rpg-error">{submit.error.message}</div>}
        {submit.data && <div className={`rpg-note ${submit.data.correct ? 'success' : 'error'}`} role="status"><strong>{submit.data.correct ? 'Stage verified' : 'Not yet—review the clue'}</strong><p>{submit.data.explanation}</p><p lang="hi">{submit.data.hinglish}</p>{submit.data.xpAwarded > 0 && <p><Trophy size={15} style={{ display: 'inline', verticalAlign: '-3px' }}/> Boss clear reward: <strong>+{submit.data.xpAwarded} XP</strong> and <strong>+{submit.data.coinsAwarded} coins</strong> (awarded once).</p>}{submit.data.correct && stage === 4 && <button className="rpg-btn purple" style={{ marginTop: 8 }} onClick={() => utils.codingRpg.state.invalidate()}>View verified results</button>}</div>}
      </> : <div className="rpg-empty">Boss stages are not available.</div>}
    </section>
    <div className="rpg-grid">
      <section className="rpg-card"><h2>Battle record</h2><div className="rpg-stats"><div className="rpg-stat"><strong>{bossAttempts.length}</strong><span className="rpg-muted">stage attempts</span></div><div className="rpg-stat"><strong>{accuracy === null ? '—' : `${accuracy}%`}</strong><span className="rpg-muted">accuracy</span></div><div className="rpg-stat"><strong>{[1,2,3,4].filter(passed).length}/4</strong><span className="rpg-muted">stages passed</span></div></div>
        {state.data?.bossComplete ? <div className="rpg-note success" style={{ marginTop: 12 }}><Trophy size={16} style={{ display: 'inline', verticalAlign: '-3px' }}/> Boss defeated. The completion reward is recorded and cannot be claimed again.</div> : !state.isLoading && bossAttempts.length === 0 ? <div className="rpg-note" style={{ marginTop: 12 }}>No attempts yet. Clear stages in order to open the final challenge.</div> : null}
      </section>
      <section className="rpg-card"><h2>Results</h2>{state.isLoading ? <p className="rpg-muted">Loading results…</p> : state.error ? <div className="rpg-error">Battle record unavailable: {state.error.message}</div> : <div className="rpg-list">{[1,2,3,4].map(n => { const s = attempts.filter((a: any) => a.assessment_id === `boss-apprentice-stage-${n}`); return <div className="rpg-history" key={n}><span className={`rpg-tag ${passed(n) ? 'good' : 'mid'}`}>{passed(n) ? 'Clear' : 'Pending'}</span><span>Stage {n} · {s.length} attempt{s.length === 1 ? '' : 's'}</span><span>{s.filter((a: any) => a.is_correct).length} correct</span></div>; })}</div>}</section>
    </div>
  </div>;
}
