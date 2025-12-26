/**
 * File Watcher for Automatic Static Page Generation
 * 
 * This script watches for changes and automatically runs generate-static-pages.js
 * 
 * Usage:
 *   npm start
 *   or
 *   node watch-and-generate.js
 * 
 * The script will:
 * - Watch for changes in script.js, overview.js, and admin.html
 * - Automatically regenerate static pages when characters are added/updated
 * - Run initial generation on startup
 */

const { spawn } = require('child_process');
const chokidar = require('chokidar');
const path = require('path');

let isGenerating = false;
let generateTimeout = null;

console.log('🚀 Starting FictoVerse Static Page Generator Watcher...\n');

// Function to run the generation script
function generatePages() {
    if (isGenerating) {
        console.log('⏳ Generation already in progress, queuing next run...');
        return;
    }

    isGenerating = true;
    console.log('📄 Generating static pages...');

    const generateScript = spawn('node', ['generate-static-pages.js'], {
        stdio: 'inherit',
        shell: true
    });

    generateScript.on('close', (code) => {
        isGenerating = false;
        if (code === 0) {
            console.log('✅ Static pages generated successfully!\n');
        } else {
            console.error(`❌ Generation failed with code ${code}\n`);
        }
    });

    generateScript.on('error', (err) => {
        isGenerating = false;
        console.error('❌ Error running generation script:', err);
    });
}

// Debounced generation function (waits 2 seconds after last change)
function debouncedGenerate() {
    if (generateTimeout) {
        clearTimeout(generateTimeout);
    }
    
    generateTimeout = setTimeout(() => {
        generatePages();
    }, 2000); // Wait 2 seconds after last change
}

// Run initial generation
console.log('📦 Running initial page generation...');
generatePages();

// Watch for changes in key files
const watchPaths = [
    'script.js',
    'overview.js',
    'admin.html',
    'generate-static-pages.js'
];

console.log('\n👀 Watching for changes in:');
watchPaths.forEach(file => console.log(`   - ${file}`));
console.log('\n💡 Pages will auto-regenerate when you save characters.\n');
console.log('Press Ctrl+C to stop the watcher.\n');

const watcher = chokidar.watch(watchPaths, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    ignoreInitial: true
});

watcher
    .on('change', (filePath) => {
        const fileName = path.basename(filePath);
        console.log(`📝 File changed: ${fileName}`);
        console.log('⏱️  Regenerating pages in 2 seconds...');
        debouncedGenerate();
    })
    .on('error', (error) => {
        console.error('❌ Watcher error:', error);
    });

// Also watch for changes via a simple HTTP endpoint (optional)
// This allows the browser to trigger generation after saving a character
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/generate' && req.method === 'POST') {
        console.log('🌐 Generation triggered via API');
        debouncedGenerate();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Generation triggered' }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

server.listen(3001, () => {
    console.log('🔌 API endpoint available at http://localhost:3001/generate (POST)');
    console.log('   You can trigger generation from the browser after saving characters.\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping watcher...');
    watcher.close();
    server.close();
    process.exit(0);
});

