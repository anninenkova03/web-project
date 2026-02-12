import { PRESENTATIONS } from '../data.js';
import { presentationBridge } from '../presentationBridge.js';

let currentPresentation = null;
let currentSlideIndex = 0;
let isFullscreen = false;

let slideContent, presentationTitle, slideCounter, progressBar, prevBtn, nextBtn;
let backBtn, mapBtn, fullscreenBtn, editBtn, shortcutsInfo;

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
    editBtn = document.getElementById('editBtn');
    shortcutsInfo = document.getElementById('shortcutsInfo');

    const urlParams = new URLSearchParams(window.location.search);
    const presentationId = Number(urlParams.get('id'));
    const slideFromMap = Number(urlParams.get('slide'));

    // Load directly from API first
    try {
        const apiService = window.apiService;
        if (apiService) {
            const response = await apiService.getPresentation(presentationId);
            if (response && response.data) {
                currentPresentation = convertApiToViewerFormat(response.data);
            }
        }
    } catch (error) {
        console.error('Failed to load from API:', error);
    }

    // Fallback to localStorage
    if (!currentPresentation) {
        currentPresentation = presentationBridge.getPresentationById(presentationId);
    }
    
    if (!currentPresentation) {
        currentPresentation = PRESENTATIONS.find(p => p.id === presentationId);
    }

    if (!currentPresentation) {
        alert('Презентацията не е намерена');
        window.location.href = '../dashboard/dashboard.html';
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

function convertApiToViewerFormat(apiData) {
    // Convert API presentation format to viewer format
    const slides = (apiData.slides || []).map((slide, index) => {
        // Extract title from data or generate one
        let title = 'Slide ' + (index + 1);
        if (slide.data && slide.data.title) {
            title = slide.data.title;
        } else if (slide.data && slide.data.heading) {
            title = slide.data.heading;
        } else if (slide.data && slide.data.text) {
            title = slide.data.text.substring(0, 50);
        }
        
        return {
            id: slide.id,
            order: slide.order || index + 1,
            type: slide.type || 'content',
            title: title,
            data: slide.data || {},
            previous: index > 0 ? (apiData.slides[index - 1].id) : null,
            next: index < apiData.slides.length - 1 ? (apiData.slides[index + 1].id) : null
        };
    });
    
    return {
        id: apiData.id,
        title: apiData.title || 'Untitled Presentation',
        type: apiData.type || 'lecture',
        author: apiData.username || 'Unknown',
        date: apiData.created_at,
        slides: slides
    };
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
                ${slide.data.author ? `<p class="author">${slide.data.author}</p>` : ''}
            `;
            break;

        case 'content':
        case 'text-only':
            slideContent.classList.add('slide-content');
            slideContent.innerHTML = `
                <h2>${slide.title}</h2>
                <div>${slide.data.content || ''}</div>
            `;
            break;

        case 'code':
            slideContent.classList.add('slide-code');
            slideContent.innerHTML = `
                <h2>${slide.title}</h2>
                <pre><code>${escapeHtml(slide.data.code || '')}</code></pre>
                ${slide.data.language ? `<div class="code-lang">${slide.data.language}</div>` : ''}
            `;
            break;

        case 'image-text':
        case 'image-left':
        case 'image-right':
            slideContent.classList.add('slide-image-text');
            const imageOnLeft = slide.type === 'image-left';
            slideContent.innerHTML = `
                <div class="image-text-container ${imageOnLeft ? 'image-left' : 'image-right'}">
                    <div class="image-part">
                        <img src="${slide.data.image}" alt="${slide.title}">
                    </div>
                    <div class="text-part">
                        <h2>${slide.title}</h2>
                        <p>${slide.data.text || slide.data.content || ''}</p>
                    </div>
                </div>
            `;
            break;

        case 'list':
            slideContent.classList.add('slide-list');
            const items = slide.data.items ? slide.data.items.split(';') : [];
            slideContent.innerHTML = `
                <h2>${slide.title}</h2>
                <ul>
                    ${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}
                </ul>
            `;
            break;

        case 'two-column':
            slideContent.classList.add('slide-two-column');
            slideContent.innerHTML = `
                <h2>${slide.title}</h2>
                <div class="two-columns">
                    <div class="column">
                        ${slide.data.left || ''}
                    </div>
                    <div class="column">
                        ${slide.data.right || ''}
                    </div>
                </div>
            `;
            break;

        default:
            slideContent.innerHTML = `
                <h2>${slide.title}</h2>
                <p>Type: ${slide.type}</p>
                <pre>${JSON.stringify(slide.data, null, 2)}</pre>
            `;
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

function editPresentation() {
    window.location.href = `../editor/editor.html?load=${currentPresentation.id}`;
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

    if (editBtn) {
        editBtn.addEventListener('click', editPresentation);
    }

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
            case 'e':
            case 'E':
                if (e.ctrlKey || e.metaKey) {
                    e.preventDefault();
                    editPresentation();
                }
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