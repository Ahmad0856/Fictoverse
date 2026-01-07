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
let loginModal, loginForm, characterForm, imageUploadBox, imageInput;
let cancelBtn, logoutBtn, debutYearSelect, universeSelect, categorySelect;

// Check if we're in edit mode
let isEditMode = false;
let editingCharacterId = null;
let existingImageUrl = null; // Store original image URL when editing

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements after DOM is loaded
    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    characterForm = document.getElementById('characterForm');
    imageUploadBox = document.getElementById('imageUploadBox');
    imageInput = document.getElementById('imageInput');
    cancelBtn = document.getElementById('cancelBtn');
    logoutBtn = document.getElementById('logoutNav');
    debutYearSelect = document.getElementById('debutYear');
    universeSelect = document.getElementById('universe');
    categorySelect = document.getElementById('category');
    
    // Debug: Check if modal element exists
    if (!loginModal) {
        console.error('Login modal element not found in DOM!');
    } else {
        console.log('Login modal element found');
    }
    
    // Check for edit parameter in URL
    const urlParams = new URLSearchParams(window.location.search);
    const editId = urlParams.get('edit');
    if (editId) {
        isEditMode = true;
        editingCharacterId = editId;
    }
    
    checkAuthStatus();
    populateDebutYears();
    setupEventListeners();
    
    // Load character data if in edit mode
    if (isEditMode && editingCharacterId) {
        loadCharacterForEdit(editingCharacterId);
    }
});

// Populate Debut Year dropdown (1890 to 2025)
function populateDebutYears() {
    const debutYearSelect = document.getElementById('debutYear');
    if (!debutYearSelect) {
        console.error('Debut year select element not found');
        return;
    }
    
    const startYear = 1890;
    const endYear = 2025;
    
    // Clear existing options except the first "Select" option
    debutYearSelect.innerHTML = '<option value="">Select</option>';
    
    for (let year = endYear; year >= startYear; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        debutYearSelect.appendChild(option);
    }
}

