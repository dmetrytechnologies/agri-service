-- Add display_id column to jobs table
ALTER TABLE public.jobs ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- Create a function to generate random string
CREATE OR REPLACE FUNCTION generate_random_string(length INTEGER) RETURNS TEXT AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER := 0;
BEGIN
  FOR i IN 1..length LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Backfill existing jobs with a display_id if null
-- Format: BK-{YYYYMM}-{RANDOM4}
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT id, created_at FROM public.jobs WHERE display_id IS NULL LOOP
    UPDATE public.jobs
    SET display_id = 'BK-' || to_char(r.created_at, 'YYYYMM') || '-' || generate_random_string(4)
    WHERE id = r.id;
  END LOOP;
END $$;
