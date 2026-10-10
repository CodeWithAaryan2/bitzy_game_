import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

export const courseRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const { data } = await db
      .from("courses")
      .select("*")
      .eq("is_published", true)
      .order("order", { ascending: true });
    return data ?? [];
  }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { data: course, error: courseError } = await db
        .from("courses").select("*").eq("slug", input.slug).eq("is_published", true).single();
      if (courseError || !course) return null;

      const { data: courseModules } = await db
        .from("modules").select("*").eq("course_id", course.id).order("order", { ascending: true });
      const { data: courseLessons } = await db
        .from("lessons").select("*").eq("course_id", course.id).order("order", { ascending: true });
      const { data: courseQuizzes } = await db
        .from("quizzes").select("*").eq("course_id", course.id).eq("is_published", true);

      return {
        course,
        modules: courseModules ?? [],
        lessons: courseLessons ?? [],
        quizzes: courseQuizzes ?? [],
      };
    }),

  getLesson: publicQuery
    .input(z.object({ courseSlug: z.string(), lessonSlug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { data: course, error: cErr } = await db
        .from("courses").select("*").eq("slug", input.courseSlug).eq("is_published", true).single();
      if (cErr || !course) return null;

      const { data: lesson, error: lErr } = await db
        .from("lessons").select("*").eq("course_id", course.id).eq("slug", input.lessonSlug).single();
      if (lErr || !lesson) return null;

      const { data: mod } = await db
        .from("modules").select("*").eq("id", lesson.module_id).single();

      return { course, lesson, module: mod ?? null };
    }),
});