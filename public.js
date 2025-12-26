// Supabase Configuration
const SUPABASE_URL = 'https://vmkuoyxvbcmaayetcbzq.supabase.co'; 
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZta3VveXh2YmNtYWF5ZXRjYnpxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU5MDg3MzksImV4cCI6MjA4MTQ4NDczOX0.EyMPPzDjWM2rOGu6GyThNw9vRAHJBMWJVExY5DKSYmk';

// Initialize Supabase client (check if already exists to avoid conflicts)
if (typeof window.supabaseClient === 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY && window.supabase) {
    window.supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
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

// Get character ID or slug from URL
function getCharacterIdFromUrl() {
    // Check for embedded character ID (from static page generation)
    if (window.CHARACTER_ID) {
        return window.CHARACTER_ID;
    }
    
    // Check for slug in path (e.g., /character/superman.html or /character/superman)
    const path = window.location.pathname;
    const pathMatch = path.match(/\/character\/([^\/]+?)(?:\.html)?$/);
    if (pathMatch) {
        return pathMatch[1]; // Return slug
    }
    
    // Check for slug in query parameter (server rewrite or direct access)
    const urlParams = new URLSearchParams(window.location.search);
    const slug = urlParams.get('slug');
    if (slug) {
        return slug;
    }
    
    // Check for name parameter (fallback for static sites)
    const name = urlParams.get('name');
    if (name) {
        return name;
    }
    
    // Fallback to ID query parameter (backward compatibility)
    const id = urlParams.get('id');
    if (id) {
        return id;
    }
    
    return null;
}

// Format birthday from MM-DD to readable format
function formatBirthday(birthday) {
    if (!birthday) return '-';
    
    const [month, day] = birthday.split('-');
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                       'July', 'August', 'September', 'October', 'November', 'December'];
    const monthIndex = parseInt(month) - 1;
    
    if (monthIndex >= 0 && monthIndex < 12) {
        const dayNum = parseInt(day);
        const suffix = getDaySuffix(dayNum);
        return `${monthNames[monthIndex]} ${dayNum}${suffix}`;
    }
    
    return birthday;
}

// Format birthday for card display (shorter format)
function formatBirthdayShort(birthday) {
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

// Get day suffix (st, nd, rd, th)
function getDaySuffix(day) {
    if (day >= 11 && day <= 13) {
        return 'th';
    }
    switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
    }
}

// Helper function to get the correct path for static filter pages based on current page location
function getFilterPath(filterType, filterValue) {
    // Check if we're in a subdirectory
    const currentPath = window.location.pathname;
    const isInSubdir = currentPath.includes('/character/') || currentPath.includes('/birthday/') || 
                      currentPath.includes('/sign/') || currentPath.includes('/category/') || 
                      currentPath.includes('/universe/');
    const prefix = isInSubdir ? '../' : '';
    
    // Generate slug from filter value
    const slug = createSlug(filterValue);
    
    // Map filter types to directory names
    const dirMap = {
        'birthday': 'birthday',
        'sign': 'sign',
        'category': 'category',
        'universe': 'universe',
        'debutYear': 'debut-year' // Optional: if you want debut year pages
    };
    
    const dir = dirMap[filterType];
    if (dir) {
        return `${prefix}${dir}/${slug}.html`;
    }
    
    // Fallback to old filter.html for unsupported types
    return isInSubdir ? '../filter.html' : 'filter.html';
}

