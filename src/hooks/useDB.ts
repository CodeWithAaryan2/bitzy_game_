/**
 * src/hooks/useDB.ts
 * React hooks for all DB data — replaces static data imports across pages.
 */
import { useState, useEffect } from 'react';
import {
  fetchCourses, fetchCourseBySlug, fetchLessonBySlug,
  fetchQuizByLessonId, fetchQuizById,
  fetchChallenges, fetchChallengeBySlug, fetchChallengeSolveCounts,
  fetchGameLevels, fetchGameLevelsByTopic,
} from '@/lib/db';

function useAsync<T>(fn: () => Promise<T>, deps: any[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fn().then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    }).catch(e => {
      if (!cancelled) { setError(e.message); setLoading(false); }
    });
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, loading, error };
}

export function useCourses() {
  return useAsync(fetchCourses, []);
}

export function useCourse(slug: string) {
  return useAsync(() => fetchCourseBySlug(slug), [slug]);
}

export function useLesson(courseSlug: string, lessonSlug: string) {
  return useAsync(() => fetchLessonBySlug(courseSlug, lessonSlug), [courseSlug, lessonSlug]);
}

export function useQuizByLesson(lessonId: number | null) {
  return useAsync(
    () => lessonId ? fetchQuizByLessonId(lessonId) : Promise.resolve(null),
    [lessonId],
  );
}

export function useQuiz(id: number | null) {
  return useAsync(
    () => id ? fetchQuizById(id) : Promise.resolve(null),
    [id],
  );
}

export function useChallenges() {
  return useAsync(fetchChallenges, []);
}

export function useChallengeSolveCounts() {
  return useAsync(fetchChallengeSolveCounts, []);
}

export function useChallenge(slug: string) {
  return useAsync(() => fetchChallengeBySlug(slug), [slug]);
}

export function useGameLevels(gameType?: string) {
  return useAsync(() => fetchGameLevels(gameType), [gameType]);
}

export function useGameLevelsByTopic(topic: string, gameType: string) {
  return useAsync(() => fetchGameLevelsByTopic(topic, gameType), [topic, gameType]);
}

import { fetchProjects } from '@/lib/db';
export function useProjects() {
  return useAsync(fetchProjects, []);
}