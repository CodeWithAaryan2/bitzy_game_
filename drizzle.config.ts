// ============================================================
// NOT USED ANYMORE — We migrated to @supabase/supabase-js
// ============================================================
//
// DO NOT run `npm run db:push` — it will NOT work.
//
// Instead, create tables using the Supabase SQL Editor:
//   1. Go to your Supabase Dashboard → SQL Editor
//   2. Open db/schema.sql from this project
//   3. Copy + paste into SQL Editor
//   4. Click "Run"
//
// Then seed data:
//   npx tsx db/seed.ts
//
// ============================================================

import { config } from "dotenv";
import { resolve } from "path";

config({ path: resolve(process.cwd(), ".env") });

// Check for Supabase env vars (not DATABASE_URL)
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "\n" +
    "╔══════════════════════════════════════════════════════════════╗\n" +
    "║  SUPABASE CREDENTIALS MISSING                                ║\n" +
    "╠══════════════════════════════════════════════════════════════╣\n" +
    "║  Add these to your .env file:                                ║\n" +
    "║                                                              ║\n" +
    "║    SUPABASE_URL=https://your-project.supabase.co             ║\n" +
    "║    SUPABASE_PUBLISHABLE_KEY=your-anon-key                    ║\n" +
    "╠══════════════════════════════════════════════════════════════╣\n" +
    "║  We use @supabase/supabase-js — NOT drizzle-kit db:push      ║\n" +
    "║  To create tables: copy db/schema.sql into SQL Editor        ║\n" +
    "║  To seed data: npx tsx db/seed.ts                            ║\n" +
    "╚══════════════════════════════════════════════════════════════╝\n"
  );
}

// Keep a dummy config so drizzle-kit doesn't crash on load
export default {
  schema: "./db/schema.ts",
  out: "./db/migrations",
  dialect: "postgresql",
  dbCredentials: { url: "postgresql://dummy:dummy@localhost:5432/dummy" },
};
