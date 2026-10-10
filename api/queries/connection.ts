import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { env } from "../lib/env";

let instance: SupabaseClient | null = null;
let serviceInstance: SupabaseClient | null = null;

function wsOpts(): any {
  const opts: any = { auth: { autoRefreshToken: false, persistSession: false } };
  // Node.js < 22 needs explicit WebSocket implementation
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ws = require("ws");
    if (ws) opts.realtime = { transport: ws };
  } catch {
    // Browser or ws not available — native WebSocket will be used
  }
  return opts;
}

/**
 * Anon-key client. Called with no args (existing routers:
 * challenge/course/gamification/admin/mentor-router.ts) it returns a
 * cached singleton, same as before.
 *
 * Called with a token (payment-router.ts), it returns a fresh client
 * with that user's JWT forwarded in the Authorization header — this is
 * what makes `auth.uid()` resolve correctly for the RLS policies in
 * db/004_payment_rls.sql. Not cached, since the token differs per
 * request.
 */
export function getDb(token?: string): SupabaseClient {
  if (!token) {
    if (!instance) instance = createClient(env.supabaseUrl, env.supabaseKey, wsOpts());
    return instance;
  }
  return createClient(env.supabaseUrl, env.supabaseKey, {
    ...wsOpts(),
    global: { headers: { Authorization: `Bearer ${token}` } },
  });
}

/**
 * Service-role client — bypasses RLS (Supabase grants BYPASSRLS to
 * service_role by default). Server-only. Used exclusively by
 * unlockCourse()/bumpRevenueStats()/refund() in payment-router.ts and
 * by webhook-router.ts, which has no user JWT to forward at all.
 * Never expose this client or its result to a response the browser
 * can read unfiltered.
 */
export function getServiceDb(): SupabaseClient {
  if (!serviceInstance) {
    serviceInstance = createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
  }
  return serviceInstance;
}

export function result<T>({ data, error }: { data: T | null; error: Error | null }): T {
  if (error) throw new Error(error.message);
  if (!data) throw new Error("No data returned");
  return data;
}

export function resultMaybe<T>({ data, error }: { data: T | null; error: Error | null }): T | null {
  if (error) return null;
  return data;
}
