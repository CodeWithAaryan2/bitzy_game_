export const GAME_CATALOG = [
  { id: 'quiz', title: 'Code Quiz', hasRecordedScore: true },
  { id: 'truthy', title: 'True or False', hasRecordedScore: true },
  { id: 'prediction', title: 'Code Prediction', hasRecordedScore: true },
  { id: 'bughunt', title: 'Bug Hunt', hasRecordedScore: true },
  { id: 'fillblank', title: 'Fill the Blank', hasRecordedScore: true },
  { id: 'typing', title: 'Speed Typing', hasRecordedScore: true },
  { id: 'codeorder', title: 'Code Order', hasRecordedScore: true },
  { id: 'coderace', title: 'Code Race', hasRecordedScore: false },
  { id: 'bugsquash', title: 'Bug Squash Arena', hasRecordedScore: false },
  { id: 'royale', title: 'Code Royale', hasRecordedScore: false },
  { id: 'dash', title: 'Code Dash', hasRecordedScore: false },
] as const;

export type GameId = typeof GAME_CATALOG[number]['id'];
export type QuestionAttempt = {
  game_name: string | null;
  question_id: string;
  is_correct: boolean;
  answered_at: string;
  lesson_id?: number | null;
};
export type GameProgressSnapshot = {
  game_name: string;
  current_level: number;
  current_score: number;
  highest_score: number;
  times_played: number;
  last_topic: string | null;
  updated_at: string;
};
export type GameMetric = {
  id: GameId;
  title: string;
  completedSessions: number;
  hasResumableSession: boolean;
  trackedSessions: number;
  answers: number;
  correct: number;
  incorrect: number;
  accuracy: number | null;
  bestScore: number | null;
  latestScore: number | null;
  lastPlayedAt: string | null;
  lastTopic: string | null;
};

export function buildGameMetrics(progress: GameProgressSnapshot[], attempts: QuestionAttempt[]): GameMetric[] {
  const progressByGame = new Map(progress.map(row => [row.game_name, row]));
  return GAME_CATALOG.map(game => {
    const saved = progressByGame.get(game.id);
    const answers = attempts.filter(row => row.game_name === game.id);
    const correct = answers.filter(row => row.is_correct).length;
    const incorrect = answers.length - correct;
    const hasResumableSession = Boolean(saved && saved.current_level > 0);
    const completedSessions = Math.max(0, Number(saved?.times_played ?? 0));
    return {
      id: game.id,
      title: game.title,
      completedSessions,
      hasResumableSession,
      trackedSessions: completedSessions + (hasResumableSession ? 1 : 0),
      answers: answers.length,
      correct,
      incorrect,
      accuracy: answers.length ? Math.round((correct / answers.length) * 100) : null,
      bestScore: saved && game.hasRecordedScore ? Number(saved.highest_score) : null,
      latestScore: saved && game.hasRecordedScore ? Number(saved.current_score) : null,
      lastPlayedAt: saved?.updated_at ?? null,
      lastTopic: saved?.last_topic ?? null,
    };
  });
}

export function buildLearningPriorities(metrics: GameMetric[]) {
  const needsImprovement = metrics
    .filter(metric => metric.answers >= 3 && metric.accuracy !== null && metric.accuracy < 60)
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100) || b.answers - a.answers);
  const doingWell = metrics
    .filter(metric => metric.answers >= 5 && metric.accuracy !== null && metric.accuracy >= 80)
    .sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0) || b.answers - a.answers);
  const needsPractice = metrics
    .filter(metric => metric.answers > 0 && !needsImprovement.includes(metric) && (metric.answers < 5 || (metric.accuracy ?? 100) < 80))
    .sort((a, b) => (a.accuracy ?? 100) - (b.accuracy ?? 100) || a.answers - b.answers);
  return { needsImprovement, needsPractice, doingWell };
}

