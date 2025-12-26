-- ============================================
-- Enable Public Read Access for Characters
-- This allows the public character profile page to read character data
-- ============================================

-- Allow public (anon) users to read characters
DROP POLICY IF EXISTS "Allow public to read characters" ON characters;
CREATE POLICY "Allow public to read characters"
  ON characters
  FOR SELECT
  TO anon
  USING (true);

-- Allow public (anon) users to read universes (for filtering)
DROP POLICY IF EXISTS "Allow public to read universes" ON universes;
CREATE POLICY "Allow public to read universes"
  ON universes
  FOR SELECT
  TO anon
  USING (true);

-- Allow public (anon) users to read categories (for filtering)
DROP POLICY IF EXISTS "Allow public to read categories" ON categories;
CREATE POLICY "Allow public to read categories"
  ON categories
  FOR SELECT
  TO anon
  USING (true);

