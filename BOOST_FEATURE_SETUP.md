# Boost Feature Setup Guide

This guide explains how to set up and use the boost feature for characters.

## Overview

The boost feature allows users to "boost" (follow/like) characters, which:
- Tracks the number of boosts each character has received
- Determines character positions in various rankings
- Prevents duplicate boosts from the same user (using localStorage)

## Prerequisites

Before starting, make sure you have:
- Access to your Supabase project dashboard
- SQL Editor access in Supabase
- Basic understanding of database operations

## Step 1: Database Setup - Add Boost Column

### 1.1 Open Supabase SQL Editor

1. Go to your Supabase project dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query** to create a new SQL query

### 1.2 Run the Migration Script

1. Open the file `add_boost_column.sql` from your project
2. Copy the entire contents of the file
3. Paste it into the Supabase SQL Editor
4. Click **Run** (or press Ctrl+Enter / Cmd+Enter)

**What this script does:**
- Checks if `boost_count` column already exists (prevents errors if run multiple times)
- Adds `boost_count` column as INTEGER with default value of 0
- Updates all existing characters to have 0 boosts (if any are NULL)
- Creates an index on `boost_count` for faster sorting and queries

**Expected Result:**
- You should see "Success. No rows returned" or similar success message
- The `boost_count` column is now available in your `characters` table

### 1.3 Verify the Column Was Added

1. In Supabase, go to **Table Editor**
2. Select the `characters` table
3. Check that a new column `boost_count` appears
4. Verify existing characters have `boost_count` set to 0

## Step 2: Enable Public Write Access for Boost Count

### 2.1 Understanding Row Level Security (RLS)

By default, Supabase tables have Row Level Security enabled. We need to allow anonymous (public) users to update the `boost_count` field.

### 2.2 Create Update Policy

1. Go to **SQL Editor** in Supabase
2. Create a new query
3. Copy and paste the following SQL:

```sql
-- Drop existing policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Allow public to update boost_count" ON characters;

-- Create policy to allow public users to update boost_count
CREATE POLICY "Allow public to update boost_count"
  ON characters
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
```

4. Click **Run**

**What this does:**
- Allows anonymous (unauthenticated) users to update records in the `characters` table
- This is necessary for the boost button to work on public pages

### 2.3 (Optional) More Secure Alternative

If you want better security, you can restrict updates to only the `boost_count` field. However, Supabase RLS policies don't easily allow field-level restrictions. 

**Recommended Approach**: Use the simple policy from Step 2.2. The boost functionality only updates the `boost_count` field, and since this is a public-facing feature, the simple policy is sufficient.

**Alternative**: If you need stricter control, you can:
1. Create a database function that only allows updating `boost_count`
2. Use that function instead of direct table updates
3. Grant execute permission on the function to anon users

Here's an example (advanced):

```sql
-- Create a function that only updates boost_count
CREATE OR REPLACE FUNCTION increment_boost_count(character_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE characters 
    SET boost_count = COALESCE(boost_count, 0) + 1,
        updated_at = NOW()
    WHERE id = character_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anonymous users
GRANT EXECUTE ON FUNCTION increment_boost_count(UUID) TO anon;
```

Then update the JavaScript to call this function instead of direct UPDATE. However, this requires modifying the JavaScript code in `public.js`.

**For most use cases, the simple policy from Step 2.2 is recommended and sufficient.**

### 2.4 Verify RLS is Enabled

1. Go to **Authentication** → **Policies** in Supabase
2. Find the `characters` table
3. Verify you see the "Allow public to update boost_count" policy listed

## Step 3: Test the Boost Feature

### 3.1 Test on Character Profile Page

1. Open your website and navigate to any character profile page
2. Look for the **Boost** button in the top-right area of the character header
3. You should see:
   - A blue button with "⚡ Boost" text
   - A number below showing the current boost count (should be 0 initially)

### 3.2 Test Boosting

1. Click the **Boost** button
2. The button should:
   - Change to green color
   - Text changes to "Boosted"
   - Button becomes disabled
   - Count increments by 1
3. Refresh the page - the count should persist
4. Try clicking again - it should remain disabled (preventing duplicate boosts)

### 3.3 Verify Database Update

1. Go to Supabase **Table Editor**
2. Select the `characters` table
3. Find the character you boosted
4. Verify the `boost_count` column shows 1 (or the incremented number)

