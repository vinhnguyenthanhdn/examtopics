-- =====================================================
-- PMP QUIZ DATABASE SCHEMA
-- Clone from AWS Quiz Database Structure
-- =====================================================
-- This script creates all necessary tables for the PMP Quiz application
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. QUESTIONS TABLE
-- =====================================================
-- Stores all PMP exam questions
CREATE TABLE IF NOT EXISTS questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer TEXT NOT NULL,
    is_multiselect BOOLEAN DEFAULT FALSE,
    discussion_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_questions_id ON questions(id);
CREATE INDEX IF NOT EXISTS idx_questions_created_at ON questions(created_at);

-- =====================================================
-- 2. AI CACHE TABLE
-- =====================================================
-- Caches AI-generated explanations and theory to reduce API costs
CREATE TABLE IF NOT EXISTS ai_cache (
    id BIGSERIAL PRIMARY KEY,
    question_id TEXT NOT NULL,
    language TEXT NOT NULL CHECK (language IN ('vi', 'en')),
    type TEXT NOT NULL CHECK (type IN ('explanation', 'theory')),
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique cache entries per question/language/type
    UNIQUE(question_id, language, type)
);

-- Add indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_ai_cache_lookup ON ai_cache(question_id, language, type);
CREATE INDEX IF NOT EXISTS idx_ai_cache_created_at ON ai_cache(created_at);

-- =====================================================
-- 3. USER PROGRESS TABLE
-- =====================================================
-- Tracks which question each user is currently on
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_question_index INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);

-- =====================================================
-- 4. USER SUBMISSIONS TABLE
-- =====================================================
-- Stores user's answer history for each question
CREATE TABLE IF NOT EXISTS user_submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow multiple submissions per question (for practice)
    -- But track the latest one
    UNIQUE(user_id, question_id, submitted_at)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_submissions_user_id ON user_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_question_id ON user_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_user_submissions_submitted_at ON user_submissions(submitted_at DESC);

-- =====================================================
-- 5. APP SETTINGS TABLE
-- =====================================================
-- Stores application-level settings (e.g., API key rotation index)
CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

-- Questions: Public read access
CREATE POLICY "Questions are viewable by everyone"
    ON questions FOR SELECT
    USING (true);

-- AI Cache: Public read access (cached content is public)
CREATE POLICY "AI cache is viewable by everyone"
    ON ai_cache FOR SELECT
    USING (true);

-- AI Cache: Service role can insert/update
CREATE POLICY "Service role can manage AI cache"
    ON ai_cache FOR ALL
    USING (auth.role() = 'service_role');

-- User Progress: Users can only see/update their own progress
CREATE POLICY "Users can view own progress"
    ON user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- User Submissions: Users can only see/insert their own submissions
CREATE POLICY "Users can view own submissions"
    ON user_submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own submissions"
    ON user_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- App Settings: Public read, service role write
CREATE POLICY "App settings are viewable by everyone"
    ON app_settings FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage app settings"
    ON app_settings FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating 'updated_at'
DROP TRIGGER IF EXISTS update_questions_updated_at ON questions;
CREATE TRIGGER update_questions_updated_at
    BEFORE UPDATE ON questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_cache_updated_at ON ai_cache;
CREATE TRIGGER update_ai_cache_updated_at
    BEFORE UPDATE ON ai_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_progress_updated_at ON user_progress;
CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_app_settings_updated_at ON app_settings;
CREATE TRIGGER update_app_settings_updated_at
    BEFORE UPDATE ON app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA (Optional)
-- =====================================================

-- Insert default app settings
INSERT INTO app_settings (key, value) 
VALUES ('gemini_key_index', '0')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup:

-- Check all tables exist
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;

-- Check RLS is enabled
-- SELECT tablename, rowsecurity 
-- FROM pg_tables 
-- WHERE schemaname = 'public';

-- Check policies
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public';
