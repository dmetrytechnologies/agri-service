-- Safely recreate DELETE policies
-- We drop them first to avoid "already exists" errors.

DROP POLICY IF EXISTS "Delete Farmers" ON public.farmers;
CREATE POLICY "Delete Farmers" ON public.farmers
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Delete Jobs" ON public.jobs;
CREATE POLICY "Delete Jobs" ON public.jobs
FOR DELETE
TO authenticated
USING (true);

DROP POLICY IF EXISTS "Delete Operators" ON public.operators;
CREATE POLICY "Delete Operators" ON public.operators
FOR DELETE
TO authenticated
USING (true);
