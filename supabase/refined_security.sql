-- ==============================================================================
-- PROJECT: AGRI DRONE SERVICE
-- PURPOSE: REFINED PRODUCTION SECURITY (Strict RBAC)
-- DATE: 2026-01-31
-- DESCRIPTION: Replaces permissive policies with Role-Based Access Control (RBAC)
--              using JWT Phone Claims to link Auth Users to Data.
-- ==============================================================================

-- 1. UTILITY FUNCTIONS
-- Helper to get the phone number from the current JWT (Supabase Auth)
CREATE OR REPLACE FUNCTION public.jwt_phone() RETURNS text 
    LANGUAGE sql STABLE 
    SET search_path = public
    AS $$
    SELECT current_setting('request.jwt.claims', true)::json->>'phone';
$$;

-- Helper to check if current user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean 
    LANGUAGE sql SECURITY DEFINER 
    SET search_path = public
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.admins 
        WHERE phone = public.jwt_phone()
    );
$$;

-- Helper to check if current user is an Operator
CREATE OR REPLACE FUNCTION public.is_operator() RETURNS boolean 
    LANGUAGE sql SECURITY DEFINER 
    SET search_path = public
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.operators 
        WHERE phone = public.jwt_phone()
    );
$$;


-- 2. RESET POLICIES (Clean Slate)
-- We must drop ALL potential prior policies to avoid "Multiple Permissive Policies" conflicts.

-- Farmers Tables
DROP POLICY IF EXISTS "Allow authenticated modify on farmers" ON public.farmers;
DROP POLICY IF EXISTS "Allow public insert on farmers" ON public.farmers;
DROP POLICY IF EXISTS "Allow public read access on farmers" ON public.farmers;
DROP POLICY IF EXISTS "Authenticated Update Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Farmers can view own profile" ON public.farmers;
DROP POLICY IF EXISTS "Public Insert Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Public Read Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Unified farmers access" ON public.farmers;
DROP POLICY IF EXISTS "Insert Farmers" ON public.farmers;
DROP POLICY IF EXISTS "Update Farmers" ON public.farmers;

-- Operators Table
DROP POLICY IF EXISTS "Allow authenticated delete on operators" ON public.operators;
DROP POLICY IF EXISTS "Allow authenticated insert on operators" ON public.operators;
DROP POLICY IF EXISTS "Allow authenticated modify on operators" ON public.operators;
DROP POLICY IF EXISTS "Allow public insert on operators" ON public.operators;
DROP POLICY IF EXISTS "Allow public read access on operators" ON public.operators;
DROP POLICY IF EXISTS "Authenticated Update Operators" ON public.operators;
DROP POLICY IF EXISTS "Operators can view own profile" ON public.operators;
DROP POLICY IF EXISTS "Public Read Operators" ON public.operators;
DROP POLICY IF EXISTS "Unified operators access" ON public.operators;
DROP POLICY IF EXISTS "Insert Operators" ON public.operators;
DROP POLICY IF EXISTS "Update Operators" ON public.operators;
DROP POLICY IF EXISTS "Delete Operators" ON public.operators;

-- Jobs Table
DROP POLICY IF EXISTS "Allow authenticated full access on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow public full access on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Allow public insert on jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated Update Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Authenticated View Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Farmers Insert Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Farmers can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Unified jobs access" ON public.jobs;
DROP POLICY IF EXISTS "View Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Insert Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Modify Jobs" ON public.jobs;
DROP POLICY IF EXISTS "Delete Jobs" ON public.jobs;

-- Admins Table
DROP POLICY IF EXISTS "Admins can view everything" ON public.admins;
DROP POLICY IF EXISTS "Admins have full access" ON public.admins;
DROP POLICY IF EXISTS "Allow authenticated modify on admins" ON public.admins;
DROP POLICY IF EXISTS "Allow public read access on admins" ON public.admins;
DROP POLICY IF EXISTS "Public Read Admins" ON public.admins;
DROP POLICY IF EXISTS "Admins Modify Admins" ON public.admins;
DROP POLICY IF EXISTS "Admins Insert Admins" ON public.admins;
DROP POLICY IF EXISTS "Admins Update Admins" ON public.admins;
DROP POLICY IF EXISTS "Admins Delete Admins" ON public.admins;


