# How to View Static Pages

If you're getting `ERR_FILE_NOT_FOUND` errors, it's likely because you're trying to open HTML files directly from the file system. Here's how to properly view the pages:

## Option 1: Use a Local Web Server (Recommended)

### Using Python (if installed):
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

Then open: `http://localhost:8000/home.html`

### Using Node.js (if installed):
```bash
npx http-server -p 8000
```

Then open: `http://localhost:8000/home.html`

### Using PHP (if installed):
```bash
php -S localhost:8000
```

Then open: `http://localhost:8000/home.html`

## Option 2: Use VS Code Live Server Extension

1. Install the "Live Server" extension in VS Code
2. Right-click on `home.html`
3. Select "Open with Live Server"
4. The page will open in your browser with a local server

## Option 3: Use Browser Developer Tools

Some browsers allow you to disable security for local files, but this is not recommended for security reasons.

## Why This Happens

When you open HTML files directly (double-clicking them), they use the `file://` protocol which:
- Has security restrictions
- Doesn't handle relative paths well
- Can't make certain API requests

Using a local web server (like the options above) uses the `http://` protocol which:
- Properly handles relative paths
- Allows API requests to Supabase
- Works exactly like a real website

## Quick Test

After starting a server, try accessing:
- Homepage: `http://localhost:8000/home.html`
- Character page: `http://localhost:8000/character/superman-clark-kent.html`
- Birthday page: `http://localhost:8000/birthday/january.html`

If these work, your pages are generated correctly!

