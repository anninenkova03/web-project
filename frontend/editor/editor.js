let fileManager;
let validator;
let highlighter;
let autoSaveInterval;

document.addEventListener('DOMContentLoaded', function() {
    initializeEditor();
});

function initializeEditor() {
    fileManager = new FileManager();
    validator = new SlimValidator();
    
    const editorTextarea = document.getElementById('slim-editor');
    highlighter = new SyntaxHighlighter(editorTextarea);
    
    initializeUI();
    initializeEventListeners();
    loadFileList();
    
    // Auto-save на всеки 30 секунди
    startAutoSave();
    
    loadLastOrCreateNew();
    
    console.log('✓ Editor initialized');
}

function initializeUI() {
    const typeSelect = document.getElementById('presentation-type');
    const types = [
        { value: 'lecture', label: 'Лекция' },
        { value: 'tutorial', label: 'Упражнение' },
        { value: 'project', label: 'Проект' },
        { value: 'demo', label: 'Демо' }
    ];
    
    typeSelect.innerHTML = '';
    types.forEach(type => {
        const option = document.createElement('option');
        option.value = type.value;
        option.textContent = type.label;
        typeSelect.appendChild(option);
    });
}


function initializeEventListeners() {
    document.getElementById('btn-new').addEventListener('click', handleNew);
    document.getElementById('btn-open').addEventListener('click', handleOpen);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-validate').addEventListener('click', handleValidate);
    document.getElementById('btn-preview').addEventListener('click', handlePreview);
    document.getElementById('btn-theme').addEventListener('click', handleThemeToggle);
    document.getElementById('btn-refresh').addEventListener('click', loadFileList);
    
    const editor = document.getElementById('slim-editor');
    editor.addEventListener('input', handleEditorInput);
    editor.addEventListener('keydown', handleEditorKeydown);
    editor.addEventListener('click', updateCursorPosition);
    editor.addEventListener('keyup', updateCursorPosition);
    
    const titleInput = document.getElementById('presentation-title');
    titleInput.addEventListener('input', handleTitleChange);
    
    const typeSelect = document.getElementById('presentation-type');
    typeSelect.addEventListener('change', handleTypeChange);
    
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', handleTabSwitch);
    });
    
    document.getElementById('close-preview').addEventListener('click', closePreview);
    document.getElementById('preview-modal').addEventListener('click', function(e) {
        if (e.target === this) {
            closePreview();
        }
    });
    
    document.addEventListener('keydown', handleGlobalKeyboard);
    
    window.addEventListener('beforeunload', function(e) {
        if (fileManager.hasUnsavedChanges()) {
            e.preventDefault();
            e.returnValue = '';
            return '';
        }
    });
}

function loadFileList() {
    const fileList = document.getElementById('file-list');
    const presentations = fileManager.getAll();
    
    if (presentations.length === 0) {
        fileList.innerHTML = `
            <div class="empty-state">
                <p>Няма презентации</p>
                <button class="btn-small" onclick="handleNew()">Създай нова</button>
            </div>
        `;
        return;
    }
    
    fileList.innerHTML = '';
    
    presentations.forEach(pres => {
        const item = document.createElement('div');
        item.className = 'file-item';
        if (fileManager.currentFile && fileManager.currentFile.id === pres.id) {
            item.classList.add('active');
        }
        
        const lastModified = new Date(pres.lastModified);
        const dateStr = formatDate(lastModified);
        
        item.innerHTML = `
            <div class="file-name">${escapeHtml(pres.title)}</div>
            <div class="file-meta">
                ${pres.type} • ${dateStr}
            </div>
        `;
        
        item.addEventListener('click', () => loadPresentation(pres.id));
        
        item.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            showContextMenu(e, pres);
        });
        
        fileList.appendChild(item);
    });
}

function loadPresentation(id) {
    if (fileManager.hasUnsavedChanges()) {
        if (!confirm('Имате незапазени промени. Искате ли да продължите?')) {
            return;
        }
    }
    
    const presentation = fileManager.load(id);
    if (!presentation) {
        showStatus('Грешка при зареждане', 'error');
        return;
    }
    
    document.getElementById('slim-editor').value = presentation.content;
    document.getElementById('presentation-title').value = presentation.title;
    document.getElementById('presentation-type').value = presentation.type;
    
    loadFileList();
    updateStatistics();
    showStatus(`Заредена: ${presentation.title}`, 'success');
    
    document.getElementById('validation-output').innerHTML = `
        <div class="validation-empty">
            <span class="icon">ℹ️</span>
            <p>Натиснете "Валидирай" за проверка на синтаксиса</p>
        </div>
    `;
}