## Step 4: Verify Rankings Work

### 4.1 Test Homepage Sorting

1. Go to your homepage
2. Characters should be sorted by:
   - Boost count (highest first)
   - Then alphabetically if boost counts are equal

### 4.2 Test with Multiple Characters

1. Boost several different characters
2. Give them different boost counts (boost some multiple times from different browsers/devices)
3. Verify they appear in the correct order on the homepage

## Troubleshooting

### Issue: Boost button doesn't appear

**Solution:**
- Check browser console for JavaScript errors
- Verify `character.html` includes the boost button HTML
- Ensure `public.js` is loaded correctly

### Issue: "Failed to boost character" error

**Possible Causes:**
1. **RLS Policy not set up**: Run Step 2.2 again
2. **Column doesn't exist**: Run Step 1.2 again
3. **Network error**: Check Supabase connection

**Solution:**
- Open browser Developer Tools (F12)
- Check Console tab for detailed error messages
- Verify Supabase URL and API key are correct in `public.js`

### Issue: Boost count doesn't update

**Solution:**
- Check if RLS policy allows updates (Step 2.2)
- Verify the `boost_count` column exists in the database
- Check browser console for errors

### Issue: Can boost multiple times

**Expected Behavior:**
- Users can only boost once per browser (localStorage-based)
- Clearing browser data will reset this
- For production, consider implementing user authentication

**If you want stricter control:**
- Implement user authentication
- Track boosts in a separate `user_boosts` table
- Check database before allowing boost

### Issue: Sorting not working by boost count

**Solution:**
- Verify `boost_count` is included in queries (check `home.js`)
- Ensure `sortCharacters()` function uses `boost_count` (already implemented)
- Check that characters have `boost_count` values (not NULL)

## Advanced Configuration

### Customize Boost Button Appearance

Edit `public.css` to customize:
- Button colors (`.boost-button`)
- Boosted state color (`.boost-button.boosted`)
- Button size and spacing

### Change Boost Limit

Currently, users can boost once per browser. To change:
- Modify the localStorage check in `setupBoostButton()` function
- Or implement server-side tracking with user authentication

### Add Boost Analytics

Track boost events:
1. Create a `boost_events` table
2. Log each boost with timestamp and character ID
3. Create analytics dashboard

## Security Considerations

### Current Implementation
- Uses localStorage (client-side only)
- Users can clear browser data to boost again
- No server-side validation of boost limits

### Production Recommendations
1. **Implement User Authentication**: Track boosts per user account
2. **Server-Side Validation**: Validate boost requests on the server
3. **Rate Limiting**: Prevent abuse with rate limiting
4. **IP Tracking**: Track boosts by IP address (less reliable but better than nothing)

## Next Steps

After setup is complete:
1. ✅ Test boost functionality on multiple characters
2. ✅ Verify rankings update correctly
3. ✅ Monitor boost counts in database
4. ✅ Consider implementing user authentication for better tracking
5. ✅ Add boost analytics if needed

## Features

### Boost Button
- Located on the character profile page, next to the character name
- Shows current boost count
- Changes to "Boosted" after clicking (prevents duplicate boosts)
- Uses localStorage to track if a user has already boosted

### Rankings
Characters can be sorted by boost count to determine rankings:
- Most popular characters
- Top characters by universe
- Top characters by category
- Birthday rankings

## Usage

1. **View Boost Count**: The boost count is displayed below the boost button on each character profile page

2. **Boost a Character**: 
   - Click the "Boost" button on any character profile page
   - The count increments immediately
   - Button changes to "Boosted" and becomes disabled

3. **Sort by Boosts**: 
   - Update sorting functions to use `boost_count` field
   - Example: `order('boost_count', { ascending: false })`

## Technical Details

### Storage
- **Database**: `boost_count` column in `characters` table (INTEGER)
- **LocalStorage**: Tracks which characters a user has boosted (key: `boosted_{characterId}`)

### Limitations
- Users can only boost each character once per browser (localStorage-based)
- Clearing browser data will allow boosting again
- For production, consider implementing user authentication for more accurate tracking

## Future Enhancements

- User authentication for cross-device boost tracking
- Boost history/analytics
- Leaderboards based on boost counts
- Boost notifications
- Social sharing when boosting