// Format category/universe name (capitalize first letter of each word)
function formatName(name) {
    if (!name) return '-';
    return name.split('-').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

// Format zodiac sign
function formatSign(sign) {
    if (!sign) return '-';
    return sign.charAt(0).toUpperCase() + sign.slice(1);
}

// Extract links from text (for About, Fun Fact sections)
function processTextWithLinks(text) {
    if (!text) return '-';
    
    // Simple link detection - you can enhance this
    // For now, we'll just return the text as-is
    // In a real implementation, you might want to detect and link specific terms
    return text;
}

// Load character data
async function loadCharacter() {
    // First, check if character data is embedded in the page (for individual character pages)
    if (window.characterData) {
        console.log('Using embedded character data');
        displayCharacter(window.characterData);
        if (window.characterData.id) {
            setupBoostButton(window.characterData.id, window.characterData.boost_count || 0);
        }
        loadRelatedCharacters(window.characterData);
        return;
    }
    
    const identifier = getCharacterIdFromUrl();
    
    if (!identifier) {
        console.error('No character identifier provided');
        document.body.innerHTML = '<div style="padding: 48px; text-align: center;"><h1>Character Not Found</h1><p>No character identifier provided in the URL.</p><p><a href="home.html">Browse all characters</a></p></div>';
        return;
    }

    const supabase = window.supabaseClient;
    if (!supabase) {
        console.error('Supabase not configured');
        document.body.innerHTML = '<div style="padding: 48px; text-align: center;"><h1>Configuration Error</h1><p>Supabase is not configured. Please check the configuration.</p></div>';
        return;
    }

    try {
        let data, error;
        
        // Check if identifier is a UUID (ID) or a slug
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(identifier);
        
        if (isUUID) {
            // Query by ID
            console.log('Loading character with ID:', identifier);
            const result = await supabase
            .from('characters')
            .select('*')
                .eq('id', identifier)
            .single();
            data = result.data;
            error = result.error;
        } else {
            // Query by slug (character name)
            console.log('Loading character with slug:', identifier);
            // Fetch all characters and find by slug
            const { data: allCharacters, error: fetchError } = await supabase
                .from('characters')
                .select('*');
            
            if (fetchError) {
                error = fetchError;
            } else {
                // Find character whose slug matches
                const character = allCharacters.find(char => {
                    const slug = createSlug(char.character_name);
                    return slug === identifier;
                });
                
                if (character) {
                    data = character;
                } else {
                    error = { code: 'PGRST116', message: 'Character not found' };
                }
            }
        }

        if (error) {
            console.error('Error loading character:', error);
            let errorMessage = 'Error loading character. ';
            
            if (error.code === 'PGRST116') {
                errorMessage += 'Character not found.';
            } else if (error.message.includes('permission') || error.message.includes('policy')) {
                errorMessage += 'Please run the enable_public_read_access.sql file in your Supabase SQL Editor to enable public read access.';
            } else {
                errorMessage += error.message;
            }
            
            document.body.innerHTML = `<div style="padding: 48px; text-align: center;"><h1>Error</h1><p>${errorMessage}</p><p><a href="public-index.html">Browse all characters</a></p></div>`;
            return;
        }

        if (data) {
            console.log('Character loaded successfully:', data);
            displayCharacter(data);
            // Load related characters
            loadRelatedCharacters(data);
        } else {
            document.body.innerHTML = '<div style="padding: 48px; text-align: center;"><h1>Character Not Found</h1><p>The requested character could not be found.</p><p><a href="public-index.html">Browse all characters</a></p></div>';
        }
    } catch (error) {
        console.error('Error loading character:', error);
        document.body.innerHTML = `<div style="padding: 48px; text-align: center;"><h1>Error</h1><p>An unexpected error occurred: ${error.message}</p><p><a href="public-index.html">Browse all characters</a></p></div>`;
    }
}

// Display character data
function displayCharacter(character) {
    // Image
    const characterImage = document.getElementById('characterImage');
    if (character.image_url) {
        characterImage.src = character.image_url;
        characterImage.alt = character.character_name || 'Character';
    } else {
        characterImage.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="320" height="320"%3E%3Crect width="320" height="320" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="16"%3ENo Image%3C/text%3E%3C/svg%3E';
    }

    // Name
    const characterName = document.getElementById('characterName');
    characterName.textContent = character.character_name || '-';

    // Universe (display as "DC Character", "Marvel Character", etc.)
    const characterCategory = document.getElementById('characterCategory');
    const universeFormatted = formatName(character.universe);
    if (universeFormatted && character.universe) {
        const universePath = getFilterPath('universe', character.universe);
        characterCategory.innerHTML = `<a href="${universePath}" class="clickable-universe-label">${universeFormatted} Character</a>`;
        characterCategory.classList.add('has-link');
    } else {
        characterCategory.textContent = 'Character';
        characterCategory.classList.remove('has-link');
    }

    // Category
    const categoryValue = document.getElementById('characterCategoryValue');
    const categoryFormatted = formatName(character.category);
    if (categoryFormatted && categoryFormatted !== '-') {
        const categoryPath = getFilterPath('category', character.category);
        categoryValue.innerHTML = `<a href="${categoryPath}" class="clickable-detail-value">${categoryFormatted}</a>`;
        categoryValue.classList.add('has-link');
    } else {
        categoryValue.textContent = '-';
    }

    // Birthday
    const characterBirthday = document.getElementById('characterBirthday');
    const birthdayFormatted = formatBirthday(character.birthday);
    if (birthdayFormatted && birthdayFormatted !== '-') {
        // Extract month name from formatted birthday (e.g., "January 15" -> "January")
        const monthName = birthdayFormatted.split(' ')[0];
        const birthdayPath = getFilterPath('birthday', monthName);
        characterBirthday.innerHTML = `<a href="${birthdayPath}" class="clickable-detail-value">${birthdayFormatted}</a>`;
        characterBirthday.classList.add('has-link');
    } else {
        characterBirthday.textContent = '-';
    }

    // Sign
    const characterSign = document.getElementById('characterSign');
    const signFormatted = formatSign(character.sign);
    if (signFormatted && signFormatted !== '-') {
        const signPath = getFilterPath('sign', character.sign);
        characterSign.innerHTML = `<a href="${signPath}" class="clickable-detail-value">${signFormatted}</a>`;
        characterSign.classList.add('has-link');
    } else {
        characterSign.textContent = '-';
    }

    // Debut Year
    const characterDebutYear = document.getElementById('characterDebutYear');
    if (character.debut_year) {
        // For debut year, use filter.html as we don't have static pages for debut years
        const currentPath = window.location.pathname;
        const isInSubdir = currentPath.includes('/character/') || currentPath.includes('/birthday/') || 
                          currentPath.includes('/sign/') || currentPath.includes('/category/') || 
                          currentPath.includes('/universe/');
        const debutYearFilterPath = isInSubdir ? '../filter.html' : 'filter.html';
        characterDebutYear.innerHTML = `<a href="${debutYearFilterPath}?type=debutYear&value=${encodeURIComponent(character.debut_year)}&label=${encodeURIComponent(character.debut_year)}" class="clickable-detail-value">${character.debut_year}</a>`;
        characterDebutYear.classList.add('has-link');
    } else {
        characterDebutYear.textContent = '-';
    }

    // About (with potential link processing)
    const characterAbout = document.getElementById('characterAbout');
    if (character.about && character.about.trim()) {
        // Simple link detection - convert text like "DC Comics" to links if they appear
        let aboutText = character.about;
        // You can enhance this to detect and link specific terms
        // For now, we'll just display the text
        characterAbout.innerHTML = aboutText.replace(/\n/g, '<br>');
    } else {
        characterAbout.textContent = '-';
    }

    // Nickname (conditional rendering)
    const nicknameSection = document.getElementById('nicknameSection');
    const characterNickname = document.getElementById('characterNickname');
    if (character.nickname && character.nickname.trim()) {
        characterNickname.textContent = character.nickname;
        nicknameSection.style.display = 'flex';
    } else {
        nicknameSection.style.display = 'none';
    }

    // Powers/Skills (conditional rendering)
    const powersSection = document.getElementById('powersSection');
    const characterPowers = document.getElementById('characterPowers');
    if (character.powers_skills && character.powers_skills.trim()) {
        characterPowers.textContent = character.powers_skills;
        powersSection.style.display = 'flex';
    } else {
        powersSection.style.display = 'none';
    }

    // Love Interest (conditional rendering)
    const loveInterestSection = document.getElementById('loveInterestSection');
    const characterLoveInterest = document.getElementById('characterLoveInterest');
    if (character.love_interest && character.love_interest.trim()) {
        characterLoveInterest.textContent = character.love_interest;
        loveInterestSection.style.display = 'flex';
    } else {
        loveInterestSection.style.display = 'none';
    }

    // Fun Fact (conditional rendering)
    const funFactSection = document.getElementById('funFactSection');
    const characterFunFact = document.getElementById('characterFunFact');
    if (character.fun_fact && character.fun_fact.trim()) {
        characterFunFact.textContent = character.fun_fact;
        funFactSection.style.display = 'flex';
    } else {
        funFactSection.style.display = 'none';
    }

    // Fame badges (generate based on character data)
    generateFameBadges(character); // Async function, will update badges when ready

    // Setup boost button
    if (character.id) {
        setupBoostButton(character.id, character.boost_count || 0);
    }
}

// Generate fame badges with accurate ranks
async function generateFameBadges(character) {
    const fameBadges = document.getElementById('fameBadges');
    if (!fameBadges) return;
    
    fameBadges.innerHTML = '<div style="color: #6b7280;">Loading ranks...</div>';

    const supabase = window.supabaseClient;
    if (!supabase) {
        fameBadges.innerHTML = '';
        return;
    }

    const badges = [];

    try {
        // Calculate overall rank (by boost_count)
        const { data: allCharacters } = await supabase
            .from('characters')
            .select('id, boost_count, character_name')
            .order('boost_count', { ascending: false, nullsFirst: false })
            .order('character_name', { ascending: true });

        if (allCharacters) {
            const overallRank = allCharacters.findIndex(c => c.id === character.id) + 1;
            if (overallRank > 0) {
                const currentPath = window.location.pathname;
                const isInSubdir = currentPath.includes('/character/');
                const popularPath = isInSubdir ? '../popular.html' : 'popular.html';
                badges.push({ 
                    text: `Most Popular #${overallRank}`,
                    href: popularPath
                });
            }
        }

        // Calculate category rank
        if (character.category) {
            const { data: categoryCharacters } = await supabase
                .from('characters')
                .select('id, boost_count, character_name')
                .eq('category', character.category)
                .order('boost_count', { ascending: false, nullsFirst: false })
                .order('character_name', { ascending: true });

            if (categoryCharacters) {
                const categoryRank = categoryCharacters.findIndex(c => c.id === character.id) + 1;
                if (categoryRank > 0) {
                    const categoryFormatted = formatName(character.category);
                    const categoryPath = getFilterPath('category', character.category);
                    badges.push({ 
                        text: `${categoryFormatted} #${categoryRank}`,
                        href: categoryPath
                    });
                }
            }
        }

        // Calculate birthday month rank
        if (character.birthday) {
            const [month] = character.birthday.split('-');
            const monthPadded = month.padStart(2, '0');
            const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                               'July', 'August', 'September', 'October', 'November', 'December'];
            const monthIndex = parseInt(month) - 1;
            
            if (monthIndex >= 0 && monthIndex < 12) {
                const { data: monthCharacters } = await supabase
                    .from('characters')
                    .select('id, boost_count, character_name')
                    .like('birthday', `${monthPadded}-%`)
                    .order('boost_count', { ascending: false, nullsFirst: false })
                    .order('character_name', { ascending: true });

                if (monthCharacters) {
                    const monthRank = monthCharacters.findIndex(c => c.id === character.id) + 1;
                    if (monthRank > 0) {
                        const monthName = monthNames[monthIndex];
                        const birthdayPath = getFilterPath('birthday', monthName);
                        badges.push({ 
                            text: `Born in ${monthName} #${monthRank}`,
                            href: birthdayPath
                        });
                    }
                }
            }
        }

        // Display badges with clickable links
        fameBadges.innerHTML = '';
        
        badges.forEach(badge => {
            const badgeElement = document.createElement('a');
            badgeElement.className = 'fame-badge';
            badgeElement.textContent = badge.text;
            badgeElement.href = badge.href;
            fameBadges.appendChild(badgeElement);
        });
    } catch (error) {
        console.error('Error generating fame badges:', error);
        fameBadges.innerHTML = '';
    }
}

