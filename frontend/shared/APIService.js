class APIService {
    constructor() {
        this.baseURL = 'http://localhost/web-project/backend/public';
        this.cache = new Map();
        this.cacheTimeout = 60000;
        
        // Ensure we have reference to authService
        if (typeof window !== 'undefined' && window.authService) {
            this.authService = window.authService;
        }
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            
<<<<<<< HEAD
            // Get auth token
            const token = this.authService?.getToken();

            // Build headers with authentication
=======
            const token = authService.getToken();
            
>>>>>>> 850d86947c2f2fa0069638b57cd0d0eb31a651b5
            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers
            };
            
            if (token) {
                headers['Authorization'] = `Bearer ${token}`;
            }

            const response = await fetch(url, {
                credentials: 'include',
                headers: headers,
                ...options
            });

            const text = await response.text();

            if (text.trim().startsWith('<')) {
                console.error('Server returned HTML:', text);
                throw new Error('Backend returned HTML instead of JSON. Check server logs for PHP errors.');
            }

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

<<<<<<< HEAD
    async getPresentations(filters = {}) {
        const params = new URLSearchParams(filters);
        const data = await this.request(`/api/presentations?${params}`);
        return data;
=======
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
>>>>>>> 850d86947c2f2fa0069638b57cd0d0eb31a651b5
    }

    async generatePresentation(slimContent) {
        return await this.request('/api/generate', {
            method: 'POST',
            body: JSON.stringify({ slim: slimContent })
        });
    }

    async getPresentation(id) {
        return await this.request(`/api/presentation?id=${id}`);
    }

<<<<<<< HEAD
    async updatePresentation(id, slimContent) {
        const response = await this.request(`/api/presentation?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ slim: slimContent })
=======
    async getPresentationHTML(slug) {
        try {
            const htmlURL = `${this.baseURL.replace('/public', '')}/generated/presentations/${slug}/index.html`;
            
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
>>>>>>> 850d86947c2f2fa0069638b57cd0d0eb31a651b5
        });
        this.clearCache();
        return response;
    }

<<<<<<< HEAD
    async deletePresentation(id) {
        await this.request(`/api/presentation?id=${id}`, { method: 'DELETE' });
        this.clearCache();
        return true;
=======
    async getFullPresentation(id) {
        try {
            const presentation = await this.getPresentation(id);
            
            const slides = presentation.slides.map((slide, index) => ({
                id: slide.id,
                order: slide.order,
                type: slide.type,
                title: slide.data.title || `Слайд ${index + 1}`,
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
>>>>>>> 850d86947c2f2fa0069638b57cd0d0eb31a651b5
    }

    async toggleLike(id) {
        return await this.request(`/api/presentation/like?id=${id}`, { method: 'POST' });
    }

    async toggleFavorite(id) {
        return await this.request(`/api/presentation/favorite?id=${id}`, { method: 'POST' });
    }

    async getFavorites() {
        return await this.request('/api/favorites');
    }

    async getComments(presentationId) {
        return await this.request(`/api/presentation/comments?id=${presentationId}`);
    }

    async addComment(presentationId, comment, parentId = null) {
        return await this.request(`/api/presentation/comments?id=${presentationId}`, {
            method: 'POST',
            body: JSON.stringify({ comment, parent_comment_id: parentId })
        });
    }

    async deleteComment(commentId) {
        return await this.request(`/api/comment?id=${commentId}`, { method: 'DELETE' });
    }
    
    async getHistory(presentationId) {
        return await this.request(`/api/presentation/history?id=${presentationId}`);
    }
    
    async getAdminDashboard() {
        return await this.request('/api/admin/dashboard');
    }

    async getUsers(page = 1, limit = 20) {
        return await this.request(`/api/admin/users?page=${page}&limit=${limit}`);
    }

    async toggleUserStatus(userId) {
        return await this.request(`/api/admin/user/status?id=${userId}`, { method: 'PUT' });
    }

    async changeUserRole(userId, role) {
        return await this.request(`/api/admin/user/role?id=${userId}`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        });
    }

    async deleteUser(userId) {
        return await this.request(`/api/admin/user?id=${userId}`, { method: 'DELETE' });
    }

    async getActivityLogs(page = 1, limit = 50) {
        return await this.request(`/api/admin/logs?page=${page}&limit=${limit}`);
    }

    clearCache() {
        this.cache.clear();
    }

    async healthCheck() {
        try {
            const response = await this.request('/api/health');
            return true;
        } catch (error) {
            return false;
        }
    }
}

const apiService = new APIService();
if (typeof window !== 'undefined') {
    window.APIService = APIService;
    window.apiService = apiService;
}
<<<<<<< HEAD
console.log('API Service loaded');
=======

console.log('API Service loaded');
>>>>>>> 850d86947c2f2fa0069638b57cd0d0eb31a651b5