function handleNew() {
    if (fileManager.hasUnsavedChanges()) {
        if (!confirm('Имате незапазени промени. Искате ли да създадете нова презентация?')) {
            return;
        }
    }
    
    const title = prompt('Име на презентацията:', 'Нова презентация');
    if (!title) return;
    
    const type = document.getElementById('presentation-type').value;
    const presentation = fileManager.createNew(title, type);
    
    document.getElementById('slim-editor').value = presentation.content;
    document.getElementById('presentation-title').value = presentation.title;
    
    loadFileList();
    updateStatistics();
    showStatus('Създадена нова презентация', 'success');
}

function handleOpen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.slim,.txt';
    
    input.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        fileManager.import(file)
            .then(presentation => {
                loadPresentation(presentation.id);
                showStatus(`Импортирана: ${presentation.title}`, 'success');
            })
            .catch(err => {
                showStatus('Грешка при импорт: ' + err.message, 'error');
            });
    });
    
    input.click();
}

function handleSave() {
    const content = document.getElementById('slim-editor').value;
    const title = document.getElementById('presentation-title').value || 'Без име';
    
    const presentation = fileManager.save(content, title);
    
    if (presentation) {
        loadFileList();
        updateFileStatus('saved');
        showStatus('Запазено успешно', 'success');
    } else {
        showStatus('Грешка при запазване', 'error');
    }
}

function handleValidate() {
    const content = document.getElementById('slim-editor').value;
    const result = validator.validate(content);
    
    displayValidationResult(result);
    updateStatistics();
}

function displayValidationResult(result) {
    const output = document.getElementById('validation-output');
    
    let html = '';
    
    html += `<div class="validation-message ${result.valid ? 'success' : 'error'}">
        <strong>${result.summary}</strong>
    </div>`;
    
    if (result.errors.length > 0) {
        result.errors.forEach(err => {
            html += `<div class="validation-message error">
                <strong>Ред ${err.line}:</strong> ${escapeHtml(err.message)}
            </div>`;
        });
    }
    
    if (result.warnings.length > 0) {
        result.warnings.forEach(warn => {
            html += `<div class="validation-message warning">
                <strong>Ред ${warn.line}:</strong> ${escapeHtml(warn.message)}
            </div>`;
        });
    }
    
    if (result.slides.length > 0) {
        html += `<div class="validation-message success">
            <strong>Намерени ${result.slides.length} слайда:</strong><br>`;
        
        result.slides.forEach((slide, idx) => {
            html += `${idx + 1}. ${escapeHtml(slide.title || 'Без заглавие')} (${slide.type || 'без тип'})<br>`;
        });
        
        html += `</div>`;
    }
    
    output.innerHTML = html;
}

function handlePreview() {
    const content = document.getElementById('slim-editor').value;
    const result = validator.validate(content);
    
    if (!result.valid) {
        if (!confirm('Презентацията съдържа грешки. Искате ли да я видите въпреки това?')) {
            return;
        }
    }
    
    const modal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    let html = '<div class="preview-slides">';
    
    if (result.slides.length === 0) {
        html += '<p>Няма слайдове за показване</p>';
    } else {
        result.slides.forEach((slide, idx) => {
            html += generateSlidePreview(slide, idx + 1);
        });
    }
    
    html += '</div>';
    
    previewContent.innerHTML = html;
    modal.classList.add('active');
}

