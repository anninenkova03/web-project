let currentPresentation = null;
let currentSlideIndex = 0;
let isFullscreen = false;
let isBackendAvailable = false;

let slideContent, presentationTitle, slideCounter, progressBar, prevBtn, nextBtn;
let backBtn, mapBtn, fullscreenBtn, shortcutsInfo;

async function init() {
    slideContent = document.getElementById('slideContent');
    presentationTitle = document.getElementById('presentationTitle');
    slideCounter = document.getElementById('slideCounter');
    progressBar = document.getElementById('progressBar');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    backBtn = document.getElementById('backBtn');
    mapBtn = document.getElementById('mapBtn');
    fullscreenBtn = document.getElementById('fullscreenBtn');
    shortcutsInfo = document.getElementById('shortcutsInfo');

    const urlParams = new URLSearchParams(window.location.search);
    const presentationId = urlParams.get('id');
    const startSlide = parseInt(urlParams.get('slide')) || 0;

    if (!presentationId) {
        showError('Няма избрана презентация');
        return;
    }

    isBackendAvailable = await apiService.healthCheck();

    await loadPresentation(presentationId, startSlide);
}

async function loadPresentation(id, startSlide = 0) {
    try {
        presentationTitle.textContent = 'Зареждане...';
        
        if (isBackendAvailable) {
            console.log(`Loading presentation ${id} from backend...`);
            
            currentPresentation = await apiService.getFullPresentation(id);
            
        } else {
            console.warn('Backend not available, using demo data');
            currentPresentation = getDemoPresentation();
        }
        
        presentationTitle.textContent = currentPresentation.title;
        currentSlideIndex = startSlide;
        
        renderSlide();
        setupEventListeners();
        
        setTimeout(() => {
            shortcutsInfo.classList.add('show');
            setTimeout(() => shortcutsInfo.classList.remove('show'), 3000);
        }, 1000);
        
        console.log(`Presentation loaded: ${currentPresentation.title} (${currentPresentation.slides.length} slides)`);
        
    } catch (error) {
        console.error('Error loading presentation:', error);
        showError(`Грешка при зареждане: ${error.message}`);
    }
}

function renderSlide() {
    if (!currentPresentation || !currentPresentation.slides) {
        showError('Няма заредена презентация');
        return;
    }
    
    const slide = currentPresentation.slides[currentSlideIndex];
    
    if (!slide) {
        showError('Слайдът не може да бъде намерен');
        return;
    }
    
    slideCounter.textContent = `${currentSlideIndex + 1} / ${currentPresentation.slides.length}`;
    const progress = ((currentSlideIndex + 1) / currentPresentation.slides.length) * 100;
    progressBar.style.width = `${progress}%`;

    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === currentPresentation.slides.length - 1;

    slideContent.className = 'slide';
    
    switch(slide.type) {
        case 'title':
            slideContent.classList.add('slide-title');
            slideContent.innerHTML = `
                <h1>${escapeHtml(slide.data.title || slide.title)}</h1>
                <p class="subtitle">${escapeHtml(slide.data.subtitle || '')}</p>
                ${slide.data.author ? `<p class="author">${escapeHtml(slide.data.author)}</p>` : ''}
            `;
            break;

        case 'text-only':
        case 'content':
            slideContent.classList.add('slide-content');
            slideContent.innerHTML = `
                <h2>${escapeHtml(slide.title)}</h2>
                <div class="content">${slide.data.content || ''}</div>
            `;
            break;

        case 'code':
            slideContent.classList.add('slide-code');
            slideContent.innerHTML = `
                <h2>${escapeHtml(slide.title)}</h2>
                <pre><code>${escapeHtml(slide.data.code || slide.data.content || '')}</code></pre>
                ${slide.data.language ? `<p class="language-tag">${escapeHtml(slide.data.language)}</p>` : ''}
            `;
            break;

        case 'list':
            slideContent.classList.add('slide-content');
            const items = slide.data.items ? slide.data.items.split(';') : [];
            slideContent.innerHTML = `
                <h2>${escapeHtml(slide.title)}</h2>
                <ul>
                    ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
            `;
            break;

        case 'image-text':
            slideContent.classList.add('slide-image-text');
            slideContent.innerHTML = `
                <div class="image-container">
                    <img src="${escapeHtml(slide.data.image)}" alt="${escapeHtml(slide.title)}">
                </div>
                <div class="text-content">
                    <h2>${escapeHtml(slide.title)}</h2>
                    <p>${escapeHtml(slide.data.text || slide.data.content || '')}</p>
                </div>
            `;
            break;

        case 'image-left':
            slideContent.classList.add('slide-two-column');
            slideContent.innerHTML = `
                <div class="column">
                    <img src="${escapeHtml(slide.data.image)}" alt="${escapeHtml(slide.title)}">
                </div>
                <div class="column">
                    <h2>${escapeHtml(slide.title)}</h2>
                    <p>${escapeHtml(slide.data.text || slide.data.content || '')}</p>
                </div>
            `;
            break;

        case 'image-right':
            slideContent.classList.add('slide-two-column');
            slideContent.innerHTML = `
                <div class="column">
                    <h2>${escapeHtml(slide.title)}</h2>
                    <p>${escapeHtml(slide.data.text || slide.data.content || '')}</p>
                </div>
                <div class="column">
                    <img src="${escapeHtml(slide.data.image)}" alt="${escapeHtml(slide.title)}">
                </div>
            `;
            break;

        case 'two-column':
            slideContent.classList.add('slide-two-column');
            slideContent.innerHTML = `
                <h2 style="grid-column: 1 / -1;">${escapeHtml(slide.title)}</h2>
                <div class="column">${slide.data.left || ''}</div>
                <div class="column">${slide.data.right || ''}</div>
            `;
            break;

        default:
            slideContent.innerHTML = `
                <h2>${escapeHtml(slide.title)}</h2>
                <p>Непознат тип слайд: ${escapeHtml(slide.type)}</p>
            `;
    }
    
    updateURL();
}

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

