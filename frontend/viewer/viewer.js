// === DEMO PRESENTATION DATA ===
const DEMO_PRESENTATION = {
    id: 1,
    title: "Въведение в Web Technologies",
    slides: [
        {
            id: 1,
            type: "title",
            data: {
                title: "Въведение в Web Technologies",
                subtitle: "HTML, CSS, JavaScript & PHP"
            }
        },
        {
            id: 2,
            type: "content",
            data: {
                title: "Какво ще научим?",
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
            type: "content",
            data: {
                title: "Трислойна архитектура",
                content: `
                    <p><strong>Presentation Layer:</strong> HTML, CSS, JavaScript</p>
                    <p><strong>Business Logic:</strong> PHP, обработка на данни</p>
                    <p><strong>Data Layer:</strong> MySQL база данни</p>
                    <p>Тази архитектура осигурява разделение на отговорностите и улеснява поддръжката.</p>
                `
            }
        },
        {
            id: 4,
            type: "code",
            data: {
                title: "Пример: HTML структура",
                code: `<!DOCTYPE html>
<html lang="bg">
<head>
    <meta charset="UTF-8">
    <title>Моята страница</title>
</head>
<body>
    <h1>Здравей, свят!</h1>
    <p>Това е моята първа уеб страница.</p>
</body>
</html>`
            }
        },
        {
            id: 5,
            type: "content",
            data: {
                title: "Заключение",
                content: `
                    <p>Web Technologies е основата на модерния интернет.</p>
                    <p>Комбинацията от frontend и backend технологии позволява създаването на мощни уеб приложения.</p>
                    <ul>
                        <li>Практикувайте редовно</li>
                        <li>Изучавайте документация</li>
                        <li>Участвайте в проекти</li>
                    </ul>
                `
            }
        }
    ]
};

// === STATE ===
let currentPresentation = null;
let currentSlideIndex = 0;
let isFullscreen = false;

// === DOM ELEMENTS ===
let slideContent, presentationTitle, slideCounter, progressBar, prevBtn, nextBtn;
let backBtn, mapBtn, fullscreenBtn, shortcutsInfo;

// === INITIALIZATION ===
async function init() {
    // Initialize DOM elements
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

    // Get presentation ID from URL (or use demo)
    const urlParams = new URLSearchParams(window.location.search);
    const presentationId = urlParams.get('id');

    // TODO: Load from API
    // const response = await fetch(`../backend/public/index.php?action=getPresentation&id=${presentationId}`);
    // currentPresentation = await response.json();

    currentPresentation = DEMO_PRESENTATION;

    presentationTitle.textContent = currentPresentation.title;
    
    renderSlide();
    setupEventListeners();
    
    // Show shortcuts briefly
    setTimeout(() => {
        shortcutsInfo.classList.add('show');
        setTimeout(() => shortcutsInfo.classList.remove('show'), 3000);
    }, 1000);
}

// === RENDER SLIDE ===
function renderSlide() {
    const slide = currentPresentation.slides[currentSlideIndex];
    
    // Update counter and progress
    slideCounter.textContent = `${currentSlideIndex + 1} / ${currentPresentation.slides.length}`;
    const progress = ((currentSlideIndex + 1) / currentPresentation.slides.length) * 100;
    progressBar.style.width = `${progress}%`;

    // Update navigation buttons
    prevBtn.disabled = currentSlideIndex === 0;
    nextBtn.disabled = currentSlideIndex === currentPresentation.slides.length - 1;

    // Render slide based on type
    slideContent.className = 'slide';
    
    switch(slide.type) {
        case 'title':
            slideContent.classList.add('slide-title');
            slideContent.innerHTML = `
                <h1>${slide.data.title}</h1>
                <p class="subtitle">${slide.data.subtitle || ''}</p>
            `;
            break;

        case 'content':
            slideContent.classList.add('slide-content');
            slideContent.innerHTML = `
                <h2>${slide.data.title}</h2>
                <div>${slide.data.content}</div>
            `;
            break;

        case 'code':
            slideContent.classList.add('slide-code');
            slideContent.innerHTML = `
                <h2>${slide.data.title}</h2>
                <pre><code>${escapeHtml(slide.data.code)}</code></pre>
            `;
            break;

        case 'image-text':
            slideContent.classList.add('slide-image-text');
            slideContent.innerHTML = `
                <div>
                    <img src="${slide.data.image}" alt="${slide.data.title}">
                </div>
                <div class="text-content">
                    <h2>${slide.data.title}</h2>
                    <p>${slide.data.text}</p>
                </div>
            `;
            break;

        default:
            slideContent.innerHTML = `<p>Unknown slide type: ${slide.type}</p>`;
    }
}

// === NAVIGATION ===
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

// === FULLSCREEN ===
function toggleFullscreen() {
    if (!isFullscreen) {
        document.documentElement.requestFullscreen();
    } else {
        document.exitFullscreen();
    }
}

// === EVENT LISTENERS ===
function setupEventListeners() {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    backBtn.addEventListener('click', () => {
        // TODO: Navigate back to dashboard
        alert('Връщане към Dashboard\n(интеграция с dashboard.html)');
        // window.location.href = 'dashboard.html';
    });

    mapBtn.addEventListener('click', () => {
        // TODO: Navigate to slide map
        alert(`Отваряне на карта за презентация ${currentPresentation.id}`);
        // window.location.href = `map.html?id=${currentPresentation.id}`;
    });

    fullscreenBtn.addEventListener('click', toggleFullscreen);

    // Keyboard navigation
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

    // Fullscreen change detection
    document.addEventListener('fullscreenchange', () => {
        isFullscreen = !!document.fullscreenElement;
        fullscreenBtn.textContent = isFullscreen ? '⛶ Exit Fullscreen' : '⛶ Fullscreen';
    });

    // Touch/swipe support for mobile
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

// === HELPER FUNCTIONS ===
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// === START ===
// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', init);