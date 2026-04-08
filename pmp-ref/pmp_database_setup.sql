-- =====================================================
-- PMP QUIZ DATABASE SCHEMA (Separate from AWS tables)
-- =====================================================
-- This script creates PMP-specific tables alongside existing AWS tables
-- All PMP tables use prefix "pmp_" to avoid conflicts
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. PMP QUESTIONS TABLE
-- =====================================================
-- Stores all PMP exam questions (separate from AWS questions)
CREATE TABLE IF NOT EXISTS pmp_questions (
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
CREATE INDEX IF NOT EXISTS idx_pmp_questions_id ON pmp_questions(id);
CREATE INDEX IF NOT EXISTS idx_pmp_questions_created_at ON pmp_questions(created_at);

-- =====================================================
-- 2. PMP AI CACHE TABLE
-- =====================================================
-- Caches AI-generated explanations and theory for PMP questions
CREATE TABLE IF NOT EXISTS pmp_ai_cache (
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
CREATE INDEX IF NOT EXISTS idx_pmp_ai_cache_lookup ON pmp_ai_cache(question_id, language, type);
CREATE INDEX IF NOT EXISTS idx_pmp_ai_cache_created_at ON pmp_ai_cache(created_at);

-- =====================================================
-- 3. PMP USER PROGRESS TABLE
-- =====================================================
-- Tracks which PMP question each user is currently on
CREATE TABLE IF NOT EXISTS pmp_user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_question_index INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_pmp_user_progress_user_id ON pmp_user_progress(user_id);

-- =====================================================
-- 4. PMP USER SUBMISSIONS TABLE
-- =====================================================
-- Stores user's answer history for PMP questions
CREATE TABLE IF NOT EXISTS pmp_user_submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    question_id TEXT NOT NULL,
    user_answer TEXT NOT NULL,
    is_correct BOOLEAN NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Allow multiple submissions per question (for practice)
    UNIQUE(user_id, question_id, submitted_at)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_pmp_user_submissions_user_id ON pmp_user_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_pmp_user_submissions_question_id ON pmp_user_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_pmp_user_submissions_submitted_at ON pmp_user_submissions(submitted_at DESC);

-- =====================================================
-- 5. PMP APP SETTINGS TABLE
-- =====================================================
-- Stores PMP application-level settings (e.g., API key rotation index)
CREATE TABLE IF NOT EXISTS pmp_app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all PMP tables
ALTER TABLE pmp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmp_ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmp_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmp_user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE pmp_app_settings ENABLE ROW LEVEL SECURITY;

-- PMP Questions: Public read access
CREATE POLICY "PMP questions are viewable by everyone"
    ON pmp_questions FOR SELECT
    USING (true);

-- PMP AI Cache: Public read access (cached content is public)
CREATE POLICY "PMP AI cache is viewable by everyone"
    ON pmp_ai_cache FOR SELECT
    USING (true);

-- PMP AI Cache: Service role can insert/update
CREATE POLICY "Service role can manage PMP AI cache"
    ON pmp_ai_cache FOR ALL
    USING (auth.role() = 'service_role');

-- PMP User Progress: Users can only see/update their own progress
CREATE POLICY "Users can view own PMP progress"
    ON pmp_user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PMP progress"
    ON pmp_user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own PMP progress"
    ON pmp_user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- PMP User Submissions: Users can only see/insert their own submissions
CREATE POLICY "Users can view own PMP submissions"
    ON pmp_user_submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own PMP submissions"
    ON pmp_user_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- PMP App Settings: Public read, service role write
CREATE POLICY "PMP app settings are viewable by everyone"
    ON pmp_app_settings FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage PMP app settings"
    ON pmp_app_settings FOR ALL
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

-- Triggers for auto-updating 'updated_at' on PMP tables
DROP TRIGGER IF EXISTS update_pmp_questions_updated_at ON pmp_questions;
CREATE TRIGGER update_pmp_questions_updated_at
    BEFORE UPDATE ON pmp_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pmp_ai_cache_updated_at ON pmp_ai_cache;
CREATE TRIGGER update_pmp_ai_cache_updated_at
    BEFORE UPDATE ON pmp_ai_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pmp_user_progress_updated_at ON pmp_user_progress;
CREATE TRIGGER update_pmp_user_progress_updated_at
    BEFORE UPDATE ON pmp_user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_pmp_app_settings_updated_at ON pmp_app_settings;
CREATE TRIGGER update_pmp_app_settings_updated_at
    BEFORE UPDATE ON pmp_app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default PMP app settings
INSERT INTO pmp_app_settings (key, value) 
VALUES ('gemini_key_index', '0')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- OPTIONAL: CLONE DATA FROM AWS TABLES
-- =====================================================
-- Uncomment the following if you want to copy existing AWS data as a starting point

-- Clone questions from AWS to PMP (if you want to use them as templates)
-- INSERT INTO pmp_questions (id, question, options, correct_answer, is_multiselect, discussion_link)
-- SELECT id, question, options, correct_answer, is_multiselect, discussion_link
-- FROM questions
-- ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================
-- Run these to verify the setup:

-- Check all PMP tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'pmp_%'
ORDER BY table_name;

-- Expected output:
-- pmp_ai_cache
-- pmp_app_settings
-- pmp_questions
-- pmp_user_progress
-- pmp_user_submissions

-- Check RLS is enabled on PMP tables
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename LIKE 'pmp_%';

-- Check PMP policies
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'pmp_%'
ORDER BY tablename, policyname;

-- Count records in each table
SELECT 
    'pmp_questions' as table_name, 
    COUNT(*) as record_count 
FROM pmp_questions
UNION ALL
SELECT 
    'pmp_ai_cache', 
    COUNT(*) 
FROM pmp_ai_cache
UNION ALL
SELECT 
    'pmp_user_progress', 
    COUNT(*) 
FROM pmp_user_progress
UNION ALL
SELECT 
    'pmp_user_submissions', 
    COUNT(*) 
FROM pmp_user_submissions;
