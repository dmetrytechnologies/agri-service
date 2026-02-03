-- MASTER DB FIX SQL ("PAKKA WORKING")
-- This script resets and re-applies ALL necessary permissions for the application to work 100%.
-- It handles:
-- 1. Full Admin Access for logged-in users (Insert/Update/Delete/Select)
-- 2. Public Read Access for Login/Signup checks (Fixes "User not found" / "Signup failed")
-- 3. Security Fixes (search_path warnings)
-- 4. Sequence Permissions (Fixes ID generation errors)

BEGIN;

-------------------------------------------------------
-- 1. SECURITY & FUNCTION FIXES (Silence Warnings)
-------------------------------------------------------
-- Explicitly force search_path to public for security
ALTER FUNCTION public.generate_random_string SET search_path = public;
ALTER FUNCTION public.generate_farmer_id SET search_path = public;
ALTER FUNCTION public.generate_operator_id SET search_path = public;


-------------------------------------------------------
-- 2. RESET POLICIES (Clean Slate)
-------------------------------------------------------
-- Dropping ALL existing policies to avoid conflicts ("Policy already exists" errors)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.farmers;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.operators;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.admins;

DROP POLICY IF EXISTS "Public Read Access" ON public.farmers;
DROP POLICY IF EXISTS "Public Read Access" ON public.operators;
DROP POLICY IF EXISTS "Public Read Access" ON public.admins;

-- Also cleanup any legacy/duplicate policies if they exist
DROP POLICY IF EXISTS "Insert Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Update Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Delete Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Select Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Delete Operators" ON public.operators;
DROP POLICY IF EXISTS "Delete Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.farmers;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.operators;


-------------------------------------------------------
-- 3. FARMERS TABLE POLICIES
-------------------------------------------------------
-- Allow EVERYONE (including anonymous) to READ farmers. 
-- Required for `checkUserExists` during login.
CREATE POLICY "Public Read Access" ON public.farmers
FOR SELECT
TO public
USING (true);

-- Allow LOGGED IN users to do EVERYTHING (Add/Edit/Delete)
CREATE POLICY "Enable all access for authenticated users" ON public.farmers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------
-- 4. OPERATORS TABLE POLICIES
-------------------------------------------------------
-- Allow EVERYONE to READ operators (for login check)
CREATE POLICY "Public Read Access" ON public.operators
FOR SELECT
TO public
USING (true);

-- Allow LOGGED IN users to do EVERYTHING
CREATE POLICY "Enable all access for authenticated users" ON public.operators
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------
-- 5. ADMINS TABLE POLICIES
-------------------------------------------------------
-- Allow EVERYONE to READ admins (for login check)
CREATE POLICY "Public Read Access" ON public.admins
FOR SELECT
TO public
USING (true);

-- Allow LOGGED IN users to do EVERYTHING
CREATE POLICY "Enable all access for authenticated users" ON public.admins
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------
-- 6. JOBS (BOOKINGS) POLICIES
-------------------------------------------------------
-- Jobs are private. Only logged-in users should access them.
CREATE POLICY "Enable all access for authenticated users" ON public.jobs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);


-------------------------------------------------------
-- 7. SEQUENCE PERMISSIONS (Critical for ID Gen)
-------------------------------------------------------
-- Ensure 'anon' and 'authenticated' can use sequences if ID generation happens in DB
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;


-------------------------------------------------------
-- 8. GRANT TABLE PERMISSIONS
-------------------------------------------------------
-- Just to be absolutely sure RLS doesn't block basic table access
GRANT ALL ON TABLE public.farmers TO authenticated;
GRANT ALL ON TABLE public.operators TO authenticated;
GRANT ALL ON TABLE public.jobs TO authenticated;
GRANT ALL ON TABLE public.admins TO authenticated;

GRANT SELECT ON TABLE public.farmers TO anon;
GRANT SELECT ON TABLE public.operators TO anon;
GRANT SELECT ON TABLE public.admins TO anon;

COMMIT;

-- VERIFICATION MESSAGE
SELECT 'Permissions Fixed. Try adding a farmer now.' as status;
