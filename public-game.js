// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Initialize Supabase client (will be set in DOMContentLoaded)
// Use a scoped variable to avoid conflicts
let gameSupabaseClient;

// Game state
let currentQuestionIndex = 0;
let questions = [];
let score = 0;
let selectedAnswer = null;
let answerSubmitted = false;
let answerPercentages = null;

// DOM Elements
let gameContent, searchInput, searchBarContainer, searchResults, randomCharacterBtn;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM Content Loaded - Initializing game page');
    
    gameContent = document.getElementById('gameContent');
    searchInput = document.getElementById('searchInput');
    searchBarContainer = document.getElementById('searchBarContainer');
    searchResults = document.getElementById('searchResults');
    randomCharacterBtn = document.getElementById('randomCharacterBtn');

    if (!gameContent) {
        console.error('gameContent element not found!');
        return;
    }

    // Wait for Supabase to load
    const initSupabase = () => {
        console.log('Initializing Supabase...');
        console.log('window.supabase exists:', typeof window.supabase !== 'undefined');
        console.log('window.supabaseClient exists:', typeof window.supabaseClient !== 'undefined');
        
        const tryInit = () => {
            if (typeof window.supabase !== 'undefined') {
                console.log('Supabase library found, initializing...');
                initializeSupabase();
                if (gameSupabaseClient) {
                    loadQuestions();
                } else {
                    console.error('Failed to initialize Supabase client');
                    gameContent.innerHTML = '<div class="error">Failed to initialize database connection. Please refresh the page.</div>';
                }
    } else {
                console.log('Supabase library not loaded yet, waiting...');
            }
        };
        
        // Try immediately
        tryInit();
        
        // If not ready, try again after a delay
        if (typeof window.supabase === 'undefined') {
            let attempts = 0;
            const maxAttempts = 10;
            const checkInterval = setInterval(() => {
                attempts++;
                console.log(`Checking for Supabase library (attempt ${attempts}/${maxAttempts})...`);
                
                if (typeof window.supabase !== 'undefined') {
                    clearInterval(checkInterval);
                    tryInit();
                } else if (attempts >= maxAttempts) {
                    clearInterval(checkInterval);
                    console.error('Supabase library failed to load after multiple attempts');
                    gameContent.innerHTML = '<div class="error">Supabase library failed to load. Please check your internet connection and refresh the page.</div>';
                }
            }, 200);
        }
    };

    // Start initialization
    initSupabase();
    setupEventListeners();
});

// Initialize Supabase client
function initializeSupabase() {
    console.log('initializeSupabase called');
    
    if (typeof window.supabaseClient !== 'undefined') {
        console.log('Using existing supabaseClient');
        gameSupabaseClient = window.supabaseClient;
        return;
    }
    
    if (typeof window.supabase === 'undefined') {
        console.error('window.supabase is undefined!');
        return;
    }
    
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
        console.error('Supabase credentials missing!');
        return;
    }
    
    console.log('Creating new Supabase client');
    gameSupabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = gameSupabaseClient;
    console.log('Supabase client created:', !!gameSupabaseClient);
}

// Setup Event Listeners
function setupEventListeners() {
    // Random character button
    if (randomCharacterBtn) {
        randomCharacterBtn.addEventListener('click', () => {
            if (typeof navigateToRandomCharacter === 'function') {
                navigateToRandomCharacter();
            } else {
                // Fallback: navigate to a random character page
                window.location.href = 'home.html';
            }
        });
    }

    // Search functionality (if search is available)
    if (searchInput && typeof setupSearch === 'function') {
        setupSearch();
            }
        }

