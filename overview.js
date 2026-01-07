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
let charactersTab, universesTab, charactersTableContainer, universesTableContainer, universesTableBody;
let editUniverseModal, editUniverseForm, editUniverseId, editUniverseName, editUniverseDescription, cancelEditUniverseBtn;
let currentView = 'characters'; // 'characters' or 'universes'

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
    charactersTab = document.getElementById('charactersTab');
    universesTab = document.getElementById('universesTab');
    charactersTableContainer = document.getElementById('charactersTableContainer');
    universesTableContainer = document.getElementById('universesTableContainer');
    universesTableBody = document.getElementById('universesTableBody');
    editUniverseModal = document.getElementById('editUniverseModal');
    editUniverseForm = document.getElementById('editUniverseForm');
    editUniverseId = document.getElementById('editUniverseId');
    editUniverseName = document.getElementById('editUniverseName');
    editUniverseDescription = document.getElementById('editUniverseDescription');
    cancelEditUniverseBtn = document.getElementById('cancelEditUniverseBtn');
    
    checkAuthStatus();
    setupEventListeners();
    
    // Debug: Log if elements are found
    console.log('Navigation elements:', {
        addCharacterNav: !!addCharacterNav,
        addCharacterBtn: !!addCharacterBtn,
        logoutNav: !!logoutNav,
        charactersTab: !!charactersTab,
        universesTab: !!universesTab,
        universesTableBody: !!universesTableBody,
        universesTableContainer: !!universesTableContainer
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

    // Tab switching
    if (charactersTab) {
        charactersTab.addEventListener('click', () => {
            switchView('characters');
        });
    }

    if (universesTab) {
        universesTab.addEventListener('click', () => {
            switchView('universes');
        });
    }

    // Edit Universe Modal
    if (editUniverseForm) {
        editUniverseForm.addEventListener('submit', handleEditUniverseSubmit);
    }

    if (cancelEditUniverseBtn) {
        cancelEditUniverseBtn.addEventListener('click', hideEditUniverseModal);
    }

    // Close modal when clicking outside
    if (editUniverseModal) {
        editUniverseModal.addEventListener('click', (e) => {
            if (e.target === editUniverseModal) {
                hideEditUniverseModal();
            }
        });
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
            if (currentView === 'characters') {
                loadCharacters();
            } else {
                loadUniverses();
            }
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
            if (currentView === 'characters') {
                loadCharacters();
            } else {
                loadUniverses();
            }
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
        if (currentView === 'characters') {
            loadCharacters(searchTerm);
        } else {
            loadUniverses(searchTerm);
        }
    }, 300); // Debounce search
}

// Switch View (Characters/Universes)
function switchView(view) {
    currentView = view;
    
    // Clear search input when switching views
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Update tab active states
    if (charactersTab && universesTab) {
        if (view === 'characters') {
            charactersTab.classList.add('active-tab');
            universesTab.classList.remove('active-tab');
            if (charactersTableContainer) charactersTableContainer.style.display = 'block';
            if (universesTableContainer) universesTableContainer.style.display = 'none';
            loadCharacters();
        } else {
            universesTab.classList.add('active-tab');
            charactersTab.classList.remove('active-tab');
            if (universesTableContainer) universesTableContainer.style.display = 'block';
            if (charactersTableContainer) charactersTableContainer.style.display = 'none';
            loadUniverses();
        }
    }
}

// Load Universes
async function loadUniverses(searchTerm = '') {
    if (!supabase) {
        console.error('Supabase not initialized');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            console.error('No session found');
            return;
        }

        let query = supabase
            .from('universes')
            .select('*')
            .order('name', { ascending: true });

        // Add search filter if search term exists
        if (searchTerm) {
            query = query.ilike('name', `%${searchTerm}%`);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error loading universes:', error);
            return;
        }

        console.log('Universes loaded:', data);
        displayUniverses(data || []);
    } catch (error) {
        console.error('Error loading universes:', error);
    }
}

// Display Universes in Table
function displayUniverses(universes) {
    console.log('Displaying universes:', universes);
    console.log('universesTableBody element:', universesTableBody);
    
    if (!universesTableBody) {
        console.error('universesTableBody element not found');
        // Try to get it again
        universesTableBody = document.getElementById('universesTableBody');
        if (!universesTableBody) {
            console.error('Still cannot find universesTableBody element');
            return;
        }
    }
    
    universesTableBody.innerHTML = '';

    if (universes.length === 0) {
        universesTableBody.innerHTML = `
            <tr>
                <td colspan="3" style="text-align: center; padding: 32px; color: #6b7280;">
                    No universes found.${searchInput && searchInput.value.trim() ? ' Try a different search term.' : ''}
                </td>
            </tr>
        `;
        return;
    }

    universes.forEach(universe => {
        const row = document.createElement('tr');
        
        // Format created date
        let createdDisplay = '-';
        if (universe.created_at) {
            const date = new Date(universe.created_at);
            createdDisplay = date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
            });
        }

        row.innerHTML = `
            <td class="col-character">${universe.name || '-'}</td>
            <td class="col-universe">${createdDisplay}</td>
            <td class="col-actions">
                <button class="btn-edit" onclick="event.stopPropagation(); editUniverse('${universe.id}')" title="Edit Universe">✏️</button>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteUniverse('${universe.id}', '${universe.name.replace(/'/g, "\\'")}')" title="Delete Universe">🗑️</button>
            </td>
        `;

        universesTableBody.appendChild(row);
    });
}

