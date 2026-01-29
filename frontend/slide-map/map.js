import { PRESENTATIONS } from '../data.js';
import { presentationBridge } from '../presentationBridge.js';

let currentPresentation = null;
let currentView = 'grid';

let presentationTitle, presentationSubtitle, totalSlides, slideTypes, duration;
let mapContent, gridViewBtn, flowViewBtn, viewBtn, backBtn, editBtn;

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
    editBtn = document.getElementById('editBtn');

    const urlParams = new URLSearchParams(window.location.search);
    const presentationId = Number(urlParams.get('id'));

    currentPresentation = presentationBridge.getPresentationById(presentationId);
    
    if (!currentPresentation) {
        currentPresentation = PRESENTATIONS.find(p => p.id === presentationId);
    }

    if (!currentPresentation) {
        alert('Презентацията не е намерена');
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    updateHeader();
    updateStats();
    renderMap();
    setupEventListeners();
}

function updateHeader() {
    presentationTitle.textContent = `${currentPresentation.title}`;
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
        'text-only': '📝 Text',
        'code': '💻 Code',
        'image-text': '🖼️ Image',
        'image-left': '🖼️ Image Left',
        'image-right': '🖼️ Image Right',
        'list': '📋 List',
        'two-column': '📊 Two Column'
    };
    return labels[type] || type;
}

function goToSlide(slideId) {
    window.location.href = `../viewer/viewer.html?id=${currentPresentation.id}&slide=${slideId}`;
}

function editPresentation() {
    window.location.href = `../editor/editor.html?load=${currentPresentation.id}`;
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
        window.location.href = `../viewer/viewer.html?id=${currentPresentation.id}`;
    });

    backBtn.addEventListener('click', () => {
        window.location.href = `../dashboard/dashboard.html`;
    });

    if (editBtn) {
        editBtn.addEventListener('click', editPresentation);
    }
}

document.addEventListener('DOMContentLoaded', init);