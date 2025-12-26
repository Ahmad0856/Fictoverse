// Supabase Configuration (reuse same project as admin)
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Initialize Supabase client
let supabase;
if (typeof window.supabaseClient === 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
    supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    window.supabaseClient = supabase;
} else if (typeof window.supabaseClient !== 'undefined') {
    supabase = window.supabaseClient;
}

document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const characterId = params.get('id');

    if (!characterId) {
        console.error('No character id provided in URL');
        return;
    }

    loadCharacterProfile(characterId);
});

async function loadCharacterProfile(id) {
    if (!supabase) {
        console.error('Supabase is not configured');
        return;
    }

    try {
        const { data, error } = await supabase
            .from('characters')
            .select('*')
            .eq('id', id)
            .maybeSingle();

        if (error) {
            console.error('Error loading character profile:', error);
            return;
        }

        if (!data) {
            console.warn('Character not found');
            return;
        }

        renderCharacterProfile(data);
    } catch (err) {
        console.error('Unexpected error loading character profile:', err);
    }
}

function renderCharacterProfile(character) {
    const {
        character_name,
        nickname,
        love_interest,
        category,
        fun_fact,
        universe,
        birthday,
        powers_skills,
        sign,
        about,
        image_url,
    } = character;

    const nameEl = document.getElementById('characterNameDisplay');
    const universeTagEl = document.getElementById('characterCategoryDisplay');
    const birthdayEl = document.getElementById('characterBirthday');
    const signEl = document.getElementById('characterSign');
    const categoryEl = document.getElementById('characterCategory');
    const universeEl = document.getElementById('characterUniverse');
    const aboutEl = document.getElementById('characterAbout');
    const nicknameEl = document.getElementById('characterNickname');
    const powersEl = document.getElementById('characterPowers');
    const loveInterestEl = document.getElementById('characterLoveInterest');
    const funFactEl = document.getElementById('characterFunFact');
    const imageEl = document.getElementById('characterImage');

    if (nameEl) nameEl.textContent = character_name || 'Unknown Character';

    if (universeTagEl) {
        const universeLabel = universe
            ? `${formatUniverse(universe)} Character`
            : 'Character';
        universeTagEl.textContent = universeLabel;
    }

    if (birthdayEl) birthdayEl.textContent = formatBirthday(birthday) || '-';
    if (signEl) signEl.textContent = sign ? capitalizeWords(sign) : '-';
    if (categoryEl) categoryEl.textContent = category || '-';
    if (universeEl) universeEl.textContent = universe ? formatUniverse(universe) : '-';
    if (aboutEl) aboutEl.textContent = about || 'No description available yet.';
    if (nicknameEl) nicknameEl.textContent = nickname || '-';
    if (powersEl) powersEl.textContent = powers_skills || '-';
    if (loveInterestEl) loveInterestEl.textContent = love_interest || '-';
    if (funFactEl) funFactEl.textContent = fun_fact || '-';

    if (imageEl) {
        if (image_url) {
            imageEl.src = image_url;
            imageEl.alt = character_name || 'Character image';
        } else {
            imageEl.src = 'https://via.placeholder.com/320x400?text=Character';
            imageEl.alt = 'Placeholder character image';
        }
    }
}

function formatUniverse(universe) {
    if (!universe) return '';
    return universe
        .split('-')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

function formatBirthday(birthday) {
    if (!birthday) return '';
    const [month, day] = birthday.split('-');
    if (!month || !day) return birthday;

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex < 0 || monthIndex >= monthNames.length) return birthday;

    return `${monthNames[monthIndex]} ${parseInt(day, 10)}`;
}

function capitalizeWords(text) {
    if (!text) return '';
    return text
        .split(' ')
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}


