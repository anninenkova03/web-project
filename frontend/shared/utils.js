function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}

function formatDateTime(dateString) {
    const date = new Date(dateString);
    return date.toLocaleString('bg-BG', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    
    if (hours > 0) {
        return `${hours}ч ${mins}мин`;
    }
    return `${mins} мин`;
}

function truncateText(text, maxLength = 100) {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function capitalizeFirst(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function getUrlParam(param) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(param);
}

function setUrlParam(param, value) {
    const url = new URL(window.location);
    url.searchParams.set(param, value);
    window.history.pushState({}, '', url);
}

function removeUrlParam(param) {
    const url = new URL(window.location);
    url.searchParams.delete(param);
    window.history.pushState({}, '', url);
}

function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error saving to localStorage:', error);
    }
}

function getLocalStorage(key, defaultValue = null) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
        console.error('Error reading from localStorage:', error);
        return defaultValue;
    }
}

function removeLocalStorage(key) {
    localStorage.removeItem(key);
}

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

function uniqueArray(array) {
    return [...new Set(array)];
}

function sortByProperty(array, property, ascending = true) {
    return [...array].sort((a, b) => {
        const aVal = a[property];
        const bVal = b[property];
        
        if (aVal < bVal) return ascending ? -1 : 1;
        if (aVal > bVal) return ascending ? 1 : -1;
        return 0;
    });
}

function getSlideTypeLabel(type) {
    const labels = {
        'title': '📌 Заглавие',
        'content': '📝 Съдържание',
        'code': '💻 Код',
        'image-text': '🖼️ Изображение',
        'quiz': '❓ Въпрос',
        'lecture': '📚 Лекция',
        'tutorial': '🎓 Урок',
        'workshop': '🛠️ Работилница'
    };
    return labels[type] || capitalizeFirst(type);
}

function getSlideTypeColor(type) {
    const colors = {
        'title': '#1976d2',
        'content': '#7b1fa2',
        'code': '#388e3c',
        'image-text': '#f57c00',
        'quiz': '#E91E63',
        'lecture': '#4CAF50',
        'tutorial': '#2196F3',
        'workshop': '#FF9800'
    };
    return colors[type] || '#718096';
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            ${message}
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem;
        border-radius: 8px;
        background: ${type === 'error' ? '#F56565' : type === 'success' ? '#48BB78' : '#4299E1'};
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 1rem;
        z-index: 9999;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    
    notification.querySelector('.notification-close').addEventListener('click', () => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    });
    
    setTimeout(() => {
        if (notification.parentNode) {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

export {
    formatDate,
    formatDateTime,
    formatTime,
    truncateText,
    capitalizeFirst,
    escapeHtml,
    getUrlParam,
    setUrlParam,
    removeUrlParam,
    setLocalStorage,
    getLocalStorage,
    removeLocalStorage,
    isValidEmail,
    isValidUrl,
    uniqueArray,
    sortByProperty,
    getSlideTypeLabel,
    getSlideTypeColor,
    showNotification
};