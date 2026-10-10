-- Coding RPG: private, server-validated assessment history and idempotent boss rewards.
-- Apply through the Supabase SQL editor before using the new RPG routes.
CREATE TABLE IF NOT EXISTS public.coding_rpg_attempts (
  attempt_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  submission_key UUID NOT NULL,
  assessment_id TEXT NOT NULL CHECK (length(assessment_id) BETWEEN 1 AND 80),
  skill_key TEXT NOT NULL CHECK (length(skill_key) BETWEEN 1 AND 60),
  answer TEXT NOT NULL CHECK (length(answer) <= 1500),
  is_correct BOOLEAN NOT NULL,
  hints_used SMALLINT NOT NULL DEFAULT 0 CHECK (hints_used BETWEEN 0 AND 3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS coding_rpg_attempts_submission_once_idx
  ON public.coding_rpg_attempts (user_id, submission_key);
CREATE INDEX IF NOT EXISTS coding_rpg_attempts_user_recent_idx
  ON public.coding_rpg_attempts (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS coding_rpg_attempts_user_assessment_idx
  ON public.coding_rpg_attempts (user_id, assessment_id, is_correct);

CREATE TABLE IF NOT EXISTS public.coding_rpg_mastery (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_key TEXT NOT NULL CHECK (length(skill_key) BETWEEN 1 AND 60),
  verified_assessments INTEGER NOT NULL DEFAULT 0 CHECK (verified_assessments >= 0),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, skill_key)
);

CREATE TABLE IF NOT EXISTS public.coding_rpg_rewards (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reward_key TEXT NOT NULL CHECK (length(reward_key) BETWEEN 1 AND 100),
  xp_awarded INTEGER NOT NULL CHECK (xp_awarded BETWEEN 0 AND 5000),
  coins_awarded INTEGER NOT NULL DEFAULT 0 CHECK (coins_awarded BETWEEN 0 AND 5000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, reward_key)
);

ALTER TABLE public.coding_rpg_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_rpg_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coding_rpg_rewards ENABLE ROW LEVEL SECURITY;
-- No client-side policies: reads and writes flow through the authenticated API,
-- which verifies the Supabase JWT and filters by its user id.
REVOKE ALL ON public.coding_rpg_attempts, public.coding_rpg_mastery, public.coding_rpg_rewards FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coding_rpg_attempts, public.coding_rpg_mastery, public.coding_rpg_rewards TO service_role;

CREATE OR REPLACE FUNCTION public.coding_rpg_level_for_xp(p_xp INTEGER)
RETURNS INTEGER LANGUAGE plpgsql IMMUTABLE SET search_path = public AS $$
DECLARE
  v_level INTEGER := 1;
  v_total INTEGER := 0;
  v_next_cost INTEGER;
BEGIN
  WHILE v_level < 200 LOOP
    v_next_cost := 50 + (v_level + 1) * 10;
    EXIT WHEN v_total + v_next_cost > GREATEST(COALESCE(p_xp, 0), 0);
    v_total := v_total + v_next_cost;
    v_level := v_level + 1;
  END LOOP;
  RETURN v_level;
END;
$$;

CREATE OR REPLACE FUNCTION public.record_coding_rpg_attempt(
  p_user_id UUID,
  p_submission_key UUID,
  p_assessment_id TEXT,
  p_skill_key TEXT,
  p_answer TEXT,
  p_is_correct BOOLEAN,
  p_hints_used SMALLINT,
  p_reward_key TEXT DEFAULT NULL,
  p_boss_stage SMALLINT DEFAULT NULL
)
RETURNS TABLE(attempt_id UUID, xp_awarded INTEGER, coins_awarded INTEGER, boss_complete BOOLEAN, verified BOOLEAN)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_attempt UUID;
  v_xp INTEGER := 0;
  v_coins INTEGER := 0;
  v_complete BOOLEAN := FALSE;
  v_passed INTEGER;
  v_previously_verified BOOLEAN := FALSE;
  v_verified BOOLEAN := FALSE;
BEGIN
  IF p_user_id IS NULL OR p_submission_key IS NULL OR p_assessment_id IS NULL OR length(p_assessment_id) > 80
     OR p_skill_key IS NULL OR length(p_skill_key) > 60
     OR p_answer IS NULL OR length(p_answer) > 1500
     OR p_hints_used NOT BETWEEN 0 AND 3
     OR (p_boss_stage IS NOT NULL AND p_boss_stage NOT BETWEEN 1 AND 4) THEN
    RAISE EXCEPTION 'Invalid coding RPG submission';
  END IF;

  -- Serialize this user's progression and enforce stage gates inside the
  -- transaction too (the API checks them for UX, but the database is final).
  PERFORM 1 FROM public.profiles WHERE user_id = p_user_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Learner profile not found'; END IF;
  IF p_boss_stage = 1 AND NOT EXISTS (
    SELECT 1 FROM public.coding_rpg_mastery WHERE user_id = p_user_id
  ) THEN RAISE EXCEPTION 'Complete a verified assessment before the boss'; END IF;
  IF p_boss_stage > 1 AND NOT EXISTS (
    SELECT 1 FROM public.coding_rpg_attempts
    WHERE user_id = p_user_id AND assessment_id = 'boss-apprentice-stage-' || (p_boss_stage - 1)::TEXT AND is_correct
  ) THEN RAISE EXCEPTION 'Previous boss stage is not complete'; END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.coding_rpg_attempts
    WHERE user_id = p_user_id AND assessment_id = p_assessment_id AND is_correct
  ) INTO v_previously_verified;

  INSERT INTO public.coding_rpg_attempts(user_id, submission_key, assessment_id, skill_key, answer, is_correct, hints_used)
  VALUES (p_user_id, p_submission_key, p_assessment_id, p_skill_key, p_answer, p_is_correct, p_hints_used)
  ON CONFLICT (user_id, submission_key) DO NOTHING
  RETURNING coding_rpg_attempts.attempt_id INTO v_attempt;
  IF v_attempt IS NULL THEN
    SELECT a.attempt_id, a.is_correct INTO v_attempt, v_verified
    FROM public.coding_rpg_attempts a WHERE a.user_id = p_user_id AND a.submission_key = p_submission_key;
    RETURN QUERY SELECT v_attempt, 0, 0, FALSE, v_verified;
    RETURN;
  END IF;
  v_verified := p_is_correct;

  IF p_is_correct AND NOT v_previously_verified THEN
    INSERT INTO public.coding_rpg_mastery(user_id, skill_key, verified_assessments, verified_at)
    VALUES (p_user_id, p_skill_key, 1, NOW())
    ON CONFLICT (user_id, skill_key) DO UPDATE
      SET verified_assessments = public.coding_rpg_mastery.verified_assessments + 1,
          verified_at = NOW();
  END IF;

  IF p_boss_stage = 4 AND p_is_correct THEN
    SELECT COUNT(DISTINCT assessment_id) INTO v_passed
    FROM public.coding_rpg_attempts
    WHERE user_id = p_user_id AND is_correct
      AND assessment_id IN ('boss-apprentice-stage-1','boss-apprentice-stage-2','boss-apprentice-stage-3','boss-apprentice-stage-4');
    v_complete := v_passed = 4;
    IF v_complete AND p_reward_key = 'boss-apprentice-complete' THEN
      INSERT INTO public.coding_rpg_rewards(user_id, reward_key, xp_awarded, coins_awarded)
      VALUES (p_user_id, p_reward_key, 250, 100)
      ON CONFLICT (user_id, reward_key) DO NOTHING;
      IF FOUND THEN
        v_xp := 250;
        v_coins := 100;
        UPDATE public.profiles
        SET xp = COALESCE(xp, 0) + v_xp,
            coins = COALESCE(coins, 0) + v_coins,
            level = public.coding_rpg_level_for_xp(COALESCE(xp, 0) + v_xp),
            updated_at = NOW()
        WHERE user_id = p_user_id;
        INSERT INTO public.activity_logs(user_id, activity_type, description, xp_earned)
        VALUES (p_user_id, 'xp', 'Boss clear: The Logic Warden', v_xp);
        INSERT INTO public.leaderboard_entries(user_id, display_name, level, xp, current_streak, challenges_solved, updated_at)
        SELECT user_id, COALESCE(display_name, 'Learner'), level, xp, current_streak, 0, NOW()
        FROM public.profiles WHERE user_id = p_user_id
        ON CONFLICT (user_id) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          level = EXCLUDED.level,
          xp = EXCLUDED.xp,
          current_streak = EXCLUDED.current_streak,
          updated_at = NOW();
        INSERT INTO public.user_achievements(user_id, achievement_id, completed, completed_at, progress)
        VALUES (p_user_id, 'logic-warden', TRUE, NOW(), 100)
        ON CONFLICT (user_id, achievement_id) DO UPDATE SET
          completed = TRUE, completed_at = COALESCE(public.user_achievements.completed_at, NOW()), progress = 100;
      END IF;
    END IF;
  END IF;

  RETURN QUERY SELECT v_attempt, v_xp, v_coins, v_complete, v_verified;
END;
$$;
REVOKE ALL ON FUNCTION public.record_coding_rpg_attempt(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN, SMALLINT, TEXT, SMALLINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_coding_rpg_attempt(UUID, UUID, TEXT, TEXT, TEXT, BOOLEAN, SMALLINT, TEXT, SMALLINT) TO service_role;
REVOKE ALL ON FUNCTION public.coding_rpg_level_for_xp(INTEGER) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.coding_rpg_level_for_xp(INTEGER) TO service_role;

INSERT INTO public.achievements(id, title, description, category, icon, color, requirement_type, requirement_count, xp_reward, coin_reward, is_secret)
VALUES ('logic-warden', 'Logic Warden', 'Defeat The Logic Warden’s four verified stages.', 'coding', 'Trophy', '#38D8ED', 'boss_cleared', 1, 0, 0, FALSE)
ON CONFLICT (id) DO NOTHING;
