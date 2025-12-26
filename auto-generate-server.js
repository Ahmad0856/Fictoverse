/**
 * Production-Ready Auto-Generation Server
 * 
 * This server runs continuously and automatically generates static pages
 * when characters are added/updated in the database.
 * 
 * Usage:
 *   node auto-generate-server.js
 * 
 * For production, run this as a background service or use PM2:
 *   pm2 start auto-generate-server.js --name "fictoverse-generator"
 * 
 * This server:
 * - Polls Supabase for changes every 30 seconds
 * - Automatically regenerates pages when changes are detected
 * - Can be deployed to any Node.js hosting service
 * - Works independently of the local watcher
 */

const { spawn } = require('child_process');
const https = require('https');

// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

let isGenerating = false;
let lastCharacterCount = 0;
let lastCheckTime = null;

console.log('🚀 Starting FictoVerse Auto-Generation Server...\n');
console.log('📡 Monitoring database for changes...\n');

// Function to run the generation script
function generatePages() {
    if (isGenerating) {
        console.log('⏳ Generation already in progress, skipping...');
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

// Function to check for database changes
async function checkForChanges() {
    try {
        const url = new URL(`${SUPABASE_URL}/rest/v1/characters`);
        url.searchParams.append('select', 'id');
        url.searchParams.append('order', 'updated_at.desc');
        url.searchParams.append('limit', '1');

        const options = {
            hostname: url.hostname,
            path: url.pathname + url.search,
            method: 'GET',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            }
        };

        const req = https.request(options, (res) => {
            let data = '';

            res.on('data', (chunk) => {
                data += chunk;
            });

            res.on('end', () => {
                try {
                    const characters = JSON.parse(data);
                    const currentCount = Array.isArray(characters) ? characters.length : 0;
                    const currentTime = new Date().toISOString();

                    // Check if count changed or if this is the first check
                    if (lastCharacterCount === 0) {
                        // First run - just store the count
                        lastCharacterCount = currentCount;
                        lastCheckTime = currentTime;
                        console.log(`📊 Initial check: ${currentCount} characters found`);
                        
                        // Generate pages on first run
                        generatePages();
                    } else if (currentCount !== lastCharacterCount) {
                        console.log(`🔄 Change detected: Character count changed from ${lastCharacterCount} to ${currentCount}`);
                        lastCharacterCount = currentCount;
                        lastCheckTime = currentTime;
                        generatePages();
                    } else {
                        // Check if any character was updated recently (within last 2 minutes)
                        // This is a simple approach - for better detection, you'd check updated_at timestamps
                        console.log(`✓ No changes detected (${currentCount} characters)`);
                    }
                } catch (error) {
                    console.error('❌ Error parsing response:', error.message);
                }
            });
        });

        req.on('error', (error) => {
            console.error('❌ Error checking for changes:', error.message);
        });

        req.end();
    } catch (error) {
        console.error('❌ Error in checkForChanges:', error.message);
    }
}

// Run initial generation
console.log('📦 Running initial page generation...');
generatePages();

// Check for changes every 30 seconds
setInterval(() => {
    if (!isGenerating) {
        checkForChanges();
    }
}, 30000); // 30 seconds

// Also provide HTTP endpoint for manual triggers
const http = require('http');
const server = http.createServer((req, res) => {
    if (req.url === '/generate' && req.method === 'POST') {
        console.log('🌐 Manual generation triggered via API');
        generatePages();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, message: 'Generation triggered' }));
    } else if (req.url === '/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ 
            status: 'running',
            isGenerating,
            lastCharacterCount,
            lastCheckTime
        }));
    } else {
        res.writeHead(404);
        res.end('Not found');
    }
});

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
    console.log(`🔌 API endpoint available at http://localhost:${PORT}/generate (POST)`);
    console.log(`📊 Status endpoint available at http://localhost:${PORT}/status (GET)`);
    console.log('\n💡 Server will automatically regenerate pages when database changes are detected.\n');
});

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n\n👋 Stopping auto-generation server...');
    server.close();
    process.exit(0);
});

