-- Cleanup redundant policies identified by Supabase Linter
-- These policies are likely leftovers from early development ("Enable all access...")
-- and clash with the refined policies we are trying to enforce.

-- Table: public.admins
DROP POLICY IF EXISTS "Public Read Access" ON public.admins;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.admins;

-- Table: public.farmers
DROP POLICY IF EXISTS "Public Read Access" ON public.farmers;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.farmers;

-- Table: public.operators
DROP POLICY IF EXISTS "Public Read Access" ON public.operators;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.operators;

-- Table: public.jobs
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON public.jobs;
