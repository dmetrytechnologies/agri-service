
-- Add the missing service_villages column to the operators table
ALTER TABLE operators 
ADD COLUMN IF NOT EXISTS service_villages text[] DEFAULT '{}';

-- Grant permissions if necessary (optional, but good practice)
GRANT ALL ON operators TO authenticated;
GRANT ALL ON operators TO service_role;
