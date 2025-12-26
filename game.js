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

// DOM Elements
let loginModal, loginForm, logoutNav, overviewNav, addCharacterNav;
let addQuestionBtn, questionModal, closeModalBtn, cancelQuestionBtn, questionForm;
let questionsTableBody, searchInput;
let optionASelect, optionBSelect, questionTextInput, questionIdInput;
let isEditMode = false;
let editingQuestionId = null;

// Check authentication status on page load
document.addEventListener('DOMContentLoaded', () => {
    // Get DOM elements after DOM is loaded
    loginModal = document.getElementById('loginModal');
    loginForm = document.getElementById('loginForm');
    logoutNav = document.getElementById('logoutNav');
    overviewNav = document.getElementById('overviewNav');
    addCharacterNav = document.getElementById('addCharacterNav');
    addQuestionBtn = document.getElementById('addQuestionBtn');
    questionModal = document.getElementById('questionModal');
    closeModalBtn = document.getElementById('closeModalBtn');
    cancelQuestionBtn = document.getElementById('cancelQuestionBtn');
    questionForm = document.getElementById('questionForm');
    questionsTableBody = document.getElementById('questionsTableBody');
    searchInput = document.getElementById('searchInput');
    optionASelect = document.getElementById('optionA');
    optionBSelect = document.getElementById('optionB');
    questionTextInput = document.getElementById('questionText');
    questionIdInput = document.getElementById('questionId');
    
    checkAuthStatus();
    setupEventListeners();
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

    // Overview navigation
    if (overviewNav) {
        overviewNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'overview.html';
        });
    }

    // Add Character navigation
    if (addCharacterNav) {
        addCharacterNav.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            window.location.href = 'index.html';
        });
    }

    // Add Question button
    if (addQuestionBtn) {
        addQuestionBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            openQuestionModal();
        });
    }

    // Close modal buttons
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeQuestionModal);
    }

    if (cancelQuestionBtn) {
        cancelQuestionBtn.addEventListener('click', closeQuestionModal);
    }

    // Question form submit
    if (questionForm) {
        questionForm.addEventListener('submit', handleQuestionSubmit);
    }

    // Close modal on overlay click
    if (questionModal) {
        questionModal.addEventListener('click', (e) => {
            if (e.target === questionModal) {
                closeQuestionModal();
            }
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
            loadCharacters();
            loadQuestions();
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
        alert('Supabase is not configured. Please add your credentials in game.js');
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
            loadCharacters();
            loadQuestions();
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

// Load Characters for dropdowns
async function loadCharacters() {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('characters')
            .select('id, character_name')
            .order('character_name', { ascending: true });

        if (error) {
            console.error('Error loading characters:', error);
            return;
        }

        // Populate both dropdowns
        optionASelect.innerHTML = '<option value="">Select Character</option>';
        optionBSelect.innerHTML = '<option value="">Select Character</option>';

        if (data) {
            data.forEach(character => {
                const optionA = document.createElement('option');
                optionA.value = character.id;
                optionA.textContent = character.character_name;
                optionASelect.appendChild(optionA);

                const optionB = document.createElement('option');
                optionB.value = character.id;
                optionB.textContent = character.character_name;
                optionBSelect.appendChild(optionB);
            });
        }
    } catch (error) {
        console.error('Error loading characters:', error);
    }
}

// Load Questions
async function loadQuestions(searchTerm = '') {
    if (!supabase) return;

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        // First, get all questions
        let query = supabase
            .from('game_questions')
            .select('id, question, option_a, option_b')
            .order('created_at', { ascending: false });

        // Add search filter if search term exists
        if (searchTerm) {
            query = query.ilike('question', `%${searchTerm}%`);
        }

        const { data: questions, error } = await query;

        if (error) {
            console.error('Error loading questions:', error);
            // If table doesn't exist, show empty state
            if (error.code === '42P01') {
                displayQuestions([]);
                return;
            }
            return;
        }

        // Fetch character names for each question
        if (questions && questions.length > 0) {
            const characterIds = new Set();
            questions.forEach(q => {
                if (q.option_a) characterIds.add(q.option_a);
                if (q.option_b) characterIds.add(q.option_b);
            });

            const { data: characters, error: charError } = await supabase
                .from('characters')
                .select('id, character_name')
                .in('id', Array.from(characterIds));

            if (!charError && characters) {
                const charMap = {};
                characters.forEach(char => {
                    charMap[char.id] = char.character_name;
                });

                // Add character names to questions
                questions.forEach(q => {
                    q.option_a_name = charMap[q.option_a] || 'Unknown';
                    q.option_b_name = charMap[q.option_b] || 'Unknown';
                });
            }
        }

        displayQuestions(questions || []);
    } catch (error) {
        console.error('Error loading questions:', error);
        displayQuestions([]);
    }
}

// Display Questions in Table
function displayQuestions(questions) {
    questionsTableBody.innerHTML = '';

    if (questions.length === 0) {
        questionsTableBody.innerHTML = `
            <tr>
                <td colspan="4" style="text-align: center; padding: 32px; color: #6b7280;">
                    No questions found. Click the "+" button to add your first question.
                </td>
            </tr>
        `;
        return;
    }

    questions.forEach(question => {
        const row = document.createElement('tr');
        
        // Get character names
        const optionAName = question.option_a_name || 'Unknown';
        const optionBName = question.option_b_name || 'Unknown';

        row.innerHTML = `
            <td class="col-question">${question.question || '-'}</td>
            <td class="col-option-a">${optionAName}</td>
            <td class="col-option-b">${optionBName}</td>
            <td class="col-actions">
                <button class="btn-edit" onclick="event.stopPropagation(); editQuestion('${question.id}')" title="Edit Question">✏️</button>
                <button class="btn-delete" onclick="event.stopPropagation(); deleteQuestion('${question.id}')" title="Delete Question">🗑️</button>
            </td>
        `;

        questionsTableBody.appendChild(row);
    });
}

// Handle Search
let searchTimeout;
function handleSearch(event) {
    const searchTerm = event.target.value.trim();
    
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        loadQuestions(searchTerm);
    }, 300); // Debounce search
}

