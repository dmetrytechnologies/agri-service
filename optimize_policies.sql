-- ==============================================================================
-- CLEANUP: REMOVE REDUNDANT POLICIES
-- DATE: 2026-02-03
-- DESCRIPTION: Drops "Enable ... for admins" policies because the new unified 
--              policies (e.g., "Insert Farmers") already include checks for:
--              "public.is_admin() OR ..."
--              Removing these duplicates fixes the "Multiple Permissive Policies" warning.
-- ==============================================================================

-- 1. FARMERS
DROP POLICY IF EXISTS "Enable insert for admins" ON public.farmers;
DROP POLICY IF EXISTS "Enable update for admins" ON public.farmers;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.farmers;

-- 2. OPERATORS
DROP POLICY IF EXISTS "Enable insert for admins" ON public.operators;
DROP POLICY IF EXISTS "Enable update for admins" ON public.operators;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.operators;

-- 3. JOBS
DROP POLICY IF EXISTS "Enable insert for admins" ON public.jobs;
DROP POLICY IF EXISTS "Enable update for admins" ON public.jobs;
DROP POLICY IF EXISTS "Enable delete for admins" ON public.jobs;

-- Force schema reload to apply changes immediately
NOTIFY pgrst, 'reload config';
