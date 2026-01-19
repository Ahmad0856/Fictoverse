-- ============================================
-- Migration: Add description column to universes table
-- ============================================

-- Add description column to universes table (if it doesn't exist)
ALTER TABLE universes 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add a comment to the column
COMMENT ON COLUMN universes.description IS 'Description of the universe';



