-- ============================================
-- Enable Public Update Access for Boost Count
-- This allows public users to update the boost_count field
-- ============================================

-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public to update boost_count" ON characters;

-- Create policy to allow public users to update boost_count
-- This allows anonymous (unauthenticated) users to increment boost counts
CREATE POLICY "Allow public to update boost_count"
  ON characters
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);

-- Verify the policy was created
-- You can check this in Supabase Dashboard > Authentication > Policies > characters table





