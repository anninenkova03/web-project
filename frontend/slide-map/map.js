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

let currentPresentation = null;
let currentView = 'grid';

let presentationTitle, presentationSubtitle, totalSlides, slideTypes, duration;
let mapContent, gridViewBtn, flowViewBtn, viewBtn, backBtn;

async function init() {
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

    const urlParams = new URLSearchParams(window.location.search);
    const presentationId = urlParams.get('id');

    currentPresentation = DEMO_PRESENTATION;

    updateHeader();
    updateStats();
    renderMap();
    setupEventListeners();
}

function updateHeader() {
    presentationTitle.textContent = `🗺️ ${currentPresentation.title}`;
    presentationSubtitle.textContent = `Визуализация на ${currentPresentation.slides.length} слайда`;
}

function updateStats() {
    const slides = currentPresentation.slides;
    totalSlides.textContent = slides.length;

    const types = new Set(slides.map(s => s.type));
    slideTypes.textContent = types.size;

    const estimatedMinutes = slides.length * 2;
    duration.textContent = `${estimatedMinutes} мин`;
}

function renderMap() {
    if (currentView === 'grid') {
        renderGridView();
    } else {
        renderFlowView();
    }
}

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

    document.querySelectorAll('.slide-node').forEach(node => {
        node.addEventListener('click', () => {
            const slideId = node.dataset.slideId;
            goToSlide(slideId);
        });
    });
}

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

    document.querySelectorAll('.flow-item').forEach(item => {
        item.addEventListener('click', () => {
            const slideId = item.dataset.slideId;
            goToSlide(slideId);
        });
    });
}

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
    alert(`Отваряне на слайд ${slideId} в Viewer`);
}

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
        alert(`Отваряне на презентация ${currentPresentation.id} в Viewer`);
    });

    backBtn.addEventListener('click', () => {
        alert('Връщане към Dashboard');
    });
}

document.addEventListener('DOMContentLoaded', init);