function toggleFullscreen() {
    if (!isFullscreen) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

function updateURL() {
    const urlParams = new URLSearchParams(window.location.search);
    urlParams.set('slide', currentSlideIndex);
    const newURL = `${window.location.pathname}?${urlParams.toString()}`;
    window.history.replaceState({}, '', newURL);
}

function setupEventListeners() {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    backBtn.addEventListener('click', () => {
        window.location.href = 'dashboard.html';
    });

    mapBtn.addEventListener('click', () => {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        window.location.href = `map.html?id=${id}`;
    });

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    document.addEventListener('keydown', (e) => {
        switch(e.key) {
            case 'ArrowRight':
            case ' ':
                e.preventDefault();
                nextSlide();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                prevSlide();
                break;
            case 'Home':
                e.preventDefault();
                goToSlide(0);
                break;
            case 'End':
                e.preventDefault();
                goToSlide(currentPresentation.slides.length - 1);
                break;
            case 'f':
            case 'F':
                e.preventDefault();
                toggleFullscreen();
                break;
            case 'Escape':
                if (isFullscreen) {
                    toggleFullscreen();
                }
                break;
        }
    });

    document.addEventListener('fullscreenchange', () => {
        isFullscreen = !!document.fullscreenElement;
        fullscreenBtn.textContent = isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
    });

    let touchStartX = 0;
    slideContent.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
    });

    slideContent.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const diff = touchStartX - touchEndX;

        if (Math.abs(diff) > 50) {
            if (diff > 0) {
                nextSlide();
            } else {
                prevSlide();
            }
        }
    });
}

function showError(message) {
    slideContent.innerHTML = `
        <div style="text-align: center; padding: 3rem;">
            <h2 style="color: var(--danger);">⚠️ Грешка</h2>
            <p style="color: var(--text-secondary); margin: 1rem 0;">${escapeHtml(message)}</p>
            <button onclick="location.href='dashboard.html'" class="btn btn-primary">
                ← Назад към Dashboard
            </button>
        </div>
    `;
}

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getDemoPresentation() {
    return {
        id: 1,
        title: "Demo Презентация (Offline)",
        slides: [
            {
                id: 1,
                order: 1,
                type: "title",
                title: "Въведение в Web Technologies",
                data: {
                    title: "Въведение в Web Technologies",
                    subtitle: "HTML, CSS, JavaScript & PHP"
                }
            },
            {
                id: 2,
                order: 2,
                type: "content",
                title: "Какво ще научим?",
                data: {
                    content: `
                        <ul>
                            <li>Основи на HTML5 и семантични тагове</li>
                            <li>CSS3 - стилизация и layout</li>
                            <li>JavaScript - интерактивност</li>
                            <li>PHP - сървърна логика</li>
                            <li>MySQL - бази данни</li>
                        </ul>
                    `
                }
            },
            {
                id: 3,
                order: 3,
                type: "code",
                title: "HTML Пример",
                data: {
                    code: `<!DOCTYPE html>
<html>
<head>
    <title>Hello World</title>
</head>
<body>
    <h1>Здравей, свят!</h1>
</body>
</html>`,
                    language: 'html'
                }
            }
        ]
    };
}

document.addEventListener('DOMContentLoaded', init);