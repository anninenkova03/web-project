let presentations = [];
let currentView = 'grid';
let searchTerm = '';
let isBackendAvailable = false;

let container, loadingState, searchInput, gridViewBtn, listViewBtn, refreshBtn;

async function init() {
    container = document.getElementById('presentationsContainer');
    loadingState = document.getElementById('loadingState');
    searchInput = document.getElementById('searchInput');
    gridViewBtn = document.getElementById('gridViewBtn');
    listViewBtn = document.getElementById('listViewBtn');
    refreshBtn = document.getElementById('refreshBtn');
    
    isBackendAvailable = await apiService.healthCheck();
    
    if (isBackendAvailable) {
        console.log('Backend is available');
    } else {
        console.warn('Backend is not available - using demo data');
        showNotification('Backend не е достъпен. Показват се демо данни.', 'warning');
    }
    
    await loadPresentations();
    setupEventListeners();
}

async function loadPresentations() {
    loadingState.style.display = 'block';
    container.innerHTML = '';

    try {
        if (isBackendAvailable) {
            presentations = await apiService.getPresentations();
            console.log('Loaded from backend:', presentations);
        } else {
            await new Promise(resolve => setTimeout(resolve, 500));
            presentations = getDemoData();
            console.log('Using demo data');
        }
        
        loadingState.style.display = 'none';
        renderPresentations();
        
    } catch (error) {
        console.error('Error loading presentations:', error);
        loadingState.style.display = 'none';
        showError('Грешка при зареждане на презентациите');
        
        presentations = getDemoData();
        renderPresentations();
    }
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
                <p>Опитайте с друго търсене или създайте нова презентация в Editor</p>
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
}

function renderCardView(p) {
    return `
        <div class="presentation-card">
            <div class="card-header">
                <h3 class="card-title">${escapeHtml(p.title)}</h3>
                <span class="card-type">${getTypeLabel(p.type)}</span>
            </div>
            <div class="card-meta">
                <span>${p.slides} слайда</span>
                <span>${formatDate(p.date)}</span>
            </div>
            ${p.author ? `<div class="card-meta"><span>${escapeHtml(p.author)}</span></div>` : ''}
            <div class="card-actions">
                <button class="btn btn-primary btn-small btn-view" data-id="${p.id}">
                    Преглед
                </button>
                <button class="btn btn-secondary btn-small btn-map" data-id="${p.id}">
                    Карта
                </button>
            </div>
        </div>
    `;
}

function renderListView(p) {
    return `
        <div class="presentation-card presentation-list-item">
            <div class="list-item-info">
                <h3 class="card-title">${escapeHtml(p.title)}</h3>
                <div class="card-meta">
                    <span class="card-type">${getTypeLabel(p.type)}</span>
                    <span>${p.slides} слайда</span>
                    <span>${formatDate(p.date)}</span>
                    ${p.author ? `<span>👤 ${escapeHtml(p.author)}</span>` : ''}
                </div>
            </div>
            <div class="list-item-actions">
                <button class="btn btn-primary btn-small btn-view" data-id="${p.id}">
                    Преглед
                </button>
                <button class="btn btn-secondary btn-small btn-map" data-id="${p.id}">
                    Карта
                </button>
            </div>
        </div>
    `;
}

function getTypeLabel(type) {
    const labels = {
        'lecture': 'Лекция',
        'tutorial': 'Урок',
        'workshop': 'Работилница',
        'project': 'Проект',
        'demo': 'Демо',
        'default': 'Презентация'
    };
    return labels[type] || labels['default'];
}

function formatDate(dateStr) {
    if (!dateStr) return 'Н/А';
    const date = new Date(dateStr);
    return date.toLocaleDateString('bg-BG');
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function viewPresentation(id) {
    console.log(`📂 Opening presentation ${id}`);
    window.location.href = `viewer.html?id=${id}`;
}

function viewSlideMap(id) {
    console.log(`🗺️ Opening slide map for presentation ${id}`);
    window.location.href = `map.html?id=${id}`;
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

    refreshBtn.addEventListener('click', async () => {
        apiService.clearCache();
        await loadPresentations();
        showNotification('Презентациите са обновени', 'success');
    });
}

function showError(message) {
    container.innerHTML = `
        <div class="error-state">
            <h3>Грешка</h3>
            <p>${escapeHtml(message)}</p>
            <button class="btn btn-primary" onclick="location.reload()">
                Опитай отново
            </button>
        </div>
    `;
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        background: ${type === 'error' ? '#F56565' : type === 'success' ? '#48BB78' : type === 'warning' ? '#F59E0B' : '#4299E1'};
        color: white;
        font-weight: 500;
        z-index: 9999;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function getDemoData() {
    return [
        {
            id: 1,
            title: "Въведение в Web Technologies",
            type: "lecture",
            slides: 24,
            date: "2026-01-15",
            author: "Team 1"
        },
        {
            id: 2,
            title: "HTML5 Семантични елементи",
            type: "tutorial",
            slides: 18,
            date: "2026-01-16",
            author: "Team 2"
        },
        {
            id: 3,
            title: "CSS Grid Layout",
            type: "workshop",
            slides: 32,
            date: "2026-01-17",
            author: "Team 3"
        }
    ];
}

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    .empty-state, .error-state {
        text-align: center;
        padding: 3rem;
        color: var(--text-secondary);
    }
    .empty-state h3, .error-state h3 {
        margin-bottom: 1rem;
        color: var(--text-primary);
    }
`;
document.head.appendChild(style);

document.addEventListener('DOMContentLoaded', init);