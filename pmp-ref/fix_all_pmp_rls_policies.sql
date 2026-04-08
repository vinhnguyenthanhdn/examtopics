-- =====================================================
-- FIX RLS POLICIES FOR ALL PMP TABLES
-- =====================================================
-- This script fixes RLS policies to allow anon users to write data
-- Needed for: AI cache, user progress, user submissions, app settings

-- =====================================================
-- 1. PMP_AI_CACHE - Allow INSERT/UPDATE for caching
-- =====================================================
DROP POLICY IF EXISTS "PMP AI cache is viewable by everyone" ON pmp_ai_cache;
DROP POLICY IF EXISTS "Service role can manage PMP AI cache" ON pmp_ai_cache;
DROP POLICY IF EXISTS "Anyone can insert PMP AI cache" ON pmp_ai_cache;
DROP POLICY IF EXISTS "Anyone can update PMP AI cache" ON pmp_ai_cache;

-- Public read
CREATE POLICY "PMP AI cache is viewable by everyone"
    ON pmp_ai_cache FOR SELECT
    USING (true);

-- Service role full access
CREATE POLICY "Service role can manage PMP AI cache"
    ON pmp_ai_cache FOR ALL
    USING (auth.role() = 'service_role');

-- Allow INSERT for caching (anon users)
CREATE POLICY "Anyone can insert PMP AI cache"
    ON pmp_ai_cache FOR INSERT
    WITH CHECK (true);

-- Allow UPDATE for caching (anon users)
CREATE POLICY "Anyone can update PMP AI cache"
    ON pmp_ai_cache FOR UPDATE
    USING (true);

-- =====================================================
-- 2. PMP_APP_SETTINGS - Allow UPDATE for API key rotation
-- =====================================================
DROP POLICY IF EXISTS "PMP app settings are viewable by everyone" ON pmp_app_settings;
DROP POLICY IF EXISTS "Service role can manage PMP app settings" ON pmp_app_settings;
DROP POLICY IF EXISTS "Anyone can update PMP app settings" ON pmp_app_settings;

-- Public read
CREATE POLICY "PMP app settings are viewable by everyone"
    ON pmp_app_settings FOR SELECT
    USING (true);

-- Service role full access
CREATE POLICY "Service role can manage PMP app settings"
    ON pmp_app_settings FOR ALL
    USING (auth.role() = 'service_role');

-- Allow UPDATE for API key rotation (anon users)
CREATE POLICY "Anyone can update PMP app settings"
    ON pmp_app_settings FOR UPDATE
    USING (true);

-- Allow INSERT for initial settings (anon users)
CREATE POLICY "Anyone can insert PMP app settings"
    ON pmp_app_settings FOR INSERT
    WITH CHECK (true);

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Check all PMP policies
SELECT 
    tablename,
    policyname,
    cmd,
    CASE 
        WHEN qual IS NOT NULL THEN 'USING: ' || qual
        WHEN with_check IS NOT NULL THEN 'WITH CHECK: ' || with_check
        ELSE 'No condition'
    END as condition
FROM pg_policies 
WHERE schemaname = 'public'
  AND tablename LIKE 'pmp_%'
ORDER BY tablename, cmd, policyname;
