# Individual Character Pages Setup Guide

This guide explains how to generate and maintain individual HTML pages for each character.

## Overview

Instead of using a single `character.html` file that loads different characters dynamically, each character now has their own dedicated HTML page at `/characters/{character-slug}.html`.

## Benefits

- **Better SEO**: Each character has a unique URL
- **Faster Loading**: No need to fetch character data on page load
- **Better Caching**: Browser can cache individual pages
- **Cleaner URLs**: `/characters/superman.html` instead of `character.html?name=superman`

## Setup

### Step 1: Generate Character Pages

1. **Run the generator script**:
   ```bash
   node generate-character-pages.js
   ```

2. **What it does**:
   - Fetches all characters from Supabase
   - Creates a `/characters/` directory
   - Generates an HTML file for each character
   - Files are named using character slugs (e.g., `superman-clark-kent.html`, `batman-bruce-wayne.html`)
   - Embeds character data directly in each page for instant loading
   - Updates CSS/JS paths to work from the subdirectory

3. **Output**:
   - All character pages will be in the `/characters/` directory
   - Each file is a complete, standalone HTML page
   - Pages include embedded character data (no API call needed on load)

### Step 2: Verify Pages Were Created

1. Check that the `/characters/` directory exists
2. Verify HTML files were created (one per character)
3. Open a character page in your browser to test

### Step 3: Update Navigation (Already Done)

All navigation links have been updated to use the new format:
- Character cards: `characters/{slug}.html`
- Search results: `characters/{slug}.html`
- Random character: `characters/{slug}.html`

## How It Works

### Page Generation

1. **Template**: Uses `character.html` as a template
2. **Character Data**: Embeds character data as JSON in the page
3. **JavaScript**: Reads embedded data instead of fetching from API
4. **Fallback**: Still supports old URL format for backward compatibility

### Character Data Embedding

Each generated page includes:
```html
<script>
    window.characterData = {
        id: "...",
        character_name: "...",
        universe: "...",
        // ... all character fields
    };
</script>
```

The JavaScript then uses this embedded data instead of making an API call.

## Maintenance

### Adding New Characters

When you add a new character:

1. **Run the generator again**:
   ```bash
   node generate-character-pages.js
   ```

2. **The script will**:
   - Fetch all characters (including new ones)
   - Generate pages for any missing characters
   - Update existing pages if character data changed

### Automated Regeneration

You can set up automated regeneration:

**Option 1: Manual (Before Deployment)**
- Run the generator before deploying your site
- Commit the generated HTML files to your repository

**Option 2: Build Script**
Add to your deployment process:
```bash
npm run generate-pages
```

**Option 3: CI/CD Integration**
Add to your deployment pipeline:
```yaml
# Example GitHub Actions
- name: Generate Character Pages
  run: node generate-character-pages.js
```

## File Structure

```
project-root/
├── character.html          # Template file
├── characters/             # Generated pages directory
│   ├── superman.html
│   ├── spider-man.html
│   ├── batman.html
│   └── ...
├── generate-character-pages.js
└── ...
```

## URL Format

### New Format
- `/characters/superman.html`
- `/characters/spider-man.html`
- `/characters/batman.html`

### Old Format (Still Supported)
- `character.html?name=superman` (falls back to API fetch)
- `character.html?id={uuid}` (falls back to API fetch)

## Troubleshooting

### Issue: Pages not generating

**Solution**:
- Check Supabase connection
- Verify API key is correct
- Check console for error messages

### Issue: Character page shows "Character Not Found"

**Possible Causes**:
1. Page wasn't generated for that character
2. Character name has special characters that break the slug
3. File doesn't exist

**Solution**:
- Run the generator again
- Check if the HTML file exists in `/characters/` directory
- Verify the character exists in Supabase

### Issue: Page loads but shows wrong character

**Solution**:
- Regenerate the page: `node generate-character-pages.js`
- Clear browser cache
- Check that character data in database is correct

### Issue: Navigation links broken

**Solution**:
- Verify all navigation code uses `characters/{slug}.html` format
- Check that slugs are generated correctly
- Ensure character names don't have problematic characters

## Best Practices

1. **Regenerate After Changes**: Run the generator whenever you:
   - Add new characters
   - Update character data
   - Change the character.html template

2. **Version Control**: Consider committing generated pages to git for:
   - Backup
   - Faster deployments
   - Version history

3. **Automation**: Set up automated generation in your deployment process

4. **Slug Uniqueness**: Ensure character names are unique (or handle duplicates in the generator)

## Advanced: Custom Template

To customize the generated pages:

1. Edit `character.html` (the template)
2. Add placeholders if needed
3. Update `generate-character-pages.js` to replace placeholders
4. Regenerate pages

## Migration Notes

- Old URLs (`character.html?name=...`) still work (fallback to API)
- New URLs (`characters/...html`) are preferred
- All navigation has been updated to use new format
- No breaking changes for existing functionality
