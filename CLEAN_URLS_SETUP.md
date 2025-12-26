# Clean URLs Setup Guide

This guide explains how the clean URL system works for character pages.

## URL Format

### New Format (Clean URLs)
- Character pages: `/character/{slug}`
- Example: `/character/superman`, `/character/spider-man`

### Old Format (Still Supported)
- Character pages: `/character.html?id={id}`
- Automatically redirected to clean format

## How It Works

1. **Slug Generation**: Character names are converted to URL-friendly slugs
   - "Spider-Man" → "spider-man"
   - "Iron Man" → "iron-man"
   - Special characters are removed, spaces become hyphens

2. **URL Routing**: 
   - Clean URLs like `/character/superman` are handled by server rewrite rules
   - The server serves `character.html` with the slug as a parameter
   - JavaScript then looks up the character by matching the slug to character names

3. **Backward Compatibility**:
   - Old URLs with `?id={uuid}` still work
   - They're automatically redirected to the clean format

## Server Configuration

### Apache (.htaccess)
The `.htaccess` file is included in the project root. It handles:
- Rewriting `/character/{slug}` to `character.html?slug={slug}`
- Redirecting old `character.html?id={id}` URLs to clean format

### Netlify (_redirects)
The `_redirects` file is included for Netlify deployments.

### Other Hosting Providers
For other providers (Vercel, GitHub Pages, etc.), you'll need to configure URL rewriting according to their documentation.

## Testing

1. Click any character card - it should navigate to `/character/{slug}`
2. The URL should be clean and readable
3. Old bookmarks with `?id={uuid}` should still work

## Troubleshooting

### URLs not working
- Check if your hosting provider supports URL rewriting
- Verify `.htaccess` or `_redirects` file is in the root directory
- Check server logs for rewrite errors

### Character not found
- Ensure character names are unique (slugs are generated from names)
- Check browser console for errors
- Verify Supabase connection is working

### Old URLs not redirecting
- Server rewrite rules may not be configured
- Check if your hosting provider supports redirects
- Manually update bookmarks to new format





