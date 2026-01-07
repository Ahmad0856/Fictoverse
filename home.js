// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Initialize Supabase client (check if already exists to avoid conflicts)
if (typeof window.supabaseClient === 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
}

// Get current month in MM format
function getCurrentMonth() {
    const today = new Date();
    return String(today.getMonth() + 1).padStart(2, '0');
}

// Get next month in MM format
function getNextMonth() {
    const today = new Date();
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    return String(nextMonth.getMonth() + 1).padStart(2, '0');
}

// Get month name from MM format
function getMonthName(month) {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
        return monthNames[monthIndex];
    }
    return month;
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

// Format universe/category name
function formatName(name) {
    if (!name) return '';
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Sort characters: by boosts (if available) then alphabetically
function sortCharacters(characters) {
    return characters.sort((a, b) => {
        // If boosts field exists, sort by it first (descending)
        // For now, just sort alphabetically by character_name
        const nameA = (a.character_name || '').toLowerCase();
        const nameB = (b.character_name || '').toLowerCase();
        return nameA.localeCompare(nameB);
    });
}

// Create character card HTML
function createCharacterCard(character) {
    const imageUrl = character.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
    const universeFormatted = formatName(character.universe) || 'Unknown';
    
    // Create slug for character URL
    const slug = character.character_name.toLowerCase().trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return `
        <div class="character-card" onclick="window.location.href='character/${slug}.html'">
            <div class="character-card-image">
                <img src="${imageUrl}" alt="${character.character_name || 'Character'}" loading="lazy">
            </div>
            <div class="character-card-name">${character.character_name || '-'}</div>
            <div class="character-card-universe">${universeFormatted} Character</div>
        </div>
    `;
}

// Load and display characters for a specific month
async function loadMonthBirthdays(month, containerId, seeMoreId) {
    const container = document.getElementById(containerId);
    const seeMoreContainer = document.getElementById(seeMoreId);
    const supabase = window.supabaseClient;
    
    if (!supabase) {
        container.innerHTML = '<div class="error">Supabase not configured</div>';
        return;
    }

    console.log(`Loading characters for month: ${month}`);

    try {
        // Use LIKE to match all birthdays in the month (MM-XX format)
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name, universe, birthday, image_url')
            .like('birthday', `${month}-%`);

        if (error) {
            console.error('Error loading characters:', error);
            let errorMsg = 'Error loading characters. ';
            if (error.message.includes('permission') || error.message.includes('policy') || error.code === '42501') {
                errorMsg += 'Please run enable_public_read_access.sql in Supabase SQL Editor.';
            } else {
                errorMsg += error.message;
            }
            container.innerHTML = `<div class="error">${errorMsg}</div>`;
            return;
        }

        console.log(`Found ${data ? data.length : 0} characters for month ${month}`, data);

        if (!data || data.length === 0) {
            container.innerHTML = `<div class="empty-state">No birthdays found for ${getMonthName(month)}.</div>`;
            seeMoreContainer.style.display = 'none';
            return;
        }

        // Sort characters
        const sortedCharacters = sortCharacters(data);

        // Display all characters (no limit for month view)
        container.innerHTML = sortedCharacters.map(createCharacterCard).join('');

        // Show "See More" button linking to the month filter page
        if (sortedCharacters.length > 0) {
            const monthName = getMonthName(month);
            // Create slug matching the format used in generate-static-pages.js
            const monthSlug = monthName
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            seeMoreContainer.innerHTML = `
                <button class="see-more-button-large" onclick="window.location.href='birthday/${monthSlug}.html'">
                    <span>See More</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <polyline points="9 18 15 12 9 6"></polyline>
                    </svg>
                </button>
            `;
            seeMoreContainer.style.display = 'flex';
        } else {
            seeMoreContainer.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading characters:', error);
        container.innerHTML = `<div class="error">An error occurred: ${error.message}. Check console for details.</div>`;
    }
}

// Load all birthday data
async function loadBirthdays() {
    const currentMonth = getCurrentMonth();
    const nextMonth = getNextMonth();

    console.log('Current Month:', currentMonth, 'Next Month:', nextMonth);

    // Also check if we can access the database at all
    const supabase = window.supabaseClient;
    try {
        const { data: testData, error: testError } = await supabase
            .from('characters')
            .select('id, birthday')
            .limit(1);

        if (testError) {
            console.error('Database access test failed:', testError);
            if (testError.message.includes('permission') || testError.message.includes('policy')) {
                const thisMonthContainer = document.getElementById('thisMonthBirthdays');
                const nextMonthContainer = document.getElementById('nextMonthBirthdays');
                if (thisMonthContainer) {
                    thisMonthContainer.innerHTML = 
                        '<div class="error">Permission denied. Please run enable_public_read_access.sql in Supabase SQL Editor to enable public read access.</div>';
                }
                if (nextMonthContainer) {
                    nextMonthContainer.innerHTML = 
                        '<div class="error">Permission denied. Please run enable_public_read_access.sql in Supabase SQL Editor to enable public read access.</div>';
                }
                return;
            }
        } else {
            console.log('Database access test successful. Sample data:', testData);
        }
    } catch (err) {
        console.error('Database connection test error:', err);
    }

    await Promise.all([
        loadMonthBirthdays(currentMonth, 'thisMonthBirthdays', 'thisMonthSeeMore'),
        loadMonthBirthdays(nextMonth, 'nextMonthBirthdays', 'nextMonthSeeMore')
    ]);
}

// Search functionality with real-time results
let searchTimeout;
let allCharacters = [];

// Load all characters for search
async function loadAllCharactersForSearch() {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name, universe, image_url')
            .order('character_name', { ascending: true });

        if (!error && data) {
            allCharacters = data;
        }
    } catch (error) {
        console.error('Error loading characters for search:', error);
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
    const filtered = allCharacters.filter(char => 
        char.character_name && char.character_name.toLowerCase().includes(term)
    ).slice(0, 8); // Limit to 8 results

    if (filtered.length === 0) {
        searchResults.innerHTML = '<div class="search-result-item no-results">No characters found</div>';
        searchResults.style.display = 'block';
        return;
    }

    searchResults.innerHTML = filtered.map(char => {
        const imageUrl = char.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23f3f4f6"/%3E%3C/svg%3E';
        const universeFormatted = formatName(char.universe) || '';
        const slug = char.character_name.toLowerCase().trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        return `
            <div class="search-result-item" onclick="window.location.href='character/${slug}.html'">
                <img src="${imageUrl}" alt="${char.character_name}" class="search-result-image">
                <div class="search-result-info">
                    <div class="search-result-name">${char.character_name}</div>
                    ${universeFormatted ? `<div class="search-result-universe">${universeFormatted} Character</div>` : ''}
                </div>
            </div>
        `;
    }).join('');

    searchResults.style.display = 'block';
}

// Search functionality
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
                window.location.href = `public-index.html?search=${encodeURIComponent(searchTerm)}`;
            } else {
                window.location.href = 'public-index.html';
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadBirthdays();
    setupSearch();
});