// Load Universes from Supabase
async function loadUniverses() {
    if (!supabase) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('universes')
            .select('name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error loading universes:', error);
            return;
        }

        // Clear existing options except "Select"
        universeSelect.innerHTML = '<option value="">Select</option>';
        
        if (data) {
            data.forEach(universe => {
                const option = document.createElement('option');
                option.value = universe.name.toLowerCase().replace(/\s+/g, '-');
                option.textContent = universe.name;
                universeSelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading universes:', error);
    }
}

// Load Categories from Supabase
async function loadCategories() {
    if (!supabase) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('categories')
            .select('name')
            .order('name', { ascending: true });

        if (error) {
            console.error('Error loading categories:', error);
            return;
        }

        // Clear existing options except "Select"
        categorySelect.innerHTML = '<option value="">Select</option>';
        
        if (data) {
            data.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name.toLowerCase().replace(/\s+/g, '-');
                option.textContent = category.name;
                categorySelect.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// Load character data for editing
async function loadCharacterForEdit(characterId) {
    if (!supabase) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to edit characters');
            showLoginModal();
            return;
        }

        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', characterId)
            .single();

        if (error) {
            console.error('Error loading character:', error);
            alert('Error loading character: ' + error.message);
            return;
        }

        if (data) {
            // Update page title and button
            document.title = 'Edit Character - FictoVerse';
            const submitBtn = document.getElementById('submitBtn');
            if (submitBtn) {
                submitBtn.textContent = 'Update Character';
            }

            // Populate form fields
            document.getElementById('characterName').value = data.character_name || '';
            document.getElementById('nickname').value = data.nickname || '';
            document.getElementById('loveInterest').value = data.love_interest || '';
            document.getElementById('funFact').value = data.fun_fact || '';
            document.getElementById('powers').value = data.powers_skills || '';
            document.getElementById('about').value = data.about || '';

            // Set category
            if (data.category) {
                document.getElementById('category').value = data.category.toLowerCase().replace(/\s+/g, '-');
            }

            // Set universe
            if (data.universe) {
                document.getElementById('universe').value = data.universe.toLowerCase().replace(/\s+/g, '-');
            }

            // Set birthday
            if (data.birthday) {
                const [month, day] = data.birthday.split('-');
                document.getElementById('birthdayMonth').value = month;
                document.getElementById('birthdayDay').value = parseInt(day);
            }

            // Set debut year
            if (data.debut_year) {
                document.getElementById('debutYear').value = data.debut_year;
            }

            // Set sign
            if (data.sign) {
                document.getElementById('sign').value = data.sign;
            }

            // Set image
            if (data.image_url) {
                existingImageUrl = data.image_url;
                uploadedImageUrl = data.image_url;
                displayUploadedImage(data.image_url);
            }

            // Store character ID
            document.getElementById('characterId').value = characterId;

            // Load dropdowns after setting values
            await loadUniverses();
            await loadCategories();
            
            // Re-set values after dropdowns are loaded
            if (data.category) {
                document.getElementById('category').value = data.category.toLowerCase().replace(/\s+/g, '-');
            }
            if (data.universe) {
                document.getElementById('universe').value = data.universe.toLowerCase().replace(/\s+/g, '-');
            }
        }
    } catch (error) {
        console.error('Error loading character for edit:', error);
        alert('Error loading character: ' + error.message);
    }
}

// Setup Event Listeners
function setupEventListeners() {
    // Image upload
    imageUploadBox.addEventListener('click', () => {
        imageInput.click();
    });

    imageInput.addEventListener('change', handleImageUpload);

    // Form submission
    characterForm.addEventListener('submit', handleFormSubmit);

    // Cancel button
    cancelBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
            characterForm.reset();
            resetImageUpload();
            window.location.href = 'overview.html';
        }
    });

    // Logout
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            handleLogout();
        });
    }

    // Login form
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Navigation
    const overviewNav = document.getElementById('overviewNav');
    if (overviewNav) {
        overviewNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log('Navigating to overview page');
            window.location.href = 'overview.html';
        });
    } else {
        console.error('overviewNav element not found');
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
    const addCharacterNav = document.getElementById('addCharacterNav');
    if (addCharacterNav) {
        addCharacterNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            // Only navigate if we're not already on admin.html
            if (!window.location.pathname.includes('admin.html')) {
                console.log('Navigating to add character page');
                window.location.href = 'admin.html';
            } else {
                console.log('Already on add character page');
            }
        });
    }

    // Add Universe functionality
    const addUniverseBtn = document.getElementById('addUniverseBtn');
    const addUniverseInput = document.getElementById('addUniverseInput');
    const saveUniverseBtn = document.getElementById('saveUniverseBtn');
    const cancelUniverseBtn = document.getElementById('cancelUniverseBtn');
    const newUniverseName = document.getElementById('newUniverseName');
    const newUniverseDescription = document.getElementById('newUniverseDescription');

    if (addUniverseBtn) {
        addUniverseBtn.addEventListener('click', () => {
            addUniverseInput.style.display = 'flex';
            newUniverseName.focus();
        });
    }

    if (saveUniverseBtn) {
        saveUniverseBtn.addEventListener('click', async () => {
            const name = newUniverseName.value.trim();
            if (!name) {
                alert('Please enter a universe name');
                return;
            }

            const description = newUniverseDescription.value.trim();
            await createUniverse(name, description);
            newUniverseName.value = '';
            newUniverseDescription.value = '';
            addUniverseInput.style.display = 'none';
        });
    }

    if (cancelUniverseBtn) {
        cancelUniverseBtn.addEventListener('click', () => {
            newUniverseName.value = '';
            newUniverseDescription.value = '';
            addUniverseInput.style.display = 'none';
        });
    }

    // Add Category functionality
    const addCategoryBtn = document.getElementById('addCategoryBtn');
    const addCategoryInput = document.getElementById('addCategoryInput');
    const saveCategoryBtn = document.getElementById('saveCategoryBtn');
    const cancelCategoryBtn = document.getElementById('cancelCategoryBtn');
    const newCategoryName = document.getElementById('newCategoryName');

    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', () => {
            addCategoryInput.style.display = 'flex';
            newCategoryName.focus();
        });
    }

    if (saveCategoryBtn) {
        saveCategoryBtn.addEventListener('click', async () => {
            const name = newCategoryName.value.trim();
            if (!name) {
                alert('Please enter a category name');
                return;
            }

            await createCategory(name);
            newCategoryName.value = '';
            addCategoryInput.style.display = 'none';
        });
    }

    if (cancelCategoryBtn) {
        cancelCategoryBtn.addEventListener('click', () => {
            newCategoryName.value = '';
            addCategoryInput.style.display = 'none';
        });
    }
}

