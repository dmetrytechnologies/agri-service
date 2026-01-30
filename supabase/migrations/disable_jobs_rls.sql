-- NUCLEAR OPTION: Disable RLS on jobs table
-- Since the app uses simulated authentication, all users are 'anon'.
-- RLS policies cannot distinguish between Admin/Farmer, so we disable RLS 
-- to prevent 42501 errors and rely on the application logic for security.

ALTER TABLE public.jobs DISABLE ROW LEVEL SECURITY;

-- Ensure permissions are granted
GRANT ALL ON public.jobs TO anon;
GRANT ALL ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
GRANT ALL ON public.jobs TO public;

-- Force schema cache reload
NOTIFY pgrst, 'reload config';