function generateSlidePreview(slide, number) {
    let html = `
        <div class="preview-slide" data-slide="${number}">
            <div class="slide-number">Слайд ${number}</div>
            <h2 class="slide-title">${escapeHtml(slide.title || 'Без заглавие')}</h2>
            <div class="slide-type-badge">${escapeHtml(slide.type || 'unknown')}</div>
            <div class="slide-content">
    `;
    
    switch (slide.type) {
        case 'title':
            html += `<div class="title-slide">`;
            if (slide.data.subtitle) {
                html += `<p class="subtitle">${escapeHtml(slide.data.subtitle)}</p>`;
            }
            if (slide.data.author) {
                html += `<p class="author">${escapeHtml(slide.data.author)}</p>`;
            }
            html += `</div>`;
            break;
            
        case 'text-only':
            if (slide.data.content) {
                html += `<p>${escapeHtml(slide.data.content)}</p>`;
            }
            break;
            
        case 'image-text':
        case 'image-left':
        case 'image-right':
            html += `<div class="image-text-slide">`;
            if (slide.data.image) {
                html += `<div class="image-placeholder">🖼️ ${escapeHtml(slide.data.image)}</div>`;
            }
            if (slide.data.text || slide.data.content) {
                html += `<p>${escapeHtml(slide.data.text || slide.data.content)}</p>`;
            }
            html += `</div>`;
            break;
            
        case 'code':
            const code = slide.data.code || slide.data.content || '';
            const lang = slide.data.language || 'text';
            html += `<pre><code class="language-${lang}">${escapeHtml(code)}</code></pre>`;
            break;
            
        case 'list':
            if (slide.data.items) {
                const items = slide.data.items.split(';');
                html += '<ul>';
                items.forEach(item => {
                    html += `<li>${escapeHtml(item.trim())}</li>`;
                });
                html += '</ul>';
            }
            break;
            
        default:
            html += `<p><em>Непознат тип слайд</em></p>`;
            
            if (Object.keys(slide.data).length > 0) {
                html += '<div class="slide-data"><strong>Данни:</strong><ul>';
                for (let [key, value] of Object.entries(slide.data)) {
                    html += `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`;
                }
                html += '</ul></div>';
            }
    }
    
    html += `
            </div>
        </div>
    `;
    
    return html;
}

function closePreview() {
    document.getElementById('preview-modal').classList.remove('active');
}

function handleThemeToggle() {
    document.body.classList.toggle('theme-dark');
    document.body.classList.toggle('theme-light');
    
    const isDark = document.body.classList.contains('theme-dark');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    
    showStatus(`Тема: ${isDark ? 'тъмна' : 'светла'}`, 'info');
}

function handleEditorInput(e) {
    fileManager.markDirty();
    updateFileStatus('editing');
    updateStatistics();
    highlighter.applyHighlighting();
    
    const content = e.target.value;
    document.getElementById('char-count').textContent = `${content.length} символа`;
}

function handleEditorKeydown(e) {
    if (e.key === 'Tab') {
        e.preventDefault();
        const start = e.target.selectionStart;
        const end = e.target.selectionEnd;
        const value = e.target.value;
        
        e.target.value = value.substring(0, start) + '    ' + value.substring(end);
        e.target.selectionStart = e.target.selectionEnd = start + 4;
        
        handleEditorInput(e);
    }
}

function handleTitleChange(e) {
    fileManager.markDirty();
    updateFileStatus('editing');
}

function handleTypeChange(e) {
    fileManager.markDirty();
    updateFileStatus('editing');
}

function handleTabSwitch(e) {
    const tabName = e.currentTarget.dataset.tab;
    
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    e.currentTarget.classList.add('active');
    document.querySelector(`[data-content="${tabName}"]`).classList.add('active');
}

function handleGlobalKeyboard(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleNew();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpen();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleValidate();
    }
    
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePreview();
    }
}

function updateCursorPosition() {
    const editor = document.getElementById('slim-editor');
    const position = editor.selectionStart;
    const text = editor.value.substring(0, position);
    const lines = text.split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    document.getElementById('cursor-position').textContent = `Ред: ${line}, Кол: ${col}`;
}

function updateStatistics() {
    const content = document.getElementById('slim-editor').value;
    const stats = validator.getStatistics(content);
    
    document.getElementById('slide-count').textContent = stats.slideCount;
    document.getElementById('line-count').textContent = stats.totalLines;
    
    const currentFile = fileManager.getCurrentFile();
    if (currentFile) {
        document.getElementById('current-type').textContent = currentFile.type;
    }
}

function updateFileStatus(status) {
    const statusIcon = document.getElementById('file-status');
    
    switch (status) {
        case 'saved':
            statusIcon.textContent = '●';
            statusIcon.style.color = 'var(--success)';
            statusIcon.classList.remove('saving');
            break;
        case 'editing':
            statusIcon.textContent = '●';
            statusIcon.style.color = 'var(--info)';
            statusIcon.classList.remove('saving');
            break;
        case 'saving':
            statusIcon.textContent = '●';
            statusIcon.style.color = 'var(--info)';
            statusIcon.classList.add('saving');
            break;
        case 'error':
            statusIcon.textContent = '●';
            statusIcon.style.color = 'var(--danger)';
            statusIcon.classList.remove('saving');
            break;
    }
}