export function buildDailyAnswerTrend(attempts: QuestionAttempt[], days = 14, now = new Date()) {
  const counts = new Map<string, { correct: number; incorrect: number }>();
  for (const attempt of attempts) {
    const date = new Date(attempt.answered_at);
    if (!Number.isFinite(date.getTime())) continue;
    const key = date.toISOString().slice(0, 10);
    const row = counts.get(key) ?? { correct: 0, incorrect: 0 };
    if (attempt.is_correct) row.correct += 1;
    else row.incorrect += 1;
    counts.set(key, row);
  }
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (days - index - 1));
    const key = date.toISOString().slice(0, 10);
    const row = counts.get(key) ?? { correct: 0, incorrect: 0 };
    const total = row.correct + row.incorrect;
    return { date: key, correct: row.correct, incorrect: row.incorrect, accuracy: total ? Math.round((row.correct / total) * 100) : null };
  });
}


export type PerformanceTrendPoint = {
  date: string;
  attempts: number;
  correct: number;
  incorrect: number;
  dailyAccuracy: number | null;
  rollingAccuracy: number | null;
};

/** A game-specific dated trend derived only from saved answer rows. */
export function buildGamePerformanceTrend(
  attempts: QuestionAttempt[],
  gameId: GameId | 'all',
  days = 30,
  now = new Date(),
): PerformanceTrendPoint[] {
  const counts = new Map<string, { correct: number; incorrect: number }>();
  for (const attempt of attempts) {
    if (gameId !== 'all' && attempt.game_name !== gameId) continue;
    if (gameId === 'all' && !GAME_CATALOG.some(game => game.id === attempt.game_name)) continue;
    const time = new Date(attempt.answered_at);
    if (!Number.isFinite(time.getTime())) continue;
    const date = time.toISOString().slice(0, 10);
    const row = counts.get(date) ?? { correct: 0, incorrect: 0 };
    if (attempt.is_correct) row.correct += 1;
    else row.incorrect += 1;
    counts.set(date, row);
  }

  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({ length: Math.max(1, days) }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (Math.max(1, days) - index - 1));
    const key = date.toISOString().slice(0, 10);
    const current = counts.get(key) ?? { correct: 0, incorrect: 0 };
    const attempts = current.correct + current.incorrect;
    let rollingCorrect = 0;
    let rollingAttempts = 0;
    for (let offset = 0; offset < 7; offset++) {
      const windowDay = new Date(date);
      windowDay.setUTCDate(date.getUTCDate() - offset);
      const sample = counts.get(windowDay.toISOString().slice(0, 10));
      if (sample) {
        rollingCorrect += sample.correct;
        rollingAttempts += sample.correct + sample.incorrect;
      }
    }
    return {
      date: key,
      attempts,
      correct: current.correct,
      incorrect: current.incorrect,
      dailyAccuracy: attempts ? Math.round(current.correct / attempts * 100) : null,
      // Suppress a volatile moving average until it has at least 3 real answers.
      rollingAccuracy: rollingAttempts >= 3 ? Math.round(rollingCorrect / rollingAttempts * 100) : null,
    };
  });
}


export type DatedAnswerCount = { date: string; attempts: number; correct: number; incorrect: number };

/** Builds daily and sample-gated rolling accuracy from daily aggregates (e.g. Tiger SQL output). */
export function buildGameTrendFromDailyCounts(
  rows: DatedAnswerCount[],
  days = 30,
  now = new Date(),
): PerformanceTrendPoint[] {
  const counts = new Map(rows.map(row => [row.date.slice(0, 10), {
    correct: Math.max(0, Number(row.correct) || 0),
    incorrect: Math.max(0, Number(row.incorrect) || 0),
  }]));
  const count = Math.max(1, days);
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - (count - index - 1));
    const key = date.toISOString().slice(0, 10);
    const current = counts.get(key) ?? { correct: 0, incorrect: 0 };
    const attempts = current.correct + current.incorrect;
    let rollingCorrect = 0;
    let rollingAttempts = 0;
    for (let offset = 0; offset < 7; offset++) {
      const windowDate = new Date(date);
      windowDate.setUTCDate(date.getUTCDate() - offset);
      const sample = counts.get(windowDate.toISOString().slice(0, 10));
      if (sample) {
        rollingCorrect += sample.correct;
        rollingAttempts += sample.correct + sample.incorrect;
      }
    }
    return {
      date: key,
      attempts,
      correct: current.correct,
      incorrect: current.incorrect,
      dailyAccuracy: attempts ? Math.round(current.correct / attempts * 100) : null,
      rollingAccuracy: rollingAttempts >= 3 ? Math.round(rollingCorrect / rollingAttempts * 100) : null,
    };
  });
}
