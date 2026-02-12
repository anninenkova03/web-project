// ==================== VIEWER — loads presentation from API by ?id= ====================

let currentPresentation = null;  // { id, title, type, slides: [{id, order, type, data:{}}] }
let currentSlideIndex = 0;
let isFullscreen = false;

let slideContent, presentationTitle, slideCounter, progressBar, prevBtn, nextBtn;
let backBtn, mapBtn, fullscreenBtn, editBtn, shortcutsInfo;

async function init() {
    slideContent      = document.getElementById('slideContent');
    presentationTitle = document.getElementById('presentationTitle');
    slideCounter      = document.getElementById('slideCounter');
    progressBar       = document.getElementById('progressBar');
    prevBtn           = document.getElementById('prevBtn');
    nextBtn           = document.getElementById('nextBtn');
    backBtn           = document.getElementById('backBtn');
    mapBtn            = document.getElementById('mapBtn');
    fullscreenBtn     = document.getElementById('fullscreenBtn');
    editBtn           = document.getElementById('editBtn');
    shortcutsInfo     = document.getElementById('shortcutsInfo');

    const urlParams       = new URLSearchParams(window.location.search);
    const presentationId  = Number(urlParams.get('id'));
    const slideFromMap    = Number(urlParams.get('slide'));

    if (!presentationId) {
        alert('Няма избрана презентация');
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    // ── Load from API ──────────────────────────────────────────────
    try {
        slideContent.innerHTML = '<div style="color:#aaa;text-align:center;padding:60px">Зареждане...</div>';

        const response = await apiService.getPresentation(presentationId);

        // apiService.request returns the full JSON; getPresentation returns it as-is
        // Backend: { success: true, data: { id, title, type, slides: [...] } }
        const data = response.data ?? response;

        if (!data || !data.id) {
            throw new Error('Невалиден отговор от сървъра');
        }

        currentPresentation = data;

    } catch (err) {
        console.error('Viewer load error:', err);
        alert('Презентацията не е намерена');
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    if (!currentPresentation.slides || currentPresentation.slides.length === 0) {
        alert('Презентацията няма слайдове');
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    // ── Jump to slide from map link ───────────────────────────────
    if (slideFromMap) {
        const idx = currentPresentation.slides.findIndex(s => s.id === slideFromMap);
        if (idx !== -1) currentSlideIndex = idx;
    }

    presentationTitle.textContent = currentPresentation.title;

    renderSlide();
    setupEventListeners();

    setTimeout(() => {
        shortcutsInfo.classList.add('show');
        setTimeout(() => shortcutsInfo.classList.remove('show'), 3000);
    }, 1000);
}

// ── Render current slide ──────────────────────────────────────────
function renderSlide() {
    const slide   = currentPresentation.slides[currentSlideIndex];
    const total   = currentPresentation.slides.length;
    const d       = slide.data || {};

    // Slide title is stored inside data.title (set by SlimParser via #title directive)
    const title   = d.title || '';

    slideCounter.textContent  = `${currentSlideIndex + 1} / ${total}`;
    progressBar.style.width   = `${((currentSlideIndex + 1) / total) * 100}%`;
    prevBtn.disabled          = currentSlideIndex === 0;
    nextBtn.disabled          = currentSlideIndex === total - 1;

    slideContent.className = 'slide';

    switch (slide.type) {
        case 'title':
            slideContent.classList.add('slide-title');
            slideContent.innerHTML = `
                <h1>${escapeHtml(title)}</h1>
                ${d.subtitle ? `<p class="subtitle">${escapeHtml(d.subtitle)}</p>` : ''}
                ${d.author   ? `<p class="author">${escapeHtml(d.author)}</p>`   : ''}
            `;
            break;

        case 'text-only':
        case 'content':
            slideContent.classList.add('slide-content');
            slideContent.innerHTML = `
                <h2>${escapeHtml(title)}</h2>
                <div class="slide-text">${escapeHtml(d.content || '')}</div>
            `;
            break;

        case 'list':
            slideContent.classList.add('slide-list');
            const items = d.items ? d.items.split(';') : (d.content ? d.content.split(';') : []);
            slideContent.innerHTML = `
                <h2>${escapeHtml(title)}</h2>
                <ul>
                    ${items.map(item => `<li>${escapeHtml(item.trim())}</li>`).join('')}
                </ul>
            `;
            break;

        case 'code':
            slideContent.classList.add('slide-code');
            slideContent.innerHTML = `
                <h2>${escapeHtml(title)}</h2>
                ${d.language ? `<div class="code-lang">${escapeHtml(d.language)}</div>` : ''}
                <pre><code>${escapeHtml(d.code || d.content || '')}</code></pre>
            `;
            break;

        case 'image-text':
        case 'image-left':
        case 'image-right':
            slideContent.classList.add('slide-image-text');
            slideContent.innerHTML = `
                <div class="image-text-container ${slide.type === 'image-left' ? 'image-left' : 'image-right'}">
                    <div class="image-part">
                        <img src="${escapeHtml(d.image || '')}" alt="${escapeHtml(title)}">
                    </div>
                    <div class="text-part">
                        <h2>${escapeHtml(title)}</h2>
                        <p>${escapeHtml(d.text || d.content || '')}</p>
                    </div>
                </div>
            `;
            break;

        case 'two-column':
            slideContent.classList.add('slide-two-column');
            slideContent.innerHTML = `
                <h2>${escapeHtml(title)}</h2>
                <div class="two-columns">
                    <div class="column">${d.left  || ''}</div>
                    <div class="column">${d.right || ''}</div>
                </div>
            `;
            break;

        case 'quote':
            slideContent.classList.add('slide-quote');
            slideContent.innerHTML = `
                <blockquote>${escapeHtml(d.quote || d.content || '')}</blockquote>
                ${d.author ? `<p class="quote-author">— ${escapeHtml(d.author)}</p>` : ''}
            `;
            break;

        default:
            slideContent.innerHTML = `
                <h2>${escapeHtml(title)}</h2>
                <p style="color:#888">Тип: ${escapeHtml(slide.type)}</p>
                <pre style="font-size:0.8rem">${escapeHtml(JSON.stringify(d, null, 2))}</pre>
            `;
    }
}

// ── Navigation ────────────────────────────────────────────────────
function nextSlide() {
    if (currentSlideIndex < currentPresentation.slides.length - 1) {
        currentSlideIndex++;
        renderSlide();
    }
}

function prevSlide() {
    if (currentSlideIndex > 0) {
        currentSlideIndex--;
        renderSlide();
    }
}

function goToSlide(index) {
    if (index >= 0 && index < currentPresentation.slides.length) {
        currentSlideIndex = index;
        renderSlide();
    }
}
window.goToSlide = goToSlide;

// ── Fullscreen & Edit ─────────────────────────────────────────────
function toggleFullscreen() {
    if (!isFullscreen) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function editPresentation() {
    window.location.href = `../editor/editor.html?load=${currentPresentation.id}`;
}

// ── Event listeners ───────────────────────────────────────────────
function setupEventListeners() {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);

    backBtn.addEventListener('click', () => {
        window.location.href = '../dashboard/dashboard.html';
    });

    if (mapBtn) {
        mapBtn.addEventListener('click', () => {
            window.location.href = `../slide-map/map.html?id=${currentPresentation.id}`;
        });
    }

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    if (editBtn) {
        editBtn.addEventListener('click', editPresentation);
    }

    document.addEventListener('keydown', (e) => {
        switch (e.key) {
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevSlide();
                break;
            case 'f': case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'Escape':
                if (isFullscreen) toggleFullscreen();
                break;
        }
    });

    document.addEventListener('fullscreenchange', () => {
        isFullscreen = !!document.fullscreenElement;
        fullscreenBtn.textContent = isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
    });

    // Touch swipe
    let touchStartX = 0;
    slideContent.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });
    slideContent.addEventListener('touchend', (e) => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            diff > 0 ? nextSlide() : prevSlide();
        }
    });
}

// ── Utility ───────────────────────────────────────────────────────
function escapeHtml(text) {
    if (text == null) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

document.addEventListener('DOMContentLoaded', init);