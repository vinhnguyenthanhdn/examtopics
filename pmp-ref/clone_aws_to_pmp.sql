-- =====================================================
-- CLONE AWS QUESTIONS TO PMP QUESTIONS
-- =====================================================
-- This script copies all questions from AWS table to PMP table
-- Run this in Supabase SQL Editor AFTER running pmp_database_setup.sql

-- Step 1: Check how many AWS questions exist
SELECT COUNT(*) as aws_question_count FROM questions;

-- Step 2: Clone all AWS questions to PMP table
INSERT INTO pmp_questions (
    id, 
    question, 
    options, 
    correct_answer, 
    is_multiselect, 
    discussion_link,
    created_at,
    updated_at
)
SELECT 
    id, 
    question, 
    options, 
    correct_answer, 
    is_multiselect, 
    discussion_link,
    created_at,
    updated_at
FROM questions
ON CONFLICT (id) DO NOTHING;

-- Step 3: Verify PMP questions were copied
SELECT COUNT(*) as pmp_question_count FROM pmp_questions;

-- Step 4: Show first 5 PMP questions
SELECT id, LEFT(question, 50) as question_preview 
FROM pmp_questions 
ORDER BY id 
LIMIT 5;
