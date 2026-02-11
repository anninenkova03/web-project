class APIService {
    constructor() {
        this.baseURL = '../backend/public';
        this.cache = new Map();
        this.cacheTimeout = 60000;
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;

            const response = await fetch(url, {
                credentials: 'include',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    ...options.headers
                },
                ...options
            });

            const text = await response.text();

            // if (text.trim().startsWith('<')) {
            //     console.error('Server returned HTML:', text);
            //     throw new Error('Backend returned HTML instead of JSON.');
            // }

            const data = JSON.parse(text);

            if (!response.ok) {
                throw new Error(data.error || `HTTP ${response.status}`);
            }

            return data;

        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    async getPresentations() {
        const cacheKey = 'presentations-list';
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log('Using cached presentations');
                return cached.data;
            }
        }

        try {
            const data = await this.request('/api/presentations');
            
            const presentations = data.map(p => ({
                id: p.id,
                title: p.title,
                type: p.presentation_type,
                slides: parseInt(p.slides) || 0,
                date: p.created_at,
                author: 'System',
                slug: p.slug
            }));

            this.cache.set(cacheKey, {
                data: presentations,
                timestamp: Date.now()
            });

            console.log(`Loaded ${presentations.length} presentations from API`);
            return presentations;
            
        } catch (error) {
            console.error('Error loading presentations:', error);
            throw error;
        }
    }

    async generatePresentation(slimContent) {
        return await this.request('/api/generate', {
            method: 'POST',
            body: JSON.stringify({ slim: slimContent })
        });
    }


    async getPresentation(id) {
        const cacheKey = `presentation-${id}`;
        
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`Using cached presentation ${id}`);
                return cached.data;
            }
        }

        try {
            const presentations = await this.getPresentations();
            const presentation = presentations.find(p => p.id == id);
            
            if (!presentation) {
                throw new Error(`Презентация с ID ${id} не е намерена`);
            }

            this.cache.set(cacheKey, {
                data: presentation,
                timestamp: Date.now()
            });

            return presentation;
            
        } catch (error) {
            console.error(`Error loading presentation ${id}:`, error);
            throw error;
        }
    }

    async getPresentationHTML(slug) {
        try {
            const htmlURL = `../backend/generated/presentations/${slug}/index.html`;
            
            const response = await fetch(htmlURL);
            if (!response.ok) {
                throw new Error('HTML файлът не е намерен');
            }

            const html = await response.text();
            console.log(`Loaded HTML for ${slug}`);
            return html;
            
        } catch (error) {
            console.error(`Error loading HTML for ${slug}:`, error);
            throw error;
        }
    }

    parseHTMLToSlides(html, presentationTitle) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const sections = doc.querySelectorAll('section');
        
        const slides = [];
        let slideId = 1;

        sections.forEach((section, index) => {
            const slideType = section.className || 'text-only';
            const slideData = {};

            section.querySelectorAll('div').forEach(div => {
                const className = div.className;
                const content = div.innerHTML;
                if (className && content) {
                    slideData[className] = content;
                }
            });

            slides.push({
                id: slideId++,
                order: index + 1,
                type: slideType,
                title: slideData.title || `Слайд ${index + 1}`,
                data: slideData,
                next: index < sections.length - 1 ? slideId : null,
                previous: index > 0 ? slideId - 2 : null
            });
        });

        return {
            id: Date.now(),
            title: presentationTitle,
            slides: slides
        };
    }

    async getFullPresentation(id) {
        try {
            const metadata = await this.getPresentation(id);
            const html = await this.getPresentationHTML(metadata.slug);
            const presentation = this.parseHTMLToSlides(html, metadata.title);
            
            presentation.id = metadata.id;
            presentation.slug = metadata.slug;
            presentation.type = metadata.type;
            presentation.created_at = metadata.date;

            console.log(`Loaded full presentation: ${presentation.title}`);
            return presentation;
            
        } catch (error) {
            console.error('Error loading full presentation:', error);
            return this.getDemoPresentation();
        }
    }

    getDemoPresentation() {
        return {
            id: 1,
            title: "Demo Презентация",
            type: "lecture",
            slides: [
                {
                    id: 1,
                    order: 1,
                    type: "title",
                    title: "Въведение в Web Technologies",
                    data: {
                        title: "Въведение в Web Technologies",
                        subtitle: "HTML, CSS, JavaScript & PHP"
                    },
                    next: 2,
                    previous: null
                },
                {
                    id: 2,
                    order: 2,
                    type: "text-only",
                    title: "Какво ще научим?",
                    data: {
                        content: "Основи на HTML5, CSS3, JavaScript, PHP и MySQL"
                    },
                    next: null,
                    previous: 1
                }
            ]
        };
    }

    clearCache() {
        this.cache.clear();
        console.log('Cache cleared');
    }

    async healthCheck() {
        try {
            const response = await fetch(this.baseURL);
            return response.ok;
        } catch (error) {
            console.error('Backend not available:', error);
            return false;
        }
    }
}

const apiService = new APIService();

if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIService;
}

if (typeof window !== 'undefined') {
    window.APIService = APIService;
    window.apiService = apiService;
}

console.log('API Service loaded');