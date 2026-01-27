let fileManager;
let validator;
let autoSaveInterval;
let currentTheme = 'light';

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Editor initialization...');
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
    
    console.log('✅ Editor ready!');
    updateStatus('Готов за работа');
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

function setupEventListeners() {
    document.getElementById('btn-new').addEventListener('click', handleNew);
    document.getElementById('btn-open').addEventListener('click', handleOpen);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-validate').addEventListener('click', handleValidate);
    document.getElementById('btn-preview').addEventListener('click', handlePreview);
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);
    document.getElementById('btn-refresh').addEventListener('click', loadFileList);
    
    const editor = document.getElementById('slim-editor');
    editor.addEventListener('input', handleEditorChange);
    editor.addEventListener('keyup', updateCursorPosition);
    editor.addEventListener('click', updateCursorPosition);
    
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
    updateStatus(`✅ Създадена: ${title}`);
}

function handleOpen() {
    console.log('📂 Отваряне на file picker...');
    fileManager.showImportDialog();
}

function handleSave() {
    const editor = document.getElementById('slim-editor');
    const titleInput = document.getElementById('presentation-title');
    
    const content = editor.value;
    const title = titleInput.value || 'Без име';
    
    if (!content.trim()) {
        alert('⚠️ Няма съдържание за запазване!');
        return;
    }
    
    fileManager.save(content, title);
    
    document.getElementById('file-status').textContent = '✓';
    document.getElementById('file-status').style.color = 'var(--success)';
    
    loadFileList();
    updateStatus(`💾 Запазена: ${title}`);
    showStatus('Презентацията е запазена', 'success');
}

function handleValidate() {
    if (!validator) {
        alert('❌ Validator не е зареден!');
        return;
    }
    
    const editor = document.getElementById('slim-editor');
    const content = editor.value;
    
    if (!content.trim()) {
        alert('⚠️ Няма съдържание за валидиране!');
        return;
    }
    
    try {
        const result = validator.validate(content);
        displayValidationResults(result);
        updateStatus(result.isValid ? '✅ Валидна презентация' : '⚠️ Има грешки');
    } catch (error) {
        console.error('Грешка при валидация:', error);
        alert('❌ Грешка при валидация: ' + error.message);
    }
}

function handlePreview() {
    const editor = document.getElementById('slim-editor');
    const content = editor.value;
    
    if (!content.trim()) {
        alert('⚠️ Няма съдържание за преглед!');
        return;
    }
    
    const slides = parseSlimContent(content);
    const modal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');
    
    previewContent.innerHTML = generatePreviewHTML(slides);
    modal.classList.add('active');
    
    updateStatus('👁️ Преглед на презентация');
}

function closePreview() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('active');
}

function handleEditorChange() {
    const editor = document.getElementById('slim-editor');
    const content = editor.value;
    
    document.getElementById('char-count').textContent = `${content.length} символа`;
    
    const slideCount = fileManager.countSlides(content);
    document.getElementById('slide-count').textContent = slideCount;
    
    const lineCount = content.split('\n').length;
    document.getElementById('line-count').textContent = lineCount;
    
    fileManager.markDirty();
    document.getElementById('file-status').textContent = '●';
    document.getElementById('file-status').style.color = 'var(--warning)';
}

function handleTitleChange() {
    fileManager.markDirty();
}

function handleTypeChange(e) {
    const currentFile = fileManager.getCurrentFile();
    if (currentFile) {
        currentFile.type = e.target.value;
        document.getElementById('current-type').textContent = e.target.value;
    }
}

function updateCursorPosition() {
    const editor = document.getElementById('slim-editor');
    const text = editor.value.substring(0, editor.selectionStart);
    const lines = text.split('\n');
    const row = lines.length;
    const col = lines[lines.length - 1].length + 1;
    
    document.getElementById('cursor-position').textContent = `Ред: ${row}, Кол: ${col}`;
}

