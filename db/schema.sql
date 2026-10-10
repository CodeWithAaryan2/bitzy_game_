-- ============================================================
-- BITZY APP - SUPABASE SCHEMA
-- Run this in Supabase Dashboard > SQL Editor
-- ============================================================

-- ============================================================
-- PROFILES (main user data, linked to auth.users)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  bio TEXT DEFAULT 'Learning to code one day at a time!',
  avatar TEXT,
  level INTEGER DEFAULT 1 NOT NULL,
  xp INTEGER DEFAULT 50 NOT NULL,
  coins INTEGER DEFAULT 50 NOT NULL,
  energy INTEGER DEFAULT 5 NOT NULL,
  max_energy INTEGER DEFAULT 5 NOT NULL,
  current_streak INTEGER DEFAULT 1 NOT NULL,
  longest_streak INTEGER DEFAULT 1 NOT NULL,
  last_login_date DATE DEFAULT CURRENT_DATE,
  role TEXT DEFAULT 'user' NOT NULL CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.user_id = auth.uid() AND p.role = 'admin'
    )
  );

-- ============================================================
-- COURSE PROGRESS
-- ============================================================
CREATE TABLE IF NOT EXISTS course_progress (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id INTEGER NOT NULL,
  completed_lessons TEXT[] DEFAULT '{}',
  completed_quizzes TEXT[] DEFAULT '{}',
  overall_progress INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, course_id)
);

ALTER TABLE course_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own course progress"
  ON course_progress FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- CHALLENGE SUBMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS challenge_submissions (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  challenge_id INTEGER NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL,
  source_code TEXT,
  language TEXT DEFAULT 'javascript',
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, challenge_id)
);

ALTER TABLE challenge_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own submissions"
  ON challenge_submissions FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- ACHIEVEMENTS (static app data - readable by all)
-- ============================================================
CREATE TABLE IF NOT EXISTS achievements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT DEFAULT 'learning' NOT NULL,
  icon TEXT DEFAULT 'Star',
  color TEXT DEFAULT '#58CC02',
  requirement_type TEXT DEFAULT 'lessons_completed',
  requirement_count INTEGER DEFAULT 1 NOT NULL,
  xp_reward INTEGER DEFAULT 0 NOT NULL,
  coin_reward INTEGER DEFAULT 0 NOT NULL,
  is_secret BOOLEAN DEFAULT FALSE NOT NULL
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read achievements"
  ON achievements FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================================
-- USER ACHIEVEMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE NOT NULL,
  completed_at TIMESTAMPTZ,
  progress INTEGER DEFAULT 0 NOT NULL,
  UNIQUE(user_id, achievement_id)
);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own achievements"
  ON user_achievements FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- LEADERBOARD
-- ============================================================
CREATE TABLE IF NOT EXISTS leaderboard_entries (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  level INTEGER DEFAULT 1 NOT NULL,
  xp INTEGER DEFAULT 0 NOT NULL,
  current_streak INTEGER DEFAULT 0 NOT NULL,
  challenges_solved INTEGER DEFAULT 0 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read leaderboard"
  ON leaderboard_entries FOR SELECT
  TO authenticated, anon
  USING (true);

CREATE POLICY "Users can upsert own entry"
  ON leaderboard_entries FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- ACTIVITY LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  xp_earned INTEGER DEFAULT 0 NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own logs"
  ON activity_logs FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- CHAT MESSAGES (AI Mentor)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own messages"
  ON chat_messages FOR ALL
  USING (auth.uid() = user_id);

-- ============================================================
-- INSERT DEFAULT ACHIEVEMENTS
-- ============================================================
INSERT INTO achievements (id, title, description, category, icon, color, requirement_type, requirement_count, xp_reward, coin_reward, is_secret) VALUES
  ('first_lesson', 'First Steps', 'Complete your first lesson', 'learning', 'Footprints', '#58CC02', 'lessons_completed', 1, 50, 25, false),
  ('five_lessons', 'Quick Learner', 'Complete 5 lessons', 'learning', 'BookOpen', '#1CB0F6', 'lessons_completed', 5, 100, 50, false),
  ('ten_lessons', 'Scholar', 'Complete 10 lessons', 'learning', 'GraduationCap', '#CE82FF', 'lessons_completed', 10, 200, 100, false),
  ('first_quiz', 'Quiz Master', 'Complete your first quiz', 'learning', 'Target', '#FF9600', 'quizzes_completed', 1, 50, 25, false),
  ('perfect_quiz', 'Perfectionist', 'Get 100% on a quiz', 'learning', 'Star', '#FFC800', 'perfect_quiz', 1, 200, 100, false),
  ('first_challenge', 'Bug Hunter', 'Solve your first challenge', 'challenge', 'Bug', '#FF4B4B', 'challenges_solved', 1, 100, 50, false),
  ('five_challenges', 'Problem Solver', 'Solve 5 challenges', 'challenge', 'Swords', '#FF9600', 'challenges_solved', 5, 250, 125, false),
  ('three_day_streak', 'On Fire', 'Maintain a 3-day streak', 'streak', 'Flame', '#FF4B4B', 'streak_days', 3, 150, 75, false),
  ('seven_day_streak', 'Unstoppable', 'Maintain a 7-day streak', 'streak', 'Zap', '#FFC800', 'streak_days', 7, 500, 250, false),
  ('first_game', 'Game On', 'Play your first game', 'special', 'Gamepad2', '#CE82FF', 'games_played', 1, 50, 25, false),
  ('level_5', 'Rising Star', 'Reach level 5', 'special', 'Star', '#58CC02', 'reach_level', 5, 200, 100, false),
  ('level_10', 'Code Scout', 'Reach level 10', 'special', 'Trophy', '#FF9600', 'reach_level', 10, 500, 250, false),
  ('night_owl', 'Night Owl', 'Code between midnight and 5am', 'secret', 'Moon', '#CE82FF', 'night_owl', 1, 300, 150, true),
  ('speed_demon', 'Speed Demon', 'Complete a typing challenge over 60 WPM', 'secret', 'Zap', '#FF4B4B', 'speed_demon', 1, 300, 150, true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- TRIGGER: Auto-create profile on signup WITH starter pack
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    user_id,
    display_name,
    bio,
    role,
    level,
    xp,
    coins,
    energy,
    max_energy,
    current_streak,
    longest_streak,
    last_login_date
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1), 'Learner'),
    'Learning to code one day at a time!',
    'user',
    1,
    50,
    50,
    5,
    5,
    1,
    1,
    CURRENT_DATE
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
