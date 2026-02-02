-- Enable DELETE for admins on farmers table
CREATE POLICY "Enable delete for admins" ON "public"."farmers"
AS PERMISSIVE FOR DELETE
TO authenticated
USING ((( SELECT auth.jwt() AS jwt) ->> 'phone'::text) IN ( SELECT admins.phone FROM admins));

-- Enable DELETE for admins on jobs table (to clean up associated bookings)
CREATE POLICY "Enable delete for admins" ON "public"."jobs"
AS PERMISSIVE FOR DELETE
TO authenticated
USING ((( SELECT auth.jwt() AS jwt) ->> 'phone'::text) IN ( SELECT admins.phone FROM admins));
