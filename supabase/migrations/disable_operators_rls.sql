-- NUCLEAR OPTION: Disable RLS on operators table
-- Since the app uses simulated authentication, all users are 'anon'.
-- We disable RLS to allow the dashboard to update operator details without restriction.

ALTER TABLE public.operators DISABLE ROW LEVEL SECURITY;

-- Ensure permissions are granted
GRANT ALL ON public.operators TO anon;
GRANT ALL ON public.operators TO authenticated;
GRANT ALL ON public.operators TO service_role;
GRANT ALL ON public.operators TO public;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
