-- ==============================================================================
-- FIX: PHONE NUMBER MISMATCH IN RLS POLICIES
-- DATE: 2026-02-03
-- DESCRIPTION: default JWT phone includes country code (+91), but DB uses 10 digits.
--              We update policies to compare the LAST 10 DIGITS.
-- ==============================================================================

-- 1. UTILITY FUNCTIONS - Update to use 10-digit comparison

-- Helper to check if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean 
    LANGUAGE sql SECURITY DEFINER 
    SET search_path = public
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins 
        WHERE right(phone, 10) = right(public.jwt_phone(), 10)
    );
$$;

-- Helper to check if current user is an Operator
CREATE OR REPLACE FUNCTION public.is_operator() RETURNS boolean 
    LANGUAGE sql SECURITY DEFINER 
    SET search_path = public
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.operators 
        WHERE right(phone, 10) = right(public.jwt_phone(), 10)
    );
$$;


-- 2. OPERATORS POLICIES

DROP POLICY IF EXISTS "Insert Operators" ON public.operators;
CREATE POLICY "Insert Operators" ON public.operators FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin() OR 
        right(phone, 10) = right(public.jwt_phone(), 10)
    );

DROP POLICY IF EXISTS "Update Operators" ON public.operators;
CREATE POLICY "Update Operators" ON public.operators FOR UPDATE TO authenticated 
    USING (public.is_admin() OR right(phone, 10) = right(public.jwt_phone(), 10))
    WITH CHECK (public.is_admin() OR right(phone, 10) = right(public.jwt_phone(), 10));


-- 3. FARMERS POLICIES

DROP POLICY IF EXISTS "Insert Farmers" ON public.farmers;
CREATE POLICY "Insert Farmers" ON public.farmers FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin() OR 
        right(phone, 10) = right(public.jwt_phone(), 10)
    );

DROP POLICY IF EXISTS "Update Farmers" ON public.farmers;
CREATE POLICY "Update Farmers" ON public.farmers FOR UPDATE TO authenticated 
    USING (public.is_admin() OR right(phone, 10) = right(public.jwt_phone(), 10))
    WITH CHECK (public.is_admin() OR right(phone, 10) = right(public.jwt_phone(), 10));


-- 4. JOBS POLICIES (Also beneficial to standardise)

DROP POLICY IF EXISTS "View Jobs" ON public.jobs;
CREATE POLICY "View Jobs" ON public.jobs FOR SELECT TO authenticated 
    USING (
        public.is_admin() OR 
        public.is_operator() OR 
        right(farmer_phone, 10) = right(public.jwt_phone(), 10)
    );

DROP POLICY IF EXISTS "Insert Jobs" ON public.jobs;
CREATE POLICY "Insert Jobs" ON public.jobs FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin() OR 
        public.is_operator() OR 
        right(farmer_phone, 10) = right(public.jwt_phone(), 10)
    );


-- Force schema reload
NOTIFY pgrst, 'reload config';