function showStatus(message, type = 'info') {
    const statusEl = document.getElementById('status-message');
    statusEl.textContent = message;
    
    switch (type) {
        case 'success':
            statusEl.style.color = 'var(--success)';
            break;
        case 'error':
            statusEl.style.color = 'var(--danger)';
            break;
        case 'warning':
            statusEl.style.color = '#f59e0b';
            break;
        default:
            statusEl.style.color = 'var(--text-secondary)';
    }
    
    setTimeout(() => {
        statusEl.textContent = 'Готов';
        statusEl.style.color = 'var(--text-secondary)';
    }, 3000);
}

function showContextMenu(e, presentation) {
    const existing = document.querySelector('.context-menu');
    if (existing) {
        existing.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'context-menu';
    menu.style.position = 'fixed';
    menu.style.left = e.clientX + 'px';
    menu.style.top = e.clientY + 'px';
    menu.style.background = 'var(--bg-primary)';
    menu.style.border = '1px solid var(--border)';
    menu.style.borderRadius = 'var(--radius)';
    menu.style.boxShadow = 'var(--shadow-lg)';
    menu.style.padding = '8px';
    menu.style.zIndex = '1000';
    menu.style.minWidth = '150px';
    
    menu.innerHTML = `
        <div class="menu-item" onclick="loadPresentation('${presentation.id}')">
            📂 Отвори
        </div>
        <div class="menu-item" onclick="exportPresentation('${presentation.id}')">
            💾 Експортирай
        </div>
        <div class="menu-item" onclick="duplicatePresentation('${presentation.id}')">
            📋 Дублирай
        </div>
        <hr style="margin: 4px 0; border: none; border-top: 1px solid var(--border);">
        <div class="menu-item" style="color: var(--danger)" onclick="deletePresentation('${presentation.id}')">
            🗑️ Изтрий
        </div>
    `;
    
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', function closeMenu() {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        });
    }, 10);
}

function exportPresentation(id) {
    fileManager.export(id);
    showStatus('Презентацията е изтеглена', 'success');
}

function duplicatePresentation(id) {
    const original = fileManager.presentations.find(p => p.id === id);
    if (!original) return;
    
    const newTitle = `${original.title} (копие)`;
    const newPres = fileManager.createNew(newTitle, original.type);
    newPres.content = original.content;
    fileManager.save(newPres.content, newTitle);
    
    loadFileList();
    showStatus('Презентацията е дублирана', 'success');
}

function deletePresentation(id) {
    const presentation = fileManager.presentations.find(p => p.id === id);
    if (!presentation) return;
    
    if (!confirm(`Сигурни ли сте, че искате да изтриете "${presentation.title}"?`)) {
        return;
    }
    
    fileManager.delete(id);
    loadFileList();
    
    if (fileManager.currentFile === null || fileManager.currentFile.id === id) {
        document.getElementById('slim-editor').value = '';
        document.getElementById('presentation-title').value = '';
    }
    
    showStatus('Презентацията е изтрита', 'success');
}

function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (fileManager.hasUnsavedChanges() && fileManager.currentFile) {
            console.log('Auto-saving...');
            handleSave();
        }
    }, 30000); // 30 seconds
}

function loadLastOrCreateNew() {
    const presentations = fileManager.getAll();
    
    if (presentations.length > 0) {
        const sorted = [...presentations].sort((a, b) => 
            new Date(b.lastModified) - new Date(a.lastModified)
        );
        loadPresentation(sorted[0].id);
    } else {
        const newPres = fileManager.createNew('Моята първа презентация', 'lecture');
        loadPresentation(newPres.id);
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) { // < 1 minute
        return 'Сега';
    } else if (diff < 3600000) { // < 1 hour
        const mins = Math.floor(diff / 60000);
        return `Преди ${mins} мин`;
    } else if (diff < 86400000) { // < 1 day
        const hours = Math.floor(diff / 3600000);
        return `Преди ${hours} час${hours > 1 ? 'а' : ''}`;
    } else {
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    }
}

(function loadTheme() {
    const theme = localStorage.getItem('theme') || 'light';
    document.body.classList.add(`theme-${theme}`);
})();