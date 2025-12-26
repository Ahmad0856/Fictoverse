-- Clean Categories - Remove old and add new
-- Run this in your Supabase SQL Editor

-- Step 1: Update any characters that use old categories to NULL (optional)
-- Uncomment the line below if you want to clear old category assignments
-- UPDATE characters SET category = NULL WHERE LOWER(category) IN ('hero', 'villain', 'supporting', 'other');

-- Step 2: Delete old categories
DELETE FROM categories WHERE LOWER(name) IN ('hero', 'villain', 'supporting', 'other');

-- Step 3: Delete any duplicate new categories if they exist (cleanup)
-- This ensures we don't have duplicates
DELETE FROM categories WHERE LOWER(name) IN ('manga', 'anime', 'animanga', 'tv show', 'cartoon', 'comics');

-- Step 4: Insert the new categories
INSERT INTO categories (name) VALUES 
  ('Manga'),
  ('Anime'),
  ('Animanga'),
  ('TV Show'),
  ('Cartoon'),
  ('Comics')
ON CONFLICT (name) DO NOTHING;

-- Step 5: Verify (run this separately to see results)
-- SELECT id, name, created_at FROM categories ORDER BY name;