// Load Questions from Supabase
async function loadQuestions() {
    console.log('loadQuestions called');
    console.log('supabase client:', !!gameSupabaseClient);

    if (!gameSupabaseClient) {
        console.error('Supabase client not initialized!');
        gameContent.innerHTML = '<div class="error">Unable to connect to database. Please refresh the page.</div>';
                    return;
                }

    try {
        console.log('Fetching questions from game_questions table...');
        // Fetch all questions
        const { data: questionsData, error } = await gameSupabaseClient
            .from('game_questions')
            .select('id, question, option_a, option_b')
            .order('created_at', { ascending: false });
        
        console.log('Query result:', { data: questionsData, error });

        if (error) {
            console.error('Error loading questions:', error);
            console.error('Error details:', {
                code: error.code,
                message: error.message,
                details: error.details,
                hint: error.hint
            });
            
            if (error.code === '42P01') {
                // Table doesn't exist
                gameContent.innerHTML = `
                    <div class="empty-state">
                        <h2>No questions available</h2>
                        <p>The game questions table hasn't been created yet. Please run the SQL script in Supabase to create the table.</p>
                        <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">Error: ${error.message}</p>
                    </div>
                `;
            } else if (error.code === '42501' || error.message.includes('permission') || error.message.includes('policy')) {
                // Permission denied - RLS policy issue
                gameContent.innerHTML = `
                    <div class="empty-state">
                        <h2>Access Denied</h2>
                        <p>The game questions table exists but public access hasn't been enabled. Please check the RLS policies in Supabase.</p>
                        <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">Error: ${error.message}</p>
                    </div>
                `;
            } else {
                gameContent.innerHTML = `
                    <div class="error">
                        <h2>Error loading questions</h2>
                        <p>${error.message || 'Please try again later.'}</p>
                        <p style="margin-top: 16px; font-size: 12px; color: #6b7280;">Error code: ${error.code || 'Unknown'}</p>
                    </div>
                `;
            }
            return;
        }

        if (!questionsData || questionsData.length === 0) {
            gameContent.innerHTML = `
                <div class="empty-state">
                    <h2>No questions available</h2>
                    <p>There are no questions in the game yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        // Fetch character names for all questions
        const characterIds = new Set();
        questionsData.forEach(q => {
            if (q.option_a) characterIds.add(q.option_a);
            if (q.option_b) characterIds.add(q.option_b);
        });

        const { data: characters, error: charError } = await gameSupabaseClient
            .from('characters')
            .select('id, character_name, image_url')
            .in('id', Array.from(characterIds));

        if (charError) {
            console.error('Error loading characters:', charError);
            gameContent.innerHTML = '<div class="error">Error loading character data. Please try again later.</div>';
            return;
        }

        // Map character data
        const charMap = {};
        if (characters) {
            characters.forEach(char => {
                charMap[char.id] = {
                    name: char.character_name,
                    image: char.image_url
                };
    });
}

        // Combine questions with character data
        questions = questionsData.map(q => ({
            id: q.id,
            question: q.question,
            optionA: {
                id: q.option_a,
                name: charMap[q.option_a]?.name || 'Unknown Character',
                image: charMap[q.option_a]?.image || null
            },
            optionB: {
                id: q.option_b,
                name: charMap[q.option_b]?.name || 'Unknown Character',
                image: charMap[q.option_b]?.image || null
            }
        }));

        // Shuffle questions
        shuffleArray(questions);

        // Start the game
        currentQuestionIndex = 0;
        score = 0;
        displayQuestion();
    } catch (error) {
        console.error('Error loading questions:', error);
        gameContent.innerHTML = '<div class="error">An unexpected error occurred. Please try again later.</div>';
    }
}

// Shuffle array (Fisher-Yates algorithm)
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// Display Current Question
async function displayQuestion() {
        if (currentQuestionIndex >= questions.length) {
            showResults();
            return;
        }

        const question = questions[currentQuestionIndex];
    selectedAnswer = null;
    answerSubmitted = false;
    answerPercentages = null;

    // Load percentages for this question
    await loadAnswerPercentages(question.id);
    
    // Determine which percentage is higher for color coding
    let percentageAClass = '';
    let percentageBClass = '';
    if (answerPercentages && answerPercentages.total > 0) {
        if (answerPercentages.optionA > answerPercentages.optionB) {
            percentageAClass = 'percentage-high';
            percentageBClass = 'percentage-low';
        } else if (answerPercentages.optionB > answerPercentages.optionA) {
            percentageBClass = 'percentage-high';
            percentageAClass = 'percentage-low';
        }
    }

        gameContent.innerHTML = `
        <div class="question-container">
            <div class="question-progress">
                    Question ${currentQuestionIndex + 1} of ${questions.length}
                </div>
            <div class="question-text">${question.question}</div>
            <div class="options-container">
                <div class="option-card" data-option="A" onclick="selectOptionImmediately('A')">
                    <div class="option-content">
                        ${question.optionA.image ? `<img src="${question.optionA.image}" alt="${question.optionA.name}" class="option-image">` : ''}
                        <div class="option-name">${question.optionA.name}</div>
                        <div class="option-percentage ${percentageAClass}" id="percentageA" style="display: none;">
                        </div>
                    </div>
                </div>
                <div class="option-card" data-option="B" onclick="selectOptionImmediately('B')">
                    <div class="option-content">
                        ${question.optionB.image ? `<img src="${question.optionB.image}" alt="${question.optionB.name}" class="option-image">` : ''}
                        <div class="option-name">${question.optionB.name}</div>
                        <div class="option-percentage ${percentageBClass}" id="percentageB" style="display: none;">
                        </div>
                    </div>
                </div>
            </div>
            <button class="submit-answer-btn" id="nextBtn" onclick="nextQuestion()" style="display: none;">
                Next
            </button>
            </div>
        `;
    }

// Load Answer Percentages
async function loadAnswerPercentages(questionId) {
    if (!gameSupabaseClient) return;

    try {
        const { data: answers, error } = await gameSupabaseClient
            .from('game_answers')
            .select('selected_option')
            .eq('question_id', questionId);
        
        if (error) {
            console.error('Error loading answer percentages:', error);
            return;
        }

        if (answers && answers.length > 0) {
            const totalAnswers = answers.length;
            const optionACount = answers.filter(a => a.selected_option === 'A').length;
            const optionBCount = answers.filter(a => a.selected_option === 'B').length;
            
            answerPercentages = {
                optionA: totalAnswers > 0 ? Math.round((optionACount / totalAnswers) * 100) : 0,
                optionB: totalAnswers > 0 ? Math.round((optionBCount / totalAnswers) * 100) : 0,
                total: totalAnswers
            };
        } else {
            answerPercentages = {
                optionA: 0,
                optionB: 0,
                total: 0
            };
        }
    } catch (error) {
        console.error('Error calculating percentages:', error);
    }
}

// Select Option Immediately (when user clicks) - exposed globally
window.selectOptionImmediately = async function(option) {
    if (answerSubmitted) return; // Prevent multiple submissions
    
    selectedAnswer = option;
    answerSubmitted = true;
    
    const question = questions[currentQuestionIndex];
    
    // Store answer in database
    if (gameSupabaseClient) {
        try {
            await gameSupabaseClient
                .from('game_answers')
                .insert({
                    question_id: question.id,
                    selected_option: option
                });
        } catch (error) {
            console.error('Error saving answer:', error);
        }
}

    // Reload percentages to include this answer
    await loadAnswerPercentages(question.id);
    
    // Update UI - show selected state and percentages
    document.querySelectorAll('.option-card').forEach(card => {
        card.classList.remove('selected');
        card.style.pointerEvents = 'none'; // Disable further clicks
    });
    
    const selectedCard = document.querySelector(`.option-card[data-option="${option}"]`);
    selectedCard.classList.add('selected');
    
    // Show percentages with color coding
    const percentageA = document.getElementById('percentageA');
    const percentageB = document.getElementById('percentageB');
    
    if (percentageA && percentageB && answerPercentages) {
        percentageA.textContent = `${answerPercentages.optionA}%`;
        percentageB.textContent = `${answerPercentages.optionB}%`;
        percentageA.style.display = 'block';
        percentageB.style.display = 'block';
        
        // Apply color coding: green for highest, red for lowest
        if (answerPercentages.optionA > answerPercentages.optionB) {
            percentageA.classList.add('percentage-high');
            percentageA.classList.remove('percentage-low');
            percentageB.classList.add('percentage-low');
            percentageB.classList.remove('percentage-high');
        } else if (answerPercentages.optionB > answerPercentages.optionA) {
            percentageB.classList.add('percentage-high');
            percentageB.classList.remove('percentage-low');
            percentageA.classList.add('percentage-low');
            percentageA.classList.remove('percentage-high');
        } else {
            // If equal, both get neutral color (or you can choose a different color)
            percentageA.classList.remove('percentage-high', 'percentage-low');
            percentageB.classList.remove('percentage-high', 'percentage-low');
        }
    }
    
    // Show Next button
    const nextBtn = document.getElementById('nextBtn');
    if (nextBtn) {
        nextBtn.style.display = 'block';
    }
}

// Next Question - exposed globally
window.nextQuestion = function() {
    currentQuestionIndex++;
    
    if (currentQuestionIndex >= questions.length) {
        showResults();
    } else {
        displayQuestion();
    }
}

// Show Results
function showResults() {
    gameContent.innerHTML = `
        <div class="results-container">
            <h2 class="results-title">Game Complete!</h2>
            <p class="results-text">You've answered all ${questions.length} questions.</p>
            <button class="play-again-btn" onclick="restartGame()">Play Again</button>
                    </div>
                `;
}

// Restart Game - exposed globally
window.restartGame = function() {
    shuffleArray(questions);
    currentQuestionIndex = 0;
    score = 0;
    selectedAnswer = null;
    answerSubmitted = false;
    answerPercentages = null;
    displayQuestion();
}

// Navigate to Random Character (if function exists from public.js)
function navigateToRandomCharacter() {
    if (typeof window.navigateToRandomCharacter === 'function') {
        window.navigateToRandomCharacter();
        } else {
        window.location.href = 'home.html';
    }
}
