-- Add available_dates column if it doesn't exist
ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS available_dates text[] DEFAULT '{}';

-- Ensure district column exists (re-run safe)
ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS district text;

-- Ensure service_villages column exists (re-run safe)
ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS service_villages text[] DEFAULT '{}';

-- Add comments for clarity
COMMENT ON COLUMN public.operators.available_dates IS 'List of dates when the operator is available';
COMMENT ON COLUMN public.operators.district IS 'District where the operator is based';
COMMENT ON COLUMN public.operators.service_villages IS 'List of villages the operator serves';

-- Notify PostgREST to reload schema cache
NOTIFY pgrst, 'reload config';
