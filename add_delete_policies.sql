-- Enable DELETE for admins on farmers table
-- Uses right(phone, 10) to match last 10 digits, handling +91 prefix differences
CREATE POLICY "Enable delete for admins" ON "public"."farmers"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);

-- Enable DELETE for admins on jobs table
CREATE POLICY "Enable delete for admins" ON "public"."jobs"
AS PERMISSIVE FOR DELETE
TO authenticated
USING (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);
