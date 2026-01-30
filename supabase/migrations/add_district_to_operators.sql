-- Add district column to operators table if it doesn't exist
ALTER TABLE public.operators 
ADD COLUMN IF NOT EXISTS district text;

-- Add comment
COMMENT ON COLUMN public.operators.district IS 'District of the operator';
