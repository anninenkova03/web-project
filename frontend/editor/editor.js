let fileManager;
let validator;
let autoSaveInterval;
let currentTheme = 'light';

document.addEventListener('DOMContentLoaded', function() {
    console.log('Editor initialization...');

    if (!authService || !authService.isAuthenticated()) {
        alert('Трябва да влезете в профила си');
        window.location.href = '../auth/auth.html';
        return;
    }
    
    initializeEditor();
});

function initializeEditor() {
    fileManager = new FileManager();
    
    if (typeof SlimValidator !== 'undefined') {
        validator = new SlimValidator();
    }
    
    initializeUI();
    setupEventListeners();
    loadFileList();
    
    startAutoSave();
    
    loadLastOrCreateNew();
    
    loadTheme();
    
    console.log('Editor ready!');
    updateStatus('Готов за работа');
}

function initializeUI() {
    const typeSelect = document.getElementById('presentation-type');
    const types = [
        { value: 'lecture', label: '📚 Лекция' },
        { value: 'tutorial', label: '🎓 Упражнение' },
        { value: 'project', label: '💼 Проект' },
        { value: 'demo', label: '🎬 Демо' }
    ];
    
    typeSelect.innerHTML = '';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        typeSelect.appendChild(option);
    });
}

function setupEventListeners() {
    document.getElementById('btn-new').addEventListener('click', handleNew);
    document.getElementById('btn-open').addEventListener('click', handleOpen);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-validate').addEventListener('click', handleValidate);
    document.getElementById('btn-preview').addEventListener('click', handlePreview);
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);
    document.getElementById('btn-refresh').addEventListener('click', loadFileList);

    const generateBtn = document.getElementById('btn-generate');
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerate);
    }
    
    const dashboardBtn = document.getElementById('btn-dashboard');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = '../dashboard/dashboard.html';
        });
    }
    
    const editor = document.getElementById('slim-editor');
    editor.addEventListener('input', handleEditorChange);
    
    document.getElementById('presentation-title').addEventListener('input', handleTitleChange);
    
    document.getElementById('presentation-type').addEventListener('change', handleTypeChange);
    
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });
    
    document.getElementById('close-preview').addEventListener('click', closePreview);
    document.getElementById('preview-modal').addEventListener('click', (e) => {
        if (e.target.id === 'preview-modal') {
            closePreview();
        }
    });
    
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

async function handleGenerate() {
    console.log('Generate clicked!');
    
    const editor = document.getElementById('slim-editor');
    const content = editor.value.trim();

    if (!content) {
        alert('❌ Няма съдържание за генериране!\n\nНапишете SLIM код в едитора.');
        return;
    }

    if (!content.includes('#title') && !content.includes('#slide')) {
        alert('❌ Невалиден SLIM формат!\n\nТрябва да има поне #title или #slide команди.');
        return;
    }

    try {
        updateStatus('⏳ Генериране на презентация...');

        const generateBtn = document.getElementById('btn-generate');
        if (generateBtn) {
            generateBtn.disabled = true;
            generateBtn.textContent = '⏳ Генериране...';
        }

        console.log('Sending SLIM content to API:', content.substring(0, 100) + '...');

        const response = await apiService.generatePresentation(content);
        
        console.log('Generate response:', response);

        const titleInput = document.getElementById('presentation-title');
        const title = titleInput.value || 'Untitled Presentation';
        fileManager.save(content, title);

        alert('✅ Презентацията е създадена успешно!\n\nМоже да я видите в Dashboard.');

        setTimeout(() => {
            window.location.href = '../dashboard/dashboard.html';
        }, 500);

    } catch (error) {
        console.error('Generate error:', error);
        
        let errorMessage = '❌ Грешка при генериране на презентацията!\n\n';
        
        if (error.message) {
            errorMessage += 'Детайли: ' + error.message;
        } else {
            errorMessage += 'Моля, проверете:\n';
            errorMessage += '• Дали сте влезли в профила си\n';
            errorMessage += '• Дали SLIM форматът е правилен\n';
            errorMessage += '• Дали backend API работи';
        }
        
        alert(errorMessage);
        updateStatus('❌ Грешка при генериране');
    } finally {
        const generateBtn = document.getElementById('btn-generate');
        if (generateBtn) {
            generateBtn.disabled = false;
            generateBtn.textContent = '⚙️ Generate';
        }
    }
}

