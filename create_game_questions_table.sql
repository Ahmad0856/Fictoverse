-- Create game_questions table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS game_questions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question TEXT NOT NULL,
    option_a UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    option_b UUID NOT NULL REFERENCES characters(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on question for faster searches
CREATE INDEX IF NOT EXISTS idx_game_questions_question ON game_questions USING gin(to_tsvector('english', question));

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_game_questions_created_at ON game_questions(created_at DESC);

-- Enable Row Level Security
ALTER TABLE game_questions ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all questions
DROP POLICY IF EXISTS "Allow authenticated users to read game questions" ON game_questions;
CREATE POLICY "Allow authenticated users to read game questions"
    ON game_questions
    FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert questions
DROP POLICY IF EXISTS "Allow authenticated users to insert game questions" ON game_questions;
CREATE POLICY "Allow authenticated users to insert game questions"
    ON game_questions
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update questions
DROP POLICY IF EXISTS "Allow authenticated users to update game questions" ON game_questions;
CREATE POLICY "Allow authenticated users to update game questions"
    ON game_questions
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- Policy: Allow authenticated users to delete questions
DROP POLICY IF EXISTS "Allow authenticated users to delete game questions" ON game_questions;
CREATE POLICY "Allow authenticated users to delete game questions"
    ON game_questions
    FOR DELETE
    TO authenticated
    USING (true);

-- Policy: Allow public users to read questions (for playing the game)
DROP POLICY IF EXISTS "Allow public users to read game questions" ON game_questions;
CREATE POLICY "Allow public users to read game questions"
    ON game_questions
    FOR SELECT
    TO anon
    USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_game_questions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at (drop if exists first)
DROP TRIGGER IF EXISTS update_game_questions_updated_at ON game_questions;
CREATE TRIGGER update_game_questions_updated_at
    BEFORE UPDATE ON game_questions
    FOR EACH ROW
    EXECUTE FUNCTION update_game_questions_updated_at();


