// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Initialize Supabase client
var supabase;
if (typeof window.supabaseClient === 'undefined' && SUPABASE_URL !== 'YOUR_SUPABASE_URL' && SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY') {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase; // Store globally to avoid re-initialization
} else if (typeof window.supabaseClient !== 'undefined') {
    supabase = window.supabaseClient; // Use existing client
}

// DOM Elements (will be set in DOMContentLoaded)
let loginModal, loginForm, logoutNav, addCharacterNav, addCharacterBtn;
let charactersTableBody, charactersCount, universesCount, searchInput;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements after DOM is loaded
    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    logoutNav = document.getElementById('logoutNav');
    addCharacterNav = document.getElementById('addCharacterNav');
    addCharacterBtn = document.getElementById('addCharacterBtn');
    charactersTableBody = document.getElementById('charactersTableBody');
    charactersCount = document.getElementById('charactersCount');
    universesCount = document.getElementById('universesCount');
    searchInput = document.getElementById('searchInput');
    
    checkAuthStatus();
    setupEventListeners();
    
    // Debug: Log if elements are found
    console.log('Navigation elements:', {
        addCharacterNav: !!addCharacterNav,
        addCharacterBtn: !!addCharacterBtn,
        logoutNav: !!logoutNav
    });
});

// Setup Event Listeners
function setupEventListeners() {
    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Logout
    if (logoutNav) {
        logoutNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        });
    }

    // Game navigation
    const gameNav = document.getElementById('gameNav');
    if (gameNav) {
        gameNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigating to game page');
            window.location.href = 'game.html';
        });
    }

    // Add Character navigation
    if (addCharacterNav) {
        addCharacterNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigating to add character page');
            window.location.href = 'admin.html';
        });
    } else {
        console.error('addCharacterNav element not found');
    }

    // Add Character button
    if (addCharacterBtn) {
        addCharacterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigating to add character page from button');
            window.location.href = 'admin.html';
        });
    }

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
}

// Check Authentication Status
async function checkAuthStatus() {
    const mainContainer = document.querySelector('.main-container');
    const topNav = document.querySelector('.top-nav');
    
    if (!supabase) {
        showLoginModal();
        hideAdminContent(mainContainer, topNav);
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            showLoginModal();
            hideAdminContent(mainContainer, topNav);
        } else {
            hideLoginModal();
            showAdminContent(mainContainer, topNav);
            // Load data when authenticated
            loadSummaryCounts();
            loadCharacters();
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        showLoginModal();
        hideAdminContent(mainContainer, topNav);
    }
}

// Show/Hide Login Modal
function showLoginModal() {
    if (loginModal) {
    loginModal.classList.add('show');
    }
}

function hideLoginModal() {
    if (loginModal) {
    loginModal.classList.remove('show');
    }
}

// Hide admin content when not authenticated
function hideAdminContent(mainContainer, topNav) {
    if (mainContainer) {
        mainContainer.style.display = 'none';
    }
    if (topNav) {
        topNav.style.display = 'none';
    }
}

// Show admin content when authenticated
function showAdminContent(mainContainer, topNav) {
    if (mainContainer) {
        mainContainer.style.display = 'flex';
    }
    if (topNav) {
        topNav.style.display = 'flex';
    }
}

// Handle Login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (!supabase) {
        alert('Supabase is not configured. Please add your credentials in overview.js');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert('Login failed: ' + error.message);
            return;
        }

        if (data.session) {
            const mainContainer = document.querySelector('.main-container');
            const topNav = document.querySelector('.top-nav');
            hideLoginModal();
            showAdminContent(mainContainer, topNav);
            loadSummaryCounts();
            loadCharacters();
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('An error occurred during login');
    }
}