-- 3. DEFINE STRICT POLICIES

-- ---- TABLE: ADMINS ----
-- Read: Public (needed for is_admin check logic effectively, or at least login)
CREATE POLICY "Public Read Admins" ON public.admins FOR SELECT TO public USING (true);
-- Write: ONLY Existing Admins can add/edit Admins.
-- We split this into INSERT/UPDATE/DELETE to avoid overlap with "Public Read" (SELECT)
CREATE POLICY "Admins Insert Admins" ON public.admins FOR INSERT TO authenticated 
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins Update Admins" ON public.admins FOR UPDATE TO authenticated 
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

CREATE POLICY "Admins Delete Admins" ON public.admins FOR DELETE TO authenticated 
    USING (public.is_admin());


-- ---- TABLE: OPERATORS ----
-- Read: Authenticated (Admins need to manage, Farmers need to see assigned?) 
-- Actually, Manual Booking needs to "getAvailableOperators", so Public Read found useful.
CREATE POLICY "Public Read Operators" ON public.operators FOR SELECT TO public USING (true);

-- Insert: Authenticated Users (Self-Signup) OR Admins
CREATE POLICY "Insert Operators" ON public.operators FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin() OR 
        phone = public.jwt_phone() -- Can only insert OWN phone
    );

-- Update: Admins OR Self
CREATE POLICY "Update Operators" ON public.operators FOR UPDATE TO authenticated 
    USING (public.is_admin() OR phone = public.jwt_phone())
    WITH CHECK (public.is_admin() OR phone = public.jwt_phone());

-- Delete: Admins Only
CREATE POLICY "Delete Operators" ON public.operators FOR DELETE TO authenticated 
    USING (public.is_admin());


-- ---- TABLE: FARMERS ----
-- Read: Public (Used for Login checks 'checkUserExists')
CREATE POLICY "Public Read Farmers" ON public.farmers FOR SELECT TO public USING (true);

-- Insert: Authenticated (Self-Signup) OR Admins
CREATE POLICY "Insert Farmers" ON public.farmers FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin() OR 
        phone = public.jwt_phone() -- Can only insert OWN phone
    );

-- Update: Admins OR Self
-- Note: IVR Leads are updated by Admins. Farmers update themselves.
CREATE POLICY "Update Farmers" ON public.farmers FOR UPDATE TO authenticated 
    USING (public.is_admin() OR phone = public.jwt_phone())
    WITH CHECK (public.is_admin() OR phone = public.jwt_phone());


-- ---- TABLE: JOBS (BOOKINGS) ----
-- Read: Admins, Operators, or Own Jobs
CREATE POLICY "View Jobs" ON public.jobs FOR SELECT TO authenticated 
    USING (
        public.is_admin() OR 
        public.is_operator() OR 
        farmer_phone = public.jwt_phone() -- Own jobs
    );

-- Insert: Admins, Operators, or Own Jobs
CREATE POLICY "Insert Jobs" ON public.jobs FOR INSERT TO authenticated 
    WITH CHECK (
        public.is_admin() OR 
        public.is_operator() OR 
        farmer_phone = public.jwt_phone()
    );

-- Update: Admins or Operators (Assign/Complete)
-- Farmers generally don't update jobs once placed (maybe cancel? but let's restrict for safety)
CREATE POLICY "Modify Jobs" ON public.jobs FOR UPDATE TO authenticated 
    USING (public.is_admin() OR public.is_operator())
    WITH CHECK (public.is_admin() OR public.is_operator());

-- Delete: Admins Only
CREATE POLICY "Delete Jobs" ON public.jobs FOR DELETE TO authenticated 
    USING (public.is_admin());


-- 4. GRANT PERMISSIONS
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
-- Public needs SELECT for login checks (User Exists?)
GRANT SELECT ON public.farmers TO anon;
GRANT SELECT ON public.operators TO anon;
GRANT SELECT ON public.admins TO anon;

-- Force schema reload
NOTIFY pgrst, 'reload config';
