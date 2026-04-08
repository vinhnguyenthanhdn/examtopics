-- Enable RLS on the table if it's not already enabled (optional, good practice)
ALTER TABLE pmp_user_submissions ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see their OWN submissions (likely already exists, but included for completeness)
CREATE POLICY "Users can view their own submissions" 
ON pmp_user_submissions FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow ADMINS to see ALL submissions
-- This assumes you have a 'profiles' table with a 'role' column
CREATE POLICY "Admins can view all submissions" 
ON pmp_user_submissions FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.role = 'admin'
  )
);
