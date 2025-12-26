// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Initialize Supabase client (check if already exists to avoid conflicts)
if (typeof window.supabaseClient === 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Format universe/category name
function formatName(name) {
    if (!name) return '';
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Create slug from character name
function createSlug(text) {
    if (!text) return '';
    return text
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/[\s_-]+/g, '-') // Replace spaces and underscores with hyphens
        .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Create character card with rank indicator
function createCharacterCard(character, rank) {
    const imageUrl = character.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
    const universeFormatted = formatName(character.universe) || 'Unknown';
    const slug = createSlug(character.character_name);
    const isMobile = window.innerWidth <= 768;
    const cardClickHandler = isMobile ? '' : `onclick="window.location.href='character/${slug}.html'"`;
    const imageClickHandler = isMobile ? `onclick="window.location.href='character/${slug}.html'"` : '';
    const nameClickHandler = isMobile ? `onclick="window.location.href='character/${slug}.html'"` : '';

    return `
        <div class="character-card character-card-ranked" ${cardClickHandler}>
            <div class="character-card-image" ${imageClickHandler}>
                <img src="${imageUrl}" alt="${character.character_name || 'Character'}" loading="lazy">
                <div class="character-rank-badge">${rank}</div>
            </div>
            <div class="character-card-name" ${nameClickHandler}>${character.character_name || '-'}</div>
            <div class="character-card-universe">${universeFormatted} Character</div>
        </div>
    `;
}

// Load popular characters (top 30 by boost count)
async function loadPopularCharacters() {
    const container = document.getElementById('popularCharacters');
    const supabase = window.supabaseClient;
    
    if (!supabase) {
        container.innerHTML = '<div class="error">Supabase not configured</div>';
        return;
    }

    try {
        // Fetch top 30 characters ordered by boost_count (descending), then by name
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name, universe, image_url, boost_count')
            .order('boost_count', { ascending: false, nullsFirst: false })
            .order('character_name', { ascending: true })
            .limit(30);

        if (error) {
            console.error('Error loading popular characters:', error);
            let errorMsg = 'Error loading characters. ';
            if (error.message.includes('permission') || error.message.includes('policy') || error.code === '42501') {
                errorMsg += 'Please run enable_public_read_access.sql in Supabase SQL Editor.';
            } else {
                errorMsg += error.message;
            }
            container.innerHTML = `<div class="error">${errorMsg}</div>`;
            return;
        }

        if (!data || data.length === 0) {
            container.innerHTML = '<div class="empty-state">No characters found.</div>';
            return;
        }

        // Display characters with their rank
        container.innerHTML = data.map((character, index) => {
            const rank = index + 1; // Rank starts at 1
            return createCharacterCard(character, rank);
        }).join('');

    } catch (error) {
        console.error('Error loading popular characters:', error);
        container.innerHTML = `<div class="error">An error occurred: ${error.message}. Check console for details.</div>`;
    }
}

// Search functionality with real-time results (same as home.js)
let searchTimeout;
let allCharacters = [];
let searchableItems = {
    universes: new Set(),
    categories: new Set(),
    months: new Set(),
    signs: new Set()
};

// Month names for matching
const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                   'july', 'august', 'september', 'october', 'november', 'december'];

// Load all characters for search
async function loadAllCharactersForSearch() {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name, universe, category, birthday, sign, image_url, boost_count')
            .order('character_name', { ascending: true });

        if (!error && data) {
            allCharacters = data;
            
            // Extract unique searchable items
            searchableItems.universes.clear();
            searchableItems.categories.clear();
            searchableItems.months.clear();
            searchableItems.signs.clear();
            
            data.forEach(char => {
                if (char.universe) searchableItems.universes.add(char.universe);
                if (char.category) searchableItems.categories.add(char.category);
                if (char.birthday) {
                    const [month] = char.birthday.split('-');
                    const monthIndex = parseInt(month) - 1;
                    if (monthIndex >= 0 && monthIndex < 12) {
                        searchableItems.months.add(monthNames[monthIndex]);
                    }
                }
                if (char.sign) searchableItems.signs.add(char.sign);
            });
        }
    } catch (error) {
        console.error('Error loading characters for search:', error);
    }
}

// Get filter path helper
function getFilterPath(filterType, filterValue) {
    const slug = createSlug(filterValue);
    const dirMap = {
        'birthday': 'birthday',
        'sign': 'sign',
        'category': 'category',
        'universe': 'universe'
    };
    return `${dirMap[filterType] || filterType}/${slug}.html`;
}

// Get icon for search result type
function getIconForType(type) {
    switch(type) {
        case 'universe': return '🌌';
        case 'category': return '📂';
        case 'month': return '📅';
        case 'sign': return '⭐';
        default: return '👤';
    }
}

