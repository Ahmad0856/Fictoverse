# Automatic Static Page Generation Setup

This guide explains how to set up automatic static page generation so you don't have to manually run `node generate-static-pages.js` every time.

## Quick Start

### Option 1: Production Server (Recommended for Production/Deployment)

For production or when you want pages to auto-generate after publishing:

```bash
node auto-generate-server.js
```

Or use PM2 for production:
```bash
npm install -g pm2
pm2 start auto-generate-server.js --name "fictoverse-generator"
```

This server continuously monitors your database and automatically regenerates pages when characters are added/updated. **No manual steps required!**

See `PRODUCTION_AUTO_GENERATION.md` for detailed deployment instructions.

### Option 2: Automatic Watcher (Recommended for Development)

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the watcher:**
   ```bash
   npm start
   ```
   or
   ```bash
   node watch-and-generate.js
   ```

3. **Keep the watcher running** in a terminal window while you work.

The watcher will:
- ✅ Automatically regenerate pages when you save characters
- ✅ Run initial generation on startup
- ✅ Watch for changes in key files
- ✅ Provide an API endpoint for browser-triggered generation

### Option 2: Manual Generation (Current Method)

If you prefer to generate manually:
```bash
npm run generate
```
or
```bash
node generate-static-pages.js
```

## How It Works

### Automatic Watcher (`watch-and-generate.js`)

1. **File Watching**: Watches for changes in:
   - `script.js` (character save logic)
   - `overview.js` (character management)
   - `admin.html` (admin interface)
   - `generate-static-pages.js` (generator script)

2. **Debounced Generation**: Waits 2 seconds after the last change before generating (prevents multiple runs)

3. **API Endpoint**: Provides `http://localhost:3001/generate` (POST) that can be called from the browser

4. **Browser Integration**: When you save a character in the admin panel, it automatically triggers generation via the API

### Browser Integration

When you add or update a character:
1. The character is saved to the database
2. A POST request is sent to `http://localhost:3001/generate`
3. The watcher receives the request and triggers page generation
4. Static pages are automatically regenerated

**Note**: The API call fails silently if the watcher isn't running, so you can still use the admin panel without it.

## Usage

### Starting the Watcher

```bash
npm start
```

You'll see output like:
```
🚀 Starting FictoVerse Static Page Generator Watcher...

📦 Running initial page generation...
📄 Generating static pages...
✅ Static pages generated successfully!

👀 Watching for changes in:
   - script.js
   - overview.js
   - admin.html
   - generate-static-pages.js

💡 Pages will auto-regenerate when you save characters.

Press Ctrl+C to stop the watcher.
```

### Stopping the Watcher

Press `Ctrl+C` in the terminal where the watcher is running.

## Troubleshooting

### Watcher Not Running

If you see this message in the browser console:
```
💡 Static page watcher not running. Run "npm start" to enable auto-generation.
```

**Solution**: Start the watcher in a separate terminal:
```bash
npm start
```

### Pages Not Generating

1. **Check if watcher is running**: Look for the watcher output in the terminal
2. **Check for errors**: Look for error messages in the watcher terminal
3. **Manual generation**: Try running `npm run generate` manually to see if there are any errors

### Port Already in Use

If port 3001 is already in use, you can modify the port in `watch-and-generate.js`:
```javascript
server.listen(3001, () => {  // Change 3001 to another port
```

## Benefits

✅ **No manual steps**: Pages generate automatically when you save characters
✅ **Always up-to-date**: Static pages reflect the latest database changes
✅ **Development-friendly**: Watcher runs in background, doesn't interfere with your work
✅ **Fallback available**: Can still generate manually if needed

## Next Steps

1. Run `npm install` to install dependencies
2. Run `npm start` to start the watcher
3. Add or update characters in the admin panel
4. Watch the terminal - pages will regenerate automatically!

