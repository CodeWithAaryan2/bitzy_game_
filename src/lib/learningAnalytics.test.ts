import { describe, expect, it } from 'vitest';
import { buildDailyAnswerTrend, buildGameMetrics, buildGamePerformanceTrend, buildGameTrendFromDailyCounts, buildLearningPriorities, type QuestionAttempt } from './learningAnalytics';

const attempt = (game_name: string, is_correct: boolean, question_id: string, answered_at = '2026-10-08T10:00:00.000Z'): QuestionAttempt => ({ game_name, is_correct, question_id, answered_at });

describe('learning analytics', () => {
  it('derives accuracy and sessions only from recorded rows', () => {
    const metrics = buildGameMetrics([
      { game_name: 'quiz', current_level: 2, current_score: 30, highest_score: 50, times_played: 2, last_topic: 'JavaScript', updated_at: '2026-10-08T10:00:00.000Z' },
    ], [attempt('quiz', true, 'q1'), attempt('quiz', false, 'q2')]);
    expect(metrics.find(row => row.id === 'quiz')).toMatchObject({ trackedSessions: 3, completedSessions: 2, hasResumableSession: true, answers: 2, correct: 1, incorrect: 1, accuracy: 50, bestScore: 50 });
    expect(metrics.find(row => row.id === 'truthy')?.accuracy).toBeNull();
  });

  it('requires evidence before assigning improvement/strength labels', () => {
    const metrics = buildGameMetrics([], [attempt('quiz', false, 'q1'), attempt('quiz', false, 'q2')]);
    const priorities = buildLearningPriorities(metrics);
    expect(priorities.needsImprovement).toHaveLength(0);
    expect(priorities.doingWell).toHaveLength(0);
    expect(priorities.needsPractice.map(row => row.id)).toContain('quiz');
  });

  it('calculates the daily trend from dated answer events', () => {
    const rows = [attempt('quiz', true, 'q1', '2026-10-08T10:00:00.000Z'), attempt('quiz', false, 'q2', '2026-10-08T12:00:00.000Z')];
    const trend = buildDailyAnswerTrend(rows, 2, new Date('2026-10-08T18:00:00.000Z'));
    expect(trend[1]).toMatchObject({ date: '2026-10-08', correct: 1, incorrect: 1, accuracy: 50 });
  });

  it('calculates a selected game trend and a sample-gated 7-day accuracy', () => {
    const rows = [
      attempt('quiz', true, 'q1', '2026-10-08T10:00:00.000Z'),
      attempt('quiz', false, 'q2', '2026-10-08T12:00:00.000Z'),
      attempt('truthy', true, 'q3', '2026-10-08T14:00:00.000Z'),
      attempt('quiz', true, 'q4', '2026-10-09T10:00:00.000Z'),
    ];
    const trend = buildGamePerformanceTrend(rows, 'quiz', 3, new Date('2026-10-09T18:00:00.000Z'));
    expect(trend[1]).toMatchObject({ date: '2026-10-08', attempts: 2, correct: 1, incorrect: 1, dailyAccuracy: 50, rollingAccuracy: null });
    expect(trend[2]).toMatchObject({ date: '2026-10-09', attempts: 1, dailyAccuracy: 100, rollingAccuracy: 67 });
  });

  it('builds a trend from Tiger daily aggregates without requiring raw answers in the browser', () => {
    const trend = buildGameTrendFromDailyCounts([
      { date: '2026-10-08', attempts: 2, correct: 1, incorrect: 1 },
      { date: '2026-10-09', attempts: 1, correct: 1, incorrect: 0 },
    ], 2, new Date('2026-10-09T18:00:00.000Z'));
    expect(trend[0]).toMatchObject({ date: '2026-10-08', attempts: 2, dailyAccuracy: 50, rollingAccuracy: null });
    expect(trend[1]).toMatchObject({ date: '2026-10-09', attempts: 1, dailyAccuracy: 100, rollingAccuracy: 67 });
  });
});
