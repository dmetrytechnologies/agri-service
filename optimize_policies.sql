-- Drop inefficient policies first
-- Farmers
DROP POLICY IF EXISTS "Enable insert for admins" ON "public"."farmers";
DROP POLICY IF EXISTS "Enable update for admins" ON "public"."farmers";

-- Operators
DROP POLICY IF EXISTS "Enable insert for admins" ON "public"."operators";
DROP POLICY IF EXISTS "Enable update for admins" ON "public"."operators";

-- Jobs
DROP POLICY IF EXISTS "Enable insert for admins" ON "public"."jobs";
DROP POLICY IF EXISTS "Enable update for admins" ON "public"."jobs";

-- Re-create with Optimizations
-- Use (select auth.jwt()) pattern to ensure it runs as an InitPlan (once per query) instead of per-row.

-- FARMERS
CREATE POLICY "Enable insert for admins" ON "public"."farmers"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
);

CREATE POLICY "Enable update for admins" ON "public"."farmers"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
);

-- OPERATORS
CREATE POLICY "Enable insert for admins" ON "public"."operators"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
);

CREATE POLICY "Enable update for admins" ON "public"."operators"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
);

-- JOBS
CREATE POLICY "Enable insert for admins" ON "public"."jobs"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
);

CREATE POLICY "Enable update for admins" ON "public"."jobs"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE right(admins.phone, 10) = right(((select auth.jwt()) ->> 'phone'), 10)
  )
);
