/**
 * Static Page Generator for FictoVerse
 * 
 * This script generates individual HTML pages for:
 * - Each character (character/{slug}.html)
 * - Each birthday month (birthday/{month}.html)
 * - Each zodiac sign (sign/{sign}.html)
 * - Each category (category/{category}.html)
 * - Each universe (universe/{universe}.html)
 * 
 * Usage:
 *   node generate-static-pages.js
 * 
 * Run this script whenever:
 * - New characters are added
 * - Character data is updated
 * - New universes/categories are added
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Directories to create
const DIRS = {
    characters: 'character',
    birthdays: 'birthday',
    signs: 'sign',
    categories: 'category',
    universes: 'universe'
};

// Helper function to create a slug from text
function createSlug(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Helper function to format name
function formatName(name) {
    if (!name) return '';
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Helper function to make Supabase API request
function supabaseRequest(table, select = '*', filters = {}) {
    return new Promise((resolve, reject) => {
        const url = new URL(`${SUPABASE_URL}/rest/v1/${table}`);
        url.searchParams.append('select', select);
        
        // Add filters
        Object.keys(filters).forEach(key => {
            if (filters[key] !== undefined) {
                url.searchParams.append(key, `eq.${filters[key]}`);
            }
        });

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

// Read character.html template
function readCharacterTemplate() {
    try {
        return fs.readFileSync('character.html', 'utf8');
    } catch (error) {
        console.error('Error reading character.html:', error);
        throw error;
    }
}

// Read filter.html template (or create one)
function readFilterTemplate() {
    try {
        if (fs.existsSync('filter.html')) {
            return fs.readFileSync('filter.html', 'utf8');
        }
        // Return a basic template if filter.html doesn't exist
        return getBasicFilterTemplate();
    } catch (error) {
        console.error('Error reading filter.html:', error);
        return getBasicFilterTemplate();
    }
}

function getBasicFilterTemplate() {
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - FictoVerse</title>
    <link rel="stylesheet" href="../public.css">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
    <!-- Header -->
    <header class="public-header">
        <div class="header-container">
            <div class="header-left">
                <a href="../index.html" class="public-logo">
                    <img src="../assets/Logo main.png" alt="FictoVerse Logo" class="logo-image">
                </a>
            </div>
            <div class="header-center">
                <div class="public-search-bar" id="searchBarContainer">
                    <input type="text" placeholder="Search character" class="public-search-input" id="searchInput">
                    <span class="public-search-icon">🔍</span>
                    <div class="search-results" id="searchResults" style="display: none;"></div>
                </div>
            </div>
            <div class="header-right">
                <div class="nav-icon-item" id="randomCharacterBtn">
                    <div class="nav-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 3h5v5"></path>
                            <path d="M8 3H3v5"></path>
                            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L4 3"></path>
                            <path d="m21 3-5 5"></path>
                            <path d="M3 21l5-5"></path>
                            <path d="M8 21h5v-5"></path>
                            <path d="M16 21h5v-5"></path>
                        </svg>
                    </div>
                    <span class="nav-icon-label">Random</span>
                </div>
                <div class="nav-icon-item" onclick="window.location.href='../popular.html'">
                    <div class="nav-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                    </div>
                    <span class="nav-icon-label">Popular</span>
                </div>
                <div class="nav-icon-item" onclick="window.location.href='../public-game.html'">
                    <div class="nav-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 12h4m-2-2v4m8-8h.01M18 12h.01M15 9h.01M15 15h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path>
                        </svg>
                    </div>
                    <span class="nav-icon-label">Game</span>
                </div>
            </div>
        </div>
    </header>

    <!-- Main Content -->
    <main class="home-main">
        <div class="home-container">
            <section class="birthday-section">
                <h1 class="section-title">{{TITLE}}</h1>
                <div class="characters-grid" id="filteredCharactersGrid">
                    <!-- Characters will be loaded here -->
                </div>
                <div id="noResultsMessage" style="display: none; text-align: center; padding: 48px; color: #6b7280;">
                    <p>No characters found matching this filter.</p>
                </div>
            </section>
        </div>
    </main>

    <!-- Footer -->
    <footer class="public-footer">
        <div class="footer-container">
            <div class="footer-left">
                <div class="footer-logo">
                    <img src="../assets/Logo main.png" alt="FictoVerse Logo" class="logo-image-footer">
                </div>
                <div class="copyright">© 2024 FictoVerse. All rights reserved.</div>
                <div class="privacy-link">
                    <a href="../privacy-policy.html">Privacy Policy</a> | 
                    <a href="../terms-of-use.html">Terms of Use</a>
                </div>
            </div>
            <div class="footer-right">
                <nav class="footer-nav">
                    <a href="../about-us.html" class="footer-nav-link">About us</a>
                    <a href="../index.html" class="footer-nav-link">Home</a>
                    <a href="../public-game.html" class="footer-nav-link">Game</a>
                    <a href="../contact-us.html" class="footer-nav-link">Contact us</a>
                </nav>
                <div class="footer-social">
                    <a href="https://www.instagram.com/fictionalbirthdays?igsh=dW16ODdteHFuaGt5" class="social-icon-link" target="_blank" rel="noopener noreferrer">
                        <img src="../assets/instagram.png" alt="Instagram" class="social-icon-image">
                    </a>
                </div>
            </div>
        </div>
    </footer>

    <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
    <script>
        // Inline script for this specific filter page
        const FILTER_TYPE = '{{FILTER_TYPE}}';
        const FILTER_VALUE = '{{FILTER_VALUE}}';
        const FILTER_LABEL = '{{FILTER_LABEL}}';
        
        // Load filtered characters on page load
        // (Implementation would go here - similar to filter.js)
    </script>
</body>
</html>`;
}

// Generate character page
function generateCharacterPage(character, template) {
    const slug = createSlug(character.character_name);
    
    // Replace placeholders in template
    let html = template;
    
    // Update page title and meta description
    html = html.replace(/<title>.*?<\/title>/, `<title>${character.character_name} - FictoVerse</title>`);
    html = html.replace(/<meta name="description".*?>/, `<meta name="description" content="View ${character.character_name}'s profile including birthday, powers, and fun facts on FictoVerse.">`);
    
    // Update CSS path (character pages are in subdirectory)
    html = html.replace(/href="public\.css"/g, 'href="../public.css"');
    html = html.replace(/href="home\.html"/g, 'href="../index.html"');
    // Also handle direct index.html links (for logo) - must come after home.html replacement
    html = html.replace(/href="index\.html"/g, 'href="../index.html"');
    
    // Replace text logo with image logo in header (handle both text and image logos)
    html = html.replace(/<a href="\.\.\/index\.html" class="public-logo">[\s\S]*?<\/a>/g, 
        '<a href="../index.html" class="public-logo"><img src="../assets/Logo main.png" alt="FictoVerse Logo" class="logo-image"></a>');
    
    // Replace text logo with image logo in footer (handle both text and image logos)
    html = html.replace(/<div class="footer-logo">[\s\S]*?<\/div>/g, 
        '<div class="footer-logo"><img src="../assets/Logo main.png" alt="FictoVerse Logo" class="logo-image-footer"></div>');
    
    // Remove phone and address from footer
    html = html.replace(/<p class="contact-info">Phone:[\s\S]*?<\/p>/g, '');
    html = html.replace(/<p class="contact-info">Address:[\s\S]*?<\/p>/g, '');
    html = html.replace(/<div class="contact-info">Phone:[\s\S]*?<\/div>/g, '');
    html = html.replace(/<div class="contact-info">Address:[\s\S]*?<\/div>/g, '');
    
    // Remove entire footer-contact section
    html = html.replace(/<div class="footer-contact">[\s\S]*?<\/div>/g, '');
    
    // Update script paths
    html = html.replace(/src="public\.js"/g, 'src="../public.js"');
    
    // Update footer links (they also reference home.html)
    html = html.replace(/<a href="home\.html"/g, '<a href="../index.html"');
    // Also handle direct index.html links in footer
    html = html.replace(/<a href="index\.html"/g, '<a href="../index.html"');
    
    // Update Privacy Policy and Terms of Use links
    html = html.replace(/<a href="privacy-policy\.html">/g, '<a href="../privacy-policy.html">');
    html = html.replace(/<a href="terms-of-use\.html">/g, '<a href="../terms-of-use.html">');
    
    // Update About us link
    html = html.replace(/<a href="about-us\.html"/g, '<a href="../about-us.html"');
    html = html.replace(/<a href="#" class="footer-nav-link">About us<\/a>/g, 
        '<a href="../about-us.html" class="footer-nav-link">About us</a>');
    
    // Update Game link in footer to use relative path
    html = html.replace(/<a href="public-game\.html" class="footer-nav-link">Game<\/a>/g, 
        '<a href="../public-game.html" class="footer-nav-link">Game</a>');
    
    // Replace Trivia with Game in footer
    html = html.replace(/<a href="#" class="footer-nav-link">Trivia<\/a>/g, 
        '<a href="../public-game.html" class="footer-nav-link">Game</a>');
    
    // Add Contact us link after Game link if it doesn't exist
    html = html.replace(/(<a href="\.\.\/public-game\.html" class="footer-nav-link">Game<\/a>)(?![\s\S]*?<a href="\.\.\/contact-us\.html")/g, 
        '$1\n                    <a href="../contact-us.html" class="footer-nav-link">Contact us</a>');
    
    // Update Popular nav link (character pages are in subdirectory)
    html = html.replace(/onclick="window\.location\.href='popular\.html'"/g, 'onclick="window.location.href=\'../popular.html\'"');
    
    // Ensure header-right section has all three nav buttons with correct structure
    const correctNavButtons = `
                <div class="nav-icon-item" id="randomCharacterBtn">
                    <div class="nav-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M16 3h5v5"></path>
                            <path d="M8 3H3v5"></path>
                            <path d="M12 22v-8.3a4 4 0 0 0-1.172-2.872L4 3"></path>
                            <path d="m21 3-5 5"></path>
                            <path d="M3 21l5-5"></path>
                            <path d="M8 21h5v-5"></path>
                            <path d="M16 21h5v-5"></path>
                        </svg>
                    </div>
                    <span class="nav-icon-label">Random</span>
                </div>
                <div class="nav-icon-item" onclick="window.location.href='../popular.html'">
                    <div class="nav-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                    </div>
                    <span class="nav-icon-label">Popular</span>
                </div>
                <div class="nav-icon-item" onclick="window.location.href='../public-game.html'">
                    <div class="nav-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 12h4m-2-2v4m8-8h.01M18 12h.01M15 9h.01M15 15h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path>
                        </svg>
                    </div>
                    <span class="nav-icon-label">Game</span>
                </div>`;
    
    // Replace the entire header-right section to ensure consistency
    html = html.replace(/<div class="header-right">[\s\S]*?<\/div>\s*<\/div>\s*<\/header>/g, 
        `<div class="header-right">${correctNavButtons}
            </div>
        </div>
    </header>`);
    
    // Also update search bar to be consistent
    html = html.replace(/<div class="public-search-bar"[^>]*>/g, 
        '<div class="public-search-bar" id="searchBarContainer">');
    // Note: Character pages use public.js which expects id="searchResults", so we keep it as is
    
    // Update Contact Us icon to game icon (replace old email/envelope icon)
    const oldEmailIcon = /<svg[^>]*>[\s\S]*?<path d="M4 4h16c1\.1 0 2 \.9 2 2v12c0 1\.1-\.9 2-2 2H4c-1\.1 0-2-\.9-2-2V6c0-1\.1\.9-2 2-2z"><\/path>[\s\S]*?<polyline points="22,6 12,13 2,6"><\/polyline>[\s\S]*?<\/svg>/;
    const newGameIcon = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <path d="M6 12h4m-2-2v4m8-8h.01M18 12h.01M15 9h.01M15 15h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z"></path>
                        </svg>`;
    // Only replace if it's in the Contact Us nav item
    html = html.replace(/(<div class="nav-icon-item">[\s\S]*?<div class="nav-icon-wrapper">\s*)<svg[^>]*>[\s\S]*?<path d="M4 4h16[\s\S]*?<\/svg>([\s\S]*?<span class="nav-icon-label">Game<\/span>)/g, `$1${newGameIcon}$2`);
    
    // Add inline script to load this specific character by ID
    const inlineScript = `
    <script>
        // Auto-load this character by ID
        window.CHARACTER_ID = '${character.id}';
        window.CHARACTER_SLUG = '${slug}';
    </script>
<script type="text/javascript"> var infolinks_pid = 3442574; var infolinks_wsid = 0; </script> <script type="text/javascript" src="//resources.infolinks.com/js/infolinks_main.js"></script>`;
    
    // Insert script before closing body tag
    html = html.replace('</body>', inlineScript + '</body>');
    
    return html;
}

// Generate filter page
function generateFilterPage(filterType, filterValue, filterLabel, characters) {
    const template = readFilterTemplate();
    let html = template;
    
    // Sort by boost_count (descending), then by name, and limit to top 30
    const sortedChars = characters
        .sort((a, b) => {
            const boostA = a.boost_count || 0;
            const boostB = b.boost_count || 0;
            if (boostB !== boostA) {
                return boostB - boostA; // Higher boosts first
            }
            // If boosts are equal, sort alphabetically
            const nameA = (a.character_name || '').toLowerCase();
            const nameB = (b.character_name || '').toLowerCase();
            return nameA.localeCompare(nameB);
        })
        .slice(0, 30); // Limit to top 30
    
    // Replace placeholders
    html = html.replace(/\{\{TITLE\}\}/g, `${filterLabel} Characters`);
    html = html.replace(/\{\{FILTER_TYPE\}\}/g, filterType);
    html = html.replace(/\{\{FILTER_VALUE\}\}/g, filterValue);
    html = html.replace(/\{\{FILTER_LABEL\}\}/g, filterLabel);
    
    // Update page title in HTML
    html = html.replace(/<title>.*?<\/title>/, `<title>${filterLabel} Characters - FictoVerse</title>`);
    // Add favicon to prevent 404
    html = html.replace(/<link rel="stylesheet"/, `<link rel="icon" href="data:,">\n    <link rel="stylesheet"`);
    // Update h1 title to use section-title class like popular page
    html = html.replace(/<h1 class="filter-page-title"[^>]*>.*?<\/h1>/, `<h1 class="section-title">${filterLabel} Characters</h1>`);
    html = html.replace(/<h1[^>]*id="filterPageTitle"[^>]*>.*?<\/h1>/, `<h1 class="section-title">${filterLabel} Characters</h1>`);
    html = html.replace(/<h1 class="section-title">\{\{TITLE\}\}<\/h1>/, `<h1 class="section-title">${filterLabel} Characters</h1>`);
    
    // Update paths for subdirectory (filter pages are in subdirectories)
    html = html.replace(/href="public\.css"/g, 'href="../public.css"');
    html = html.replace(/href="home\.html"/g, 'href="../index.html"');
    // Also handle direct index.html links (for logo)
    html = html.replace(/href="index\.html"/g, 'href="../index.html"');
    html = html.replace(/src="filter\.js"/g, 'src="../filter.js"');
    
    // Remove entire footer-contact section from filter pages
    html = html.replace(/<div class="footer-contact">[\s\S]*?<\/div>/g, '');
    
    // Update footer copyright
    html = html.replace(/© 2024 FictoVerse\. All rights reserved\./g, '© 2026 FictionalBirthdays. All Rights Reserved.');
    html = html.replace(/© 2023 Positivus\. All Rights Reserved\./g, '© 2026 FictionalBirthdays. All Rights Reserved.');
    
    // Update footer privacy links
    html = html.replace(/<div class="privacy-link"><a href="#">Privacy Policy<\/a><\/div>/g, 
        '<p class="privacy-link">\n                    <a href="../privacy-policy.html">Privacy Policy</a> | \n                    <a href="../terms-of-use.html">Terms of Use</a>\n                </p>');
    html = html.replace(/<div class="privacy-link">.*?Privacy Policy.*?<\/div>/g, 
        '<p class="privacy-link">\n                    <a href="../privacy-policy.html">Privacy Policy</a> | \n                    <a href="../terms-of-use.html">Terms of Use</a>\n                </p>');
    
    // Update footer copyright div to p tag
    html = html.replace(/<div class="copyright">© 2026 FictionalBirthdays\. All Rights Reserved\.<\/div>/g, 
        '<p class="copyright">© 2026 FictionalBirthdays. All Rights Reserved.</p>');
    
    // Update Home link in footer
    html = html.replace(/<a href="home\.html" class="footer-nav-link">Home<\/a>/g, 
        '<a href="../index.html" class="footer-nav-link">Home</a>');
    html = html.replace(/<a href="\.\.\/home\.html" class="footer-nav-link">Home<\/a>/g, 
        '<a href="../index.html" class="footer-nav-link">Home</a>');
    
    // Update Popular nav link
    html = html.replace(/<div class="nav-icon-item">[\s\S]*?<span class="nav-icon-label">Popular<\/span>[\s\S]*?<\/div>/, 
        `<div class="nav-icon-item" onclick="window.location.href='../popular.html'">
                    <div class="nav-icon-wrapper">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                        </svg>
                    </div>
                    <span class="nav-icon-label">Popular</span>
                </div>`);
    
    // Generate character cards HTML with rank badges
    const cardsHtml = sortedChars.map((char, index) => {
        const rank = index + 1; // Rank starts at 1
        const slug = createSlug(char.character_name);
        const universeFormatted = formatName(char.universe);
        const imageUrl = char.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
        
        return `
        <div class="character-card character-card-ranked" onclick="window.location.href='../character/${slug}.html'">
            <div class="character-card-image">
                <img src="${imageUrl}" alt="${char.character_name || 'Character'}" loading="lazy">
                <div class="character-rank-badge">${rank}</div>
            </div>
            <div class="character-card-name">${char.character_name || '-'}</div>
            <div class="character-card-universe">${universeFormatted || '-'} Character</div>
        </div>`;
    }).join('');
    
    // Replace the grid placeholder and remove the comment
    html = html.replace(
        '<div class="characters-grid" id="filteredCharactersGrid">\n                <!-- Characters will be loaded here -->',
        `<div class="characters-grid" id="filteredCharactersGrid">${cardsHtml}`
    );
    // Also handle case where comment might be on same line
    html = html.replace(
        '<div class="characters-grid" id="filteredCharactersGrid"><!-- Characters will be loaded here -->',
        `<div class="characters-grid" id="filteredCharactersGrid">${cardsHtml}`
    );
    
    // Add inline script to handle this specific filter
    const inlineScript = `
    <script>
        // This page shows: ${filterLabel} Characters
        // Characters are pre-rendered above
    </script>
<script type="text/javascript"> var infolinks_pid = 3442574; var infolinks_wsid = 0; </script> <script type="text/javascript" src="//resources.infolinks.com/js/infolinks_main.js"></script>`;
    
    html = html.replace('</body>', inlineScript + '</body>');
    
    return html;
}

// Create directory if it doesn't exist
function ensureDirectory(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`Created directory: ${dir}`);
    }
}

// Main generation function
async function generateAllPages() {
    console.log('🚀 Starting static page generation...\n');
    
    // Create directories
    Object.values(DIRS).forEach(dir => ensureDirectory(dir));
    
    try {
        // Fetch all characters
        console.log('📥 Fetching characters from Supabase...');
        const characters = await supabaseRequest('characters', '*');
        console.log(`✅ Found ${characters.length} characters\n`);
        
        // Read character template
        const characterTemplate = readCharacterTemplate();
        
        // Generate character pages
        console.log('📄 Generating character pages...');
        let characterCount = 0;
        for (const character of characters) {
            if (!character.character_name) continue;
            
            const slug = createSlug(character.character_name);
            const html = generateCharacterPage(character, characterTemplate);
            const filePath = path.join(DIRS.characters, `${slug}.html`);
            
            fs.writeFileSync(filePath, html, 'utf8');
            characterCount++;
        }
        console.log(`✅ Generated ${characterCount} character pages\n`);
        
        // Generate birthday month pages
        console.log('📅 Generating birthday month pages...');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        let birthdayCount = 0;
        
        for (let i = 0; i < 12; i++) {
            const month = String(i + 1).padStart(2, '0');
            const monthName = monthNames[i];
            
            // Filter characters by month
            const monthChars = characters.filter(char => {
                if (!char.birthday) return false;
                const [charMonth] = char.birthday.split('-');
                return charMonth === month;
            });
            
            if (monthChars.length > 0) {
                const html = generateFilterPage('birthday', monthName, monthName, monthChars);
                const filePath = path.join(DIRS.birthdays, `${createSlug(monthName)}.html`);
                fs.writeFileSync(filePath, html, 'utf8');
                birthdayCount++;
            }
        }
        console.log(`✅ Generated ${birthdayCount} birthday month pages\n`);
        
        // Generate sign pages
        console.log('⭐ Generating zodiac sign pages...');
        const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 
                      'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
        let signCount = 0;
        
        for (const sign of signs) {
            const signChars = characters.filter(char => 
                char.sign && char.sign.toLowerCase() === sign.toLowerCase()
            );
            
            if (signChars.length > 0) {
                const signLabel = formatName(sign);
                const html = generateFilterPage('sign', sign, signLabel, signChars);
                const filePath = path.join(DIRS.signs, `${sign}.html`);
                fs.writeFileSync(filePath, html, 'utf8');
                signCount++;
            }
        }
        console.log(`✅ Generated ${signCount} zodiac sign pages\n`);
        
        // Generate category pages
        console.log('📂 Generating category pages...');
        const categories = [...new Set(characters.map(c => c.category).filter(Boolean))];
        let categoryCount = 0;
        
        for (const category of categories) {
            const categoryChars = characters.filter(char => 
                char.category && char.category.toLowerCase() === category.toLowerCase()
            );
            
            if (categoryChars.length > 0) {
                const categoryLabel = formatName(category);
                const html = generateFilterPage('category', category, categoryLabel, categoryChars);
                const filePath = path.join(DIRS.categories, `${createSlug(category)}.html`);
                fs.writeFileSync(filePath, html, 'utf8');
                categoryCount++;
            }
        }
        console.log(`✅ Generated ${categoryCount} category pages\n`);
        
        // Generate universe pages
        console.log('🌌 Generating universe pages...');
        const universes = [...new Set(characters.map(c => c.universe).filter(Boolean))];
        let universeCount = 0;
        
        for (const universe of universes) {
            const universeChars = characters.filter(char => 
                char.universe && char.universe.toLowerCase() === universe.toLowerCase()
            );
            
            if (universeChars.length > 0) {
                const universeLabel = formatName(universe);
                const html = generateFilterPage('universe', universe, universeLabel, universeChars);
                const filePath = path.join(DIRS.universes, `${createSlug(universe)}.html`);
                fs.writeFileSync(filePath, html, 'utf8');
                universeCount++;
            }
        }
        console.log(`✅ Generated ${universeCount} universe pages\n`);
        
        console.log('✨ Static page generation complete!');
        console.log(`\n📊 Summary:`);
        console.log(`   - Character pages: ${characterCount}`);
        console.log(`   - Birthday pages: ${birthdayCount}`);
        console.log(`   - Sign pages: ${signCount}`);
        console.log(`   - Category pages: ${categoryCount}`);
        console.log(`   - Universe pages: ${universeCount}`);
        console.log(`   - Total pages: ${characterCount + birthdayCount + signCount + categoryCount + universeCount}`);
        
    } catch (error) {
        console.error('❌ Error generating pages:', error.message);
        process.exit(1);
    }
}

// Run the generator
generateAllPages();