// Load related characters
async function loadRelatedCharacters(currentCharacter) {
    console.log('loadRelatedCharacters called for:', currentCharacter?.character_name);
    
    const supabase = window.supabaseClient;
    if (!supabase) {
        console.warn('Supabase not configured, skipping related characters');
        return;
    }

    try {
        // Load characters from same universe
        if (currentCharacter.universe) {
            console.log('Loading universe characters for:', currentCharacter.universe);
            const { data: universeChars, error: universeError } = await supabase
                .from('characters')
                .select('id, character_name, universe, image_url, boost_count')
                .eq('universe', currentCharacter.universe)
                .neq('id', currentCharacter.id)
                .order('boost_count', { ascending: false })
                .order('character_name', { ascending: true })
                .limit(10);

            console.log('Universe query result:', { data: universeChars, error: universeError });

            if (universeError) {
                console.warn('Error loading universe characters:', universeError);
                const section = document.getElementById('moreUniverseSection');
                if (section) section.style.display = 'none';
            } else if (universeChars && universeChars.length > 0) {
                console.log(`Found ${universeChars.length} universe characters`);
                const universeFormatted = formatName(currentCharacter.universe);
                displayRelatedCharacters(universeChars, 'moreUniverseCards', `More ${universeFormatted} characters`, 'universe', currentCharacter.universe);
                const heading = document.getElementById('moreUniverseHeading');
                if (heading) heading.textContent = `More ${universeFormatted} characters`;
                const section = document.getElementById('moreUniverseSection');
                if (section) section.style.display = 'block';
            } else {
                console.log('No universe characters found');
                const section = document.getElementById('moreUniverseSection');
                if (section) section.style.display = 'none';
            }
        } else {
            console.log('No universe for character');
            const section = document.getElementById('moreUniverseSection');
            if (section) section.style.display = 'none';
        }

        // Load characters with same birthday month
        if (currentCharacter.birthday) {
            const [month] = currentCharacter.birthday.split('-');
            const monthNumber = month.padStart(2, '0'); // Ensure 2-digit format
            
            console.log('Loading birthday characters for month:', monthNumber);
            
            // Query characters with same birthday month
            const { data: birthdayChars, error: birthdayError } = await supabase
                .from('characters')
                .select('id, character_name, universe, image_url, birthday, boost_count')
                .neq('id', currentCharacter.id)
                .ilike('birthday', `${monthNumber}-%`)
                .order('boost_count', { ascending: false })
                .order('character_name', { ascending: true })
                .limit(10);

            console.log('Birthday query result:', { data: birthdayChars, error: birthdayError });

            if (birthdayError) {
                console.warn('Error loading birthday characters:', birthdayError);
                const section = document.getElementById('sameBirthdaySection');
                if (section) section.style.display = 'none';
            } else if (birthdayChars && birthdayChars.length > 0) {
                console.log(`Found ${birthdayChars.length} birthday characters`);
                    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                                       'July', 'August', 'September', 'October', 'November', 'December'];
                    const monthIndex = parseInt(month) - 1;
                    const monthName = monthIndex >= 0 && monthIndex < 12 ? monthNames[monthIndex] : 'Unknown';
                    
                displayRelatedCharacters(birthdayChars, 'sameBirthdayCards', `Born in ${monthName}`, 'birthday', monthName);
                const heading = document.getElementById('sameBirthdayHeading');
                if (heading) heading.textContent = `Born in ${monthName}`;
                const section = document.getElementById('sameBirthdaySection');
                if (section) section.style.display = 'block';
                } else {
                console.log('No birthday characters found for month:', month);
                const section = document.getElementById('sameBirthdaySection');
                if (section) section.style.display = 'none';
                }
            } else {
            console.log('No birthday for character');
            const section = document.getElementById('sameBirthdaySection');
            if (section) section.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading related characters:', error);
        // Don't show error to user, just hide sections
        const universeSection = document.getElementById('moreUniverseSection');
        const birthdaySection = document.getElementById('sameBirthdaySection');
        if (universeSection) universeSection.style.display = 'none';
        if (birthdaySection) birthdaySection.style.display = 'none';
    }
}