// Perform real-time search
function performSearch(searchTerm) {
    const searchResults = document.getElementById('searchResults');
    if (!searchResults) return;

    if (!searchTerm || searchTerm.trim().length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    const term = searchTerm.toLowerCase().trim();
    const results = [];

    // Search characters
    const filteredChars = allCharacters.filter(char => 
        char.character_name && char.character_name.toLowerCase().includes(term)
    ).slice(0, 5); // Limit characters to 5

    // Search universes
    const filteredUniverses = Array.from(searchableItems.universes).filter(uni => 
        formatName(uni).toLowerCase().includes(term)
    ).slice(0, 2);

    // Search categories
    const filteredCategories = Array.from(searchableItems.categories).filter(cat => 
        formatName(cat).toLowerCase().includes(term)
    ).slice(0, 2);

    // Search months
    const filteredMonths = Array.from(searchableItems.months).filter(month => 
        month.includes(term)
    ).slice(0, 2);

    // Search signs
    const filteredSigns = Array.from(searchableItems.signs).filter(sign => 
        sign.toLowerCase().includes(term)
    ).slice(0, 2);

    // Add characters to results
    filteredChars.forEach(char => {
        const imageUrl = char.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23f3f4f6"/%3E%3C/svg%3E';
        const universeFormatted = formatName(char.universe) || '';
        const slug = createSlug(char.character_name);
        results.push({
            type: 'character',
            name: char.character_name,
            subtitle: universeFormatted ? `${universeFormatted} Character` : '',
            href: `character/${slug}.html`,
            image: imageUrl
        });
    });

    // Add universes to results
    filteredUniverses.forEach(uni => {
        const filterPath = getFilterPath('universe', uni);
        results.push({
            type: 'universe',
            name: formatName(uni),
            subtitle: 'Universe',
            href: filterPath,
            image: null
        });
    });

    // Add categories to results
    filteredCategories.forEach(cat => {
        const filterPath = getFilterPath('category', cat);
        results.push({
            type: 'category',
            name: formatName(cat),
            subtitle: 'Category',
            href: filterPath,
            image: null
        });
    });

    // Add months to results
    filteredMonths.forEach(month => {
        const monthCapitalized = month.charAt(0).toUpperCase() + month.slice(1);
        const filterPath = getFilterPath('birthday', monthCapitalized);
        results.push({
            type: 'month',
            name: monthCapitalized,
            subtitle: 'Birthday Month',
            href: filterPath,
            image: null
        });
    });

    // Add signs to results
    filteredSigns.forEach(sign => {
        const filterPath = getFilterPath('sign', sign);
        results.push({
            type: 'sign',
            name: sign,
            subtitle: 'Zodiac Sign',
            href: filterPath,
            image: null
        });
    });

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item no-results">No results found</div>';
        searchResults.style.display = 'block';
        return;
    }

    // Limit total results to 8
    const limitedResults = results.slice(0, 8);

    searchResults.innerHTML = limitedResults.map(item => {
        const imageHtml = item.image 
            ? `<img src="${item.image}" alt="${item.name}" class="search-result-image">`
            : `<div class="search-result-image search-result-icon">${getIconForType(item.type)}</div>`;
        
        return `
            <div class="search-result-item" onclick="window.location.href='${item.href}'">
                ${imageHtml}
                <div class="search-result-info">
                    <div class="search-result-name">${item.name}</div>
                    ${item.subtitle ? `<div class="search-result-universe">${item.subtitle}</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    searchResults.style.display = 'block';
}

// Setup search functionality
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResults');
    
    if (!searchInput) return;

    // Real-time search as user types
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value;
        clearTimeout(searchTimeout);
        
        searchTimeout = setTimeout(() => {
            performSearch(searchTerm);
        }, 300); // Debounce for 300ms
    });

    // Handle Enter key - navigate to search page
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const searchTerm = searchInput.value.trim();
            if (searchTerm) {
                window.location.href = `home.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        const searchBarContainer = document.getElementById('searchBarContainer');
        if (searchBarContainer && !searchBarContainer.contains(e.target)) {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }
    });

    // Load all characters for search on page load
    loadAllCharactersForSearch();
}

// Navigate to random character
async function navigateToRandomCharacter() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase client not available');
        return;
    }

    try {
        // Fetch all characters
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name')
            .limit(1000); // Get up to 1000 characters

        if (error) {
            console.error('Error fetching characters:', error);
            alert('Error loading characters. Please try again.');
            return;
        }

        if (!data || data.length === 0) {
            alert('No characters found.');
            return;
        }

        // Pick a random character
        const randomIndex = Math.floor(Math.random() * data.length);
        const randomCharacter = data[randomIndex];

        // Navigate to the random character's profile
        const slug = createSlug(randomCharacter.character_name);
        window.location.href = `character/${slug}.html`;
    } catch (error) {
        console.error('Error navigating to random character:', error);
        alert('An error occurred. Please try again.');
    }
}

// Setup random character button
function setupRandomCharacterButton() {
    const randomBtn = document.getElementById('randomCharacterBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToRandomCharacter();
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadPopularCharacters();
    setupSearch();
    setupRandomCharacterButton();
});


