/**
 * src/lib/db.ts
 * Single source of truth for all DB reads.
 * Replaces: src/data/courses.ts, challenges.ts, quizzes.ts,
 *           gameData.ts, gameDataExtended.ts, codeOrderData.ts
 */
import { supabase } from '@/lib/supabase';

// ─── COURSES ─────────────────────────────────────────────────
export async function fetchCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_published', true)
    .order('id', { ascending: true });
  if (error) throw error;
  return data ?? [];
}

export async function fetchCourseBySlug(slug: string) {
  const { data: course, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error || !course) return null;

  const [{ data: modules }, { data: lessons }] = await Promise.all([
    supabase.from('course_modules').select('*').eq('course_id', course.id).order('order', { ascending: true }),
    supabase.from('course_lessons').select('*').eq('course_id', course.id).eq('is_published', true).order('order', { ascending: true }),
  ]);

  // Nest lessons under modules
  const modulesWithLessons = (modules ?? []).map((m: any) => ({
    ...m,
    lessons: (lessons ?? []).filter((l: any) => l.module_id === m.id),
  }));

  return { ...course, modules: modulesWithLessons };
}

export async function fetchLessonBySlug(courseSlug: string, lessonSlug: string) {
  const course = await fetchCourseBySlug(courseSlug);
  if (!course) return null;

  const lesson = course.modules
    .flatMap((m: any) => m.lessons)
    .find((l: any) => l.slug === lessonSlug);
  if (!lesson) return null;

  const mod = course.modules.find((m: any) => m.id === lesson.module_id);
  const allLessons = course.modules.flatMap((m: any) => m.lessons);
  const idx = allLessons.findIndex((l: any) => l.slug === lessonSlug);

  return {
    lesson,
    module: mod ?? null,
    course,
    prevLesson: idx > 0 ? allLessons[idx - 1] : null,
    nextLesson: idx < allLessons.length - 1 ? allLessons[idx + 1] : null,
    totalLessons: allLessons.length,
  };
}

// ─── QUIZZES ─────────────────────────────────────────────────
export async function fetchQuizByLessonId(lessonId: number) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('lesson_id', lessonId)
    .eq('is_published', true)
    .single();
  if (error) return null;
  return data ? { ...data, questions: JSON.parse(data.questions ?? '[]') } : null;
}

export async function fetchQuizById(id: number) {
  const { data, error } = await supabase
    .from('quizzes')
    .select('*')
    .eq('id', id)
    .eq('is_published', true)
    .single();
  if (error) return null;
  return data ? { ...data, questions: JSON.parse(data.questions ?? '[]') } : null;
}

// ─── CHALLENGES ──────────────────────────────────────────────
export async function fetchChallenges() {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('is_published', true)
    .order('id', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((c: any) => ({
    ...c,
    test_cases: JSON.parse(c.test_cases ?? '[]'),
    hints: c.hints ? c.hints.split('\n').filter(Boolean).map((h: string, i: number) => ({ order: i + 1, text: h })) : [],
    starter_code: c.starter_code ? { javascript: c.starter_code, python: '# Write your solution here\n', typescript: c.starter_code } : { javascript: '// Write your solution here\n', python: '# Write your solution here\n', typescript: '// Write your solution here\n' },
  }));
}

// Real solve counts per challenge — counted live from accepted submissions,
// never fabricated. Returns { [challenge_id]: count }.
export async function fetchChallengeSolveCounts(): Promise<Record<number, number>> {
  const { data, error } = await supabase
    .from('challenge_submissions')
    .select('challenge_id')
    .eq('status', 'accepted');
  if (error) { console.error('fetchChallengeSolveCounts error', error); return {}; }
  const counts: Record<number, number> = {};
  (data ?? []).forEach((row: any) => { counts[row.challenge_id] = (counts[row.challenge_id] ?? 0) + 1; });
  return counts;
}

export async function fetchChallengeBySlug(slug: string) {
  const { data, error } = await supabase
    .from('challenges')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();
  if (error || !data) return null;
  return {
    ...data,
    test_cases: JSON.parse(data.test_cases ?? '[]'),
    hints: data.hints ? data.hints.split('\n').filter(Boolean).map((h: string, i: number) => ({ order: i + 1, text: h })) : [],
    starter_code: data.starter_code
      ? { javascript: data.starter_code, python: '# Write your solution here\n', typescript: data.starter_code }
      : { javascript: '// Write your solution here\n', python: '# Write your solution here\n', typescript: '// Write your solution here\n' },
  };
}

// ─── GAME LEVELS ─────────────────────────────────────────────
export async function fetchGameLevels(gameType?: string) {
  let q = supabase
    .from('game_levels')
    .select('*')
    .eq('is_published', true)
    .order('order', { ascending: true });
  if (gameType) q = q.eq('game_type', gameType);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((g: any) => ({
    ...g,
    questions: (JSON.parse(g.questions ?? '[]')).map((q: any) => ({ difficulty: 'easy', ...q })),
  }));
}

export async function fetchGameLevelsByTopic(topic: string, gameType: string) {
  const { data, error } = await supabase
    .from('game_levels')
    .select('*')
    .eq('is_published', true)
    .eq('game_type', gameType)
    .eq('topic', topic)
    .order('order', { ascending: true });
  if (error) return [];
  return (data ?? []).map((g: any) => ({ ...g, questions: (JSON.parse(g.questions ?? '[]')).map((q: any) => ({ difficulty: 'easy', ...q })) }));
}

// ─── PROJECTS ─────────────────────────────────────────────────
export async function fetchProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('is_published', true)
    .order('order', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    ...p,
    techStack:   JSON.parse(p.tech_stack  ?? '[]'),
    stackColors: JSON.parse(p.stack_colors ?? '[]'),
    steps:       JSON.parse(p.steps       ?? '[]'),
    resources:   JSON.parse(p.resources   ?? '[]'),
  }));
}