function handleNew() {
    if (fileManager.hasUnsavedChanges()) {
        if (!confirm('Имате незапазени промени! Искате ли да създадете нова презентация?')) {
            return;
        }
    }
    
    const title = prompt('Име на новата презентация:', 'Нова презентация');
    if (!title) return;
    
    const type = document.getElementById('presentation-type').value;
    const presentation = fileManager.createNew(title, type);
    
    loadPresentationInEditor(presentation);
    loadFileList();
    updateStatus(`Създадена: ${title}`);
}

function handleOpen() {
    console.log('Отваряне на file picker...');
    fileManager.showImportDialog();
}

async function handleSave() {
    const editor = document.getElementById('slim-editor');
    const titleInput = document.getElementById('presentation-title');

    const content = editor.value;
    const title = titleInput.value || 'Без име';

    if (!content.trim()) {
        alert('Няма съдържание за запазване!');
        return;
    }

    fileManager.save(content, title);
    updateStatus(`💾 Запазена локално: ${title}`);
    showStatus('Презентацията е запазена локално. Натиснете "Generate" за да я публикувате в Dashboard.', 'info');
    
    loadFileList();
}

function handleValidate() {
    if (!validator) {
        alert('Validator не е зареден!');
        return;
    }
    
    const editor = document.getElementById('slim-editor');
    const content = editor.value;
    
    if (!content.trim()) {
        alert('Няма съдържание за валидиране!');
        return;
    }
    
    try {
        const result = validator.validate(content);
        displayValidationResults(result);
        updateStatus(result.isValid ? '✅ Валидна презентация' : '❌ Има грешки');
    } catch (error) {
        console.error('Validation error:', error);
        alert('Грешка при валидация: ' + error.message);
    }
}

function displayValidationResults(result) {
    let message = result.isValid 
        ? '✅ Презентацията е валидна!\n\n' 
        : '❌ Намерени грешки:\n\n';
    
    if (!result.isValid && result.errors && result.errors.length > 0) {
        result.errors.forEach((error, index) => {
            message += `${index + 1}. ${error}\n`;
        });
    }
    
    if (result.warnings && result.warnings.length > 0) {
        message += '\n⚠️ Предупреждения:\n\n';
        result.warnings.forEach((warning, index) => {
            message += `${index + 1}. ${warning}\n`;
        });
    }
    
    alert(message);
}

function handlePreview() {
    const editor = document.getElementById('slim-editor');
    const content = editor.value;
    
    if (!content.trim()) {
        alert('Няма съдържание за преглед!');
        return;
    }
    
    try {
        const previewContent = document.getElementById('preview-content');
        previewContent.textContent = content;
        
        document.getElementById('preview-modal').classList.add('show');
        updateStatus('Преглед');
    } catch (error) {
        console.error('Preview error:', error);
        alert('Грешка при преглед: ' + error.message);
    }
}

function closePreview() {
    document.getElementById('preview-modal').classList.remove('show');
}

function handleEditorChange() {
    const editor = document.getElementById('slim-editor');
    const content = editor.value;
    
    updateCharCount(content.length);
    
    fileManager.markAsUnsaved();
    updateFileStatus();
}

function handleTitleChange() {
    fileManager.markAsUnsaved();
    updateFileStatus();
}

function handleTypeChange() {
    const type = document.getElementById('presentation-type').value;
    if (fileManager.currentFile) {
        fileManager.currentFile.type = type;
        fileManager.markAsUnsaved();
        updateFileStatus();
    }
}

