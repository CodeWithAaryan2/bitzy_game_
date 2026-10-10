// src/lib/importCourseMarkdown.ts

import { supabase } from "@/lib/supabase";
import { parseCourseMarkdown, slugify } from "@/lib/parseCourseMarkdown";

export async function importCourseMarkdown(
  md: string
): Promise<{ ok: boolean; message: string }> {
  const parsed = parseCourseMarkdown(md);

  if (!parsed.title) {
    return {
      ok: false,
      message: 'No "# Course Title" heading found in file.',
    };
  }

  const courseSlug = parsed.meta.slug || slugify(parsed.title);

  // Find existing course
  const { data: existingCourse, error: courseError } = await supabase
    .from("courses")
    .select("*")
    .eq("slug", courseSlug)
    .maybeSingle();

  if (courseError) {
    return {
      ok: false,
      message: courseError.message,
    };
  }

  let courseId: number;

  if (existingCourse) {
    courseId = existingCourse.id;
  } else {
    const { data: newCourse, error } = await supabase
      .from("courses")
      .insert({
        slug: courseSlug,
        title: parsed.title,
        description:
          parsed.meta.shortdescription ||
          parsed.meta.description ||
          "",
        long_description:
          parsed.meta.longdescription || "",
        icon: parsed.meta.icon || "🤖",
        color: parsed.meta.color || "#00C2FF",
        difficulty: parsed.meta.difficulty || "Beginner",
        category:
          parsed.meta.category ||
          "Artificial Intelligence & Machine Learning",
        estimated_hours: Number(
          parsed.meta.estimatedhours || 0
        ),
        xp_reward: Number(parsed.meta.xpreward || 500),
        coin_reward: Number(parsed.meta.coinreward || 250),
        order: 0,
        is_published: false,
      })
      .select()
      .single();

    if (error) {
      return {
        ok: false,
        message: error.message,
      };
    }

    courseId = newCourse.id;
  }

  let modulesAdded = 0;
  let lessonsAdded = 0;

  for (const module of parsed.modules) {
    // Find module
    const { data: existingModule } = await supabase
      .from("course_modules")
      .select("*")
      .eq("course_id", courseId);

    let moduleRow = existingModule?.find(
      (m: any) =>
        m.title.toLowerCase() === module.title.toLowerCase()
    );

    let moduleId: number;

    if (moduleRow) {
      moduleId = moduleRow.id;
    } else {
      const { data: newModule, error } = await supabase
        .from("course_modules")
        .insert({
          course_id: courseId,
          title: module.title,
          description: module.meta.description || "",
          order: Number(module.meta.order || modulesAdded + 1),
          is_boss_module: module.meta.boss === "true",
        })
        .select()
        .single();

      if (error) continue;

      moduleId = newModule.id;
      modulesAdded++;
    }

    // Lessons
    const { data: existingLessons } = await supabase
      .from("course_lessons")
      .select("*")
      .eq("module_id", moduleId);

    for (const lesson of module.lessons) {
      const lessonSlug =
        lesson.meta.slug || slugify(lesson.title);

      const found = existingLessons?.find(
        (l: any) => l.slug === lessonSlug
      );

      if (found) continue;

      const { error } = await supabase
        .from("course_lessons")
        .insert({
          module_id: moduleId,
          course_id: courseId,
          title: lesson.title,
          slug: lessonSlug,
          description: lesson.meta.description || "",
          content: lesson.content,
          type: lesson.meta.type || "reading",
          duration: lesson.meta.duration || "10 min",
          xp_reward: Number(lesson.meta.xp || 20),
          coin_reward: Number(lesson.meta.coins || 10),
          order: Number(
            lesson.meta.order ||
              (existingLessons?.length || 0) +
                lessonsAdded +
                1
          ),
          is_published: false,
        });

      if (!error) lessonsAdded++;
    }
  }

  return {
    ok: true,
    message: `"${parsed.title}" imported successfully. ${modulesAdded} module(s), ${lessonsAdded} lesson(s).`,
  };
}