// Display related character cards
function displayRelatedCharacters(characters, containerId, sectionTitle, filterType = null, filterValue = null) {
    const container = document.getElementById(containerId);
    if (!container) {
        console.error('Container not found:', containerId);
        return;
    }
    
    container.innerHTML = '';

    if (!characters || characters.length === 0) {
        console.log('No characters to display for:', containerId);
        return;
    }

    // Show only first 3 characters
    const displayChars = characters.slice(0, 3);
    const hasMore = characters.length > 3;

    console.log(`Displaying ${displayChars.length} characters in ${containerId}, hasMore: ${hasMore}`);

    displayChars.forEach(character => {
        if (!character || !character.character_name) {
            console.warn('Invalid character data:', character);
            return;
        }
        
        const card = document.createElement('div');
        card.className = 'character-card';
        
        // Navigation function
        const navigateToCharacter = () => {
            const slug = createSlug(character.character_name);
            // Check if we're in a subdirectory
            const currentPath = window.location.pathname;
            if (currentPath.includes('/character/')) {
                // Already in character directory, just use the slug
                window.location.href = `${slug}.html`;
            } else if (currentPath.includes('/birthday/') || currentPath.includes('/sign/') || 
                      currentPath.includes('/category/') || currentPath.includes('/universe/')) {
                // In other subdirectories, go up one level then into character
                window.location.href = `../character/${slug}.html`;
            } else {
                // At root level
                window.location.href = `character/${slug}.html`;
            }
        };

        // Check if mobile (screen width <= 768px)
        const isMobile = window.innerWidth <= 768;
        
        if (isMobile) {
            // On mobile: only card image and name are clickable
            // Don't add click handler to card itself
        } else {
            // On desktop: entire card is clickable
            card.addEventListener('click', navigateToCharacter);
        }

        const imageUrl = character.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200"%3E%3Crect width="200" height="200" fill="%23f3f4f6"/%3E%3Ctext x="50%25" y="50%25" text-anchor="middle" dy=".3em" fill="%239ca3af" font-family="sans-serif" font-size="14"%3ENo Image%3C/text%3E%3C/svg%3E';
        const universeFormatted = formatName(character.universe) || 'Unknown';

        card.innerHTML = `
            <div class="character-card-image">
                <img src="${imageUrl}" alt="${character.character_name || 'Character'}">
            </div>
            <div class="character-card-name">${character.character_name || '-'}</div>
            <div class="character-card-universe">${universeFormatted} Character</div>
        `;

        // On mobile, add click handlers to image and name
        if (isMobile) {
            const imageElement = card.querySelector('.character-card-image');
            const nameElement = card.querySelector('.character-card-name');
            if (imageElement) {
                imageElement.addEventListener('click', navigateToCharacter);
            }
            if (nameElement) {
                nameElement.addEventListener('click', navigateToCharacter);
            }
        }

        container.appendChild(card);
    });

    // Add "More" button BELOW the horizontal cards row if there are more characters
    if (hasMore && filterType && filterValue) {
        const moreButton = document.createElement('button');
        moreButton.className = 'see-more-button-related';
        moreButton.textContent = 'More';
        moreButton.addEventListener('click', () => {
            // Use static page paths
            const currentPath = window.location.pathname;
            const filterPath = getFilterPath(filterType, filterValue);
            window.location.href = filterPath;
        });
        // Append the button to the parent so it sits clearly below the cards row
        if (container.parentElement) {
            container.parentElement.appendChild(moreButton);
        } else {
            // Fallback: append to container (should rarely happen)
            container.appendChild(moreButton);
        }
    }
}

