-- Update Categories to new options
-- Run this in your Supabase SQL Editor

-- First, check what categories exist (optional - for reference)
-- SELECT * FROM categories;

-- Delete old default categories
-- Note: This will only delete if no characters are using these categories
-- If characters are using them, you'll need to update those characters first
DELETE FROM categories WHERE name IN ('Hero', 'Villain', 'Supporting', 'Other');

-- If the above fails due to foreign key constraints, first update characters:
-- UPDATE characters SET category = NULL WHERE category IN ('hero', 'villain', 'supporting', 'other');
-- Then delete the categories

-- Insert new category options (only if they don't already exist)
INSERT INTO categories (name) VALUES 
  ('Manga'),
  ('Anime'),
  ('Animanga'),
  ('TV Show'),
  ('Cartoon'),
  ('Comics')
ON CONFLICT (name) DO NOTHING;

-- Verify the categories
-- SELECT * FROM categories ORDER BY name;