function loadFileList() {
    const fileList = document.getElementById('file-list');
    const presentations = fileManager.sortByDate();
    
    if (presentations.length === 0) {
        fileList.innerHTML = `
            <div style="padding: 20px; text-align: center; color: var(--text-secondary);">
                <p>Няма презентации</p>
                <small>Създайте нова или импортирайте файл</small>
            </div>
        `;
        return;
    }
    
    fileList.innerHTML = presentations.map(p => {
        const isActive = p.id === fileManager.getCurrentFile()?.id;
        return `
            <div class="file-item ${isActive ? 'active' : ''}" 
                 data-id="${p.id}"
                 onclick="loadPresentation('${p.id}')"
                 oncontextmenu="showContextMenu(event, '${p.id}'); return false;">
                <div class="file-name">${escapeHtml(p.title)}</div>
                <div class="file-meta">
                    ${p.slideCount} слайда • ${p.type}
                    <br>
                    <small>${formatDate(p.lastModified)}</small>
                </div>
            </div>
        `;
    }).join('');
}

function loadPresentation(id) {
    const presentation = fileManager.load(id);
    if (presentation) {
        loadPresentationInEditor(presentation);
        updateStatus(`📂 Заредена: ${presentation.title}`);
    }
}

function loadPresentationInEditor(presentation) {
    if (!presentation) return;
    
    document.getElementById('presentation-title').value = presentation.title;
    document.getElementById('slim-editor').value = presentation.content;
    document.getElementById('presentation-type').value = presentation.type;
    
    document.getElementById('slide-count').textContent = presentation.slideCount;
    document.getElementById('current-type').textContent = presentation.type;
    document.getElementById('char-count').textContent = `${presentation.content.length} символа`;
    document.getElementById('line-count').textContent = presentation.content.split('\n').length;
    
    document.getElementById('file-status').textContent = '✓';
    document.getElementById('file-status').style.color = 'var(--success)';
    
    loadFileList();
}

