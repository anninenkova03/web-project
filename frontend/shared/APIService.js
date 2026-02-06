class APIService {
    constructor() {
        this.baseURL = 'http://localhost/web-project-complete/backend/public';
        this.cache = new Map();
        this.cacheTimeout = 60000;
    }

    async request(endpoint, options = {}) {
        try {
            const url = endpoint.startsWith('http') ? endpoint : `${this.baseURL}${endpoint}`;
            
            console.log('API Request:', url, options.method || 'GET');
            
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            if (data.success === false) {
                throw new Error(data.error || 'API request failed');
            }
            
            return data.data || data;
            
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
            
            const presentations = Array.isArray(data) ? data.map(p => ({
                id: p.id,
                title: p.title,
                type: p.presentation_type,
                slides: parseInt(p.slides) || 0,
                date: p.created_at,
                author: 'System',
                slug: p.slug
            })) : [];

            this.cache.set(cacheKey, {
                data: presentations,
                timestamp: Date.now()
            });

            console.log(`Loaded ${presentations.length} presentations from API`);
            return presentations;
            
        } catch (error) {
            console.error('Error loading presentations:', error);
            return [];
        }
    }

    async generatePresentation(slimContent) {
        try {
            const response = await this.request('/api/generate', {
                method: 'POST',
                body: JSON.stringify({
                    slim: slimContent
                })
            });

            console.log('Presentation generated:', response);
            
            this.clearCache();
            
            return response;
            
        } catch (error) {
            console.error('Error generating presentation:', error);
            throw error;
        }
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
            const presentation = await this.request(`/api/presentation?id=${id}`);
            
            if (!$presentation) {
                throw new Error(`Presentation with ID ${id} not found`);
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

    async updatePresentation(id, slimContent) {
        try {
            const response = await this.request(`/api/presentation?id=${id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    slim: slimContent
                })
            });

            console.log('Presentation updated:', response);
            
            this.clearCache();
            
            return response;
            
        } catch (error) {
            console.error('Error updating presentation:', error);
            throw error;
        }
    }

    async deletePresentation(id) {
        try {
            await this.request(`/api/presentation?id=${id}`, {
                method: 'DELETE'
            });

            console.log(`Presentation ${id} deleted`);
            
            this.clearCache();
            
            return true;
            
        } catch (error) {
            console.error('Error deleting presentation:', error);
            throw error;
        }
    }

    async getPresentationHTML(slug) {
        try {
            const htmlURL = `${this.baseURL.replace('/public', '')}/generated/presentations/${slug}/index.html`;
            
            const response = await fetch(htmlURL);
            if (!response.ok) {
                throw new Error('HTML file not found');
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
                title: slideData.title || `Slide ${index + 1}`,
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
            const presentation = await this.getPresentation(id);
            
            const slides = presentation.slides.map((slide, index) => ({
                id: slide.id,
                order: slide.order,
                type: slide.type,
                title: slide.data.title || `Slide ${index + 1}`,
                data: slide.data,
                next: index < presentation.slides.length - 1 ? presentation.slides[index + 1].id : null,
                previous: index > 0 ? presentation.slides[index - 1].id : null
            }));

            return {
                id: presentation.id,
                title: presentation.title,
                type: presentation.type,
                slug: presentation.slug,
                created_at: presentation.created_at,
                slides: slides
            };
            
        } catch (error) {
            console.error('Error loading full presentation:', error);
            return this.getDemoPresentation();
        }
    }

    getDemoPresentation() {
        return {
            id: 1,
            title: "Demo Presentation",
            type: "lecture",
            slides: [
                {
                    id: 1,
                    order: 1,
                    type: "title",
                    title: "Introduction to Web Technologies",
                    data: {
                        title: "Introduction to Web Technologies",
                        subtitle: "HTML, CSS, JavaScript & PHP"
                    },
                    next: 2,
                    previous: null
                },
                {
                    id: 2,
                    order: 2,
                    type: "text-only",
                    title: "What will we learn?",
                    data: {
                        content: "Basics of HTML5, CSS3, JavaScript, PHP and MySQL"
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
            const response = await this.request('/api/health');
            console.log('Backend health check:', response);
            return true;
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

console.log('API Service loaded successfully');