function loadPresentationInEditor(presentation) {
    document.getElementById('slim-editor').value = presentation.content || '';
    document.getElementById('presentation-title').value = presentation.title || '';
    document.getElementById('presentation-type').value = presentation.type || 'lecture';
    
    updateCharCount((presentation.content || '').length);
    fileManager.markAsSaved();
    updateFileStatus();
}

function loadFileList() {
    const fileList = document.getElementById('file-list');
    const presentations = fileManager.getAll();
    
    if (presentations.length === 0) {
        fileList.innerHTML = '<div class="empty-state">Няма запазени презентации</div>';
        return;
    }
    
    fileList.innerHTML = presentations.map(p => `
        <div class="file-item" data-id="${p.id}">
            <div class="file-info">
                <div class="file-title">${escapeHtml(p.title)}</div>
                <div class="file-meta">
                    ${p.slideCount || 0} слайда • ${p.type || 'lecture'}
                    <br>
                    <small>Преди ${formatTimeAgo(p.lastModified)}</small>
                </div>
            </div>
            <button class="btn-small" onclick="loadPresentation('${p.id}')">Отвори</button>
        </div>
    `).join('');
}

function loadPresentation(id) {
    const presentation = fileManager.load(id);
    if (presentation) {
        loadPresentationInEditor(presentation);
        updateStatus(`Отворена: ${presentation.title}`);
    }
}

function loadLastOrCreateNew() {
    const last = fileManager.loadLast();
    if (last) {
        loadPresentationInEditor(last);
        updateStatus(`Отворена: ${last.title}`);
    } else {
        handleNew();
    }
}

function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (fileManager && fileManager.hasUnsavedChanges()) {
            const editor = document.getElementById('slim-editor');
            const titleInput = document.getElementById('presentation-title');
            
            const content = editor.value;
            const title = titleInput.value || 'Autosave';
            
            if (content.trim()) {
                fileManager.save(content, title);
                updateStatus('💾 Auto-save', 1000);
            }
        }
    }, 30000);
}

function updateStatus(message, timeout = 0) {
    const statusElement = document.getElementById('file-status');
    if (statusElement) {
        statusElement.textContent = message;
        
        if (timeout > 0) {
            setTimeout(() => {
                updateStatus('●');
            }, timeout);
        }
    }
}

function showStatus(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#51cf66' : type === 'error' ? '#ff6b6b' : '#4dabf7'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function updateFileStatus() {
    const status = document.getElementById('file-status');
    if (fileManager && fileManager.hasUnsavedChanges()) {
        status.textContent = '● Незапазено';
        status.style.color = '#ff6b6b';
    } else {
        status.textContent = '● Запазено';
        status.style.color = '#51cf66';
    }
}

function updateCharCount(count) {
    const charCount = document.getElementById('char-count');
    if (charCount) {
        charCount.textContent = `${count} символа`;
    }
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.content === tabName);
    });
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.className = `theme-${currentTheme}`;
    localStorage.setItem('editor-theme', currentTheme);
    updateStatus(`Тема: ${currentTheme}`);
}

function loadTheme() {
    const savedTheme = localStorage.getItem('editor-theme');
    if (savedTheme) {
        currentTheme = savedTheme;
        document.body.className = `theme-${currentTheme}`;
    }
}

function handleKeyboardShortcuts(e) {
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        handleSave();
    }

    if (e.ctrlKey && e.key === 'g') {
        e.preventDefault();
        handleGenerate();
    }

    if (e.ctrlKey && e.key === 'p') {
        e.preventDefault();
        handlePreview();
    }

    if (e.key === 'Escape') {
        closePreview();
    }
}

function formatTimeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return 'малко';
    if (minutes < 60) return `${minutes} мин`;
    if (hours < 24) return `${hours} ч`;
    return `${days} дни`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.addEventListener('beforeunload', (e) => {
    if (fileManager && fileManager.hasUnsavedChanges()) {
        e.preventDefault();
        e.returnValue = '';
        return '';
    }
});