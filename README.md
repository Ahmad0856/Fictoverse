# FictoVerse Admin Dashboard

A private admin dashboard for uploading characters to the FictoVerse database, built with HTML, CSS, JavaScript, and Supabase.

## Features

- Private admin authentication via Supabase
- Character upload form with image support
- Responsive design matching the Figma UI
- Secure data storage in Supabase

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note down your project URL and anon key from the project settings

### 2. Configure Supabase

1. Open `script.js` and replace the following:
   ```javascript
   const SUPABASE_URL = 'YOUR_SUPABASE_URL';
   const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';
   ```
   with your actual Supabase credentials.

### 3. Set Up Database Schema

Run the following SQL in your Supabase SQL Editor:

```sql
-- Create characters table
CREATE TABLE characters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  character_name TEXT NOT NULL,
  nickname TEXT,
  love_interest TEXT,
  category TEXT,
  fun_fact TEXT,
  universe TEXT,
  birthday DATE,
  powers_skills TEXT,
  debut_year INTEGER,
  sign TEXT,
  about TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated users to insert characters"
  ON characters
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy for authenticated users to read
CREATE POLICY "Allow authenticated users to read characters"
  ON characters
  FOR SELECT
  TO authenticated
  USING (true);
```

### 4. Set Up Storage Bucket

1. In Supabase Dashboard, go to Storage
2. Create a new bucket named `character-images`
3. Set it to **Public** if you want images to be publicly accessible, or **Private** if you want them restricted
4. Create a policy to allow authenticated users to upload:

```sql
-- Policy for uploading images
CREATE POLICY "Allow authenticated users to upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'character-images');

-- Policy for reading images (if bucket is private)
CREATE POLICY "Allow authenticated users to read images"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'character-images');
```

### 5. Create Admin User

1. In Supabase Dashboard, go to Authentication > Users
2. Click "Add user" and create an admin account
3. Set a secure password
4. Use this email and password to log into the admin dashboard

### 6. Run the Application

Simply open `index.html` in a web browser, or use a local server:

```bash
# Using Python
python -m http.server 8000

# Using Node.js (http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000` in your browser.

## Usage

1. Log in with your admin credentials
2. Fill out the character form with all relevant information
3. Upload a character image (optional)
4. Click "Add Character" to save to the database
5. Use "Cancel" to reset the form

## File Structure

```
.
├── index.html      # Main HTML structure
├── styles.css      # All styling
├── script.js       # JavaScript logic and Supabase integration
└── README.md       # This file
```

## Security Notes

- The dashboard requires authentication to access
- Only authenticated users can add characters
- Make sure to keep your Supabase credentials secure
- Consider adding additional security policies in Supabase for production use

