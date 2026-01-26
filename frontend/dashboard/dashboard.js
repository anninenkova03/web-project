// === DEMO DATA (когато backend-a е готов, това ще идва от API) ===
const DEMO_PRESENTATIONS = [
    {
        id: 1,
        title: "Въведение в Web Technologies",
        type: "lecture",
        slides: 24,
        date: "2026-01-15",
        author: "Team 1"
    },
    // ... rest of demo data
];

// === STATE ===
let presentations = [];
let currentView = 'grid';
let searchTerm = '';

// === DOM ELEMENTS ===
let container, loadingState, searchInput, gridViewBtn, listViewBtn, refreshBtn;

// === INITIALIZATION ===
async function init() {
    // Initialize DOM elements
    container = document.getElementById('presentationsContainer');
    loadingState = document.getElementById('loadingState');
    searchInput = document.getElementById('searchInput');
    gridViewBtn = document.getElementById('gridViewBtn');
    listViewBtn = document.getElementById('listViewBtn');
    refreshBtn = document.getElementById('refreshBtn');
    
    await loadPresentations();
    setupEventListeners();
}

// === LOAD PRESENTATIONS ===
async function loadPresentations() {
    loadingState.style.display = 'block';
    container.innerHTML = '';

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));

    // TODO: Replace with real API call
    // const response = await fetch('../backend/public/index.php?action=getPresentations');
    // presentations = await response.json();

    presentations = DEMO_PRESENTATIONS;
    
    loadingState.style.display = 'none';
    renderPresentations();
}

// === RENDER PRESENTATIONS ===
function renderPresentations() {
    const filtered = presentations.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Няма намерени презентации</h3>
                <p>Опитайте с друго търсене</p>
            </div>
        `;
        return;
    }

    container.className = currentView === 'grid' ? 'presentations-grid' : 'presentations-list';
    
    container.innerHTML = filtered.map(p => 
        currentView === 'grid' ? renderCardView(p) : renderListView(p)
    ).join('');

    // Add event listeners to buttons
    document.querySelectorAll('.btn-view').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewPresentation(btn.dataset.id);
        });
    });

    document.querySelectorAll('.btn-map').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            viewSlideMap(btn.dataset.id);
        });
    });
}

// === RENDER CARD VIEW ===
function renderCardView(p) {
    return `
        <div class="presentation-card">
            <div class="card-header">
                <h3 class="card-title">${p.title}</h3>
                <span class="card-type">${getTypeLabel(p.type)}</span>
            </div>
            <div class="card-meta">
                <span>📄 ${p.slides} слайда</span>
                <span>📅 ${formatDate(p.date)}</span>
            </div>
            <div class="card-meta">
                <span>👤 ${p.author}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-small btn-view" data-id="${p.id}">
                    👁️ Преглед
                </button>
                <button class="btn btn-secondary btn-small btn-map" data-id="${p.id}">
                    🗺️ Карта
                </button>
            </div>
        </div>
    `;
}

// === RENDER LIST VIEW ===
function renderListView(p) {
    return `
        <div class="presentation-card presentation-list-item">
            <div class="list-item-info">
                <h3 class="card-title">${p.title}</h3>
                <div class="card-meta">
                    <span class="card-type">${getTypeLabel(p.type)}</span>
                    <span>📄 ${p.slides} слайда</span>
                    <span>📅 ${formatDate(p.date)}</span>
                    <span>👤 ${p.author}</span>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-primary btn-small btn-view" data-id="${p.id}">
                    👁️ Преглед
                </button>
                <button class="btn btn-secondary btn-small btn-map" data-id="${p.id}">
                    🗺️ Карта
                </button>
            </div>
        </div>
    `;
}

// === HELPER FUNCTIONS ===
function getTypeLabel(type) {
    const labels = {
        'lecture': '📚 Лекция',
        'tutorial': '🎓 Урок',
        'workshop': '🛠️ Работилница'
    };
    return labels[type] || type;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bg-BG');
}

// === ACTIONS ===
function viewPresentation(id) {
    // TODO: Navigate to viewer
    alert(`Отваряне на презентация ${id} в Viewer\n(Следваща стъпка)`);
    // window.location.href = `viewer.html?id=${id}`;
}

function viewSlideMap(id) {
    // TODO: Navigate to slide map
    alert(`Отваряне на карта на слайдовете за презентация ${id}\n(Следваща стъпка)`);
    // window.location.href = `map.html?id=${id}`;
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value;
        renderPresentations();
    });

    gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        gridViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        renderPresentations();
    });

    listViewBtn.addEventListener('click', () => {
        currentView = 'list';
        listViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        renderPresentations();
    });

    refreshBtn.addEventListener('click', () => {
        loadPresentations();
    });
}

// === START ===
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);