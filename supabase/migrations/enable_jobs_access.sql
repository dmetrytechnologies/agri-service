-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- 1. Allow Public (anon) FULL ACCESS (Simulated Auth requires this)
-- Since the app does not use Supabase Auth, all requests come as 'anon'.
-- We must allow anon to do everything on the jobs table.

DROP POLICY IF EXISTS "Allow public full access on jobs" ON public.jobs;
CREATE POLICY "Allow public full access on jobs"
ON public.jobs
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 2. Grant Permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO service_role;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