// Open Question Modal
async function openQuestionModal(questionId = null) {
    isEditMode = questionId !== null;
    editingQuestionId = questionId;

    // Reset form
    questionForm.reset();
    questionIdInput.value = '';
    
    // Update modal title and button
    const modalTitle = questionModal.querySelector('.modal-header h2');
    const submitBtn = document.getElementById('submitQuestionBtn');
    
    if (isEditMode) {
        modalTitle.textContent = 'Edit Question';
        submitBtn.textContent = 'Update Question';
        
        // Load question data
        await loadQuestionForEdit(questionId);
    } else {
        modalTitle.textContent = 'Add Question';
        submitBtn.textContent = 'Add Question';
    }
    
    // Show modal
    questionModal.style.display = 'flex';
}

// Close Question Modal
function closeQuestionModal() {
    questionModal.style.display = 'none';
    questionForm.reset();
    questionIdInput.value = '';
    isEditMode = false;
    editingQuestionId = null;
}

// Load Question for Edit
async function loadQuestionForEdit(questionId) {
    if (!supabase) return;
    
    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) return;

        const { data, error } = await supabase
            .from('game_questions')
            .select('*')
            .eq('id', questionId)
            .single();

        if (error) {
            console.error('Error loading question:', error);
            alert('Error loading question: ' + error.message);
            return;
        }

        if (data) {
            questionTextInput.value = data.question || '';
            optionASelect.value = data.option_a || '';
            optionBSelect.value = data.option_b || '';
            questionIdInput.value = data.id;
        }
    } catch (error) {
        console.error('Error loading question:', error);
    }
}

// Handle Question Submit
async function handleQuestionSubmit(event) {
    event.preventDefault();
    
    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    const question = questionTextInput.value.trim();
    const optionA = optionASelect.value;
    const optionB = optionBSelect.value;

    if (!question || !optionA || !optionB) {
        alert('Please fill in all fields');
        return;
    }

    if (optionA === optionB) {
        alert('Option A and Option B must be different characters');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to add questions');
            showLoginModal();
            return;
        }

        if (isEditMode && editingQuestionId) {
            // Update existing question
            const { error } = await supabase
                .from('game_questions')
                .update({
                    question: question,
                    option_a: optionA,
                    option_b: optionB
                })
                .eq('id', editingQuestionId);

            if (error) {
                console.error('Error updating question:', error);
                alert('Error updating question: ' + error.message);
                return;
            }

            alert('Question updated successfully!');
        } else {
            // Insert new question
            const { error } = await supabase
                .from('game_questions')
                .insert({
                    question: question,
                    option_a: optionA,
                    option_b: optionB
                });

            if (error) {
                console.error('Error adding question:', error);
                alert('Error adding question: ' + error.message);
            return;
        }

            alert('Question added successfully!');
        }

        closeQuestionModal();
        loadQuestions();
    } catch (error) {
        console.error('Error submitting question:', error);
        alert('An error occurred while submitting the question');
    }
}

// Edit Question
function editQuestion(questionId) {
    openQuestionModal(questionId);
}

// Delete Question
async function deleteQuestion(questionId) {
    if (!confirm('Are you sure you want to delete this question?')) {
        return;
    }

    if (!supabase) {
        alert('Supabase is not configured');
        return;
    }

    try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            alert('Please log in to delete questions');
            showLoginModal();
            return;
        }

        const { error } = await supabase
            .from('game_questions')
            .delete()
            .eq('id', questionId);

        if (error) {
            console.error('Error deleting question:', error);
            alert('Error deleting question: ' + error.message);
            return;
        }

        alert('Question deleted successfully!');
        loadQuestions();
    } catch (error) {
        console.error('Error deleting question:', error);
        alert('An error occurred while deleting the question');
    }
}

// Listen for auth state changes
if (supabase) {
    supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'SIGNED_OUT') {
            showLoginModal();
        } else if (event === 'SIGNED_IN') {
            hideLoginModal();
            loadCharacters();
            loadQuestions();
        }
    });
}

