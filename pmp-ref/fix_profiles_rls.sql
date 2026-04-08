-- Enable RLS on profiles if not already enabled (it should be)
alter table profiles enable row level security;

-- Drop the policy if it exists to avoid errors on re-run
drop policy if exists "Admins can update any profile" on profiles;

-- Create policy to allow admins to update any profile
-- This relies on the "Public profiles are viewable by everyone" policy for the subquery
create policy "Admins can update any profile"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Verify the policies
select * from pg_policies where tablename = 'profiles';
