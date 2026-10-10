-- ============================================================
-- BITZY — GAMIFICATION PERSISTENCE MIGRATION
-- Run this in Supabase Dashboard > SQL Editor AFTER schema.sql.
-- Safe to run multiple times (IF NOT EXISTS everywhere).
--
-- Adds:
--   1. game_progress            — universal per-game resume (any game_name)
--   2. user_question_progress   — duplicate-XP prevention for quizzes/lessons/games
--   3. course_progress columns  — question-level resume within a lesson/quiz
-- ============================================================

-- ============================================================
-- 1. GAME PROGRESS — one row per (user, game_name). Works for every
--    current and future game because game_name is free text, not an enum.
-- ============================================================
CREATE TABLE IF NOT EXISTS game_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  game_name TEXT NOT NULL,              -- e.g. 'quiz', 'truthy', 'bughunt', 'coderace' — matches ActiveGame id in GamesPage
  current_level INTEGER DEFAULT 1 NOT NULL,
  highest_level INTEGER DEFAULT 1 NOT NULL,
  current_score INTEGER DEFAULT 0 NOT NULL,
  highest_score INTEGER DEFAULT 0 NOT NULL,
  xp_earned INTEGER DEFAULT 0 NOT NULL,     -- cumulative XP earned from this game
  coins_earned INTEGER DEFAULT 0 NOT NULL,  -- cumulative coins earned from this game
  last_topic TEXT,                          -- last topic/difficulty played, for resume UX
  times_played INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, game_name)
);

CREATE INDEX IF NOT EXISTS idx_game_progress_user ON game_progress(user_id);

ALTER TABLE game_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own game progress" ON game_progress;
CREATE POLICY "Users can read own game progress"
  ON game_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own game progress" ON game_progress;
CREATE POLICY "Users can insert own game progress"
  ON game_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own game progress" ON game_progress;
CREATE POLICY "Users can update own game progress"
  ON game_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. USER QUESTION PROGRESS — prevents re-awarding XP/coins for a
--    question/activity the user already solved. Works across quizzes,
--    lessons and games since question_id is just a free-text key
--    (e.g. `quiz-12-q3`, `lesson-45`, `bughunt-level-2-q1`).
-- ============================================================
CREATE TABLE IF NOT EXISTS user_question_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id TEXT NOT NULL,
  lesson_id INTEGER,
  game_name TEXT,
  selected_answer TEXT,
  is_correct BOOLEAN DEFAULT FALSE NOT NULL,
  xp_earned INTEGER DEFAULT 0 NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_uqp_user ON user_question_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_uqp_user_question ON user_question_progress(user_id, question_id);

ALTER TABLE user_question_progress ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read own question progress" ON user_question_progress;
CREATE POLICY "Users can read own question progress"
  ON user_question_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own question progress" ON user_question_progress;
CREATE POLICY "Users can insert own question progress"
  ON user_question_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 3. COURSE PROGRESS — add question-level resume columns.
--    (Table already exists in schema.sql; this only adds what's missing.)
-- ============================================================
ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS last_quiz_id INTEGER;
ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS last_question_index INTEGER DEFAULT 0;
ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS last_module_id INTEGER;
ALTER TABLE course_progress ADD COLUMN IF NOT EXISTS last_lesson_slug TEXT;

-- ============================================================
-- Done. game_progress + user_question_progress now available,
-- course_progress can resume mid-quiz.
-- ============================================================

-- ============================================================
-- 4. GAME ACHIEVEMENTS SEED — matches src/data/achievements.ts ids
--    (dash-case), consistent with how GameContext.checkAchievements
--    looks them up. Safe to run multiple times.
-- ============================================================
INSERT INTO achievements (id, title, description, category, icon, color, requirement_type, requirement_count, xp_reward, coin_reward, is_secret) VALUES
  ('first-game', 'First Play', 'Complete a level in any game', 'games', 'Gamepad2', '#CE82FF', 'games_played', 1, 15, 10, false),
  ('game-explorer', 'Game Explorer', 'Play 3 different games', 'games', 'Compass', '#1CB0F6', 'distinct_games_played', 3, 40, 20, false)
ON CONFLICT (id) DO NOTHING;
