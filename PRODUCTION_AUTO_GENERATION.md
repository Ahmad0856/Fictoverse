# Production Auto-Generation Setup

This guide explains how to set up **automatic static page generation** that works even after publishing/deploying your site.

## Quick Start

### Option 1: Production Server (Recommended for Production)

Run a background server that continuously monitors the database and regenerates pages automatically:

```bash
node auto-generate-server.js
```

Or use PM2 for production:

```bash
npm install -g pm2
pm2 start auto-generate-server.js --name "fictoverse-generator"
pm2 save
pm2 startup  # Set up auto-start on system reboot
```

### Option 2: Local Watcher (For Development)

For local development, use the file watcher:

```bash
npm start
```

This watches for file changes and regenerates pages automatically.

## How It Works

### Production Server (`auto-generate-server.js`)

1. **Database Polling**: Checks Supabase every 30 seconds for changes
2. **Automatic Detection**: Detects when characters are added/updated
3. **Auto-Regeneration**: Automatically runs `generate-static-pages.js` when changes are detected
4. **API Endpoints**: Provides HTTP endpoints for manual triggers
5. **Background Service**: Runs continuously, independent of your admin interface

### Local Watcher (`watch-and-generate.js`)

1. **File Watching**: Watches for changes in key files
2. **API Endpoint**: Provides `http://localhost:3001/generate` for browser triggers
3. **Development-Friendly**: Perfect for local development

## Deployment Options

### Option A: Deploy to a Server

1. **Upload your project** to a server (VPS, cloud instance, etc.)
2. **Install Node.js** on the server
3. **Run the auto-generation server**:
   ```bash
   node auto-generate-server.js
   ```
4. **Use PM2** to keep it running:
   ```bash
   pm2 start auto-generate-server.js --name "fictoverse-generator"
   ```

### Option B: Use a Cloud Service

Deploy the auto-generation server to:
- **Heroku**: `heroku create` then `git push heroku main`
- **Railway**: Connect your repo and set start command
- **Render**: Deploy as a background worker
- **DigitalOcean App Platform**: Deploy as a worker service

### Option C: GitHub Actions (For Static Hosting)

If you're using static hosting (Netlify, Vercel, GitHub Pages), set up GitHub Actions:

1. Create `.github/workflows/generate-pages.yml`:
```yaml
name: Generate Static Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm install
      - run: node generate-static-pages.js
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./
```

2. Push changes trigger automatic generation
3. Generated pages are committed back to the repo

## Integration with Admin Panel

The admin panel (`script.js`) automatically tries to trigger generation when you save a character:

1. **Local Development**: If `npm start` is running, it triggers via API
2. **Production**: The auto-generation server detects the change via database polling
3. **No Action Required**: Pages regenerate automatically!

## Monitoring

### Check Server Status

```bash
curl http://localhost:3002/status
```

### View Logs (PM2)

```bash
pm2 logs fictoverse-generator
```

### Manual Trigger

```bash
curl -X POST http://localhost:3002/generate
```

## Configuration

### Change Polling Interval

Edit `auto-generate-server.js`:

```javascript
setInterval(() => {
    if (!isGenerating) {
        checkForChanges();
    }
}, 30000); // Change 30000 to your desired interval (in milliseconds)
```

### Change Port

Set environment variable:

```bash
PORT=3003 node auto-generate-server.js
```

Or edit the file:

```javascript
const PORT = process.env.PORT || 3002; // Change 3002 to your port
```

## Troubleshooting

### Server Not Detecting Changes

1. **Check database connection**: Verify Supabase credentials
2. **Check logs**: Look for error messages
3. **Manual trigger**: Try `curl -X POST http://localhost:3002/generate`

### Pages Not Generating

1. **Check if server is running**: `curl http://localhost:3002/status`
2. **Check for errors**: Look at server console output
3. **Test manually**: Run `node generate-static-pages.js` directly

### Server Crashes

Use PM2 to auto-restart:

```bash
pm2 start auto-generate-server.js --name "fictoverse-generator" --watch
```

## Best Practices

1. **Use PM2** for production to ensure the server stays running
2. **Monitor logs** regularly to catch issues early
3. **Set up alerts** if using a cloud service
4. **Backup** your generated pages regularly
5. **Test** the generation process before deploying

## Summary

✅ **Development**: Use `npm start` (file watcher)  
✅ **Production**: Use `node auto-generate-server.js` (database polling)  
✅ **Deployment**: Deploy the server to a cloud service or run on your server  
✅ **Zero Manual Steps**: Pages regenerate automatically when you save characters!

