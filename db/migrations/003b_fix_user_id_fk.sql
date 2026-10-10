-- ============================================================
-- FIX for db/003_payment_system.sql — run this AFTER that migration,
-- BEFORE db/004_payment_rls.sql.
--
-- 003_payment_system.sql points payments.user_id and
-- purchased_courses.user_id at `users(id)` (bigint) — the dead legacy
-- OAuth table from api/queries/users.ts. The live app's real identity
-- source is Supabase Auth: every other table points user_id at
-- `auth.users(id)` (uuid), same as profiles.user_id. As shipped, every
-- payment insert throws a FK violation for every real logged-in user.
--
-- Postgres won't let you ALTER COLUMN TYPE while any policy on that
-- table references the column (your error: "Users can create their
-- own payments" — a policy made outside these files, in the Supabase
-- dashboard or an earlier ad-hoc query). Fix: drop EVERY policy on
-- both tables first (dynamically, so it doesn't matter what they're
-- named or where they came from), do the type change, then recreate
-- the real policies from db/004_payment_rls.sql.
-- ============================================================

DO $$
DECLARE pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'payments'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON payments', pol.policyname);
  END LOOP;

  FOR pol IN
    SELECT policyname FROM pg_policies WHERE tablename = 'purchased_courses'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON purchased_courses', pol.policyname);
  END LOOP;
END $$;

ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_user_id_fkey;
ALTER TABLE payments ALTER COLUMN user_id DROP NOT NULL;
ALTER TABLE payments ALTER COLUMN user_id TYPE uuid USING NULL;
ALTER TABLE payments ADD CONSTRAINT payments_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE purchased_courses DROP CONSTRAINT IF EXISTS purchased_courses_user_id_fkey;
ALTER TABLE purchased_courses ALTER COLUMN user_id TYPE uuid USING NULL;
ALTER TABLE purchased_courses ADD CONSTRAINT purchased_courses_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Both tables now have ZERO policies (all dropped above) but RLS is
-- still enabled on them — every request will be denied until you run
-- db/004_payment_rls.sql right after this.
