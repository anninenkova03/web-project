class APIService {
    constructor() {
        this.baseURL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : this.detectBaseURL();
        this.tokenKey = 'auth_token';
        this.cache = new Map();
        console.log('[APIService] Base URL:', this.baseURL);
    }

    detectBaseURL() {
        try {
            let scriptUrl = null;
            if (document.currentScript) {
                scriptUrl = document.currentScript.src;
            } else {
                const scripts = document.getElementsByTagName('script');
                for (let s of scripts) {
                    if (s.src && s.src.includes('APIService.js')) {
                        scriptUrl = s.src;
                        break;
                    }
                }
            }
            if (scriptUrl) {
                const url = new URL(scriptUrl);
                const pathParts = url.pathname.split('/').filter(p => p);
                const frontendIndex = pathParts.indexOf('frontend');
                if (frontendIndex !== -1) {
                    const projectRoot = pathParts.slice(0, frontendIndex).join('/');
                    return `${url.origin}/${projectRoot}/backend/public`.replace(/\/$/, '');
                }
            }
        } catch (e) {}
        const origin = window.location.origin;
        let pathname = window.location.pathname;
        const frontendPos = pathname.indexOf('/frontend');
        if (frontendPos !== -1) {
            const projectPath = pathname.substring(0, frontendPos);
            return `${origin}${projectPath}/backend/public`.replace(/\/$/, '');
        }
        return `${origin}/backend/public`.replace(/\/$/, '');
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;
            console.log('[API]', options.method || 'GET', url);

            const headers = {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                ...options.headers,
                ...this.getAuthHeader()
            };

            const response = await fetch(url, {
                ...options,
                credentials: 'include',
                headers
            });

            const text = await response.text();

            if (text.trim().startsWith('<')) {
                console.error('[API] Server returned HTML:', text.slice(0, 300));
                throw new Error('Backend returned HTML instead of JSON. Check server logs for PHP errors.');
            }

            const data = JSON.parse(text);

            if (!response.ok) {
                const msg = data.error
                    || (data.errors ? Object.values(data.errors).flat().join(', ') : null)
                    || `HTTP ${response.status}`;
                throw new Error(msg);
            }

            return data;

        } catch (error) {
            console.error('[API] Request Error:', error);
            throw error;
        }
    }

    async getPresentations(filters = {}) {
        const params = new URLSearchParams(filters);
        const data = await this.request(`/api/presentations?${params}`);
        return data;
    }

    async createPresentation(data) {
        return await this.request('/api/presentations', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async updatePresentation(id, data) {
        return await this.request(`/api/presentation?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async getPresentation(id) {
        return await this.request(`/api/presentation?id=${id}`);
    }

    async updatePresentation(id, slimContent) {
        const response = await this.request(`/api/presentation?id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ slim: slimContent })
        });
        this.clearCache();
        return response;
    }

    async deletePresentation(id) {
        await this.request(`/api/presentation?id=${id}`, { method: 'DELETE' });
        this.clearCache();
        return true;
    }

    async toggleLike(id) {
        return await this.request(`/api/presentation/like?id=${id}`, { method: 'POST' });
    }

    async getFullPresentation(id) {
        return await this.request(`/api/presentation?id=${id}`);
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
console.log('[APIService] Loaded and initialized');