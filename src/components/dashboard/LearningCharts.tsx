import { useEffect, useMemo, useState } from 'react';
import {
  Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer,
  Tooltip, XAxis, YAxis,
} from 'recharts';
import { Activity, CircleHelp, Gamepad2, Loader2 } from 'lucide-react';
import { buildGamePerformanceTrend, GAME_CATALOG, type GameId, type PerformanceTrendPoint, type QuestionAttempt } from '@/lib/learningAnalytics';
import { trpc } from '@/providers/trpc';

type ComparisonRow = { name: string; Correct: number; Incorrect: number };
const dateLabel = (value: string) => new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' }).format(new Date(`${value}T00:00:00Z`));
const axis = { fill: 'var(--text-muted)', fontSize: 10 };

function EmptyPanel({ title, detail }: { title: string; detail: string }) {
  return <div className="la-empty"><CircleHelp size={21}/><div><strong>{title}</strong><p>{detail}</p></div></div>;
}

function TrendTooltip({ active, payload, label }: any) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return <div style={{ padding: '9px 11px', border: '1px solid var(--border)', borderRadius: 10, background: 'var(--surface)', color: 'var(--text)', fontSize: 11, boxShadow: '0 8px 24px rgba(0,0,0,.12)' }}>
    <strong>{dateLabel(label)}</strong>
    <p style={{ margin: '4px 0' }}>{row.attempts} saved answers · {row.correct} correct · {row.incorrect} incorrect</p>
    <p style={{ margin: 0 }}>Daily accuracy: {row.dailyAccuracy === null ? '—' : `${row.dailyAccuracy}%`}</p>
    <p style={{ margin: '3px 0 0' }}>7-day accuracy: {row.rollingAccuracy === null ? 'Building (needs 3 answers)' : `${row.rollingAccuracy}%`}</p>
  </div>;
}

export default function LearningCharts({ comparison, attempts, loading }: {
  comparison: ComparisonRow[];
  attempts: QuestionAttempt[];
  loading: boolean;
}) {
  const [selectedGame, setSelectedGame] = useState<GameId | 'all'>('all');
  const fallbackTrend = useMemo(() => buildGamePerformanceTrend(attempts, selectedGame, 30), [attempts, selectedGame]);
  const [trend, setTrend] = useState<PerformanceTrendPoint[]>([]);
  const [trendSource, setTrendSource] = useState<'syncing' | 'tiger-cloud' | 'supabase'>('syncing');
  const { mutate: syncTrend } = trpc.tigerAnalytics.performanceTrend.useMutation();
  useEffect(() => {
    if (loading) { setTrendSource('syncing'); return; }
    let current = true;
    setTrend(fallbackTrend);
    setTrendSource('syncing');
    syncTrend({ gameId: selectedGame, days: 30 }, {
      onSuccess: result => {
        if (!current) return;
        setTrend(result.trend);
        setTrendSource('tiger-cloud');
      },
      onError: () => {
        if (!current) return;
        setTrend(fallbackTrend);
        setTrendSource('supabase');
      },
    });
    return () => { current = false; };
  }, [attempts, fallbackTrend, loading, selectedGame, syncTrend]);
  const activeDays = trend.filter(point => point.attempts > 0).length;
  const latestPoint = [...trend].reverse().find(point => point.attempts > 0);
  const gameName = selectedGame === 'all' ? 'All games' : GAME_CATALOG.find(game => game.id === selectedGame)?.title ?? 'Selected game';

  return <section className="la-chart-grid">
    <div className="d-card la-section">
      <div className="la-section-title"><div><p className="la-eyebrow">GAME COMPARISON</p><h2>Correct vs incorrect</h2></div><Gamepad2 size={21} style={{ color: 'var(--purple-dark)' }}/></div>
      {loading ? <div className="la-loading"><Loader2 className="animate-spin"/>Loading saved answers…</div> : !comparison.length ? <EmptyPanel title="Not enough answer data" detail="This comparison appears after games save answer outcomes. No accuracy bars are invented."/> : <div className="la-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={comparison} margin={{ top: 12, right: 10, bottom: 38, left: -18 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="name" angle={-24} textAnchor="end" interval={0} height={58} tick={axis}/><YAxis allowDecimals={false} tick={axis}/><Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, color: 'var(--text)' }}/><Bar dataKey="Correct" fill="var(--green)" radius={[5,5,0,0]}/><Bar dataKey="Incorrect" fill="var(--red)" radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></div>}
    </div>

    <div className="d-card la-section">
      <div className="la-section-title la-trend-heading">
        <div><p className="la-eyebrow">SAVED ANSWERS · LAST 30 DAYS</p><h2>Performance trend</h2><p className="la-muted la-small">{gameName}{latestPoint ? ` · latest ${latestPoint.dailyAccuracy}% from ${latestPoint.attempts} answers` : ' · no saved answers in this period'}</p></div>
        <Activity size={21} style={{ color: 'var(--blue-dark)' }}/>
      </div>
      <p className="la-data-source" data-source={trendSource} role="status">
        {trendSource === 'tiger-cloud' ? 'Trend source: Tiger Cloud' : trendSource === 'syncing' ? 'Syncing saved answers to Tiger Cloud…' : 'Tiger Cloud unavailable; showing Supabase history'}
      </p>
      <label className="la-trend-select-label" htmlFor="la-trend-game">Game</label>
      <select id="la-trend-game" className="la-trend-select" value={selectedGame} onChange={event => {
        const value = event.target.value;
        if (value === 'all' || GAME_CATALOG.some(game => game.id === value)) setSelectedGame(value as GameId | 'all');
      }}>
        <option value="all">All games combined</option>
        {GAME_CATALOG.map(game => <option key={game.id} value={game.id}>{game.title}</option>)}
      </select>
      {loading ? <div className="la-loading"><Loader2 className="animate-spin"/>Loading saved performance history…</div> : !activeDays ? <EmptyPanel title="No answer records in this range" detail="No saved outcomes for this game were recorded in the last 30 days. Session totals or best scores alone cannot reconstruct earlier daily accuracy."/> : <>
        {activeDays < 2 && <p className="la-trend-note">Trend is building. Daily accuracy is shown; compare across days after another day of saved answers.</p>}
        <div className="la-chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={trend} margin={{ top: 15, right: 10, bottom: 8, left: -14 }}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)"/><XAxis dataKey="date" tickFormatter={dateLabel} minTickGap={25} tick={axis}/><YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tickFormatter={value => `${value}%`} tick={axis}/><Tooltip content={<TrendTooltip/>}/><Line type="monotone" dataKey="dailyAccuracy" name="Daily accuracy" stroke="var(--blue-dark)" strokeWidth={1.7} dot={{ r: 3, fill: 'var(--blue-dark)' }} connectNulls={false}/><Line type="monotone" dataKey="rollingAccuracy" name="7-day rolling accuracy (3+ answers)" stroke="var(--purple-dark)" strokeWidth={2.5} dot={false} connectNulls={false}/></LineChart></ResponsiveContainer></div>
        <p className="la-trend-legend"><span><i style={{ background: 'var(--blue-dark)' }}/> Daily accuracy</span><span><i style={{ background: 'var(--purple-dark)' }}/> Weighted 7-day accuracy (only shown with 3+ saved answers)</span></p>
      </>}
    </div>
  </section>;
}
