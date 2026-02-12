class AuthService {
    constructor() {
        this.baseURL = window.APP_CONFIG ? window.APP_CONFIG.API_BASE_URL : this.detectBaseURL();
        
        this.baseURL = this.detectBaseURL();
        this.tokenKey = 'auth_token';
        this.userKey = 'auth_user';
        console.log('[AuthService] Base URL:', this.baseURL);
    }

    detectBaseURL() {
        // ----- 1. Script path detection (preferred) -----
        try {
            let scriptUrl = null;
            if (document.currentScript) {
                scriptUrl = document.currentScript.src;
            } else {
                const scripts = document.getElementsByTagName('script');
                for (let s of scripts) {
                    if (s.src && s.src.includes('AuthService.js')) {
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
        } catch (e) {
            console.warn('[Auth] Script detection failed, falling back to page URL');
        }

        // ----- 2. Page URL fallback -----
        const origin = window.location.origin;
        let pathname = window.location.pathname;
        if (pathname.endsWith('/')) pathname = pathname.slice(0, -1);

        const frontendPos = pathname.indexOf('/frontend');
        if (frontendPos !== -1) {
            const projectPath = pathname.substring(0, frontendPos);
            return `${origin}${projectPath}/backend/public`.replace(/\/$/, '');
        }

        // ----- 3. Last resort -----
        console.warn('[Auth] Using root-level backend fallback');
        return `${origin}/backend/public`.replace(/\/$/, '');
    }

    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        console.log('[Auth] Request:', options.method || 'GET', url);

        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...this.getAuthHeader(),
                ...options.headers
            }
        });

        const text = await response.text();
        if (!response.ok) {
            console.error('[Auth] HTTP error', response.status, text.slice(0, 300));
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        try {
            return JSON.parse(text);
        } catch (e) {
            console.error('[Auth] Invalid JSON:', text.slice(0, 300));
            throw new Error('Server returned invalid JSON');
        }
    }

    async register(userData) {
        try {
            const data = await this.request('/api/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData)
            });
            if (!data.success) throw new Error(data.error || 'Registration failed');
            this.saveAuth(data.data.token, data.data.user);
            return data.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const data = await this.request('/api/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials)
            });
            if (!data.success) throw new Error(data.error || 'Login failed');
            this.saveAuth(data.data.token, data.data.user);
            return data.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await this.request('/api/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
        }
    }

    async getCurrentUser() {
        if (!this.isAuthenticated()) return null;
    
        try {
            const data = await this.request('/api/auth/me');
    
            if (!data.success) {
                this.clearAuth();
                return null;
            }
    
            // DO NOT overwrite token
            localStorage.setItem(this.userKey, JSON.stringify(data.data));
    
            return data.data;
    
        } catch (error) {
            console.error('Get current user error:', error);
            this.clearAuth();
            return null;
        }
    }    

    saveAuth(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    getUser() {
        const userJson = localStorage.getItem(this.userKey);
        return userJson ? JSON.parse(userJson) : null;
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }
}

const authService = new AuthService();
if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
    window.authService = authService;
}
console.log('AuthService loaded and initialized');