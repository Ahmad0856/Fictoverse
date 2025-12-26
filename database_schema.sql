-- ============================================
-- FictoVerse Admin Dashboard - Complete Database Schema
-- This script handles both new installations and existing tables
-- ============================================

-- ============================================
-- 1. UNIVERSES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS universes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for universes
ALTER TABLE universes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read universes" ON universes;
DROP POLICY IF EXISTS "Allow authenticated users to insert universes" ON universes;
DROP POLICY IF EXISTS "Allow authenticated users to update universes" ON universes;
DROP POLICY IF EXISTS "Allow authenticated users to delete universes" ON universes;

-- Policy: Allow authenticated users to read universes
CREATE POLICY "Allow authenticated users to read universes"
  ON universes
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert universes
CREATE POLICY "Allow authenticated users to insert universes"
  ON universes
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update universes
CREATE POLICY "Allow authenticated users to update universes"
  ON universes
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete universes
CREATE POLICY "Allow authenticated users to delete universes"
  ON universes
  FOR DELETE
  TO authenticated
  USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_universes_name ON universes(name);

-- ============================================
-- 2. CATEGORIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to insert categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to update categories" ON categories;
DROP POLICY IF EXISTS "Allow authenticated users to delete categories" ON categories;

-- Policy: Allow authenticated users to read categories
CREATE POLICY "Allow authenticated users to read categories"
  ON categories
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert categories
CREATE POLICY "Allow authenticated users to insert categories"
  ON categories
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update categories
CREATE POLICY "Allow authenticated users to update categories"
  ON categories
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete categories
CREATE POLICY "Allow authenticated users to delete categories"
  ON categories
  FOR DELETE
  TO authenticated
  USING (true);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- ============================================
-- 3. CHARACTERS TABLE
-- ============================================
-- Create table if it doesn't exist
CREATE TABLE IF NOT EXISTS characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_name TEXT NOT NULL,
  nickname TEXT,
  love_interest TEXT,
  category TEXT,
  fun_fact TEXT,
  universe TEXT,
  birthday TEXT, -- Format: MM-DD (e.g., "03-15" for March 15th)
  powers_skills TEXT,
  debut_year INTEGER, -- Year from 1890 to 2025
  sign TEXT, -- Zodiac sign
  about TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
DO $$ 
BEGIN
  -- Add universe column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'universe') THEN
    ALTER TABLE characters ADD COLUMN universe TEXT;
  END IF;

  -- Add birthday column if it doesn't exist (or alter if it's DATE type)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'birthday') THEN
    ALTER TABLE characters ADD COLUMN birthday TEXT;
  ELSE
    -- If birthday exists as DATE, convert to TEXT
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'characters' AND column_name = 'birthday' 
               AND data_type = 'date') THEN
      ALTER TABLE characters ALTER COLUMN birthday TYPE TEXT;
    END IF;
  END IF;

  -- Add other columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'character_name') THEN
    ALTER TABLE characters ADD COLUMN character_name TEXT NOT NULL DEFAULT '';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'nickname') THEN
    ALTER TABLE characters ADD COLUMN nickname TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'love_interest') THEN
    ALTER TABLE characters ADD COLUMN love_interest TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'category') THEN
    ALTER TABLE characters ADD COLUMN category TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'fun_fact') THEN
    ALTER TABLE characters ADD COLUMN fun_fact TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'powers_skills') THEN
    ALTER TABLE characters ADD COLUMN powers_skills TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'debut_year') THEN
    ALTER TABLE characters ADD COLUMN debut_year INTEGER;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'sign') THEN
    ALTER TABLE characters ADD COLUMN sign TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'about') THEN
    ALTER TABLE characters ADD COLUMN about TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'image_url') THEN
    ALTER TABLE characters ADD COLUMN image_url TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'created_at') THEN
    ALTER TABLE characters ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'characters' AND column_name = 'updated_at') THEN
    ALTER TABLE characters ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
END $$;

-- Enable Row Level Security for characters
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Allow authenticated users to read characters" ON characters;
DROP POLICY IF EXISTS "Allow authenticated users to insert characters" ON characters;
DROP POLICY IF EXISTS "Allow authenticated users to update characters" ON characters;
DROP POLICY IF EXISTS "Allow authenticated users to delete characters" ON characters;

-- Policy: Allow authenticated users to read characters
CREATE POLICY "Allow authenticated users to read characters"
  ON characters
  FOR SELECT
  TO authenticated
  USING (true);

-- Policy: Allow authenticated users to insert characters
CREATE POLICY "Allow authenticated users to insert characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to update characters
CREATE POLICY "Allow authenticated users to update characters"
  ON characters
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow authenticated users to delete characters
CREATE POLICY "Allow authenticated users to delete characters"
  ON characters
  FOR DELETE
  TO authenticated
  USING (true);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_characters_name ON characters(character_name);
CREATE INDEX IF NOT EXISTS idx_characters_universe ON characters(universe);
CREATE INDEX IF NOT EXISTS idx_characters_category ON characters(category);
CREATE INDEX IF NOT EXISTS idx_characters_debut_year ON characters(debut_year);
CREATE INDEX IF NOT EXISTS idx_characters_created_at ON characters(created_at DESC);

-- ============================================
-- 4. STORAGE BUCKET SETUP (Run in Storage section)
-- ============================================
-- Note: Storage buckets must be created manually in Supabase Dashboard
-- Go to Storage > Create Bucket
-- Bucket name: character-images
-- Public: Yes (or No, depending on your preference)
-- 
-- Then run the following policies in SQL Editor (if bucket is private):

-- DROP POLICY IF EXISTS "Allow authenticated users to upload images" ON storage.objects;
-- CREATE POLICY "Allow authenticated users to upload images"
--   ON storage.objects
--   FOR INSERT
--   TO authenticated
--   WITH CHECK (bucket_id = 'character-images');

-- DROP POLICY IF EXISTS "Allow authenticated users to read images" ON storage.objects;
-- CREATE POLICY "Allow authenticated users to read images"
--   ON storage.objects
--   FOR SELECT
--   TO authenticated
--   USING (bucket_id = 'character-images');

-- DROP POLICY IF EXISTS "Allow authenticated users to delete images" ON storage.objects;
-- CREATE POLICY "Allow authenticated users to delete images"
--   ON storage.objects
--   FOR DELETE
--   TO authenticated
--   USING (bucket_id = 'character-images');

-- ============================================
-- 5. FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_universes_updated_at ON universes;
DROP TRIGGER IF EXISTS update_categories_updated_at ON categories;
DROP TRIGGER IF EXISTS update_characters_updated_at ON characters;

-- Trigger for universes table
CREATE TRIGGER update_universes_updated_at
    BEFORE UPDATE ON universes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for categories table
CREATE TRIGGER update_categories_updated_at
    BEFORE UPDATE ON categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for characters table
CREATE TRIGGER update_characters_updated_at
    BEFORE UPDATE ON characters
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 6. INITIAL DATA (Optional - Seed data)
-- ============================================

-- Insert some default universes (optional)
INSERT INTO universes (name) VALUES 
  ('Marvel'),
  ('DC'),
  ('Custom')
ON CONFLICT (name) DO NOTHING;

-- Insert some default categories (optional)
INSERT INTO categories (name) VALUES 
  ('Manga'),
  ('Anime'),
  ('Animanga'),
  ('TV Show'),
  ('Cartoon'),
  ('Comics')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- END OF SCHEMA
-- ============================================
