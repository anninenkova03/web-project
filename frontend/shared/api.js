// === API CONFIGURATION ===
const API_BASE_URL = '../backend/public/index.php';

// === API FUNCTIONS ===
async function fetchPresentations() {
    try {
        const response = await fetch(`${API_BASE_URL}?action=getPresentations`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching presentations:', error);
        return null;
    }
}

async function fetchPresentation(id) {
    try {
        const response = await fetch(`${API_BASE_URL}?action=getPresentation&id=${id}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching presentation:', error);
        return null;
    }
}

async function fetchSlideMap(id) {
    try {
        const response = await fetch(`${API_BASE_URL}?action=getSlideMap&id=${id}`);
        if (!response.ok) throw new Error('Network response was not ok');
        return await response.json();
    } catch (error) {
        console.error('Error fetching slide map:', error);
        return null;
    }
}

// === ERROR HANDLING ===
function showError(message) {
    console.error('API Error:', message);
    // Може да добавиш UI за грешки тук
    return {
        error: true,
        message: message
    };
}

// === CACHE MANAGEMENT ===
const cache = new Map();

function getFromCache(key) {
    return cache.get(key);
}

function setToCache(key, data) {
    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

function clearCache() {
    cache.clear();
}

// === EXPORTS ===
export {
    API_BASE_URL,
    fetchPresentations,
    fetchPresentation,
    fetchSlideMap,
    showError,
    getFromCache,
    setToCache,
    clearCache
};