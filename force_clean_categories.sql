-- Force Clean Categories - Complete Removal and Re-insertion
-- Run this ENTIRE script in your Supabase SQL Editor

-- Step 1: Check what categories currently exist (for reference)
-- Uncomment to see current categories:
-- SELECT * FROM categories ORDER BY name;

-- Step 2: Update characters that reference old categories (set to NULL)
UPDATE characters 
SET category = NULL 
WHERE category IS NOT NULL 
  AND (
    LOWER(category) = 'hero' OR 
    LOWER(category) = 'villain' OR 
    LOWER(category) = 'supporting' OR 
    LOWER(category) = 'other' OR
    category = 'Hero' OR 
    category = 'Villain' OR 
    category = 'Supporting' OR 
    category = 'Other'
  );

-- Step 3: Delete ALL existing categories (clean slate)
DELETE FROM categories;

-- Step 4: Insert ONLY the new categories
INSERT INTO categories (name) VALUES 
  ('Manga'),
  ('Anime'),
  ('Animanga'),
  ('TV Show'),
  ('Cartoon'),
  ('Comics');

-- Step 5: Verify the result
SELECT id, name, created_at FROM categories ORDER BY name;

