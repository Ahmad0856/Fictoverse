-- Add boost column to characters table
-- This column tracks the number of boosts (follows) each character has received

-- Add boost column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'characters' AND column_name = 'boost_count'
    ) THEN
        ALTER TABLE characters ADD COLUMN boost_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update existing characters to have 0 boosts if null
UPDATE characters SET boost_count = 0 WHERE boost_count IS NULL;

-- Add index for faster sorting by boost count
CREATE INDEX IF NOT EXISTS idx_characters_boost_count ON characters(boost_count DESC);





