-- =====================================================
-- FIX RLS POLICIES FOR PMP_QUESTIONS
-- =====================================================
-- This script adds INSERT policy for pmp_questions table
-- to allow importing questions via anon key

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "PMP questions are viewable by everyone" ON pmp_questions;
DROP POLICY IF EXISTS "Service role can manage PMP questions" ON pmp_questions;
DROP POLICY IF EXISTS "Anyone can insert PMP questions" ON pmp_questions;

-- Recreate policies with proper permissions

-- 1. Public read access (SELECT)
CREATE POLICY "PMP questions are viewable by everyone"
    ON pmp_questions FOR SELECT
    USING (true);

-- 2. Service role can do everything
CREATE POLICY "Service role can manage PMP questions"
    ON pmp_questions FOR ALL
    USING (auth.role() = 'service_role');

-- 3. Allow INSERT for anon users (for importing)
-- This is needed for the Python import script
CREATE POLICY "Anyone can insert PMP questions"
    ON pmp_questions FOR INSERT
    WITH CHECK (true);

-- 4. Allow UPDATE for anon users (for upsert during import)
CREATE POLICY "Anyone can update PMP questions"
    ON pmp_questions FOR UPDATE
    USING (true);

-- Verify policies
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'pmp_questions'
ORDER BY policyname;