// Search functionality with real-time results
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

    // Determine correct path prefix based on current location
    const currentPath = window.location.pathname;
    const isInSubdir = currentPath.includes('/character/') || currentPath.includes('/birthday/') || 
                      currentPath.includes('/sign/') || currentPath.includes('/category/') || 
                      currentPath.includes('/universe/');
    const prefix = isInSubdir ? '../' : '';

    // Add characters to results
    filteredChars.forEach(char => {
        const imageUrl = char.image_url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="40" height="40"%3E%3Crect width="40" height="40" fill="%23f3f4f6"/%3E%3C/svg%3E';
        const universeFormatted = formatName(char.universe) || '';
        const slug = createSlug(char.character_name);
        const href = currentPath.includes('/character/') ? `${slug}.html` : `${prefix}character/${slug}.html`;
        results.push({
            type: 'character',
            name: char.character_name,
            subtitle: universeFormatted ? `${universeFormatted} Character` : '',
            href: href,
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
        // Check if we're in a subdirectory for proper path
        const currentPath = window.location.pathname;
        if (currentPath.includes('/character/')) {
            // Already in character directory, just use the slug
            window.location.href = `${slug}.html`;
        } else if (currentPath.includes('/birthday/') || currentPath.includes('/sign/') || 
                  currentPath.includes('/category/') || currentPath.includes('/universe/')) {
            // In other subdirectories, go up one level then into character
            window.location.href = `../character/${slug}.html`;
        } else {
            // At root level
            window.location.href = `character/${slug}.html`;
        }
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
    
    // Also setup mobile Random button
    const randomBtnMobile = document.getElementById('randomCharacterBtnMobile');
    if (randomBtnMobile) {
        randomBtnMobile.addEventListener('click', (e) => {
            e.preventDefault();
            navigateToRandomCharacter();
        });
    }
}

// Calculate character's rank in popular rankings
async function getCharacterRank(characterId) {
    const supabase = window.supabaseClient;
    if (!supabase) return null;

    try {
        // Fetch all characters ordered by boost_count (descending), then by name
        const { data, error } = await supabase
            .from('characters')
            .select('id, boost_count, character_name')
            .order('boost_count', { ascending: false, nullsFirst: false })
            .order('character_name', { ascending: true });

        if (error || !data) {
            console.error('Error fetching characters for rank:', error);
            return null;
        }

        // Find the character's position (rank starts at 1)
        const rank = data.findIndex(c => c.id === characterId) + 1;
        return rank > 0 ? rank : null;
    } catch (error) {
        console.error('Error calculating rank:', error);
        return null;
    }
}

// Boost functionality
async function setupBoostButton(characterId, currentBoostCount) {
    const boostButton = document.getElementById('boostButton');
    const boostCount = document.getElementById('boostCount');
    
    if (!boostButton || !boostCount) return;

    // Get and display character's rank instead of boost count
    const rank = await getCharacterRank(characterId);
    if (rank !== null) {
        boostCount.textContent = rank;
    } else {
        boostCount.textContent = '-';
    }

    // Check if user has already boosted this character (stored in localStorage)
    const boostKey = `boosted_${characterId}`;
    const hasBoosted = localStorage.getItem(boostKey) === 'true';

    if (hasBoosted) {
        boostButton.classList.add('boosted');
        boostButton.disabled = true;
        const boostText = boostButton.querySelector('.boost-text');
        if (boostText) {
            boostText.textContent = 'Boosted';
        }
    }

    boostButton.addEventListener('click', async () => {
        if (hasBoosted) {
            return;
        }

        const supabase = window.supabaseClient;
        if (!supabase) {
            alert('Unable to boost. Please try again later.');
            return;
        }

        try {
            // Increment boost count in database
            const newCount = (currentBoostCount || 0) + 1;
            const { error } = await supabase
                .from('characters')
                .update({ boost_count: newCount })
                .eq('id', characterId);

            if (error) {
                console.error('Error updating boost count:', error);
                alert('Failed to boost character. Please try again.');
                return;
            }

            // Update UI - recalculate and display rank
            const newRank = await getCharacterRank(characterId);
            if (newRank !== null) {
                boostCount.textContent = newRank;
            }
            boostButton.classList.add('boosted');
            boostButton.disabled = true;
            const boostText = boostButton.querySelector('.boost-text');
            if (boostText) {
                boostText.textContent = 'Boosted';
            }

            // Store in localStorage to prevent duplicate boosts
            localStorage.setItem(boostKey, 'true');

            // Show success animation
            boostButton.style.transform = 'scale(1.1)';
            setTimeout(() => {
                boostButton.style.transform = 'scale(1)';
            }, 200);

        } catch (error) {
            console.error('Error boosting character:', error);
            alert('An error occurred. Please try again.');
        }
    });
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadCharacter();
    setupSearch();
    setupRandomCharacterButton();
});


