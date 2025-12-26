/**
 * Character Page Generator
 * 
 * This script generates individual HTML pages for each character.
 * 
 * Usage:
 *   node generate-character-pages.js
 * 
 * This will:
 * - Fetch all characters from Supabase
 * - Generate a unique HTML page for each character
 * - Save pages in the /characters/ directory
 * - Update automatically when new characters are added
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Helper function to create a slug from a string
function createSlug(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to make Supabase API request
function supabaseRequest(table, select = '*') {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
        url.searchParams.append('select', select);

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
                if (res.statusCode >= 200 && res.statusCode < 300) {
                    try {
                        resolve(JSON.parse(data));
                    } catch (e) {
                        reject(new Error(`Failed to parse response: ${e.message}`));
                    }
                } else {
                    reject(new Error(`HTTP ${res.statusCode}: ${data}`));
                }
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.end();
    });
}

// Read the template character.html file
function readCharacterTemplate() {
    try {
        return fs.readFileSync(path.join(__dirname, 'character.html'), 'utf8');
    } catch (error) {
        console.error('Error reading character.html template:', error);
        throw error;
    }
}

// Generate HTML for a single character
function generateCharacterPage(character, template) {
    const slug = createSlug(character.character_name);
    
    // Replace placeholders in template with character-specific data
    let html = template;
    
    // Update page title
    html = html.replace(
        /<title>.*?<\/title>/,
        `<title>${character.character_name} - FictoVerse</title>`
    );
    
    // Add character-specific meta description
    const metaDescription = character.about 
        ? character.about.substring(0, 160).replace(/<[^>]*>/g, '')
        : `Learn about ${character.character_name}, a character from ${character.universe || 'FictoVerse'}.`;
    
    if (html.includes('<meta name="description"')) {
        html = html.replace(
            /<meta name="description"[^>]*>/,
            `<meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}">`
        );
    } else {
        // Insert after existing meta tags
        html = html.replace(
            /(<meta name="viewport"[^>]*>)/,
            `$1\n    <meta name="description" content="${metaDescription.replace(/"/g, '&quot;')}">`
        );
    }
    
    // Update CSS path to work from /characters/ subdirectory
    html = html.replace('href="public.css"', 'href="../public.css"');
    
    // Update JavaScript path to work from /characters/ subdirectory
    html = html.replace('src="public.js"', 'src="../public.js"');
    
    // Update home link to work from /characters/ subdirectory
    html = html.replace('href="home.html"', 'href="../home.html"');
    
    // Add character data as JSON for JavaScript to use
    const characterDataScript = `
    <script>
        window.characterData = ${JSON.stringify(character)};
    </script>`;
    
    // Insert before closing head tag
    html = html.replace('</head>', `${characterDataScript}\n</head>`);
    
    return html;
}

// Main function
async function generateCharacterPages() {
    console.log('Generating character pages...');
    
    // Create characters directory if it doesn't exist
    const charactersDir = path.join(__dirname, 'characters');
    if (!fs.existsSync(charactersDir)) {
        fs.mkdirSync(charactersDir, { recursive: true });
        console.log('Created /characters directory');
    }
    
    try {
        // Read the template
        const template = readCharacterTemplate();
        
        // Fetch all characters
        console.log('Fetching characters from Supabase...');
        const characters = await supabaseRequest('characters', '*');
        
        console.log(`Found ${characters.length} characters`);
        
        let generated = 0;
        let errors = 0;
        
        // Generate page for each character
        for (const character of characters) {
            if (!character.character_name) {
                console.warn(`Skipping character with no name (ID: ${character.id})`);
                continue;
            }
            
            try {
                const slug = createSlug(character.character_name);
                const html = generateCharacterPage(character, template);
                const filePath = path.join(charactersDir, `${slug}.html`);
                
                fs.writeFileSync(filePath, html, 'utf8');
                generated++;
                
                console.log(`✓ Generated: ${slug}.html`);
            } catch (error) {
                console.error(`✗ Error generating page for ${character.character_name}:`, error.message);
                errors++;
            }
        }
        
        console.log(`\n✅ Character pages generated successfully!`);
        console.log(`   Generated: ${generated} pages`);
        if (errors > 0) {
            console.log(`   Errors: ${errors} pages`);
        }
        console.log(`   Location: ${charactersDir}`);
        console.log(`\n⚠️  Update your navigation links to use /characters/{slug}.html format`);
        
    } catch (error) {
        console.error('❌ Error generating character pages:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateCharacterPages();
