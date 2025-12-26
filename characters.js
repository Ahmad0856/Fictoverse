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
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                       'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
        return `${monthNames[monthIndex]} ${parseInt(day)}`;
    }
    return birthday;
}

// Create character card HTML
function createCharacterCard(character) {
    const imageUrl = character.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="270" height="270"%3E%3Crect width="270" height="270" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
    const universeFormatted = formatName(character.universe);
    
    return `
        <div class="character-card" onclick="window.location.href='character.html?id=${character.id}'">
            <img src="${imageUrl}" alt="${character.character_name || 'Character'}" class="character-card-image">
            <div class="character-card-name">${character.character_name || '-'}</div>
            <div class="character-card-universe">${universeFormatted || '-'} Character</div>
            <div class="character-card-birthday">${formatBirthday(character.birthday)}</div>
        </div>
    `;
}

// Load filtered characters
async function loadFilteredCharacters() {
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase client not available');
        return;
    }

    // Get filter parameters from URL
    const urlParams = new URLSearchParams(window.location.search);
    const filterType = urlParams.get('filter'); // 'universe', 'category', 'sign', 'debut_year'
    const filterValue = urlParams.get('value'); // The actual value to filter by

    if (!filterType || !filterValue) {
        document.getElementById('pageTitle').textContent = 'All Characters';
        // Load all characters if no filter
        await loadAllCharacters();
        return;
    }

    try {
        let query = supabase
            .from('characters')
            .select('id, character_name, universe, birthday, image_url')
            .order('character_name', { ascending: true });

        // Apply filter based on type
        if (filterType === 'universe') {
            // Convert value back to database format (lowercase with hyphens)
            const dbValue = filterValue.toLowerCase().replace(/\s+/g, '-');
            query = query.eq('universe', dbValue);
        } else if (filterType === 'category') {
            const dbValue = filterValue.toLowerCase().replace(/\s+/g, '-');
            query = query.eq('category', dbValue);
        } else if (filterType === 'sign') {
            query = query.eq('sign', filterValue.toLowerCase());
        } else if (filterType === 'debut_year') {
            query = query.eq('debut_year', parseInt(filterValue));
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading characters:', error);
            document.getElementById('charactersGrid').innerHTML = '<p>Error loading characters. Please try again.</p>';
            return;
        }

        // Set page title based on filter
        let pageTitle = 'Characters';
        if (filterType === 'universe') {
            pageTitle = `${formatName(filterValue)} Characters`;
        } else if (filterType === 'category') {
            pageTitle = `${formatName(filterValue)} Characters`;
        } else if (filterType === 'sign') {
            pageTitle = `${filterValue.charAt(0).toUpperCase() + filterValue.slice(1)} Characters`;
        } else if (filterType === 'debut_year') {
            pageTitle = `Characters from ${filterValue}`;
        }
        document.getElementById('pageTitle').textContent = pageTitle;

        // Display characters
        displayCharacters(data || []);
    } catch (error) {
        console.error('Error loading filtered characters:', error);
        document.getElementById('charactersGrid').innerHTML = '<p>An error occurred. Please try again.</p>';
    }
}

// Load all characters (no filter)
async function loadAllCharacters() {
    const supabase = window.supabaseClient;
    if (!supabase) return;

    try {
        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name, universe, birthday, image_url')
            .order('character_name', { ascending: true });

        if (error) {
            console.error('Error loading characters:', error);
            return;
        }

        displayCharacters(data || []);
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

// Display characters in grid
function displayCharacters(characters) {
    const grid = document.getElementById('charactersGrid');
    
    if (characters.length === 0) {
        grid.innerHTML = '<p style="text-align: center; padding: 48px; color: #6b7280;">No characters found.</p>';
        return;
    }

    grid.innerHTML = characters.map(character => createCharacterCard(character)).join('');
}

// Setup search functionality (reuse from home.js/public.js)
function setupSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchResults = document.getElementById('searchResultsDropdown');
    let allCharacters = [];
    let searchTimeout;

    async function loadAllCharactersForSearch() {
        const supabase = window.supabaseClient;
        if (!supabase) return;

        try {
            const { data, error } = await supabase
                .from('characters')
                .select('id, character_name, universe, image_url')
                .order('character_name', { ascending: true });

            if (error) {
                console.error('Error loading characters for search:', error);
                return;
            }

            allCharacters = data || [];
        } catch (error) {
            console.error('Error loading characters for search:', error);
        }
    }

    function displaySearchResults(results) {
        if (results.length === 0) {
            searchResults.innerHTML = '<div class="search-result-item">No results found</div>';
            searchResults.style.display = 'block';
            return;
        }

        searchResults.innerHTML = results.slice(0, 8).map(character => {
            const imageUrl = character.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23f3f4f6"/%3E%3C/svg%3E';
            return `
                <div class="search-result-item" onclick="window.location.href='character.html?id=${character.id}'">
                    <img src="${imageUrl}" alt="${character.character_name}" style="width: 40px; height: 40px; border-radius: 0; object-fit: cover; margin-right: 12px;">
                    <div>
                        <div style="font-weight: 500; color: #111827;">${character.character_name || '-'}</div>
                        <div style="font-size: 12px; color: #6b7280;">${formatName(character.universe) || '-'}</div>
                    </div>
                </div>
            `;
        }).join('');
        searchResults.style.display = 'block';
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.trim().toLowerCase();
            
            clearTimeout(searchTimeout);
            
            if (searchTerm.length === 0) {
                searchResults.style.display = 'none';
                return;
            }

            searchTimeout = setTimeout(() => {
                const results = allCharacters.filter(character => {
                    const name = (character.character_name || '').toLowerCase();
                    const universe = formatName(character.universe || '').toLowerCase();
                    return name.includes(searchTerm) || universe.includes(searchTerm);
                });
                displaySearchResults(results);
            }, 300);
        });

        // Hide dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
                searchResults.style.display = 'none';
            }
        });
    }

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
        const { data, error } = await supabase
            .from('characters')
            .select('id')
            .limit(1000);

        if (error) {
            console.error('Error fetching characters:', error);
            alert('Error loading characters. Please try again.');
            return;
        }

        if (!data || data.length === 0) {
            alert('No characters found.');
            return;
        }

        const randomIndex = Math.floor(Math.random() * data.length);
        const randomCharacter = data[randomIndex];

        window.location.href = `character.html?id=${encodeURIComponent(randomCharacter.id)}`;
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
    loadFilteredCharacters();
    setupSearch();
    setupRandomCharacterButton();
});

