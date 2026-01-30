
-- Enable read access for all users (including unauthenticated) for login checks
-- Note: In a production app with strict privacy, you might want to use a Secure View or RPC.
-- For this application, we allow reading basic profile info to check existence and retrieve role.

-- 1. Policies for 'admins'
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on admins" 
ON admins FOR SELECT 
TO public 
USING (true);

-- 2. Policies for 'operators'
ALTER TABLE operators ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on operators" 
ON operators FOR SELECT 
TO public 
USING (true);

-- 3. Policies for 'farmers'
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on farmers" 
ON farmers FOR SELECT 
TO public 
USING (true);
