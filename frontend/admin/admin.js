// Admin Panel Logic
document.addEventListener('DOMContentLoaded', async function() {
    // Check authentication and admin role
    if (!authService.isAuthenticated()) {
        window.location.href = '../auth/auth.html';
        return;
    }

    if (!authService.isAdmin()) {
        alert('Нямате административни права!');
        window.location.href = '../dashboard/dashboard.html';
        return;
    }

    await loadDashboard();
});

async function loadDashboard() {
    try {
        const data = await apiService.getAdminDashboard();
        
        renderStatistics(data);
        renderRecentActivities(data.recent_activities || []);
        renderPopularPresentations(data.popular_presentations || []);
        
        await loadUsers();
    } catch (error) {
        console.error('Error loading dashboard:', error);
        alert('Грешка при зареждане на данни');
    }
}

function renderStatistics(data) {
    const statsGrid = document.getElementById('statsGrid');
    
    const stats = [
        { icon: '👥', value: data.total_users || 0, label: 'Потребители' },
        { icon: '📊', value: data.total_presentations || 0, label: 'Презентации' },
        { icon: '💬', value: data.total_comments || 0, label: 'Коментари' },
        { icon: '👁️', value: data.total_views || 0, label: 'Прегледи' }
    ];

    statsGrid.innerHTML = stats.map(stat => `
        <div class="stat-card">
            <div class="icon">${stat.icon}</div>
            <div class="value">${stat.value}</div>
            <div class="label">${stat.label}</div>
        </div>
    `).join('');
}

async function loadUsers(page = 1) {
    try {
        const data = await apiService.getUsers(page, 10);
        renderUsersTable(data.data || [], data.pagination);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('usersTable').innerHTML = '<p>Грешка при зареждане на потребители</p>';
    }
}

function renderUsersTable(users, pagination) {
    const usersTable = document.getElementById('usersTable');
    
    if (!users || users.length === 0) {
        usersTable.innerHTML = '<p>Няма потребители</p>';
        return;
    }

    usersTable.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Потребител</th>
                    <th>Email</th>
                    <th>Роля</th>
                    <th>Статус</th>
                    <th>Презентации</th>
                    <th>Действия</th>
                </tr>
            </thead>
            <tbody>
                ${users.map(user => `
                    <tr>
                        <td>${user.id}</td>
                        <td>${user.username}</td>
                        <td>${user.email}</td>
                        <td>
                            <span class="badge badge-${user.role}">
                                ${user.role === 'admin' ? 'Admin' : 'User'}
                            </span>
                        </td>
                        <td>
                            <span class="badge badge-${user.is_active ? 'active' : 'inactive'}">
                                ${user.is_active ? 'Активен' : 'Неактивен'}
                            </span>
                        </td>
                        <td>${user.presentations_count || 0}</td>
                        <td>
                            <button class="btn btn-warning" onclick="toggleUserStatus(${user.id})">
                                ${user.is_active ? 'Деактивирай' : 'Активирай'}
                            </button>
                            <button class="btn btn-primary" onclick="changeRole(${user.id}, '${user.role === 'admin' ? 'user' : 'admin'}')">
                                ${user.role === 'admin' ? 'Make User' : 'Make Admin'}
                            </button>
                            <button class="btn btn-danger" onclick="deleteUser(${user.id}, '${user.username}')">
                                Изтрий
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        ${renderPagination(pagination, loadUsers)}
    `;
}

function renderRecentActivities(activities) {
    const activityLog = document.getElementById('activityLog');
    
    if (!activities || activities.length === 0) {
        activityLog.innerHTML = '<p>Няма последна активност</p>';
        return;
    }

    activityLog.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <strong>${activity.username || 'Система'}</strong>: ${activity.description || activity.action}
            <div class="time">${formatDate(activity.created_at)}</div>
        </div>
    `).join('');
}

function renderPopularPresentations(presentations) {
    const container = document.getElementById('popularPresentations');
    
    if (!presentations || presentations.length === 0) {
        container.innerHTML = '<p>Няма презентации</p>';
        return;
    }

    container.innerHTML = `
        <table>
            <thead>
                <tr>
                    <th>Заглавие</th>
                    <th>Автор</th>
                    <th>Прегледи</th>
                    <th>Харесвания</th>
                    <th>Създадена</th>
                </tr>
            </thead>
            <tbody>
                ${presentations.map(p => `
                    <tr>
                        <td><strong>${p.title}</strong></td>
                        <td>${p.username}</td>
                        <td>${p.view_count || 0}</td>
                        <td>${p.likes || 0}</td>
                        <td>${formatDate(p.created_at)}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    `;
}

function renderPagination(pagination, loadFunction) {
    if (!pagination || pagination.total_pages <= 1) return '';

    const pages = [];
    for (let i = 1; i <= pagination.total_pages; i++) {
        pages.push(i);
    }

    return `
        <div class="pagination">
            <button 
                onclick="${loadFunction.name}(${pagination.current_page - 1})"
                ${pagination.current_page === 1 ? 'disabled' : ''}
            >
                ← Предишна
            </button>
            ${pages.map(page => `
                <button 
                    class="${page === pagination.current_page ? 'active' : ''}"
                    onclick="${loadFunction.name}(${page})"
                >
                    ${page}
                </button>
            `).join('')}
            <button 
                onclick="${loadFunction.name}(${pagination.current_page + 1})"
                ${pagination.current_page === pagination.total_pages ? 'disabled' : ''}
            >
                Следваща →
            </button>
        </div>
    `;
}

async function toggleUserStatus(userId) {
    try {
        await apiService.toggleUserStatus(userId);
        await loadUsers();
        alert('Статусът е променен успешно');
    } catch (error) {
        console.error('Error toggling user status:', error);
        alert('Грешка при промяна на статус');
    }
}

async function changeRole(userId, newRole) {
    if (!confirm(`Сигурни ли сте, че искате да промените ролята на ${newRole}?`)) {
        return;
    }

    try {
        await apiService.changeUserRole(userId, newRole);
        await loadUsers();
        alert('Ролята е променена успешно');
    } catch (error) {
        console.error('Error changing role:', error);
        alert('Грешка при промяна на роля');
    }
}

async function deleteUser(userId, username) {
    if (!confirm(`Сигурни ли сте, че искате да изтриете потребител ${username}?`)) {
        return;
    }

    try {
        await apiService.deleteUser(userId);
        await loadUsers();
        alert('Потребителят е изтрит успешно');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert(error.message || 'Грешка при изтриване на потребител');
    }
}

async function handleLogout() {
    if (confirm('Сигурни ли сте, че искате да излезете?')) {
        await authService.logout();
        window.location.href = '../auth/auth.html';
    }
}

function formatDate(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleString('bg-BG');
}
