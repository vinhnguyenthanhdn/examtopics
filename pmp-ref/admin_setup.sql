-- Enable RLS on profiles if not already enabled (it is, but good to ensure)
alter table public.profiles enable row level security;

-- Policy to allow Admins to read all profiles (Select is already "true" for all, so this is fine)

-- Policy to allow Admins to update any profile
-- This checks if the user performing the update has 'admin' role in their own profile
create policy "Admins can update all profiles"
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Policy to allow Admins to delete profiles (if you want delete functionality)
create policy "Admins can delete profiles"
  on profiles for delete
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Helper query to make yourself an admin (Replace YOUR_EMAIL_HERE with your actual email)
-- update public.profiles set role = 'admin', is_approved = true where email = 'YOUR_EMAIL_HERE';
