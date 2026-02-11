class APIService {
    constructor() {
        this.baseURL = 'http://localhost/web-project/backend/public';
        this.cache = new Map();
        this.cacheTimeout = 60000;

        if (typeof window !== 'undefined' && window.authService) {
            this.authService = window.authService;
        }
    }

    async request(endpoint, options = {}) {
        try {
            const url = `${this.baseURL}${endpoint}`;

            const token = this.authService?.getToken();

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

    async getPresentations(filters = {}) {
        const params = new URLSearchParams(filters);
        const data = await this.request(`/api/presentations?${params}`);
        return data;
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
console.log('API Service loaded');
