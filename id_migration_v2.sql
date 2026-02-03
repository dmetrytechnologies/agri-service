-- 1. Create Sequences
CREATE SEQUENCE IF NOT EXISTS farmer_id_seq START 1;
CREATE SEQUENCE IF NOT EXISTS operator_id_seq START 1;

-- 2. Add display_id columns
ALTER TABLE public.farmers ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;
ALTER TABLE public.operators ADD COLUMN IF NOT EXISTS display_id TEXT UNIQUE;

-- 3. Functions to generate ID
CREATE OR REPLACE FUNCTION generate_farmer_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.display_id := 'FAM' || LPAD(nextval('farmer_id_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION generate_operator_id() RETURNS TRIGGER AS $$
BEGIN
    NEW.display_id := 'DRO' || LPAD(nextval('operator_id_seq')::TEXT, 4, '0');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Triggers (Run BEFORE INSERT)
DROP TRIGGER IF EXISTS set_farmer_id ON public.farmers;
CREATE TRIGGER set_farmer_id
    BEFORE INSERT ON public.farmers
    FOR EACH ROW
    WHEN (NEW.display_id IS NULL)
    EXECUTE FUNCTION generate_farmer_id();

DROP TRIGGER IF EXISTS set_operator_id ON public.operators;
CREATE TRIGGER set_operator_id
    BEFORE INSERT ON public.operators
    FOR EACH ROW
    WHEN (NEW.display_id IS NULL)
    EXECUTE FUNCTION generate_operator_id();

-- 5. Backfill Existing Data
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Backfill Farmers
    FOR r IN SELECT id FROM public.farmers WHERE display_id IS NULL ORDER BY created_at ASC LOOP
        UPDATE public.farmers
        SET display_id = 'FAM' || LPAD(nextval('farmer_id_seq')::TEXT, 4, '0')
        WHERE id = r.id;
    END LOOP;

    -- Backfill Operators
    FOR r IN SELECT id FROM public.operators WHERE display_id IS NULL ORDER BY created_at ASC LOOP
        UPDATE public.operators
        SET display_id = 'DRO' || LPAD(nextval('operator_id_seq')::TEXT, 4, '0')
        WHERE id = r.id;
    END LOOP;
END $$;
