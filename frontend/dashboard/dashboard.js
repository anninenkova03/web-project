import { PRESENTATIONS } from '../data.js';
import { presentationBridge } from '../presentationBridge.js';

let presentations = [];
let currentView = 'grid';
let searchTerm = '';

let container, loadingState, searchInput, gridViewBtn, listViewBtn, refreshBtn, newPresentationBtn;

async function init() {
    container = document.getElementById('presentationsContainer');
    loadingState = document.getElementById('loadingState');
    searchInput = document.getElementById('searchInput');
    gridViewBtn = document.getElementById('gridViewBtn');
    listViewBtn = document.getElementById('listViewBtn');
    refreshBtn = document.getElementById('refreshBtn');
    newPresentationBtn = document.getElementById('newPresentationBtn');
    
    await loadPresentations();
    setupEventListeners();
}

async function loadPresentations() {
    loadingState.style.display = 'block';
    container.innerHTML = '';

    await new Promise(resolve => setTimeout(resolve, 500));

    presentations = presentationBridge.mergeWithStaticData(PRESENTATIONS);
    
    loadingState.style.display = 'none';
    renderPresentations();
}

function renderPresentations() {
    const filtered = presentations.filter(p => 
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.type.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Няма намерени презентации</h3>
                <p>Опитайте с друго търсене или създайте нова презентация</p>
                <button class="btn btn-primary" onclick="openEditor()">Отвори Editor</button>
            </div>
        `;
        return;
    }

    container.className = currentView === 'grid' ? 'presentations-grid' : 'presentations-list';
    
    container.innerHTML = filtered.map(p => 
        currentView === 'grid' ? renderCardView(p) : renderListView(p)
    ).join('');

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

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            editPresentation(btn.dataset.id);
        });
    });
}

function renderCardView(p) {
    return `
        <div class="presentation-card">
            <div class="card-header">
                <h3 class="card-title">${p.title}</h3>
                <span class="card-type">${getTypeLabel(p.type)}</span>
            </div>
            <div class="card-meta">
                <span>${getSlidesCount(p)} слайда</span>
                <span>${formatDate(p.date)}</span>
            </div>
            <div class="card-meta">
                <span>${p.author}</span>
            </div>
            <div class="card-actions">
                <button class="btn btn-primary btn-small btn-view" data-id="${p.id}">
                    👁 Преглед
                </button>
                <button class="btn btn-secondary btn-small btn-map" data-id="${p.id}">
                    🗺️ Карта
                </button>
                <button class="btn btn-info btn-small btn-edit" data-id="${p.id}">
                    ✏️ Редактирай
                </button>
            </div>
        </div>
    `;
}

function renderListView(p) {
    return `
        <div class="presentation-card presentation-list-item">
            <div class="list-item-info">
                <h3 class="card-title">${p.title}</h3>
                <div class="card-meta">
                    <span class="card-type">${getTypeLabel(p.type)}</span>
                    <span>${getSlidesCount(p)} слайда</span>
                    <span>${formatDate(p.date)}</span>
                    <span>${p.author}</span>
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-primary btn-small btn-view" data-id="${p.id}">
                    👁 Преглед
                </button>
                <button class="btn btn-secondary btn-small btn-map" data-id="${p.id}">
                    🗺️ Карта
                </button>
                <button class="btn btn-info btn-small btn-edit" data-id="${p.id}">
                    ✏️ Редактирай
                </button>
            </div>
        </div>
    `;
}

function getTypeLabel(type) {
    const labels = {
        'lecture': '📚 Лекция',
        'tutorial': '🎓 Урок',
        'workshop': '🛠️ Работилница',
        'project': '💼 Проект',
        'demo': '🎬 Демо'
    };
    return labels[type] || type;
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('bg-BG');
}

function viewPresentation(id) {
    window.location.href = `../viewer/viewer.html?id=${id}`;
}

function viewSlideMap(id) {
    window.location.href = `../slide-map/map.html?id=${id}`;
}

function editPresentation(id) {
    window.location.href = `../editor/editor.html?load=${id}`;
}

function openEditor() {
    window.location.href = `../editor/editor.html`;
}

function getSlidesCount(presentation) {
    if (presentation.slides && Array.isArray(presentation.slides)) {
        return presentation.slides.length;
    }
    if (presentation.slidesData && Array.isArray(presentation.slidesData)) {
        return presentation.slidesData.length;
    }
    return 0;
}

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

    if (newPresentationBtn) {
        newPresentationBtn.addEventListener('click', openEditor);
    }
}

window.openEditor = openEditor;

document.addEventListener('DOMContentLoaded', init);

document.addEventListener('DOMContentLoaded', init);