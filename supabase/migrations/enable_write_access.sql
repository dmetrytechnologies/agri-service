
-- Enable WRITE access for Operators
-- 1. Allow Public (anon) to INSERT (for Signup)
DROP POLICY IF EXISTS "Allow public insert on operators" ON operators;
CREATE POLICY "Allow public insert on operators" 
ON operators FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Allow Authenticated users (Admins) to INSERT (for Admin Dashboard "Add Operator")
DROP POLICY IF EXISTS "Allow authenticated insert on operators" ON operators;
CREATE POLICY "Allow authenticated insert on operators" 
ON operators FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- 3. Allow Authenticated users to UPDATE/DELETE
DROP POLICY IF EXISTS "Allow authenticated modify on operators" ON operators;
CREATE POLICY "Allow authenticated modify on operators" 
ON operators FOR UPDATE
TO authenticated 
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete on operators" ON operators;
CREATE POLICY "Allow authenticated delete on operators" 
ON operators FOR DELETE
TO authenticated 
USING (true);


-- Enable WRITE access for Farmers
-- 1. Allow Public (anon) to INSERT (for Signup)
DROP POLICY IF EXISTS "Allow public insert on farmers" ON farmers;
CREATE POLICY "Allow public insert on farmers" 
ON farmers FOR INSERT 
TO public 
WITH CHECK (true);

-- 2. Allow Authenticated users to UPDATE/DELETE
DROP POLICY IF EXISTS "Allow authenticated modify on farmers" ON farmers;
CREATE POLICY "Allow authenticated modify on farmers" 
ON farmers FOR UPDATE
TO authenticated 
USING (true)
WITH CHECK (true);

-- Enable WRITE access for Admins
-- (Usually only created manually or via initial seed, but good to have)
DROP POLICY IF EXISTS "Allow authenticated modify on admins" ON admins;
CREATE POLICY "Allow authenticated modify on admins" 
ON admins FOR ALL
TO authenticated 
USING (true)
WITH CHECK (true);