// Create new Universe
async function createUniverse(name, description = '') {
    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to add universes');
            return;
        }

        const universeData = { name: name };
        if (description) {
            universeData.description = description;
        }

        const { data, error } = await supabase
            .from('universes')
            .insert([universeData])
            .select();

        if (error) {
            if (error.code === '23505') { // Duplicate key error
                alert('This universe already exists');
            } else {
                throw error;
            }
            return;
        }

        // Reload universes
        await loadUniverses();
        
        // Select the newly created universe
        if (data && data[0]) {
            const value = data[0].name.toLowerCase().replace(/\s+/g, '-');
            universeSelect.value = value;
        }

        alert('Universe created successfully!');
    } catch (error) {
        console.error('Error creating universe:', error);
        alert('Error creating universe: ' + error.message);
    }
}

// Create new Category
async function createCategory(name) {
    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to add categories');
            return;
        }

        const { data, error } = await supabase
            .from('categories')
            .insert([{ name: name }])
            .select();

        if (error) {
            if (error.code === '23505') { // Duplicate key error
                alert('This category already exists');
            } else {
                throw error;
            }
            return;
        }

        // Reload categories
        await loadCategories();
        
        // Select the newly created category
        if (data && data[0]) {
            const value = data[0].name.toLowerCase().replace(/\s+/g, '-');
            categorySelect.value = value;
        }

        alert('Category created successfully!');
    } catch (error) {
        console.error('Error creating category:', error);
        alert('Error creating category: ' + error.message);
    }
}

// Handle Image Upload
let uploadedImageFile = null;
let uploadedImageUrl = null;

function handleImageUpload(event) {
    const file = event.target.files[0];
    if (file) {
        uploadedImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            uploadedImageUrl = e.target.result;
            displayUploadedImage(uploadedImageUrl);
        };
        reader.readAsDataURL(file);
    }
}

function displayUploadedImage(imageUrl) {
    imageUploadBox.classList.add('has-image');
    imageUploadBox.innerHTML = `<img src="${imageUrl}" alt="Character preview">`;
}

function resetImageUpload() {
    uploadedImageFile = null;
    uploadedImageUrl = null;
    existingImageUrl = null;
    imageUploadBox.classList.remove('has-image');
    imageUploadBox.innerHTML = '<span class="upload-text">Upload Image</span>';
    imageInput.value = '';
}

// Check Authentication Status
async function checkAuthStatus() {
    const mainContainer = document.querySelector('.main-container');
    const topNav = document.querySelector('.top-nav');
    
    // Check if we're on an admin page (admin.html, overview.html, game.html, or index.html for admin)
    const isAdminPage = window.location.pathname.includes('admin.html') || 
                       window.location.pathname.includes('overview.html') ||
                       window.location.pathname.includes('game.html') ||
                       window.location.pathname.includes('index.html') ||
                       window.location.pathname === '/' ||
                       window.location.pathname.endsWith('/');
    
    if (!isAdminPage) {
        return; // Not an admin page, skip authentication check
    }
    
    // Ensure loginModal is available
    if (!loginModal) {
        loginModal = document.getElementById('loginModal');
    }
    
    if (!supabase) {
        hideAdminContent(mainContainer, topNav);
        showLoginModal();
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            hideAdminContent(mainContainer, topNav);
            showLoginModal();
        } else {
            hideLoginModal();
            showAdminContent(mainContainer, topNav);
            // Reload universes and categories when authenticated
            // Only load if we're on the add character page (admin.html or index.html)
            if (window.location.pathname.includes('admin.html') || 
                window.location.pathname.includes('index.html') || 
                window.location.pathname === '/' || 
                window.location.pathname.endsWith('/')) {
                loadUniverses();
                loadCategories();
            }
        }
    } catch (error) {
        console.error('Error checking auth status:', error);
        hideAdminContent(mainContainer, topNav);
        showLoginModal();
    }
}

// Show/Hide Login Modal
function showLoginModal() {
    // Try to get the modal if it's not already set
    if (!loginModal) {
        loginModal = document.getElementById('loginModal');
    }
    
    if (loginModal) {
        loginModal.classList.add('show');
        loginModal.style.display = 'flex'; // Force display as fallback
    } else {
        console.error('Login modal element not found!');
    }
}

