class PresentationBridge {
    constructor() {
        this.STORAGE_KEY = 'slim_presentations';
    }

    getAllFromStorage() {
        try {
            const data = localStorage.getItem(this.STORAGE_KEY);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('Error reading from storage:', error);
            return [];
        }
    }

    convertToDashboardFormat(editorPresentation) {
        const slides = this.parseSlimContent(editorPresentation.content);
        
        return {
            id: editorPresentation.id,
            title: editorPresentation.title,
            type: editorPresentation.type || 'lecture',
            author: 'Slim Editor',
            date: editorPresentation.lastModified,
            slides: slides.length,
            slidesData: slides
        };
    }

    parseSlimContent(content) {
        const lines = content.split('\n');
        const slides = [];
        let currentSlide = null;
        let slideOrder = 0;

        for (let line of lines) {
            line = line.trim();

            if (line.startsWith('#slide') || (line.startsWith('#title') && !currentSlide)) {
                if (currentSlide) {
                    currentSlide.id = slideOrder;
                    currentSlide.order = slideOrder;
                    currentSlide.previous = slideOrder > 1 ? slideOrder - 1 : null;
                    slides.push(currentSlide);
                }
                slideOrder++;
                currentSlide = {
                    id: slideOrder,
                    order: slideOrder,
                    type: 'text-only',
                    title: 'Untitled Slide',
                    data: {}
                };
            }

            if (currentSlide) {
                if (line.startsWith('#title ')) {
                    currentSlide.title = line.substring(7);
                }
                else if (line.startsWith('#type ')) {
                    currentSlide.type = line.substring(6);
                }
                else if (line.startsWith('#data ')) {
                    const dataStr = line.substring(6);
                    const pairs = dataStr.split(';');
                    pairs.forEach(pair => {
                        const [key, value] = pair.split('=');
                        if (key && value) {
                            currentSlide.data[key.trim()] = value.trim();
                        }
                    });
                }
            }
        }

        if (currentSlide) {
            currentSlide.id = slideOrder;
            currentSlide.order = slideOrder;
            currentSlide.previous = slideOrder > 1 ? slideOrder - 1 : null;
            slides.push(currentSlide);
        }

        slides.forEach((slide, index) => {
            slide.next = index < slides.length - 1 ? slides[index + 1].id : null;
        });

        return slides;
    }

    getDashboardPresentations() {
        const editorPresentations = this.getAllFromStorage();
        return editorPresentations.map(p => this.convertToDashboardFormat(p));
    }

    getPresentationById(id) {
        const editorPresentations = this.getAllFromStorage();
        const presentation = editorPresentations.find(p => p.id === id);
        
        if (!presentation) {
            return null;
        }

        const dashboardFormat = this.convertToDashboardFormat(presentation);
        
        return {
            id: dashboardFormat.id,
            title: dashboardFormat.title,
            type: dashboardFormat.type,
            author: dashboardFormat.author,
            date: dashboardFormat.date,
            slides: dashboardFormat.slidesData
        };
    }

    exportForViewer(id) {
        return this.getPresentationById(id);
    }

    mergeWithStaticData(staticPresentations) {
        const editorPresentations = this.getDashboardPresentations();
        
        const combined = [...editorPresentations];
        
        staticPresentations.forEach(staticPres => {
            if (!combined.find(p => p.id === staticPres.id)) {
                combined.push(staticPres);
            }
        });

        return combined;
    }
}

const presentationBridge = new PresentationBridge();

export { presentationBridge, PresentationBridge };

if (typeof window !== 'undefined') {
    window.PresentationBridge = PresentationBridge;
    window.presentationBridge = presentationBridge;
}