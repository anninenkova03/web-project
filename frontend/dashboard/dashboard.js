let presentations = [];
let currentUser = null;

let container;
let searchInput;

document.addEventListener('DOMContentLoaded', init);

function init() {
    container = document.getElementById('presentationsContainer');
    searchInput = document.getElementById('searchInput');

    currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (!currentUser) {
        alert('Няма логнат потребител');
        return;
    }

    loadPresentations();
    setupEventListeners();
}

function loadPresentations() {
    const all = JSON.parse(localStorage.getItem('presentations')) || [];
    const user = JSON.parse(localStorage.getItem('currentUser'));

    if (!user) {
        container.innerHTML = '<p>Няма логнат потребител</p>';
        return;
    }

    presentations = all.filter(p => p.user_id === user.id);
    renderPresentations();
}


function renderPresentations() {
    if (!presentations.length) {
        container.innerHTML = `
            <div class="empty-state">
                <h3>Нямаш презентации</h3>
                <p>Създай първата си презентация</p>
                <a href="../editor/editor.html" class="btn btn-primary">
                    ➕ Create Presentation
                </a>
            </div>
        `;
        return;
    }

    container.innerHTML = presentations.map(p => `
        <div class="presentation-card">
            <h3>${p.title}</h3>
            <p>Тип: ${p.type}</p>
            <p>Слайдове: ${p.slideCount}</p>

            <button class="btn btn-info"
                onclick="editPresentation(${p.id})">
                ✏️ Редактирай
            </button>
        </div>
    `).join('');
}

function setupEventListeners() {
    searchInput.addEventListener('input', renderPresentations);
}

function editPresentation(id) {
    window.location.href = `../editor/editor.html?load=${id}`;
}

window.editPresentation = editPresentation;
