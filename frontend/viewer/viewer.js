import { PRESENTATIONS } from '../data.js';

let currentPresentation = null;
let currentSlideIndex = 0;
let isFullscreen = false;

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
    const presentationId = Number(urlParams.get('id'));
    const slideFromMap = Number(urlParams.get('slide'));

    currentPresentation = PRESENTATIONS.find(p => p.id === presentationId);

    if (!currentPresentation) {
        alert('Презентацията не е намерена');
        window.location.href = 'dashboard.html';
        return;
    }

    if (slideFromMap) {
        const index = currentPresentation.slides.findIndex(
            s => s.id === slideFromMap
        );
        if (index !== -1) {
            currentSlideIndex = index;
        }
    }    

    presentationTitle.textContent = currentPresentation.title;
    
    renderSlide();
    setupEventListeners();
    
    setTimeout(() => {
        shortcutsInfo.classList.add('show');
        setTimeout(() => shortcutsInfo.classList.remove('show'), 3000);
    }, 1000);
}

function renderSlide() {
    const slide = currentPresentation.slides[currentSlideIndex];
    
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
                <h1>${slide.title}</h1>
                <p class="subtitle">${slide.data.subtitle || ''}</p>
            `;
            break;

        case 'content':
            slideContent.classList.add('slide-content');
            slideContent.innerHTML = `
                <h2>${slide.title}</h2>
                <div>${slide.data.content}</div>
            `;
            break;

        case 'code':
            slideContent.classList.add('slide-code');
            slideContent.innerHTML = `
                <h2>${slide.title}</h2>
                <pre><code>${escapeHtml(slide.data.code)}</code></pre>
            `;
            break;

        case 'image-text':
            slideContent.classList.add('slide-image-text');
            slideContent.innerHTML = `
                <div>
                    <img src="${slide.data.image}" alt="${slide.title}">
                </div>
                <div class="text-content">
                    <h2>${slide.title}</h2>
                    <p>${slide.data.text}</p>
                </div>
            `;
            break;

        default:
            slideContent.innerHTML = `<p>Unknown slide type: ${slide.type}</p>`;
    }
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

function setupEventListeners() {
    prevBtn.addEventListener('click', prevSlide);
    nextBtn.addEventListener('click', nextSlide);
    
    backBtn.addEventListener('click', () => {
        window.location.href = `../dashboard/dashboard.html`;
    });

    mapBtn.addEventListener('click', () => {
        window.location.href = `../slide-map/map.html?id=${currentPresentation.id}`;
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

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', init);