// Handle Logout
async function handleLogout() {
    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    if (confirm('Are you sure you want to log out?')) {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) {
                alert('Logout failed: ' + error.message);
            } else {
                const mainContainer = document.querySelector('.main-container');
                const topNav = document.querySelector('.top-nav');
                showLoginModal();
                hideAdminContent(mainContainer, topNav);
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Load Summary Counts
async function loadSummaryCounts() {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // Get characters count
        const { count: charactersCountValue, error: charactersError } = await supabase
            .from('characters')
            .select('*', { count: 'exact', head: true });

        if (!charactersError && charactersCountValue !== null) {
            charactersCount.textContent = charactersCountValue;
        }

        // Get universes count
        const { count: universesCountValue, error: universesError } = await supabase
            .from('universes')
            .select('*', { count: 'exact', head: true });

        if (!universesError && universesCountValue !== null) {
            universesCount.textContent = universesCountValue;
        }
    } catch (error) {
        console.error('Error loading summary counts:', error);
    }
}

// Load Characters
async function loadCharacters(searchTerm = '') {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        let query = supabase
            .from('characters')
            .select('id, character_name, birthday, universe')
            .order('character_name', { ascending: true });

        // Add search filter if search term exists
        if (searchTerm) {
            query = query.or(`character_name.ilike.%${searchTerm}%,universe.ilike.%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading characters:', error);
            return;
        }

        displayCharacters(data || []);
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

// Display Characters in Table
function displayCharacters(characters) {
    charactersTableBody.innerHTML = '';

    if (characters.length === 0) {
        charactersTableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 32px; color: #6b7280;">
                    No characters found. Click the "+" button to add your first character.
                </td>
            </tr>
        `;
        return;
    }

    characters.forEach(character => {
        const row = document.createElement('tr');
        
        // Format birthday (MM-DD to readable format)
        let birthdayDisplay = '-';
        if (character.birthday) {
            const [month, day] = character.birthday.split('-');
            const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
            const monthIndex = parseInt(month) - 1;
            if (monthIndex >= 0 && monthIndex < 12) {
                birthdayDisplay = `${monthNames[monthIndex]} ${parseInt(day)}`;
            }
        }

        // Format universe name (capitalize first letter of each word)
        const universeDisplay = character.universe 
            ? character.universe.split('-').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ')
            : '-';

        row.innerHTML = `
            <td class="col-character">${character.character_name || '-'}</td>
            <td class="col-birthday">${birthdayDisplay}</td>
            <td class="col-universe">${universeDisplay}</td>
            <td class="col-actions">
                <button class="btn-edit" onclick="event.stopPropagation(); editCharacter('${character.id}')" title="Edit Character">✏️</button>
                <button class="btn-view" onclick="event.stopPropagation(); viewCharacter('${character.id}')" title="View Character">👁️</button>
            </td>
        `;

        // Navigate to public character profile on click (only if clicking on non-button cells)
        if (character.id) {
            row.classList.add('clickable-character-row');
            row.addEventListener('click', (e) => {
                // Don't navigate if clicking on action buttons
                if (!e.target.closest('.btn-edit') && !e.target.closest('.btn-view')) {
                    // Create slug from character name for clean URL
                    const slug = character.character_name
                        ? character.character_name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '')
                        : character.id;
                    const url = `characters/${slug}.html`;
                window.open(url, '_blank');
                }
            });
        }

        charactersTableBody.appendChild(row);
    });
}

// Handle Search
let searchTimeout;
function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadCharacters(searchTerm);
    }, 300); // Debounce search
}

// Edit Character
function editCharacter(characterId) {
    window.location.href = `admin.html?edit=${encodeURIComponent(characterId)}`;
}

// View Character (open in new tab)
async function viewCharacter(characterId) {
    // Fetch character to get name for slug
    const supabase = window.supabaseClient;
    if (supabase) {
        try {
            const { data: character } = await supabase
                .from('characters')
                .select('character_name')
                .eq('id', characterId)
                .single();
            
            if (character && character.character_name) {
                const slug = character.character_name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
                window.open(`characters/${slug}.html`, '_blank');
            } else {
                // Fallback to old format if character not found
                window.open(`character.html?id=${encodeURIComponent(characterId)}`, '_blank');
            }
        } catch (error) {
            console.error('Error fetching character:', error);
            // Fallback to old format on error
            window.open(`character.html?id=${encodeURIComponent(characterId)}`, '_blank');
        }
    } else {
        window.open(`character.html?id=${encodeURIComponent(characterId)}`, '_blank');
    }
}

// Listen for auth state changes
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            showLoginModal();
        } else if (event === 'SIGNED_IN') {
            hideLoginModal();
            loadSummaryCounts();
            loadCharacters();
        }
    });
}

