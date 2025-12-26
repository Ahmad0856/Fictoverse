-- ============================================
-- Create Secure Boost Function
-- This function allows public users to increment boost_count safely
-- ============================================

-- Drop the function if it exists (to allow re-running this script)
DROP FUNCTION IF EXISTS increment_boost_count(UUID);

-- Create a function that only updates boost_count
-- This is more secure than allowing direct table updates
CREATE OR REPLACE FUNCTION increment_boost_count(character_id UUID)
RETURNS TABLE(boost_count INTEGER) AS $$
BEGIN
    -- Update the boost_count and return the new value
    UPDATE characters 
    SET boost_count = COALESCE(boost_count, 0) + 1,
        updated_at = NOW()
    WHERE id = character_id;
    
    -- Return the updated boost_count
    RETURN QUERY
    SELECT characters.boost_count
    FROM characters
    WHERE characters.id = character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION increment_boost_count(UUID) TO anon;

-- Add comment for documentation
COMMENT ON FUNCTION increment_boost_count(UUID) IS 
'Increments the boost_count for a character by 1. Returns the new boost_count value.';

