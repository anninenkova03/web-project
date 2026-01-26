// === DEMO DATA ===
const DEMO_PRESENTATION = {
    id: 1,
    title: "Въведение в Web Technologies",
    slides: [
        {
            id: 1,
            order: 1,
            type: "title",
            title: "Въведение в Web Technologies",
            next: 2,
            previous: null
        },
        {
            id: 2,
            order: 2,
            type: "content",
            title: "Какво ще научим?",
            next: 3,
            previous: 1
        },
        {
            id: 3,
            order: 3,
            type: "content",
            title: "Трислойна архитектура",
            next: 4,
            previous: 2
        },
        {
            id: 4,
            order: 4,
            type: "code",
            title: "Пример: HTML структура",
            next: 5,
            previous: 3
        },
        {
            id: 5,
            order: 5,
            type: "content",
            title: "Заключение",
            next: null,
            previous: 4
        }
    ]
};

// === STATE ===
let currentPresentation = null;
let currentView = 'grid';

// === DOM ELEMENTS ===
let presentationTitle, presentationSubtitle, totalSlides, slideTypes, duration;
let mapContent, gridViewBtn, flowViewBtn, viewBtn, backBtn;

// === INITIALIZATION ===
async function init() {
    // Initialize DOM elements
    presentationTitle = document.getElementById('presentationTitle');
    presentationSubtitle = document.getElementById('presentationSubtitle');
    totalSlides = document.getElementById('totalSlides');
    slideTypes = document.getElementById('slideTypes');
    duration = document.getElementById('duration');
    mapContent = document.getElementById('mapContent');
    gridViewBtn = document.getElementById('gridViewBtn');
    flowViewBtn = document.getElementById('flowViewBtn');
    viewBtn = document.getElementById('viewBtn');
    backBtn = document.getElementById('backBtn');

    // Get presentation ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const presentationId = urlParams.get('id');

    // TODO: Load from API
    // const response = await fetch(`../backend/public/index.php?action=getPresentation&id=${presentationId}`);
    // currentPresentation = await response.json();

    currentPresentation = DEMO_PRESENTATION;

    updateHeader();
    updateStats();
    renderMap();
    setupEventListeners();
}

// === UPDATE HEADER ===
function updateHeader() {
    presentationTitle.textContent = `🗺️ ${currentPresentation.title}`;
    presentationSubtitle.textContent = `Визуализация на ${currentPresentation.slides.length} слайда`;
}

// === UPDATE STATISTICS ===
function updateStats() {
    const slides = currentPresentation.slides;
    totalSlides.textContent = slides.length;

    // Count unique slide types
    const types = new Set(slides.map(s => s.type));
    slideTypes.textContent = types.size;

    // Estimate duration (2 minutes per slide)
    const estimatedMinutes = slides.length * 2;
    duration.textContent = `${estimatedMinutes} мин`;
}

// === RENDER MAP ===
function renderMap() {
    if (currentView === 'grid') {
        renderGridView();
    } else {
        renderFlowView();
    }
}

// === RENDER GRID VIEW ===
function renderGridView() {
    const slides = currentPresentation.slides;
    
    mapContent.innerHTML = `
        <div class="slide-map">
            ${slides.map(slide => `
                <div class="slide-node" data-slide-id="${slide.id}">
                    <div class="slide-number">${slide.order}</div>
                    <div class="slide-type type-${slide.type}">${getTypeLabel(slide.type)}</div>
                    <div class="slide-title">${slide.title}</div>
                    <div class="slide-meta">
                        <span class="slide-connections">
                            ${slide.previous ? '← ' + slide.previous : ''}
                            ${slide.next ? ' → ' + slide.next : ''}
                        </span>
                    </div>
                </div>
            `).join('')}
        </div>
    `;

    // Add click listeners
    document.querySelectorAll('.slide-node').forEach(node => {
        node.addEventListener('click', () => {
            const slideId = node.dataset.slideId;
            goToSlide(slideId);
        });
    });
}

// === RENDER FLOW VIEW ===
function renderFlowView() {
    const slides = currentPresentation.slides;
    
    mapContent.innerHTML = `
        <div class="flow-view">
            ${slides.map((slide, index) => `
                <div class="flow-item" data-slide-id="${slide.id}">
                    <div class="flow-number">${slide.order}</div>
                    <div class="flow-content">
                        <div class="slide-type type-${slide.type}">${getTypeLabel(slide.type)}</div>
                        <div class="flow-title">${slide.title}</div>
                    </div>
                </div>
                ${index < slides.length - 1 ? '<div class="flow-arrow">↓</div>' : ''}
            `).join('')}
        </div>
    `;

    // Add click listeners
    document.querySelectorAll('.flow-item').forEach(item => {
        item.addEventListener('click', () => {
            const slideId = item.dataset.slideId;
            goToSlide(slideId);
        });
    });
}

// === HELPER FUNCTIONS ===
function getTypeLabel(type) {
    const labels = {
        'title': '📌 Title',
        'content': '📝 Content',
        'code': '💻 Code',
        'image-text': '🖼️ Image'
    };
    return labels[type] || type;
}

function goToSlide(slideId) {
    // TODO: Navigate to viewer at specific slide
    alert(`Отваряне на слайд ${slideId} в Viewer`);
    // const slideIndex = currentPresentation.slides.findIndex(s => s.id == slideId);
    // window.location.href = `viewer.html?id=${currentPresentation.id}&slide=${slideIndex}`;
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    gridViewBtn.addEventListener('click', () => {
        currentView = 'grid';
        gridViewBtn.classList.add('active');
        flowViewBtn.classList.remove('active');
        renderMap();
    });

    flowViewBtn.addEventListener('click', () => {
        currentView = 'flow';
        flowViewBtn.classList.add('active');
        gridViewBtn.classList.remove('active');
        renderMap();
    });

    viewBtn.addEventListener('click', () => {
        // TODO: Navigate to viewer
        alert(`Отваряне на презентация ${currentPresentation.id} в Viewer`);
        // window.location.href = `viewer.html?id=${currentPresentation.id}`;
    });

    backBtn.addEventListener('click', () => {
        // TODO: Navigate back to dashboard
        alert('Връщане към Dashboard');
        // window.location.href = 'dashboard.html';
    });
}

// === START ===
document.addEventListener('DOMContentLoaded', init);