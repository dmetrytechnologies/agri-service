-- Consolidated Schema Fix
-- Run this entire script in the Supabase SQL Editor

-- 1. Ensure all columns exist (Idempotent operations)
ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS district text;

ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS available_dates text[] DEFAULT '{}';

ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS service_villages text[] DEFAULT '{}';

ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS service_pincodes text[] DEFAULT '{}';

-- 2. Verify and Repair Permissions
-- Grant access to authenticated users (admin/operators)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operators TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.operators TO service_role;

-- Grant access to public (if needed for anon signup/read)
GRANT SELECT, INSERT ON public.operators TO public;

-- 3. Force Schema Caches to Reload
NOTIFY pgrst, 'reload config';
