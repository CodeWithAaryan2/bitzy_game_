/**
 * SUPABASE CONNECTION OPTIONS EXPLAINED
 * ======================================
 *
 * Supabase gives you MULTIPLE ways to connect. Here's what each means:
 *
 * 1. DIRECT CONNECTION (port 5432) - What we use
 *    Connects straight to PostgreSQL using any Postgres driver.
 *    Best for: Server-side code, Drizzle ORM, Prisma, raw SQL.
 *    Pros: Full SQL support, transactions, Drizzle ORM compatible.
 *    Cons: Needs connection pooling for high traffic.
 *
 * 2. CONNECTION POOLER (port 6543) - Transaction mode
 *    Goes through PgBouncer connection pooler.
 *    Best for: Serverless functions, high concurrent connections.
 *    Pros: Handles thousands of concurrent clients efficiently.
 *    Cons: No prepared statements, some session features limited.
 *
 * 3. SUPABASE CLIENT SDK (@supabase/supabase-js)
 *    REST API wrapper around your database.
 *    Best for: Direct client-side access, simple CRUD.
 *    Pros: Built-in auth, realtime subscriptions, row-level security.
 *    Cons: Not type-safe without generated types, slower than raw SQL.
 *
 * 4. SUPABASE SSR (@supabase/ssr)
 *    Server-side rendering helper with cookie-based auth.
 *    Best for: Next.js apps with server components.
 *
 * =================================================================
 * WHY WE USE DIRECT CONNECTION (Option 1):
 * =================================================================
 *
 * Our stack is: React frontend + Hono/tRPC backend + Drizzle ORM + PostgreSQL
 *
 * The frontend NEVER talks directly to the database. It calls tRPC APIs.
 * The tRPC server talks to PostgreSQL using Drizzle ORM.
 *
 * This is the BEST architecture because:
 * - Full type safety end-to-end (TypeScript → tRPC → Drizzle → Postgres)
 * - Business logic lives in tRPC routers (not client-side)
 * - Drizzle ORM handles all SQL for us
 * - Can use transactions, complex queries, joins
 * - No row-level security needed (API controls access)
 *
 * If you want to use Supabase's native SDK instead, you would:
 * - Lose Drizzle ORM (write raw Supabase queries)
 * - Lose tRPC type safety (manual API calls)
 * - Need to set up Row Level Security policies
 * - Different architecture pattern
 *
 * =================================================================
 * RECOMMENDED CONNECTION STRINGS FOR EACH MODE:
 * =================================================================
 *
 * A. Direct (development / low traffic):
 *    postgresql://postgres:PASS@db.REF.supabase.co:5432/postgres
 *
 * B. Pooler (production / serverless / high traffic):
 *    postgresql://postgres:PASS@db.REF.supabase.co:6543/postgres?sslmode=require
 *
 * C. Supabase SDK (if you want to skip tRPC/Drizzle entirely):
 *    Not a connection string - uses anon/service role keys instead
 *
 * =================================================================
 * OUR CURRENT APPROACH:
 * =================================================================
 *
 * We're using Option A (Direct) with the `postgres` driver.
 *
 * Flow: React → tRPC HTTP call → Hono server → Drizzle ORM → PostgreSQL
 *                                                         ↑
 *                                              (our api/queries/connection.ts)
 *
 * This is the most powerful and type-safe approach.
 * If you want to switch to the Pooler (option B) for production,
 * just change the port from 5432 to 6543 in your DATABASE_URL.
 */

// If you ever want to use Supabase SDK alongside Drizzle, uncomment below:
// import { createClient } from "@supabase/supabase-js";
// export const supabase = createClient(
//   process.env.SUPABASE_URL!,
//   process.env.SUPABASE_SERVICE_ROLE_KEY!
// );
