import { describe, expect, it } from 'vitest';
import { detectCodeMistakes } from '../src/ai/debugger';
import { codingRpgRouter, isCorrectAssessmentAnswer } from './coding-rpg-router';

describe('local coding RPG bug detector', () => {
  it('finds incomplete assignments without executing source', () => {
    expect(detectCodeMistakes('const total = ;')[0]?.category).toBe('syntax');
  });
  it('finds array loop boundary mistakes', () => {
    expect(detectCodeMistakes('for (let i=0; i <= items.length; i++) {}')[0]?.category).toBe('loops');
  });
  it('finds assignment used in a condition', () => {
    expect(detectCodeMistakes('if (score = 10) {}')[0]?.category).toBe('conditions');
  });
  it('finds a length used directly as an array index', () => {
    expect(detectCodeMistakes('const last = items[items.length];')[0]?.category).toBe('indexing');
  });
  it('finds a potential AND/OR mismatch', () => {
    expect(detectCodeMistakes('if (isMember && hasInvite) {}')[0]?.category).toBe('logic');
  });
  it('does not claim unsupported or empty code is correct', () => {
    expect(detectCodeMistakes('')).toEqual([]);
    expect(detectCodeMistakes('console.log("hello")')).toEqual([]);
  });
  it('does not flag a strict array loop as an off-by-one error', () => {
    expect(detectCodeMistakes('for (let i=0; i < items.length; i++) {}')).toEqual([]);
  });
});

describe('server-side assessment validation', () => {
  it('accepts the fixed prediction answer and rejects incorrect/unknown answers', () => {
    expect(isCorrectAssessmentAnswer('boss-apprentice-stage-1', '0, 1, 2')).toBe(true);
    expect(isCorrectAssessmentAnswer('boss-apprentice-stage-1', '0, 1, 2, 3')).toBe(false);
    expect(isCorrectAssessmentAnswer('not-a-real-assessment', '0, 1, 2')).toBe(false);
  });
  it('validates code by fixed normalized patterns and never evaluates it', () => {
    expect(isCorrectAssessmentAnswer('boss-apprentice-stage-3', 'i < items.length')).toBe(true);
    expect(isCorrectAssessmentAnswer('boss-apprentice-stage-3', 'while(true){}')).toBe(false);
  });
  it('validates each targeted practice against its own fixed answer', () => {
    expect(isCorrectAssessmentAnswer('detective-practice-syntax', '5')).toBe(true);
    expect(isCorrectAssessmentAnswer('detective-practice-loops', 'i < items.length')).toBe(true);
    expect(isCorrectAssessmentAnswer('detective-practice-conditions', '===')).toBe(true);
    expect(isCorrectAssessmentAnswer('detective-practice-indexing', 'items.length - 1')).toBe(true);
    expect(isCorrectAssessmentAnswer('detective-practice-logic', '||')).toBe(true);
    expect(isCorrectAssessmentAnswer('detective-practice-syntax', '23')).toBe(false);
  });
  it('rejects unauthenticated access to the assessment catalog', async () => {
    const caller = codingRpgRouter.createCaller({ req: new Request('http://localhost/api/trpc'), resHeaders: new Headers() });
    await expect(caller.catalog()).rejects.toMatchObject({ code: 'UNAUTHORIZED' });
  });
});
