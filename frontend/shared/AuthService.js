class AuthService {
    constructor() {
        this.baseURL = this.detectBaseURL();
        this.tokenKey = 'auth_token';
        this.userKey = 'auth_user';
        
        console.log('[AuthService] Detected Base URL:', this.baseURL);
    }

    detectBaseURL() {
        const origin = window.location.origin;
        const pathname = window.location.pathname;
        
        const frontendIndex = pathname.indexOf('/frontend/');
        if (frontendIndex !== -1) {
            const projectPath = pathname.substring(0, frontendIndex);
            const baseURL = `${origin}${projectPath}/backend/public`;
            console.log('[AuthService] Detection method: /frontend/ found');
            console.log('[AuthService] Project path:', projectPath);
            return baseURL;
        }
        
        const segments = pathname.split('/').filter(s => s.length > 0);

        if (segments.length > 0 && segments[0] !== 'backend') {
            const baseURL = `${origin}/${segments[0]}/backend/public`;
            console.log('[AuthService] Detection method: First segment as project');
            return baseURL;
        }

        const baseURL = `${origin}/backend/public`;
        console.log('[AuthService] Detection method: Root installation');
        return baseURL;
    }

    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }

    async register(userData) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Registration failed');
            }

            this.saveAuth(data.data.token, data.data.user);

            return data.data;
        } catch (error) {
            console.error('Registration error:', error);
            throw error;
        }
    }

    async login(credentials) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(credentials)
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Login failed');
            }

            this.saveAuth(data.data.token, data.data.user);

            return data.data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    }

    async logout() {
        try {
            await fetch(`${this.baseURL}/api/auth/logout`, {
                method: 'POST',
                headers: this.getAuthHeader()
            });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
        }
    }

    async getCurrentUser() {
        try {
            if (!this.isAuthenticated()) {
                return null;
            }

            const response = await fetch(`${this.baseURL}/api/auth/me`, {
                method: 'GET',
                headers: this.getAuthHeader()
            });

            const data = await response.json();

            if (!data.success) {
                this.clearAuth();
                return null;
            }

            const user = data.data;
            localStorage.setItem(this.userKey, JSON.stringify(user));
            return user;
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