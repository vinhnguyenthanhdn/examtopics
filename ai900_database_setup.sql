-- =====================================================
-- AI-900 QUIZ DATABASE SCHEMA
-- =====================================================
-- This script creates AI-900-specific tables alongside existing tables
-- All AI-900 tables use prefix "ai900_" to avoid conflicts
-- Run this in your Supabase SQL Editor

-- =====================================================
-- 1. AI-900 QUESTIONS TABLE
-- =====================================================
-- Stores all AI-900 exam questions
CREATE TABLE IF NOT EXISTS ai900_questions (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    options TEXT[] NOT NULL,
    correct_answer TEXT NOT NULL,
    suggested_answer TEXT,
    answer_from_source TEXT,
    is_multiselect BOOLEAN DEFAULT FALSE,
    discussion_link TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai900_questions_id ON ai900_questions(id);
CREATE INDEX IF NOT EXISTS idx_ai900_questions_created_at ON ai900_questions(created_at);

-- =====================================================
-- 2. AI-900 AI CACHE TABLE
-- =====================================================
-- Caches AI-generated explanations and theory for AI-900 questions
CREATE TABLE IF NOT EXISTS ai900_ai_cache (
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
CREATE INDEX IF NOT EXISTS idx_ai900_ai_cache_lookup ON ai900_ai_cache(question_id, language, type);
CREATE INDEX IF NOT EXISTS idx_ai900_ai_cache_created_at ON ai900_ai_cache(created_at);

-- =====================================================
-- 3. AI-900 USER PROGRESS TABLE
-- =====================================================
-- Tracks which AI-900 question each user is currently on
CREATE TABLE IF NOT EXISTS ai900_user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    last_question_index INTEGER NOT NULL DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add index for user lookups
CREATE INDEX IF NOT EXISTS idx_ai900_user_progress_user_id ON ai900_user_progress(user_id);

-- =====================================================
-- 4. AI-900 USER SUBMISSIONS TABLE
-- =====================================================
-- Stores user's answer history for AI-900 questions
CREATE TABLE IF NOT EXISTS ai900_user_submissions (
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
CREATE INDEX IF NOT EXISTS idx_ai900_user_submissions_user_id ON ai900_user_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_ai900_user_submissions_question_id ON ai900_user_submissions(question_id);
CREATE INDEX IF NOT EXISTS idx_ai900_user_submissions_submitted_at ON ai900_user_submissions(submitted_at DESC);

-- =====================================================
-- 5. AI-900 APP SETTINGS TABLE
-- =====================================================
-- Stores AI-900 application-level settings (e.g., API key rotation index)
CREATE TABLE IF NOT EXISTS ai900_app_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all AI-900 tables
ALTER TABLE ai900_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai900_ai_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai900_user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai900_user_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai900_app_settings ENABLE ROW LEVEL SECURITY;

-- AI-900 Questions: Public read access
CREATE POLICY "AI-900 questions are viewable by everyone"
    ON ai900_questions FOR SELECT
    USING (true);

-- AI-900 AI Cache: Public read access (cached content is public)
CREATE POLICY "AI-900 AI cache is viewable by everyone"
    ON ai900_ai_cache FOR SELECT
    USING (true);

-- AI-900 AI Cache: Service role can insert/update
CREATE POLICY "Service role can manage AI-900 AI cache"
    ON ai900_ai_cache FOR ALL
    USING (auth.role() = 'service_role');

-- AI-900 User Progress: Users can only see/update their own progress
CREATE POLICY "Users can view own AI-900 progress"
    ON ai900_user_progress FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI-900 progress"
    ON ai900_user_progress FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI-900 progress"
    ON ai900_user_progress FOR UPDATE
    USING (auth.uid() = user_id);

-- AI-900 User Submissions: Users can only see/insert their own submissions
CREATE POLICY "Users can view own AI-900 submissions"
    ON ai900_user_submissions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own AI-900 submissions"
    ON ai900_user_submissions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- AI-900 App Settings: Public read, service role write
CREATE POLICY "AI-900 app settings are viewable by everyone"
    ON ai900_app_settings FOR SELECT
    USING (true);

CREATE POLICY "Service role can manage AI-900 app settings"
    ON ai900_app_settings FOR ALL
    USING (auth.role() = 'service_role');

-- =====================================================
-- FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update 'updated_at' timestamp
-- (Assuming this function already exists from PMP setup, but creating just in case)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating 'updated_at' on AI-900 tables
DROP TRIGGER IF EXISTS update_ai900_questions_updated_at ON ai900_questions;
CREATE TRIGGER update_ai900_questions_updated_at
    BEFORE UPDATE ON ai900_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai900_ai_cache_updated_at ON ai900_ai_cache;
CREATE TRIGGER update_ai900_ai_cache_updated_at
    BEFORE UPDATE ON ai900_ai_cache
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai900_user_progress_updated_at ON ai900_user_progress;
CREATE TRIGGER update_ai900_user_progress_updated_at
    BEFORE UPDATE ON ai900_user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai900_app_settings_updated_at ON ai900_app_settings;
CREATE TRIGGER update_ai900_app_settings_updated_at
    BEFORE UPDATE ON ai900_app_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- INITIAL DATA
-- =====================================================

-- Insert default AI-900 app settings
INSERT INTO ai900_app_settings (key, value) 
VALUES ('gemini_key_index', '0')
ON CONFLICT (key) DO NOTHING;
