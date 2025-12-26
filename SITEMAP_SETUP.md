# Sitemap Generator Setup Guide

This guide explains how to generate and maintain a dynamic sitemap.xml for your FictoVerse website.

## Overview

The sitemap generator creates an XML sitemap that includes:
- **Static pages**: Home, Characters, Universes, About, Contact
- **Dynamic character pages**: `/character/{slug}`
- **Dynamic universe pages**: `/universe/{slug}`

## Files Included

1. **`generate-sitemap.js`** - Node.js script for server-side generation
2. **`sitemap.html`** - Browser-based generator (for testing/development)
3. **`sitemap.xml`** - Generated sitemap file (created after running the generator)

## Method 1: Node.js Script (Recommended for Production)

### Prerequisites
- Node.js installed on your system
- Access to your Supabase database

### Steps

1. **Update the Base URL**
   ```javascript
   // In generate-sitemap.js, line 18
   const BASE_URL = 'https://yourdomain.com'; // Change to your actual domain
   ```

2. **Run the Generator**
   ```bash
   node generate-sitemap.js
   ```

3. **Upload sitemap.xml**
   - The script generates `sitemap.xml` in the root directory
   - Upload this file to your web server's root directory
   - Ensure it's accessible at `https://yourdomain.com/sitemap.xml`

4. **Automate with Cron (Optional)**
   ```bash
   # Run daily at 2 AM
   0 2 * * * cd /path/to/your/project && node generate-sitemap.js
   ```

## Method 2: Browser-Based Generator (For Testing)

1. **Open `sitemap.html`** in your browser
2. **Enter your base URL** (e.g., `https://yourdomain.com`)
3. **Click "Generate Sitemap"**
4. **Review the generated XML**
5. **Click "Download sitemap.xml"** to save the file

## URL Structure

### Current Implementation
The generator creates URLs using slug-based format:
- Characters: `/character/{character-name-slug}`
- Universes: `/universe/{universe-name-slug}`

### Note on Current Site Structure
Your current site uses:
- Character pages: `character.html?id={id}`

**Important**: If you want to use the slug-based format (`/character/{slug}`), you'll need to:
1. Update your routing to handle slug-based URLs
2. Create a server-side redirect or rewrite rules
3. Or modify the sitemap generator to use your current URL format

### Alternative: Use Current URL Format

If you want the sitemap to match your current URL structure, modify the generator:

**In `generate-sitemap.js`**, change:
```javascript
// From:
urls.push({
    loc: `${BASE_URL}/character/${slug}`,
    ...
});

// To:
urls.push({
    loc: `${BASE_URL}/character.html?id=${character.id}`,
    ...
});
```

## Submitting to Search Engines

### Google Search Console
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your property
3. Navigate to "Sitemaps"
4. Submit: `https://yourdomain.com/sitemap.xml`

### Bing Webmaster Tools
1. Go to [Bing Webmaster Tools](https://www.bing.com/webmasters)
2. Add your site
3. Submit sitemap: `https://yourdomain.com/sitemap.xml`

## Maintenance

### When to Regenerate
- **After adding new characters** - Run the generator to include new pages
- **After adding new universes** - Run the generator to include new pages
- **Weekly/Monthly** - Set up automated regeneration via cron

### Excluding Content
The generator automatically:
- ✅ Includes all characters from the `characters` table
- ✅ Includes all universes from the `universes` table
- ❌ Excludes admin pages (not in the generator)
- ❌ Excludes login pages (not in the generator)

To exclude specific characters or universes, modify the Supabase query in the generator to add filters.

## Troubleshooting

### Error: "Failed to fetch from Supabase"
- Check your Supabase URL and API key
- Ensure public read access is enabled (see `enable_public_read_access.sql`)
- Check your network connection

### Error: "Invalid base URL"
- Ensure your BASE_URL starts with `http://` or `https://`
- Don't include a trailing slash

### Sitemap not accessible
- Ensure `sitemap.xml` is in your web root
- Check file permissions (should be readable by web server)
- Verify the URL: `https://yourdomain.com/sitemap.xml`

## Customization

### Adding More Static Pages
Edit the `staticUrls` array in the generator:
```javascript
const staticUrls = [
    { path: '/your-new-page', priority: '0.8', changefreq: 'monthly' },
    // ... existing pages
];
```

### Changing Priority/Change Frequency
Modify the priority and changefreq values:
- **Priority**: 0.0 to 1.0 (1.0 = most important)
- **Change Frequency**: always, hourly, daily, weekly, monthly, yearly, never

### Custom Slug Generation
Modify the `createSlug()` function to customize how slugs are generated from names.

## Support

For issues or questions:
1. Check the Supabase connection
2. Verify your database schema matches the expected structure
3. Review the console output for specific error messages





