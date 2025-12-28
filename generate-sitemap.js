/**
 * Dynamic Sitemap Generator for FictoVerse
 * 
 * This script generates a sitemap.xml file by fetching data from Supabase.
 * 
 * Usage:
 *   node generate-sitemap.js
 * 
 * The generated sitemap.xml will be saved in the root directory.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Base URL for your website (update this with your actual domain)
const BASE_URL = 'https://fictionalbirthdays.com';

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

// Generate XML sitemap
function generateSitemap(urls) {
    const currentDate = new Date().toISOString().split('T')[0];
    
    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

    urls.forEach(url => {
        xml += `  <url>\n`;
        xml += `    <loc>${escapeXml(url.loc)}</loc>\n`;
        if (url.lastmod) {
            xml += `    <lastmod>${url.lastmod}</lastmod>\n`;
        }
        if (url.changefreq) {
            xml += `    <changefreq>${url.changefreq}</changefreq>\n`;
        }
        if (url.priority) {
            xml += `    <priority>${url.priority}</priority>\n`;
        }
        xml += `  </url>\n`;
    });

    xml += `</urlset>`;
    return xml;
}

// Escape XML special characters
function escapeXml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

// Main function
async function generateSitemapFile() {
    console.log('Generating sitemap.xml...');
    
    const urls = [];
    const currentDate = new Date().toISOString().split('T')[0];

    // Static URLs
    const staticUrls = [
        { path: '/', priority: '1.0', changefreq: 'daily' },
        { path: '/home.html', priority: '1.0', changefreq: 'daily' },
        { path: '/characters', priority: '0.9', changefreq: 'weekly' },
        { path: '/universes', priority: '0.9', changefreq: 'weekly' },
        { path: '/about', priority: '0.8', changefreq: 'monthly' },
        { path: '/contact', priority: '0.8', changefreq: 'monthly' }
    ];

    staticUrls.forEach(url => {
        urls.push({
            loc: `${BASE_URL}${url.path}`,
            lastmod: currentDate,
            changefreq: url.changefreq,
            priority: url.priority
        });
    });

    try {
        // Fetch all characters
        console.log('Fetching characters from Supabase...');
        const characters = await supabaseRequest('characters', 'id,character_name,updated_at');
        
        console.log(`Found ${characters.length} characters`);
        
        characters.forEach(character => {
            if (character.character_name) {
                const slug = createSlug(character.character_name);
                const lastmod = character.updated_at 
                    ? new Date(character.updated_at).toISOString().split('T')[0]
                    : currentDate;
                
                urls.push({
                    loc: `${BASE_URL}/character/${slug}`,
                    lastmod: lastmod,
                    changefreq: 'weekly',
                    priority: '0.7'
                });
            }
        });

        // Fetch all universes
        console.log('Fetching universes from Supabase...');
        const universes = await supabaseRequest('universes', 'id,name,updated_at');
        
        console.log(`Found ${universes.length} universes`);
        
        universes.forEach(universe => {
            if (universe.name) {
                const slug = createSlug(universe.name);
                const lastmod = universe.updated_at 
                    ? new Date(universe.updated_at).toISOString().split('T')[0]
                    : currentDate;
                
                urls.push({
                    loc: `${BASE_URL}/universe/${slug}`,
                    lastmod: lastmod,
                    changefreq: 'weekly',
                    priority: '0.6'
                });
            }
        });

        // Generate sitemap XML
        const sitemapXml = generateSitemap(urls);

        // Write to file
        const outputPath = path.join(__dirname, 'sitemap.xml');
        fs.writeFileSync(outputPath, sitemapXml, 'utf8');

        console.log(`\n✅ Sitemap generated successfully!`);
        console.log(`   Total URLs: ${urls.length}`);
        console.log(`   Saved to: ${outputPath}`);
        console.log(`\n⚠️  Don't forget to update BASE_URL in generate-sitemap.js with your actual domain!`);

    } catch (error) {
        console.error('❌ Error generating sitemap:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateSitemapFile();