function showContextMenu(e, presentationId) {
    e.preventDefault();
    e.stopPropagation();
    
    const presentation = fileManager.getAll().find(p => p.id === presentationId);
    if (!presentation) return;
    
    const oldMenu = document.getElementById('context-menu');
    if (oldMenu) oldMenu.remove();
    
    const menu = document.createElement('div');
    menu.id = 'context-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: #7c86f0ff;
        border: 2px solid var(--border);
        border-radius: var(--radius);
        box-shadow: var(--shadow-xl);
        padding: 8px;
        z-index: 10000;
        min-width: 200px;
        animation: fadeIn 0.15s ease;
    `;
    
    menu.innerHTML = `
        <style>
            #context-menu .menu-item {
                padding: 12px 16px;
                cursor: pointer;
                border-radius: 8px;
                transition: all 0.2s;
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.95rem;
                font-weight: 500;
                color: var(--text-primary);
            }
            #context-menu .menu-item:hover {
                background: var(--bg-tertiary);
                transform: translateX(4px);
            }
            #context-menu .menu-item.danger {
                color: var(--danger);
            }
            #context-menu .menu-item.danger:hover {
                background: var(--danger);
                color: white;
            }
            #context-menu hr {
                margin: 6px 0;
                border: none;
                border-top: 2px solid var(--border);
            }
        </style>
        <div class="menu-item" onclick="loadPresentation('${presentation.id}'); closeContextMenu();">
            <span style="font-size: 1.2rem;">📂</span> Отвори
        </div>
        <div class="menu-item" onclick="exportPresentation('${presentation.id}'); closeContextMenu();">
            <span style="font-size: 1.2rem;">💾</span> Експортирай
        </div>
        <div class="menu-item" onclick="duplicatePresentation('${presentation.id}'); closeContextMenu();">
            <span style="font-size: 1.2rem;">📋</span> Дублирай
        </div>
        <hr>
        <div class="menu-item danger" onclick="deletePresentation('${presentation.id}'); closeContextMenu();">
            <span style="font-size: 1.2rem;">🗑️</span> Изтрий
        </div>
    `;
    
    document.body.appendChild(menu);
    
    setTimeout(() => {
        document.addEventListener('click', closeContextMenu);
        document.addEventListener('contextmenu', closeContextMenu);
    }, 10);
}

function closeContextMenu() {
    const menu = document.getElementById('context-menu');
    if (menu) menu.remove();
    document.removeEventListener('click', closeContextMenu);
    document.removeEventListener('contextmenu', closeContextMenu);
}

function deletePresentation(id) {
    const presentation = fileManager.getAll().find(p => p.id === id);
    if (!presentation) return;
    
    if (!confirm(`🗑️ Сигурни ли сте, че искате да изтриете:\n\n"${presentation.title}"\n\nТова действие не може да бъде отменено!`)) {
        return;
    }
    
    fileManager.delete(id);
    loadFileList();
    
    if (fileManager.getCurrentFile()?.id === id) {
        const remaining = fileManager.getAll();
        if (remaining.length > 0) {
            loadPresentationInEditor(remaining[0]);
        } else {
            document.getElementById('slim-editor').value = '';
            document.getElementById('presentation-title').value = '';
            document.getElementById('slide-count').textContent = '0';
            document.getElementById('char-count').textContent = '0 символа';
            document.getElementById('line-count').textContent = '0';
        }
    }
    
    updateStatus(`🗑️ Изтрита: ${presentation.title}`);
    showStatus('Презентацията е изтрита', 'success');
}

function duplicatePresentation(id) {
    const newPresentation = fileManager.duplicate(id);
    if (newPresentation) {
        loadFileList();
        loadPresentationInEditor(newPresentation);
        updateStatus(`📋 Дублирана презентация`);
        showStatus('Презентацията е дублирана', 'success');
    }
}

function exportPresentation(id) {
    const result = fileManager.export(id, 'slim');
    if (result) {
        updateStatus(`💾 Експортирана: ${result.filename}`);
        showStatus('Презентацията е изтеглена', 'success');
    }
}

function displayValidationResults(result) {
    const output = document.getElementById('validation-output');
    
    if (result.isValid) {
        output.innerHTML = `
            <div class="validation-message success">
                <strong>✅ Валидна презентация!</strong>
                <p>Няма открити грешки.</p>
            </div>
            <div class="validation-message success">
                <strong>Статистика:</strong>
                <p>Слайдове: ${result.slideCount}</p>
            </div>
        `;
    } else {
        const errorsHTML = result.errors.map(err => `
            <div class="validation-message error">
                <strong>❌ Грешка на ред ${err.line}</strong>
                <p>${escapeHtml(err.message)}</p>
            </div>
        `).join('');
        
        const warningsHTML = result.warnings.map(warn => `
            <div class="validation-message warning">
                <strong>⚠️ Предупреждение на ред ${warn.line}</strong>
                <p>${escapeHtml(warn.message)}</p>
            </div>
        `).join('');
        
        output.innerHTML = errorsHTML + warningsHTML;
    }
}

function parseSlimContent(content) {
    const lines = content.split('\n');
    const slides = [];
    let currentSlide = null;
    
    for (let line of lines) {
        line = line.trim();
        
        if (line.startsWith('#slide') || (line.startsWith('#title') && !currentSlide)) {
            if (currentSlide) slides.push(currentSlide);
            currentSlide = { title: '', type: 'text-only', data: {} };
        }
        
        if (currentSlide) {
            if (line.startsWith('#title ')) {
                currentSlide.title = line.substring(7);
            } else if (line.startsWith('#type ')) {
                currentSlide.type = line.substring(6);
            } else if (line.startsWith('#data ')) {
                const dataStr = line.substring(6);
                const pairs = dataStr.split(';');
                pairs.forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        currentSlide.data[key.trim()] = value.trim();
                    }
                });
            }
        }
    }
    
    if (currentSlide) slides.push(currentSlide);
    return slides;
}

function generatePreviewHTML(slides) {
    return slides.map((slide, index) => `
        <div class="preview-slide" style="
            margin-bottom: 30px;
            padding: 30px;
            background: var(--bg-card);
            border-radius: var(--radius-lg);
            border: 2px solid var(--border);
        ">
            <h3 style="color: var(--primary); margin-bottom: 20px;">
                Слайд ${index + 1}: ${escapeHtml(slide.title)}
            </h3>
            <p style="color: var(--text-secondary); margin-bottom: 10px;">
                <strong>Тип:</strong> ${slide.type}
            </p>
            ${generateSlideContent(slide)}
        </div>
    `).join('');
}

function generateSlideContent(slide) {
    switch (slide.type) {
        case 'title':
            return `
                <div style="text-align: center; padding: 40px;">
                    <h1 style="font-size: 2.5rem; margin-bottom: 20px;">${escapeHtml(slide.title)}</h1>
                    ${slide.data.subtitle ? `<h2 style="font-size: 1.5rem; color: var(--text-secondary);">${escapeHtml(slide.data.subtitle)}</h2>` : ''}
                    ${slide.data.author ? `<p style="margin-top: 20px; color: var(--text-muted);">${escapeHtml(slide.data.author)}</p>` : ''}
                </div>
            `;
        case 'text-only':
            return `<div style="padding: 20px;"><p style="font-size: 1.1rem; line-height: 1.8;">${escapeHtml(slide.data.content || '')}</p></div>`;
        case 'list':
            const items = slide.data.items ? slide.data.items.split(';') : [];
            return `<ul style="padding: 20px; font-size: 1.1rem; line-height: 2;">${items.map(item => `<li>${escapeHtml(item)}</li>`).join('')}</ul>`;
        case 'code':
            return `
                <pre style="background: var(--bg-tertiary); padding: 20px; border-radius: var(--radius); overflow-x: auto;"><code>${escapeHtml(slide.data.code || '')}</code></pre>
                ${slide.data.content ? `<p style="margin-top: 15px; color: var(--text-secondary);">${escapeHtml(slide.data.content)}</p>` : ''}
            `;
        default:
            return `<p>Тип: ${slide.type}</p>`;
    }
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(currentTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('theme', theme);
    
    const icon = document.querySelector('#btn-theme .icon');
    if (icon) {
        icon.textContent = theme === 'dark' ? '☀️' : '🌓';
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);
}

function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.toggle('active', tab.dataset.tab === tabName);
    });
    
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.dataset.content === tabName);
    });
}

function handleKeyboardShortcuts(e) {
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
    if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        handlePreview();
    }
}


function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (fileManager.hasUnsavedChanges() && fileManager.getCurrentFile()) {
            console.log('💾 Auto-saving...');
            handleSave();
        }
    }, 30000);
}

function loadLastOrCreateNew() {
    const presentations = fileManager.getAll();
    
    if (presentations.length > 0) {
        const sorted = fileManager.sortByDate();
        loadPresentation(sorted[0].id);
    } else {
        const newPres = fileManager.createNew('Моята първа презентация', 'lecture');
        loadPresentation(newPres.id);
    }
}

function updateStatus(message) {
    document.getElementById('status-message').textContent = message;
}

function showStatus(message, type) {
    updateStatus(message);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(isoString) {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Току-що';
    if (diffMins < 60) return `Преди ${diffMins} мин`;
    if (diffHours < 24) return `Преди ${diffHours} ч`;
    if (diffDays < 7) return `Преди ${diffDays} дни`;
    
    return date.toLocaleDateString('bg-BG');
}

// Глобални функции за onclick
window.loadPresentation = loadPresentation;
window.loadFileList = loadFileList;
window.loadPresentationInEditor = loadPresentationInEditor;
window.updateStatus = updateStatus;
window.deletePresentation = deletePresentation;
window.duplicatePresentation = duplicatePresentation;
window.exportPresentation = exportPresentation;
window.showContextMenu = showContextMenu;
window.closeContextMenu = closeContextMenu;

console.log('📝 Editor script loaded');