// Show Edit Universe Modal
function showEditUniverseModal() {
    if (editUniverseModal) {
        editUniverseModal.classList.add('show');
    }
}

// Hide Edit Universe Modal
function hideEditUniverseModal() {
    if (editUniverseModal) {
        editUniverseModal.classList.remove('show');
        if (editUniverseForm) {
            editUniverseForm.reset();
        }
        if (editUniverseId) {
            editUniverseId.value = '';
        }
    }
}

// Edit Universe - Load data and show modal
async function editUniverse(universeId) {
    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to edit universes');
            return;
        }

        // Fetch universe data - select only fields that definitely exist
        const { data: universe, error } = await supabase
            .from('universes')
            .select('id, name, created_at')
            .eq('id', universeId)
            .single();

        if (error) {
            alert('Error loading universe: ' + error.message);
            return;
        }

        if (!universe) {
            alert('Universe not found');
            return;
        }

        // Try to get description separately (if column exists)
        let description = '';
        try {
            const { data: universeWithDesc } = await supabase
                .from('universes')
                .select('description')
                .eq('id', universeId)
                .single();
            
            if (universeWithDesc && universeWithDesc.description !== undefined) {
                description = universeWithDesc.description || '';
            }
        } catch (descError) {
            // Description column doesn't exist, that's okay
            console.log('Description column not available');
        }

        // Populate form fields
        if (editUniverseId) editUniverseId.value = universe.id;
        if (editUniverseName) editUniverseName.value = universe.name || '';
        if (editUniverseDescription) editUniverseDescription.value = description;

        // Show modal
        showEditUniverseModal();
    } catch (error) {
        console.error('Error loading universe for editing:', error);
        alert('An error occurred while loading the universe');
    }
}

// Handle Edit Universe Form Submission
async function handleEditUniverseSubmit(event) {
    event.preventDefault();

    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    const universeId = editUniverseId ? editUniverseId.value : null;
    const name = editUniverseName ? editUniverseName.value.trim() : '';
    const description = editUniverseDescription ? editUniverseDescription.value.trim() : '';

    if (!universeId) {
        alert('Invalid universe ID');
        return;
    }

    if (!name) {
        alert('Please enter a universe name');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to edit universes');
            return;
        }

        // Prepare update data
        const updateData = { name: name };
        
        // Try to include description if provided
        // If description column doesn't exist, we'll handle it in the error
        if (description !== undefined) {
            updateData.description = description || null;
        }

        const { error } = await supabase
            .from('universes')
            .update(updateData)
            .eq('id', universeId);

        if (error) {
            if (error.code === '23505') { // Duplicate key error
                alert('A universe with this name already exists');
            } else if (error.message && error.message.includes('description')) {
                // If error is about description column not existing, update name only
                console.log('Description column not found, updating name only');
                const { error: retryError } = await supabase
                    .from('universes')
                    .update({ name: name })
                    .eq('id', universeId);
                
                if (retryError) {
                    alert('Error updating universe: ' + retryError.message);
                    return;
                } else {
                    // Hide modal and reload universes
                    hideEditUniverseModal();
                    loadUniverses();
                    loadSummaryCounts();
                    alert('Universe name updated successfully!\n\nNote: The description column does not exist in your database. To enable description editing, please run the SQL migration:\n\nALTER TABLE universes ADD COLUMN IF NOT EXISTS description TEXT;');
                    return;
                }
            } else {
                alert('Error updating universe: ' + error.message);
            }
            return;
        }

        // Hide modal and reload universes
        hideEditUniverseModal();
        loadUniverses();
        loadSummaryCounts();
        alert('Universe updated successfully!');
    } catch (error) {
        console.error('Error updating universe:', error);
        alert('An error occurred while updating the universe');
    }
}

// Delete Universe
async function deleteUniverse(universeId, universeName) {
    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    if (!confirm(`Are you sure you want to delete the universe "${universeName}"? This action cannot be undone.`)) {
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to delete universes');
            return;
        }

        const { error } = await supabase
            .from('universes')
            .delete()
            .eq('id', universeId);

        if (error) {
            alert('Error deleting universe: ' + error.message);
            return;
        }

        // Reload universes and update counts
        loadUniverses();
        loadSummaryCounts();
        alert('Universe deleted successfully!');
    } catch (error) {
        console.error('Error deleting universe:', error);
        alert('An error occurred while deleting the universe');
    }
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
            if (currentView === 'characters') {
                loadCharacters();
            } else {
                loadUniverses();
            }
        }
    });
}

