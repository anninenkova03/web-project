// ==================== EDITOR – DIRECT DATABASE SAVE ====================
let fileManager;
let validator;
let autoSaveInterval;
let currentTheme = 'light';

// ---------- Initialization ----------
document.addEventListener('DOMContentLoaded', function() {
    console.log('Editor initialization...');

    if (typeof authService === 'undefined' || !authService.isAuthenticated()) {
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

    // ❌ Hide the "Generate" button completely
    const generateBtn = document.getElementById('btn-generate');
    if (generateBtn) generateBtn.style.display = 'none';
}

function setupEventListeners() {
    // Buttons
    document.getElementById('btn-new').addEventListener('click', handleNew);
    document.getElementById('btn-open').addEventListener('click', handleOpen);
    document.getElementById('btn-save').addEventListener('click', handleSave);
    document.getElementById('btn-validate').addEventListener('click', handleValidate);
    document.getElementById('btn-preview').addEventListener('click', handlePreview);
    document.getElementById('btn-theme').addEventListener('click', toggleTheme);
    document.getElementById('btn-refresh').addEventListener('click', loadFileList);

    // Dashboard navigation
    const dashboardBtn = document.getElementById('btn-dashboard');
    if (dashboardBtn) {
        dashboardBtn.addEventListener('click', () => {
            window.location.href = '../dashboard/dashboard.html';
        });
    }

    // Editor input
    const editor = document.getElementById('slim-editor');
    editor.addEventListener('input', handleEditorChange);
    editor.addEventListener('keyup', updateCursorPosition);
    editor.addEventListener('click', updateCursorPosition);

    // Metadata changes
    document.getElementById('presentation-title').addEventListener('input', handleTitleChange);
    document.getElementById('presentation-type').addEventListener('change', handleTypeChange);

    // Tabs
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // Preview modal
    document.getElementById('close-preview').addEventListener('click', closePreview);
    document.getElementById('preview-modal').addEventListener('click', (e) => {
        if (e.target.id === 'preview-modal') closePreview();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// ---------- File operations ----------
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
    const typeSelect = document.getElementById('presentation-type');

    const content = editor.value;
    const title = titleInput.value || 'Без име';
    const type = typeSelect.value;

    if (!content.trim()) {
        alert('Няма съдържание за запазване!');
        return;
    }

    // 1. Save locally
    const savedPresentation = fileManager.save(content, title);
    if (savedPresentation) {
        savedPresentation.type = type;
        fileManager.update(savedPresentation);
    }

    updateStatus(`💾 Запазена локално: ${title}`);
    showStatus('Запазване в облака...', 'info');

    // 2. Sync with backend
    try {
        const presentation = fileManager.getCurrentFile();
        if (!presentation) throw new Error('Няма активна презентация');

        // Prepare data for API
        const presentationData = {
            title: presentation.title,
            type: presentation.type,
            content: presentation.content,
            description: extractDescription(presentation.content)
        };

        let serverResponse;
        
        if (presentation.serverId) {
            // ✅ UPDATE existing presentation
            serverResponse = await apiService.request(`/api/presentation?id=${presentation.serverId}`, {
                method: 'PUT',
                body: JSON.stringify(presentationData)
            });
            showStatus('Презентацията е обновена в облака', 'success');
        } else {
            // ✅ CREATE – inject #presentation and #presentationType so SlimParser
            // reads the correct title/type (otherwise defaults to Untitled/lecture)
            const slimWithMeta = buildSlimWithMeta(
                presentation.content,
                presentation.title,
                presentation.type
            );
            serverResponse = await apiService.request('/api/generate', {
                method: 'POST',
                body: JSON.stringify({ slim: slimWithMeta })
            });
            
            // Extract the new presentation ID (adjust path based on your backend response)
            const newId = serverResponse.data?.id || serverResponse.id;
            if (newId) {
                presentation.serverId = newId;
                fileManager.update(presentation);
                showStatus('Презентацията е качена в облака', 'success');
            } else {
                throw new Error('Невалиден отговор от сървъра – липсва ID');
            }
        }

        updateStatus(`☁️ Запазена в облак: ${title}`);
    } catch (error) {
        console.error('Backend save error:', error);
        showStatus('❌ Грешка при запазване в облак: ' + error.message, 'error');
        // Local save still succeeded
    } finally {
        loadFileList();
    }
}

// Helper: extract first few lines as description
function extractDescription(content) {
    const lines = content.split('\n').filter(l => l.trim() && !l.startsWith('#'));
    return lines.slice(0, 2).join(' ').substring(0, 200) || 'Няма описание';
}

// Helper: prepend #presentation and #presentationType so SlimParser
// on the backend reads the correct title and type from the editor fields.
// Also removes any manually written #presentation / #presentationType lines
// so they are never duplicated.
function buildSlimWithMeta(content, title, type) {
    const cleaned = content
        .split('\n')
        .filter(l => {
            const t = l.trimStart();
            return !t.startsWith('#presentation ') &&
                   !t.startsWith('#presentationType ') &&
                   t !== '#presentation' &&
                   t !== '#presentationType';
        })
        .join('\n');

    return `#presentation ${title}\n#presentationType ${type}\n${cleaned}`;
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
    const output = document.getElementById('validation-output');

    if (result.isValid) {
        output.innerHTML = `
            <div class="validation-message success">
                <strong>✓ Валидна презентация!</strong>
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
                <strong>Грешка на ред ${err.line}</strong>
                <p>${escapeHtml(err.message)}</p>
            </div>
        `).join('');

        const warningsHTML = result.warnings.map(warn => `
            <div class="validation-message warning">
                <strong>Предупреждение на ред ${warn.line}</strong>
                <p>${escapeHtml(warn.message)}</p>
            </div>
        `).join('');

        output.innerHTML = errorsHTML + warningsHTML;
    }
}

function handlePreview() {
    const editor = document.getElementById('slim-editor');
    const content = editor.value;

    if (!content.trim()) {
        alert('Няма съдържание за преглед!');
        return;
    }

    const slides = parseSlimContent(content);
    const modal = document.getElementById('preview-modal');
    const previewContent = document.getElementById('preview-content');

    previewContent.innerHTML = generatePreviewHTML(slides);
    modal.classList.add('active');

    updateStatus('Преглед на презентация');
}

function closePreview() {
    const modal = document.getElementById('preview-modal');
    modal.classList.remove('active');
}

// ---------- Editor state ----------
function handleEditorChange() {
    const editor = document.getElementById('slim-editor');
    const content = editor.value;

    document.getElementById('char-count').textContent = `${content.length} символа`;
    const slideCount = fileManager.countSlides(content);
    document.getElementById('slide-count').textContent = slideCount;
    const lineCount = content.split('\n').length;
    document.getElementById('line-count').textContent = lineCount;

    fileManager.markDirty();
    updateFileStatus();
}

function handleTitleChange() {
    fileManager.markDirty();
    updateFileStatus();
}

function handleTypeChange(e) {
    const currentFile = fileManager.getCurrentFile();
    if (currentFile) {
        currentFile.type = e.target.value;
        document.getElementById('current-type').textContent = e.target.value;
        fileManager.markDirty();
        updateFileStatus();
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

function updateFileStatus() {
    const status = document.getElementById('file-status');
    if (fileManager && fileManager.hasUnsavedChanges()) {
        status.textContent = '● Незапазено';
        status.style.color = '#ff6b6b';
    } else {
        status.textContent = '✓ Запазено';
        status.style.color = '#51cf66';
    }
}

// ---------- File list & context menu ----------
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
        const cloudIcon = p.serverId ? '☁️ ' : '';
        return `
            <div class="file-item ${isActive ? 'active' : ''}"
                 data-id="${p.id}"
                 onclick="loadPresentation('${p.id}')"
                 oncontextmenu="showContextMenu(event, '${p.id}'); return false;">
                <div class="file-name">${cloudIcon}${escapeHtml(p.title)}</div>
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

    fileManager.markSaved();
    updateFileStatus();
    loadFileList();
}

// ---------- Context menu (unchanged) ----------
function showContextMenu(e, presentationId) {
    // ... (same as before, no changes needed)
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
        z-index: 10000;
    `;

    menu.innerHTML = `
        <div class="context-menu-header">
            <span>${escapeHtml(presentation.title)}</span>
        </div>
        <div class="context-menu-items">
            <div class="menu-item" onclick="loadPresentation('${presentation.id}'); closeContextMenu();">
                <span>📂</span> Отвори
            </div>
            <div class="menu-item" onclick="exportPresentation('${presentation.id}'); closeContextMenu();">
                <span>💾</span> Експортирай
            </div>
            <div class="menu-item" onclick="duplicatePresentation('${presentation.id}'); closeContextMenu();">
                <span>📋</span> Дублирай
            </div>
            <hr>
            <div class="menu-item" onclick="viewInDashboard('${presentation.id}'); closeContextMenu();">
                <span>👁️</span> Виж в Dashboard
            </div>
            <hr>
            <div class="menu-item danger" onclick="deletePresentation('${presentation.id}'); closeContextMenu();">
                <span>🗑️</span> Изтрий
            </div>
        </div>
    `;

    document.body.appendChild(menu);
    setTimeout(() => {
        const rect = menu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            menu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            menu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
    }, 0);
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

    if (!confirm(`Сигурни ли сте, че искате да изтриете:\n\n"${presentation.title}"\n\nТова действие не може да бъде отменено!`)) {
        return;
    }

    // Also delete from server if it exists there
    if (presentation.serverId) {
        apiService.deletePresentation(presentation.serverId).catch(console.error);
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

    updateStatus(`Изтрита: ${presentation.title}`);
    showStatus('Презентацията е изтрита', 'success');
}

function duplicatePresentation(id) {
    const newPresentation = fileManager.duplicate(id);
    if (newPresentation) {
        loadFileList();
        loadPresentationInEditor(newPresentation);
        updateStatus(`Дублирана презентация`);
        showStatus('Презентацията е дублирана', 'success');
    }
}

function exportPresentation(id) {
    const result = fileManager.export(id, 'slim');
    if (result) {
        updateStatus(`Експортирана: ${result.filename}`);
        showStatus('Презентацията е изтеглена', 'success');
    }
}

function viewInDashboard(id) {
    handleSave().then(() => {
        window.location.href = `../dashboard/dashboard.html`;
    });
}

// ---------- Preview parsing (unchanged) ----------
function parseSlimContent(content) {
    // ... (same as before)
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
    // ... (same as before)
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
    // ... (same as before)
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

// ---------- Theme ----------
function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    setTheme(currentTheme);
}

function setTheme(theme) {
    currentTheme = theme;
    document.body.className = `theme-${theme}`;
    localStorage.setItem('editor-theme', theme);
    const icon = document.querySelector('#btn-theme .icon');
    if (icon) icon.textContent = theme === 'dark' ? '☀️' : '🌓';
}

function loadTheme() {
    const savedTheme = localStorage.getItem('editor-theme') || 'light';
    setTheme(savedTheme);
}

// ---------- UI helpers ----------
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
    if (e.key === 'Escape') {
        closePreview();
    }
}

// ---------- Auto-save ----------
function startAutoSave() {
    autoSaveInterval = setInterval(() => {
        if (fileManager.hasUnsavedChanges() && fileManager.getCurrentFile()) {
            console.log('💾 Auto-saving...');
            handleSave();
        }
    }, 30000);
}

// ---------- Session management ----------
function loadLastOrCreateNew() {
    const urlParams = new URLSearchParams(window.location.search);
    const loadId = urlParams.get('load');

    if (loadId) {
        const presentationId = Number(loadId);
        const presentations = fileManager.getAll();
        const toLoad = presentations.find(p => p.id === presentationId);
        if (toLoad) {
            loadPresentation(toLoad.id);
            updateStatus(`📂 Заредена от линк: ${toLoad.title}`);
            return;
        }
    }

    const presentations = fileManager.getAll();
    if (presentations.length > 0) {
        const sorted = fileManager.sortByDate();
        loadPresentation(sorted[0].id);
    } else {
        const newPres = fileManager.createNew('Моята първа презентация', 'lecture');
        loadPresentation(newPres.id);
    }
}

// ---------- Status & notifications ----------
function updateStatus(message) {
    document.getElementById('status-message').textContent = message;
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

// ---------- Utilities ----------
function escapeHtml(text) {
    if (!text) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
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

// ---------- Beforeunload warning ----------
window.addEventListener('beforeunload', (e) => {
    if (fileManager && fileManager.hasUnsavedChanges()) {
        e.preventDefault();
        return '';
    }
});

// ---------- Expose functions to global scope ----------
window.loadPresentation = loadPresentation;
window.loadFileList = loadFileList;
window.loadPresentationInEditor = loadPresentationInEditor;
window.updateStatus = updateStatus;
window.deletePresentation = deletePresentation;
window.duplicatePresentation = duplicatePresentation;
window.exportPresentation = exportPresentation;
window.viewInDashboard = viewInDashboard;
window.showContextMenu = showContextMenu;
window.closeContextMenu = closeContextMenu;

console.log('Editor script loaded (direct database save)');