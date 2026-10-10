-- ============================================================
-- BITZY FEATURES - MIGRATION SCRIPT
-- Run in Supabase Dashboard > SQL Editor
-- These extend the existing schema with new feature tables
-- ============================================================

-- ============================================================
-- 1. PET SYSTEM
-- ============================================================
CREATE TABLE IF NOT EXISTS user_pets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pet_stage INTEGER DEFAULT 1 NOT NULL,          -- 1=Egg, 2=Jr, 3=Codeling, 4=Debugger, 5=BitBeast, 6=Dragon
  happiness INTEGER DEFAULT 70 NOT NULL,          -- 0-100
  last_fed_at TIMESTAMPTZ DEFAULT NOW(),
  last_played_at TIMESTAMPTZ DEFAULT NOW(),
  evolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id)
);

ALTER TABLE user_pets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_pets_own" ON user_pets FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 2. COMMUNITY POSTS
-- ============================================================
CREATE TABLE IF NOT EXISTS community_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_type TEXT NOT NULL CHECK (post_type IN ('achievement', 'project', 'streak', 'milestone', 'challenge')),
  content TEXT NOT NULL,
  emoji TEXT DEFAULT '🚀',
  badge_name TEXT,
  xp_gained INTEGER,
  tags TEXT[] DEFAULT '{}',
  likes_count INTEGER DEFAULT 0,
  comments_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "community_posts_read" ON community_posts FOR SELECT USING (true);
CREATE POLICY "community_posts_insert" ON community_posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "community_posts_update" ON community_posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "community_posts_delete" ON community_posts FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 3. POST LIKES
-- ============================================================
CREATE TABLE IF NOT EXISTS post_likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(post_id, user_id)
);

ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_likes_read" ON post_likes FOR SELECT USING (true);
CREATE POLICY "post_likes_insert" ON post_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_likes_delete" ON post_likes FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 4. POST COMMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS post_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "post_comments_read" ON post_comments FOR SELECT USING (true);
CREATE POLICY "post_comments_write" ON post_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_comments_delete" ON post_comments FOR DELETE USING (auth.uid() = user_id);

-- ============================================================
-- 5. USER FOLLOWS
-- ============================================================
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(follower_id, following_id),
  CHECK (follower_id != following_id)
);

ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_follows_read" ON user_follows FOR SELECT USING (true);
CREATE POLICY "user_follows_insert" ON user_follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "user_follows_delete" ON user_follows FOR DELETE USING (auth.uid() = follower_id);

-- ============================================================
-- 6. BOSS BATTLE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS boss_battles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  boss_id TEXT NOT NULL,                          -- 'html-dragon', 'css-wizard', 'js-robot'
  completed BOOLEAN DEFAULT FALSE,
  score INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_questions INTEGER DEFAULT 5,
  time_taken_seconds INTEGER,
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  attempted_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE boss_battles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boss_battles_own" ON boss_battles FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 7. USER PROJECTS (Portfolio)
-- ============================================================
CREATE TABLE IF NOT EXISTS user_projects (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,                        -- 'portfolio', 'calculator', 'weather', 'todo', 'chat'
  title TEXT NOT NULL,
  description TEXT,
  project_url TEXT,
  github_url TEXT,
  status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'showcase')),
  xp_earned INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, project_id)
);

ALTER TABLE user_projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_projects_read" ON user_projects FOR SELECT USING (true);   -- public portfolio
CREATE POLICY "user_projects_write" ON user_projects FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 8. USER CERTIFICATES
-- ============================================================
CREATE TABLE IF NOT EXISTS user_certificates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  certificate_id TEXT NOT NULL,                   -- 'html', 'css', 'javascript', 'react', 'python'
  title TEXT NOT NULL,
  issuer TEXT DEFAULT 'Bitzy Academy',
  issued_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, certificate_id)
);

ALTER TABLE user_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_certificates_read" ON user_certificates FOR SELECT USING (true);
CREATE POLICY "user_certificates_write" ON user_certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 9. INTERVIEW SESSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  interview_type TEXT NOT NULL CHECK (interview_type IN ('technical', 'behavioral', 'coding')),
  total_questions INTEGER NOT NULL,
  average_score NUMERIC(3,1),
  total_score INTEGER,
  xp_earned INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE interview_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "interview_sessions_own" ON interview_sessions FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 10. SKILL UNLOCKS (Skill Tree progress)
-- ============================================================
CREATE TABLE IF NOT EXISTS skill_unlocks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill_id TEXT NOT NULL,
  branch TEXT NOT NULL CHECK (branch IN ('frontend', 'backend', 'ai', 'gamedev')),
  unlocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE(user_id, skill_id)
);

ALTER TABLE skill_unlocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "skill_unlocks_own" ON skill_unlocks FOR ALL USING (auth.uid() = user_id);

-- ============================================================
-- 11. PLAYGROUND SAVES (Code snippets)
-- ============================================================
CREATE TABLE IF NOT EXISTS playground_saves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  language TEXT NOT NULL CHECK (language IN ('html', 'css', 'javascript')),
  code TEXT NOT NULL,
  is_public BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

ALTER TABLE playground_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "playground_own" ON playground_saves FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "playground_public" ON playground_saves FOR SELECT USING (is_public = TRUE);

-- ============================================================
-- HELPFUL VIEWS
-- ============================================================

-- Leaderboard view with all stats
CREATE OR REPLACE VIEW leaderboard_full AS
SELECT
  p.user_id,
  p.display_name,
  p.avatar,
  p.level,
  p.xp,
  p.coins,
  p.current_streak,
  p.longest_streak,
  COUNT(DISTINCT bb.id) FILTER (WHERE bb.completed = TRUE) AS bosses_defeated,
  COUNT(DISTINCT up.id) FILTER (WHERE up.status = 'completed') AS projects_completed,
  COUNT(DISTINCT uc.id) AS certificates_earned
FROM profiles p
LEFT JOIN boss_battles bb ON bb.user_id = p.user_id
LEFT JOIN user_projects up ON up.user_id = p.user_id
LEFT JOIN user_certificates uc ON uc.user_id = p.user_id
GROUP BY p.user_id, p.display_name, p.avatar, p.level, p.xp, p.coins, p.current_streak, p.longest_streak
ORDER BY p.xp DESC;

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_community_posts_user ON community_posts(user_id);
CREATE INDEX IF NOT EXISTS idx_community_posts_type ON community_posts(post_type);
CREATE INDEX IF NOT EXISTS idx_community_posts_created ON community_posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post ON post_comments(post_id);
CREATE INDEX IF NOT EXISTS idx_boss_battles_user ON boss_battles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_user ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_unlocks_user ON skill_unlocks(user_id);

-- ============================================================
-- AUTO-UPDATE updated_at trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_user_pets_updated') THEN
    CREATE TRIGGER trg_user_pets_updated BEFORE UPDATE ON user_pets FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_community_posts_updated') THEN
    CREATE TRIGGER trg_community_posts_updated BEFORE UPDATE ON community_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_playground_updated') THEN
    CREATE TRIGGER trg_playground_updated BEFORE UPDATE ON playground_saves FOR EACH ROW EXECUTE FUNCTION update_updated_at();
  END IF;
END;
$$;