function hideLoginModal() {
    // Try to get the modal if it's not already set
    if (!loginModal) {
        loginModal = document.getElementById('loginModal');
    }
    
    if (loginModal) {
        loginModal.classList.remove('show');
        loginModal.style.display = 'none'; // Force hide as fallback
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
        alert('Supabase is not configured. Please add your credentials in script.js');
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
            hideLoginModal();
            // Always redirect to overview page after successful login
            window.location.href = 'overview.html';
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
                characterForm.reset();
                resetImageUpload();
            }
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
}

// Handle Form Submission
async function handleFormSubmit(event) {
    event.preventDefault();

    if (!supabase) {
        alert('Supabase is not configured. Please add your credentials in script.js');
        return;
    }

    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        alert('Please log in to add characters');
        showLoginModal();
        return;
    }

    // Get birthday (month and day only)
    const birthdayMonth = document.getElementById('birthdayMonth').value;
    const birthdayDay = document.getElementById('birthdayDay').value;
    let birthday = null;
    if (birthdayMonth && birthdayDay) {
        // Format as MM-DD (we'll store it as a string since there's no year)
        birthday = `${birthdayMonth}-${birthdayDay.padStart(2, '0')}`;
    }

    // Get form data
    const formData = {
        character_name: document.getElementById('characterName').value,
        nickname: document.getElementById('nickname').value,
        love_interest: document.getElementById('loveInterest').value,
        category: document.getElementById('category').value,
        fun_fact: document.getElementById('funFact').value,
        universe: document.getElementById('universe').value,
        birthday: birthday,
        powers_skills: document.getElementById('powers').value,
        debut_year: document.getElementById('debutYear').value || null,
        sign: document.getElementById('sign').value,
        about: document.getElementById('about').value,
    };

    try {
        // Upload image if provided
        let imageUrl = null;
        if (uploadedImageFile) {
            try {
                const fileExt = uploadedImageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const filePath = `characters/${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from('character-images')
                    .upload(filePath, uploadedImageFile);

                if (uploadError) {
                    // If bucket doesn't exist or upload fails, warn but continue without image
                    console.warn('Image upload failed:', uploadError.message);
                    if (uploadError.message.includes('Bucket not found') || uploadError.message.includes('bucket')) {
                        const continueWithoutImage = confirm('Storage bucket not found. Character will be added without image. Continue?');
                        if (!continueWithoutImage) {
                            return; // User cancelled
                        }
                    } else {
                        // For other upload errors, still allow character creation
                        console.warn('Image upload error, continuing without image:', uploadError.message);
                    }
                } else {
                    // Upload successful, get public URL
                    const { data: { publicUrl } } = supabase.storage
                        .from('character-images')
                        .getPublicUrl(filePath);
                    imageUrl = publicUrl;
                }
            } catch (uploadException) {
                // Catch any other errors during upload
                console.warn('Image upload exception:', uploadException);
                const continueWithoutImage = confirm('Failed to upload image. Character will be added without image. Continue?');
                if (!continueWithoutImage) {
                    return; // User cancelled
                }
            }
        }

        // Add image URL to form data (preserve existing if no new image uploaded)
        if (imageUrl) {
            formData.image_url = imageUrl;
        } else if (isEditMode && existingImageUrl) {
            // Preserve existing image if in edit mode and no new image uploaded
            formData.image_url = existingImageUrl;
        }

        // Get character ID if in edit mode
        const characterId = document.getElementById('characterId').value;

        let data, error;
        if (isEditMode && characterId) {
            // Update existing character
            const result = await supabase
                .from('characters')
                .update(formData)
                .eq('id', characterId)
                .select();

            data = result.data;
            error = result.error;
        } else {
            // Insert new character
            const result = await supabase
                .from('characters')
                .insert([formData])
                .select();

            data = result.data;
            error = result.error;
        }

        if (error) {
            throw error;
        }

        alert(isEditMode ? 'Character updated successfully!' : 'Character added successfully!');
        characterForm.reset();
        resetImageUpload();
        // Redirect to overview page after successful character addition/update
        setTimeout(() => {
            window.location.href = 'overview.html';
        }, 500);
    } catch (error) {
        console.error('Error adding character:', error);
        alert('Error adding character: ' + error.message);
    }
}

// Listen for auth state changes
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            showLoginModal();
        } else if (event === 'SIGNED_IN') {
            hideLoginModal();
            // Don't redirect on auth state change - only load data for current page
            // Redirects should only happen from login form submission
            if (window.location.pathname.includes('index.html') || window.location.pathname === '/' || window.location.pathname.endsWith('/')) {
                loadUniverses();
                loadCategories();
            }
        }
    });
}
