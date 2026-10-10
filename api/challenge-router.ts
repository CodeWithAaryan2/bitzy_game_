import { z } from "zod";
import { createRouter, publicQuery } from "./middleware";
import { getDb } from "./queries/connection";

export const challengeRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    const { data } = await db
      .from("challenges").select("*").eq("is_published", true).order("id", { ascending: true });
    return data ?? [];
  }),

  getBySlug: publicQuery
    .input(z.object({ slug: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const { data, error } = await db
        .from("challenges").select("*").eq("slug", input.slug).eq("is_published", true).single();
      if (error || !data) return null;
      return data;
    }),
});