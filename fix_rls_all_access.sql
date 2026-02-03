-- CRITICAL RLS FIX
-- This script grants FULL ACCESS (Insert, Update, Delete, Select) to all authenticated users (Admins)
-- This ensures that "Add Farmer", "Add Pilot", "Delete", etc., will ALWAYS work for logged-in users.

-- 1. FARMERS TABLE
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.farmers;
DROP POLICY IF EXISTS "Insert Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Update Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Delete Farmers" ON public.farmers;
-- Re-create a single catch-all policy
CREATE POLICY "Enable all access for authenticated users" ON public.farmers
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 2. OPERATORS TABLE
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.operators;
DROP POLICY IF EXISTS "Delete Operators" ON public.operators;
-- Re-create a single catch-all policy
CREATE POLICY "Enable all access for authenticated users" ON public.operators
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 3. JOBS (BOOKINGS) TABLE
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.jobs;
DROP POLICY IF EXISTS "Delete Jobs" ON public.jobs;
-- Re-create a single catch-all policy
CREATE POLICY "Enable all access for authenticated users" ON public.jobs
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 4. ADMINS TABLE (To ensure profile checks work)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.admins;
CREATE POLICY "Enable all access for authenticated users" ON public.admins
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);
