# Public Page Setup Instructions

## Issue: Characters Not Loading

If characters aren't loading on the public pages, you need to enable public read access in Supabase.

## Quick Fix (5 minutes)

### Step 1: Open Supabase Dashboard
1. Go to [supabase.com](https://supabase.com)
2. Log in to your account
3. Select your project

### Step 2: Run the SQL Script
1. Click on **SQL Editor** in the left sidebar
2. Click **New Query**
3. Open the file `enable_public_read_access.sql` in your project folder
4. Copy ALL the contents of that file
5. Paste it into the SQL Editor
6. Click **Run** (or press Ctrl+Enter)

### Step 3: Verify
1. Refresh your public pages (`public-index.html` or `character.html`)
2. Characters should now load!

## What This Does

The SQL script creates Row Level Security (RLS) policies that allow:
- **Anonymous users** (public visitors) to **read** characters
- **Anonymous users** to **read** universes and categories
- **Authenticated users** still have full access (create, update, delete)

## Security Note

This only enables **read** access for public users. Only authenticated admin users can create, update, or delete characters.

## Troubleshooting

### Still not working?

1. **Check the browser console** (F12 → Console tab)
   - Look for error messages
   - Share any red error messages

2. **Verify the SQL ran successfully**
   - In Supabase SQL Editor, check if there are any error messages
   - The policies should be created without errors

3. **Check if you have characters in the database**
   - Go to Supabase Dashboard → Table Editor → characters
   - Verify there are characters in the table

4. **Verify Supabase credentials**
   - Check that `SUPABASE_URL` and `SUPABASE_ANON_KEY` in `public.js` and `public-index.html` are correct

## Files Created

- `character.html` - Individual character profile page
- `public-index.html` - Gallery of all characters
- `public.css` - Styling for public pages
- `public.js` - JavaScript for character profile page
- `enable_public_read_access.sql` - SQL to enable public access

