-- Create games table for storing game information
CREATE TABLE IF NOT EXISTS games (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    game_type TEXT NOT NULL, -- e.g., 'quiz', 'memory', 'trivia', etc.
    game_data JSONB, -- Store game-specific data (questions, answers, etc.)
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for active games
CREATE INDEX IF NOT EXISTS idx_games_active ON games(is_active) WHERE is_active = true;

-- Enable Row Level Security
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read all games
CREATE POLICY "Allow authenticated read games"
    ON games FOR SELECT
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to insert games
CREATE POLICY "Allow authenticated insert games"
    ON games FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- Policy: Allow authenticated users to update games
CREATE POLICY "Allow authenticated update games"
    ON games FOR UPDATE
    TO authenticated
    USING (true);

-- Policy: Allow authenticated users to delete games
CREATE POLICY "Allow authenticated delete games"
    ON games FOR DELETE
    TO authenticated
    USING (true);

-- Policy: Allow public users to read active games
CREATE POLICY "Allow public read active games"
    ON games FOR SELECT
    TO anon
    USING (is_active = true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_games_updated_at BEFORE UPDATE ON games
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

