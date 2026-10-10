-- =====================================================
-- BITZY PAYMENT RLS — payments + purchased_courses
-- Model: getDb(token) forwards the caller's Supabase JWT, so
-- auth.uid() resolves correctly for authenticated-user policies below.
-- getServiceDb() uses the service_role key, which Supabase grants
-- BYPASSRLS on by default — no explicit service-role policy needed.
-- Does not touch RLS on any other table.
-- =====================================================

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchased_courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "payments_select_own" ON payments;
DROP POLICY IF EXISTS "payments_insert_own" ON payments;
DROP POLICY IF EXISTS "payments_update_own" ON payments;

DROP POLICY IF EXISTS "purchased_courses_select_own" ON purchased_courses;
DROP POLICY IF EXISTS "purchased_courses_insert_own" ON purchased_courses;

-- payments -------------------------------------------------

CREATE POLICY "payments_select_own"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "payments_insert_own"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "payments_update_own"
  ON payments FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- purchased_courses ------------------------------------------
-- unlockCourse()/refund() always run on getServiceDb() (BYPASSRLS),
-- so these two policies exist for defense-in-depth / any future
-- authenticated-client read or write, not because the payment flow
-- depends on them.

CREATE POLICY "purchased_courses_select_own"
  ON purchased_courses FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "purchased_courses_insert_own"
  ON purchased_courses FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
