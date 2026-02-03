-- Fix Function Search Path Mutable Warnings
-- We set the search_path to 'public' explicitly for these functions to prevent search_path hijacking.

ALTER FUNCTION public.generate_random_string(integer) SET search_path = public;
ALTER FUNCTION public.generate_farmer_id() SET search_path = public;
ALTER FUNCTION public.generate_operator_id() SET search_path = public;

-- Note: The "Leaked Password Protection" warning must be enabled in the Supabase Dashboard:
-- Go to Authentication -> Security -> Password protection -> Enable "Leaked password protection"
