class AuthService {
    constructor() {
        this.baseURL = 'http://localhost/web-project/backend/public';
        this.tokenKey = 'auth_token';
        this.userKey = 'auth_user';
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

    async login(login, password) {
        try {
            const response = await fetch(`${this.baseURL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ login, password })
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
            const token = this.getToken();
            if (token) {
                await fetch(`${this.baseURL}/api/auth/logout`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
            }
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            this.clearAuth();
        }
    }

    async getCurrentUser() {
        try {
            const token = this.getToken();
            if (!token) return null;

            const response = await fetch(`${this.baseURL}/api/auth/me`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const data = await response.json();

            if (data.success) {
                this.saveUser(data.data);
                return data.data;
            }

            return null;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    async updateProfile(profileData) {
        try {
            const token = this.getToken();
            const response = await fetch(`${this.baseURL}/api/auth/profile`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(profileData)
            });

            const data = await response.json();

            if (data.success) {
                this.saveUser(data.data);
                return data.data;
            }

            throw new Error(data.error || 'Update failed');
        } catch (error) {
            console.error('Update profile error:', error);
            throw error;
        }
    }

    async changePassword(currentPassword, newPassword, newPasswordConfirmation) {
        try {
            const token = this.getToken();
            const response = await fetch(`${this.baseURL}/api/auth/password`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    current_password: currentPassword,
                    new_password: newPassword,
                    new_password_confirmation: newPasswordConfirmation
                })
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.error || 'Password change failed');
            }

            return data;
        } catch (error) {
            console.error('Change password error:', error);
            throw error;
        }
    }

    isAuthenticated() {
        return !!this.getToken();
    }

    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    }

    getToken() {
        return localStorage.getItem(this.tokenKey);
    }

    getUser() {
        const userStr = localStorage.getItem(this.userKey);
        try {
            return userStr ? JSON.parse(userStr) : null;
        } catch {
            return null;
        }
    }

    saveAuth(token, user) {
        localStorage.setItem(this.tokenKey, token);
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    saveUser(user) {
        localStorage.setItem(this.userKey, JSON.stringify(user));
    }

    clearAuth() {
        localStorage.removeItem(this.tokenKey);
        localStorage.removeItem(this.userKey);
    }

    getAuthHeader() {
        const token = this.getToken();
        return token ? { 'Authorization': `Bearer ${token}` } : {};
    }
}

const authService = new AuthService();

if (typeof window !== 'undefined') {
    window.AuthService = AuthService;
    window.authService = authService;
}

console.log('AuthService loaded successfully');
