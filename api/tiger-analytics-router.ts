import { TRPCError } from "@trpc/server";
import { z } from "zod";
import postgres from "postgres";
import { buildGameTrendFromDailyCounts, type DatedAnswerCount } from "../src/lib/learningAnalytics";
import { createRouter, protectedProcedure } from "./middleware";
import { getServiceDb } from "./queries/connection";

const GAME_IDS = ["quiz", "truthy", "prediction", "bughunt", "fillblank", "typing", "codeorder", "coderace", "bugsquash", "royale", "dash"] as const;
const gameFilter = z.enum(["all", ...GAME_IDS]);
const rangeDays = z.union([z.literal(7), z.literal(30), z.literal(90)]).default(30);
const PAGE_SIZE = 500;
const MAX_SYNC_ROWS = 25_000;

type SourceAnswer = {
  user_id: string;
  question_id: string;
  game_name: typeof GAME_IDS[number];
  is_correct: boolean;
  answered_at: string;
};

type TigerSql = ReturnType<typeof postgres>;
let tigerClient: TigerSql | null = null;

function tigerSql(): TigerSql {
  const connectionString = process.env.TIMESCALE_SERVICE_URL;
  if (!connectionString) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Tiger Cloud analytics is not configured on the server." });
  }
  if (!tigerClient) {
    tigerClient = postgres(connectionString, {
      ssl: "require",
      max: 4,
      connect_timeout: 8,
      idle_timeout: 20,
      prepare: false,
      connection: { application_name: "bitzy-profile-analytics" },
    });
  }
  return tigerClient;
}

function logTigerFailure(error: unknown) {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "unknown";
  console.error("Tiger Cloud analytics operation failed", { code });
}

async function mirrorSourcePage(sql: TigerSql, rows: SourceAnswer[]) {
  if (!rows.length) return;
  const values = rows.map(row => ({
    answered_at: row.answered_at,
    user_id: row.user_id,
    question_id: row.question_id,
    game_name: row.game_name,
    is_correct: row.is_correct,
  }));
  await sql`
    INSERT INTO public.bitzy_game_answer_events ${sql(values, "answered_at", "user_id", "question_id", "game_name", "is_correct")}
    ON CONFLICT (answered_at, user_id, question_id) DO NOTHING
  `;
}

async function syncRecentSupabaseRows(userId: string, since: string, sql: TigerSql) {
  const supabase = getServiceDb();
  let offset = 0;
  let mirroredSourceRows = 0;
  while (true) {
    const { data, error } = await supabase
      .from("user_question_progress")
      .select("user_id,question_id,game_name,is_correct,answered_at")
      .eq("user_id", userId)
      .in("game_name", GAME_IDS)
      .gte("answered_at", since)
      .order("answered_at", { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      logTigerFailure(error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not read the signed-in user's saved game answers." });
    }
    const rows = (data ?? []) as SourceAnswer[];
    if (!rows.length) break;
    if (offset + rows.length > MAX_SYNC_ROWS) {
      throw new TRPCError({ code: "PAYLOAD_TOO_LARGE", message: "This account has more recent answer history than a single sync can process. The trend is temporarily using the saved Supabase history." });
    }
    const ownedRows = rows.filter(row => row.user_id === userId && GAME_IDS.includes(row.game_name));
    try {
      await mirrorSourcePage(sql, ownedRows);
    } catch (error) {
      logTigerFailure(error);
      throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Tiger Cloud could not sync the saved answer history right now." });
    }
    mirroredSourceRows += ownedRows.length;
    if (rows.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }
  return mirroredSourceRows;
}

export const tigerAnalyticsRouter = createRouter({
  performanceTrend: protectedProcedure
    .input(z.object({ gameId: gameFilter, days: rangeDays }))
    .mutation(async ({ ctx, input }) => {
      const now = new Date();
      const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
      const firstDay = new Date(todayUtc - (input.days - 1) * 24 * 60 * 60 * 1000);
      const since = firstDay.toISOString();
      const sql = tigerSql();

      await syncRecentSupabaseRows(ctx.userId, since, sql);

      try {
        const aggregates = input.gameId === "all"
          ? await sql`
              SELECT
                (date_trunc('day', answered_at AT TIME ZONE 'UTC'))::date::text AS date,
                count(*)::int AS attempts,
                count(*) FILTER (WHERE is_correct)::int AS correct,
                count(*) FILTER (WHERE NOT is_correct)::int AS incorrect
              FROM public.bitzy_game_answer_events
              WHERE user_id = ${ctx.userId} AND answered_at >= ${since}
              GROUP BY 1 ORDER BY 1
            `
          : await sql`
              SELECT
                (date_trunc('day', answered_at AT TIME ZONE 'UTC'))::date::text AS date,
                count(*)::int AS attempts,
                count(*) FILTER (WHERE is_correct)::int AS correct,
                count(*) FILTER (WHERE NOT is_correct)::int AS incorrect
              FROM public.bitzy_game_answer_events
              WHERE user_id = ${ctx.userId} AND game_name = ${input.gameId} AND answered_at >= ${since}
              GROUP BY 1 ORDER BY 1
            `;
        const safeAggregates: DatedAnswerCount[] = aggregates.map(row => ({
          date: String(row.date),
          attempts: Number(row.attempts),
          correct: Number(row.correct),
          incorrect: Number(row.incorrect),
        }));
        return {
          source: "tiger-cloud" as const,
          gameId: input.gameId,
          days: input.days,
          trend: buildGameTrendFromDailyCounts(safeAggregates, input.days, now),
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        logTigerFailure(error);
        throw new TRPCError({ code: "SERVICE_UNAVAILABLE", message: "Tiger Cloud could not calculate the performance trend right now." });
      }
    }),
});
