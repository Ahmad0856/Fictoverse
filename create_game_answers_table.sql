-- Create game_answers table to track user selections
CREATE TABLE IF NOT EXISTS game_answers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    question_id UUID NOT NULL REFERENCES game_questions(id) ON DELETE CASCADE,
    selected_option TEXT NOT NULL CHECK (selected_option IN ('A', 'B')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on question_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_answers_question_id ON game_answers(question_id);

-- Create index on created_at for ordering
CREATE INDEX IF NOT EXISTS idx_game_answers_created_at ON game_answers(created_at DESC);

-- Enable Row Level Security
ALTER TABLE game_answers ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public users to insert answers (for playing the game)
DROP POLICY IF EXISTS "Allow public users to insert game answers" ON game_answers;
CREATE POLICY "Allow public users to insert game answers"
    ON game_answers
    FOR INSERT
    TO anon
    WITH CHECK (true);

-- Policy: Allow public users to read answers (for calculating percentages)
DROP POLICY IF EXISTS "Allow public users to read game answers" ON game_answers;
CREATE POLICY "Allow public users to read game answers"
    ON game_answers
    FOR SELECT
    TO anon
    USING (true);

-- Policy: Allow authenticated users full access
DROP POLICY IF EXISTS "Allow authenticated users to manage game answers" ON game_answers;
CREATE POLICY "Allow authenticated users to manage game answers"
    ON game_answers
    FOR ALL
    TO authenticated
    USING (true)
    WITH CHECK (true);


