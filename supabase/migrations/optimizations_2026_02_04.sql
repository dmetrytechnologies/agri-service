-- Optimizations for Auth Performance
-- 1. Indexes for faster phone lookups
CREATE INDEX IF NOT EXISTS idx_admins_phone ON public.admins(phone);
CREATE INDEX IF NOT EXISTS idx_operators_phone ON public.operators(phone);
CREATE INDEX IF NOT EXISTS idx_farmers_phone ON public.farmers(phone);

-- 2. RPC Function to get user profile in one shot
--    This replaces 3 separate client-side queries with 1 server-side executing plan.
CREATE OR REPLACE FUNCTION public.get_user_profile(phone_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with db owner permissions to bypass RLS for this specific lookup
SET search_path = public
AS $$
DECLARE
    result jsonb;
    clean_phone text;
BEGIN
    -- Normalize phone input (just in case, though client should do it too)
    -- Remove non-digits and take last 10
    clean_phone := RIGHT(REGEXP_REPLACE(phone_input, '\D', '', 'g'), 10);

    -- 1. Check Admins
    SELECT json_build_object(
        'name', name,
        'role', 'admin',
        'phone', phone
    )::jsonb INTO result
    FROM public.admins
    WHERE phone = clean_phone
    LIMIT 1;

    IF result IS NOT NULL THEN
        RETURN result;
    END IF;

    -- 2. Check Operators
    SELECT json_build_object(
        'name', name,
        'role', 'operator',
        'phone', phone,
        'address', location, -- Mapping location -> address
        'district', district,
        'service_pincodes', service_pincodes,
        'service_villages', service_villages
    )::jsonb INTO result
    FROM public.operators
    WHERE phone = clean_phone
    LIMIT 1;

    IF result IS NOT NULL THEN
        RETURN result;
    END IF;

    -- 3. Check Farmers
    SELECT json_build_object(
        'name', name,
        'role', 'farmer',
        'phone', phone,
        'address', address,
        'pincode', pincode,
        'village', village,
        'district', district
    )::jsonb INTO result
    FROM public.farmers
    WHERE phone = clean_phone
    LIMIT 1;

    -- Will be null if not found in any
    RETURN result;
END;
$$;

-- Grant access to anon and authenticated (needed for login and profile fetch)
GRANT EXECUTE ON FUNCTION public.get_user_profile(text) TO anon, authenticated, service_role;
