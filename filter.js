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

// Format birthday from MM-DD to readable format
function formatBirthday(birthday) {
    if (!birthday) return '';
    const [month, day] = birthday.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${parseInt(day)}`;
    }
    return birthday;
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

// Create character card HTML with rank badge
function createCharacterCard(character, rank) {
    const imageUrl = character.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
    const universeFormatted = formatName(character.universe);
    const slug = createSlug(character.character_name);
    const rankBadge = rank ? `<div class="character-rank-badge">${rank}</div>` : '';
    const isMobile = window.innerWidth <= 768;
    const cardClickHandler = isMobile ? '' : `onclick="window.location.href='../character/${slug}.html'"`;
    const imageClickHandler = isMobile ? `onclick="window.location.href='../character/${slug}.html'"` : '';
    const nameClickHandler = isMobile ? `onclick="window.location.href='../character/${slug}.html'"` : '';

    return `
        <div class="character-card character-card-ranked" ${cardClickHandler}>
            <div class="character-card-image" ${imageClickHandler}>
                <img src="${imageUrl}" alt="${character.character_name || 'Character'}" loading="lazy">
                ${rankBadge}
            </div>
            <div class="character-card-name" ${nameClickHandler}>${character.character_name || '-'}</div>
            <div class="character-card-universe">${universeFormatted || '-'} Character</div>
        </div>
    `;
}

// Load filtered characters
async function loadFilteredCharacters() {
    // Check if this is a static page with pre-rendered content
    const grid = document.getElementById('filteredCharactersGrid');
    if (!grid) {
        console.warn('filteredCharactersGrid not found');
        return;
    }
    
    // Check if content is already pre-rendered (static page)
    if (grid.children.length > 0) {
        // Check if there are actual character cards (not just comments or empty divs)
        const hasContent = Array.from(grid.children).some(child => {
            // Check if it's a character card or has character card content
            return child.classList && (
                child.classList.contains('character-card') ||
                child.querySelector && child.querySelector('.character-card')
            );
        });
        
        if (hasContent) {
            // Static page with pre-rendered content - skip dynamic loading
            console.log('Static page detected with pre-rendered content');
            return;
        }
    }
    
    // Also check URL path for static pages
    const path = window.location.pathname;
    if (path.match(/\/(birthday|sign|category|universe)\/[^\/]+\.html$/)) {
        // This is a static page path - content should be pre-rendered
        // If we get here, it means the content wasn't detected above, but we still shouldn't try to load
        console.log('Static page path detected, skipping dynamic load');
        return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase client not available');
        return;
    }

    // Get filter parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const filterType = urlParams.get('type'); // 'birthday', 'sign', 'debutYear', 'category'
    const filterValue = urlParams.get('value');
    const filterLabel = urlParams.get('label') || filterValue;

    if (!filterType || !filterValue) {
        // Try to extract from URL path for static pages
        const path = window.location.pathname;
        const pathMatch = path.match(/\/(birthday|sign|category|universe)\/([^\/]+)\.html$/);
        if (pathMatch) {
            // Static page detected - content is already pre-rendered
            // Just ensure the page title is correct (it should already be set in HTML)
            return;
        }
        
        // No filter parameters and not a static page path
        if (grid) {
            grid.innerHTML = '<p style="text-align: center; padding: 48px; color: #6b7280;">Invalid filter parameters.</p>';
        }
        return;
    }

    // Set page title
    const pageTitle = document.getElementById('filterPageTitle');
    const titleText = filterLabel || 'Filtered';
    pageTitle.textContent = `${titleText} Characters`;

    try {
        let query = supabase.from('characters').select('*');

        // Apply filter based on type
        if (filterType === 'birthday') {
            // For birthday, extract month from the value (format: "January" or "January 15" -> "01")
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            // Get the month name (first word of filterValue)
            const monthName = filterValue.split(' ')[0];
            const monthIndex = monthNames.findIndex(m => m.toLowerCase() === monthName.toLowerCase());
            if (monthIndex !== -1) {
                const month = String(monthIndex + 1).padStart(2, '0');
                // Filter by month (MM-DD format, where MM matches)
                query = query.like('birthday', `${month}-%`);
            } else {
                // If month not found, show no results
                query = query.eq('id', 'no-match');
            }
        } else if (filterType === 'sign') {
            query = query.eq('sign', filterValue.toLowerCase());
        } else if (filterType === 'debutYear') {
            query = query.eq('debut_year', parseInt(filterValue));
        } else if (filterType === 'category') {
            // Category is stored in lowercase with hyphens, need to match
            const categorySlug = filterValue.toLowerCase().replace(/\s+/g, '-');
            query = query.eq('category', categorySlug);
        }

        // Sort by boost_count (descending), then by name, and limit to top 30
        const { data, error } = await query;

        if (error) {
            console.error('Error loading filtered characters:', error);
            document.getElementById('filteredCharactersGrid').innerHTML = 
                '<p style="text-align: center; padding: 48px; color: #dc2626;">Error loading characters. Please try again.</p>';
            return;
        }

        const grid = document.getElementById('filteredCharactersGrid');
        const noResults = document.getElementById('noResultsMessage');

        if (!data || data.length === 0) {
            grid.style.display = 'none';
            noResults.style.display = 'block';
            return;
        }

        // Sort by boost_count (descending), then by name, and limit to top 30
        const sortedChars = data
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

        grid.style.display = 'grid';
        noResults.style.display = 'none';
        grid.innerHTML = sortedChars.map((character, index) => {
            const rank = index + 1; // Rank starts at 1
            return createCharacterCard(character, rank);
        }).join('');
    } catch (error) {
        console.error('Error loading filtered characters:', error);
        document.getElementById('filteredCharactersGrid').innerHTML = 
            '<p style="text-align: center; padding: 48px; color: #dc2626;">An error occurred. Please try again.</p>';
    }
}

// Setup random character button
function setupRandomCharacterButton() {
    const randomBtn = document.getElementById('randomCharacterBtn');
    if (randomBtn) {
        randomBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const supabase = window.supabaseClient;
            if (!supabase) return;

            try {
                const { data, error } = await supabase
                    .from('characters')
                    .select('id, character_name')
                    .limit(1000);

                if (error || !data || data.length === 0) return;

                const randomIndex = Math.floor(Math.random() * data.length);
                const randomChar = data[randomIndex];
                const slug = createSlug(randomChar.character_name);
                // Check if we're in a subdirectory
                const currentPath = window.location.pathname;
                const isInSubdir = currentPath.includes('/birthday/') || currentPath.includes('/sign/') || 
                                  currentPath.includes('/category/') || currentPath.includes('/universe/');
                const prefix = isInSubdir ? '../' : '';
                window.location.href = `${prefix}character/${slug}.html`;
            } catch (error) {
                console.error('Error navigating to random character:', error);
            }
        });
    }
}

// Search functionality with real-time results (same as public.js and home.js)
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
            .select('id, character_name, universe, category, birthday, sign, image_url')
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
    const currentPath = window.location.pathname;
    const isInSubdir = currentPath.includes('/birthday/') || currentPath.includes('/sign/') || 
                      currentPath.includes('/category/') || currentPath.includes('/universe/') ||
                      currentPath.includes('/character/');
    const prefix = isInSubdir ? '../' : '';
    const slug = createSlug(filterValue);
    const dirMap = {
        'birthday': 'birthday',
        'sign': 'sign',
        'category': 'category',
        'universe': 'universe'
    };
    return `${prefix}${dirMap[filterType] || filterType}/${slug}.html`;
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
    const searchResults = document.getElementById('searchResultsDropdown');
    if (!searchResults) return;

    if (!searchTerm || searchTerm.trim().length === 0) {
        searchResults.style.display = 'none';
        return;
    }

    const term = searchTerm.toLowerCase().trim();
    const results = [];

    // Determine correct path prefix based on current location
    const currentPath = window.location.pathname;
    const isInSubdir = currentPath.includes('/birthday/') || currentPath.includes('/sign/') || 
                      currentPath.includes('/category/') || currentPath.includes('/universe/') ||
                      currentPath.includes('/character/');
    const prefix = isInSubdir ? '../' : '';

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
            href: `${prefix}character/${slug}.html`,
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
    const searchResults = document.getElementById('searchResultsDropdown');
    
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
                const currentPath = window.location.pathname;
                const isInSubdir = currentPath.includes('/birthday/') || currentPath.includes('/sign/') || 
                                  currentPath.includes('/category/') || currentPath.includes('/universe/') ||
                                  currentPath.includes('/character/');
                const prefix = isInSubdir ? '../' : '';
                window.location.href = `${prefix}home.html?search=${encodeURIComponent(searchTerm)}`;
            }
        }
    });

    // Hide search results when clicking outside
    document.addEventListener('click', (e) => {
        const searchBarContainer = document.getElementById('searchBarContainer') || searchInput.closest('.public-search-bar');
        if (searchBarContainer && !searchBarContainer.contains(e.target)) {
            if (searchResults) {
                searchResults.style.display = 'none';
            }
        }
    });

    // Load all characters for search on page load
    loadAllCharactersForSearch();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    try {
        loadFilteredCharacters();
        setupSearch();
        setupRandomCharacterButton();
    } catch (error) {
        console.error('Error initializing filter page:', error);
        // Don't show error to user - page should still work with pre-rendered content
    }
});

