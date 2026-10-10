import { initTRPC } from "@trpc/server";
import { TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";
import { getDb } from "./queries/connection";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
});

export const createRouter = t.router;
export const publicQuery = t.procedure;

// New user-owned features must verify Supabase's signed access token before
// using any privileged persistence. Existing public routers are left intact.
export const protectedProcedure = t.procedure.use(async ({ ctx, next }) => {
  const authorization = ctx.req.headers.get("authorization") ?? "";
  const match = authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw new TRPCError({ code: "UNAUTHORIZED", message: "Sign in to continue." });
  const token = match[1];
  const db = getDb(token);
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new TRPCError({ code: "UNAUTHORIZED", message: "Your session is invalid or expired." });
  return next({ ctx: { ...ctx, userId: data.user.id } });
});
