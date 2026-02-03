-- Enable INSERT for admins on farmers table
CREATE POLICY "Enable insert for admins" ON "public"."farmers"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);

-- Enable UPDATE for admins on farmers table
CREATE POLICY "Enable update for admins" ON "public"."farmers"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
)
WITH CHECK (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);

-- Enable INSERT for admins on operators table
CREATE POLICY "Enable insert for admins" ON "public"."operators"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);

-- Enable UPDATE for admins on operators table
CREATE POLICY "Enable update for admins" ON "public"."operators"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
)
WITH CHECK (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);

-- Enable INSERT for admins on jobs table
CREATE POLICY "Enable insert for admins" ON "public"."jobs"
AS PERMISSIVE FOR INSERT
TO authenticated
WITH CHECK (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);

-- Enable UPDATE for admins on jobs table
CREATE POLICY "Enable update for admins" ON "public"."jobs"
AS PERMISSIVE FOR UPDATE
TO authenticated
USING (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
)
WITH CHECK (
  right(((current_setting('request.jwt.claims'::text, true)::jsonb) ->> 'phone'::text), 10) 
  IN (SELECT right(phone, 10) FROM admins)
);
