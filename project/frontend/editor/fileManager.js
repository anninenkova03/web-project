class FileManager {
    constructor() {
        this.currentFile = null;
        this.presentations = [];
        this.isDirty = false;
        this.storageKey = 'presentations';
        this.loadFromStorage();
        this.createFileInput();
    }

    createFileInput() {
        const oldInput = document.getElementById('file-import-input');
        if (oldInput) {
            oldInput.remove();
        }
        
        const input = document.createElement('input');
        input.type = 'file';
        input.id = 'file-import-input';
        input.accept = '.pptx,.slim,.txt';
        input.style.display = 'none';
        input.multiple = false;
        document.body.appendChild(input);
        
        console.log('File input създаден');
        
        input.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) {
                console.log('Няма избран файл');
                return;
            }
            
            console.log(`Избран файл: ${file.name} (${(file.size/1024).toFixed(2)} KB)`);
            
            try {
                const presentation = await this.import(file);
                console.log('Файлът е импортиран успешно!');
                
                if (window.updateStatus) {
                    window.updateStatus(`Импортирано: ${presentation.title}`);
                }
                
                if (window.refreshFileList) {
                    window.refreshFileList();
                }
                if (window.loadPresentationInEditor) {
                    window.loadPresentationInEditor(presentation);
                }
                
                alert(`Успешно импортиран файл!\n\n Име: ${presentation.title}\n Слайдове: ${presentation.slideCount}\n Запазен в браузъра`);
                
            } catch (error) {
                console.error('Грешка при импорт:', error);
                alert(` Грешка при импорт на файл:\n\n${error.message}\n\nПроверете дали файлът е валиден .pptx, .slim или .txt формат.`);
            }
            
            input.value = '';
        });
        
        console.log('File input event listener добавен');
    }

    showImportDialog() {
        console.log('Търсене на file input...');
        const input = document.getElementById('file-import-input');
        
        if (!input) {
            console.error('File input не съществува! Създаваме нов...');
            this.createFileInput();
            setTimeout(() => this.showImportDialog(), 100);
            return;
        }
        
        console.log('File input намерен, отваряме dialog...');
        input.click();
        console.log('File picker dialog отворен');
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.presentations = JSON.parse(stored);
                console.log(`Заредени ${this.presentations.length} презентации`);
            } else {
                this.presentations = this.getDefaultPresentations();
                this.saveToStorage();
                console.log('Създадени примерни презентации');
            }
        } catch (e) {
            console.error('Грешка при зареждане:', e);
            this.presentations = this.getDefaultPresentations();
        }
    }

    saveToStorage() {
        try {
            const json = JSON.stringify(this.presentations);
            localStorage.setItem(this.storageKey, json);
            return true;
        } catch (e) {
            console.error('Грешка при запазване:', e);
            if (e.name === 'QuotaExceededError') {
                alert('Недостатъчна памет в браузъра!');
            }
            return false;
        }
    }

    clearStorage() {
        localStorage.removeItem(this.storageKey);
        this.presentations = [];
        this.currentFile = null;
        console.log('Storage изчистен');
    }

    createNew(title, type = 'lecture') {
        const id = this.generateId(title);
        const template = this.getTemplate(type);
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        
        const newPresentation = {
            id: id,
            user_id: currentUser ? currentUser.id : null,
            title: title || 'Нова презентация',
            type: type,
            content: template,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            slideCount: this.countSlides(template)
        };

        this.presentations.push(newPresentation);
        this.currentFile = newPresentation;
        this.isDirty = false;
        this.saveToStorage();

        console.log(`Създадена: ${title}`);
        return newPresentation;
    }

    load(id) {
        const presentation = this.presentations.find(p => p.id === id);
        if (presentation) {
            this.currentFile = presentation;
            this.isDirty = false;
            console.log(`Заредена: ${presentation.title}`);
            return presentation;
        }
        console.error(`Презентация "${id}" не съществува`);
        return null;
    }

    save(content, title) {
        if (!this.currentFile) {
            return this.createNew(title || 'Нова презентация');
        }

        this.currentFile.content = content;
        if (title && title.trim() !== '') {
            this.currentFile.title = title;
        }
        this.currentFile.lastModified = new Date().toISOString();
        this.currentFile.slideCount = this.countSlides(content);
        this.isDirty = false;

        this.saveToStorage();
        console.log(`Запазена: ${this.currentFile.title}`);
        return this.currentFile;
    }

    delete(id) {
        const index = this.presentations.findIndex(p => p.id === id);
        if (index !== -1) {
            const deleted = this.presentations[index];
            this.presentations.splice(index, 1);
            this.saveToStorage();
            
            if (this.currentFile && this.currentFile.id === id) {
                this.currentFile = null;
            }
            
            console.log(`Изтрита: ${deleted.title}`);
            return true;
        }
        return false;
    }

    duplicate(id) {
        const original = this.presentations.find(p => p.id === id);
        if (!original) return null;
        
        const newTitle = `${original.title} (копие)`;
        const newPres = this.createNew(newTitle, original.type);
        newPres.content = original.content;
        newPres.slideCount = original.slideCount;
        this.save(newPres.content, newTitle);
        
        console.log(`Дублирана: ${original.title}`);
        return newPres;
    }

    getAll() {
        return this.presentations;
    }

    filterByType(type) {
        return this.presentations.filter(p => p.type === type);
    }

    search(query) {
        if (!query || query.trim() === '') {
            return this.presentations;
        }
        
        query = query.toLowerCase();
        return this.presentations.filter(p => 
            p.title.toLowerCase().includes(query) ||
            p.content.toLowerCase().includes(query) ||
            p.type.toLowerCase().includes(query)
        );
    }

    sortByDate() {
        return [...this.presentations].sort((a, b) => 
            new Date(b.lastModified) - new Date(a.lastModified)
        );
    }

    sortByName() {
        return [...this.presentations].sort((a, b) => 
            a.title.localeCompare(b.title, 'bg')
        );
    }

    import(file) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        
        console.log(`Импортиране: ${file.name} (${fileExtension})`);
        
        if (fileExtension === 'pptx') {
            return this.importPPTX(file);
        } else if (fileExtension === 'slim' || fileExtension === 'txt') {
            return this.importText(file);
        } else {
            return Promise.reject(
                new Error('Неподдържан формат! Поддържат се: .pptx, .slim, .txt')
            );
        }
    }

    importText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const content = e.target.result;
                    const title = file.name.replace(/\.(slim|txt)$/i, '');
                    
                    const presentation = this.createNew(title, 'lecture');
                    presentation.content = content;
                    presentation.slideCount = this.countSlides(content);
                    this.save(content, title);
                    
                    console.log(`Импортиран текст: ${title}`);
                    resolve(presentation);
                } catch (error) {
                    reject(new Error('Грешка при обработка: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Грешка при четене'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    importPPTX(file) {
        return new Promise((resolve, reject) => {
            if (typeof JSZip === 'undefined') {
                reject(new Error('JSZip не е заредена! Проверете дали има:\n<script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"></script>'));
                return;
            }

            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    console.log('Парсване на PPTX...');
                    const arrayBuffer = e.target.result;
                    
                    const zip = await JSZip.loadAsync(arrayBuffer);
                    console.log('ZIP разархивиран');
                    
                    const slimContent = await this.parsePPTXToSlim(zip);
                    
                    const title = file.name.replace(/\.pptx$/i, '');
                    const presentation = this.createNew(title, 'lecture');
                    presentation.content = slimContent;
                    presentation.slideCount = this.countSlides(slimContent);
                    this.save(slimContent, title);
                    
                    console.log(`PPTX импортиран: ${title}`);
                    resolve(presentation);
                    
                } catch (error) {
                    console.error('Грешка при PPTX парсване:', error);
                    reject(new Error('Грешка при PPTX: ' + error.message));
                }
            };
            
            reader.onerror = () => reject(new Error('Грешка при четене на PPTX'));
            reader.readAsArrayBuffer(file);
        });
    }

    async parsePPTXToSlim(zip) {
        let slimContent = '';
        
        try {
            const slideFiles = [];
            const slidesFolder = zip.folder('ppt/slides');
            
            if (!slidesFolder) {
                throw new Error('Невалиден PPTX - липсва ppt/slides');
            }
            
            slidesFolder.forEach((relativePath, file) => {
                if (relativePath.match(/^slide\d+\.xml$/)) {
                    slideFiles.push({ 
                        name: relativePath, 
                        file: file,
                        number: parseInt(relativePath.match(/\d+/)[0])
                    });
                }
            });
            
            if (slideFiles.length === 0) {
                throw new Error('Няма слайдове в PPTX');
            }
            
            slideFiles.sort((a, b) => a.number - b.number);
            console.log(`Намерени ${slideFiles.length} слайда`);
            
            for (let i = 0; i < slideFiles.length; i++) {
                const slideXML = await slideFiles[i].file.async('text');
                const slideContent = this.parseSlideXML(slideXML, i);
                
                if (i > 0) {
                    slimContent += '\n#slide\n';
                }
                slimContent += slideContent;
            }
            
            console.log(`Парсирани ${slideFiles.length} слайда`);
            return slimContent;
            
        } catch (error) {
            console.error('Грешка при парсване:', error);
            
            return `#title Импортирана PowerPoint презентация
#type title
#data subtitle=Конвертирана от PPTX;author=Import

#slide
#title Забележка за импорта
#type text-only
#data content=Презентацията беше частично импортирана. Възникна грешка: ${error.message}. Моля, редактирайте ръчно.`;
        }
    }

    parseSlideXML(xml, slideIndex) {
        try {
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xml, 'text/xml');
            
            const parseError = xmlDoc.querySelector('parsererror');
            if (parseError) {
                throw new Error('Невалиден XML');
            }
            
            const textElements = xmlDoc.getElementsByTagName('a:t');
            const texts = [];
            
            for (let elem of textElements) {
                const text = elem.textContent.trim();
                if (text && text.length > 0) {
                    texts.push(text);
                }
            }
            
            if (texts.length === 0) {
                return `#title Слайд ${slideIndex + 1}
#type text-only
#data content=Празен слайд`;
            }
            
            const title = texts[0];
            const restTexts = texts.slice(1);
            
            let slideType = 'text-only';
            let dataStr = '';
            
            if (slideIndex === 0 && texts.length <= 3) {
                slideType = 'title';
                const subtitle = restTexts[0] || '';
                const author = restTexts[1] || 'Импортирано от PPTX';
                dataStr = `subtitle=${this.escapeSlimData(subtitle)};author=${this.escapeSlimData(author)}`;
                
            } else if (restTexts.length === 0) {
                slideType = 'text-only';
                dataStr = `content=Само заглавие`;
                
            } else if (restTexts.length >= 4) {
                slideType = 'list';
                const items = restTexts
                    .map(t => this.escapeSlimData(t))
                    .join(';');
                dataStr = `items=${items}`;
                
            } else {
                slideType = 'text-only';
                const content = restTexts.join(' ');
                dataStr = `content=${this.escapeSlimData(content)}`;
            }
            
            return `#title ${this.escapeSlimData(title)}
#type ${slideType}
#data ${dataStr}`;
            
        } catch (error) {
            console.error(`Грешка при слайд ${slideIndex}:`, error);
            return `#title Слайд ${slideIndex + 1}
#type text-only
#data content=Грешка при импорт`;
        }
    }

    escapeSlimData(text) {
        if (!text) return '';
        
        return text
            .replace(/\n/g, ' ')
            .replace(/\r/g, '')
            .replace(/;/g, ',')
            .replace(/=/g, ':')
            .replace(/\s+/g, ' ')
            .trim();
    }

    export(id, format = 'slim') {
        const presentation = this.presentations.find(p => p.id === id);
        if (!presentation) {
            console.error('Презентация не е намерена');
            return null;
        }

        const filename = `${presentation.id}.${format}`;
        const content = presentation.content;

        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        console.log(`Експортирана: ${filename}`);
        return { filename, content, size: content.length };
    }

    generateId(title) {
        const base = title
            .toLowerCase()
            .replace(/[^a-z0-9а-я]+/gi, '-')
            .replace(/^-|-$/g, '')
            .substring(0, 50);
        
        let id = base;
        let counter = 1;
        
        while (this.presentations.find(p => p.id === id)) {
            id = `${base}-${counter}`;
            counter++;
        }
        
        return id;
    }

    getDefaultPresentations() {
        const currentUser = JSON.parse(localStorage.getItem('currentUser'));
        return [
            {
                id: 'intro-webtech',
                user_id: currentUser ? currentUser.id : null,
                title: 'Въведение в Web Technologies',
                type: 'lecture',
                content: `#title Въведение в Web Technologies
#type title
#data subtitle=Лекция 1 - Основи;author=Преподавател

#slide
#title HTML Основи
#type text-only
#data content=HTML е маркиращ език за създаване на уеб страници

#slide
#title CSS Стилизиране
#type text-only
#data content=CSS се използва за стилизиране на HTML елементи

#slide
#title JavaScript
#type code
#data language=javascript;code=console.log('Hello, World!');

#slide
#title Уеб технологии
#type list
#data items=HTML;CSS;JavaScript;PHP;MySQL`,
                lastModified: new Date().toISOString(),
                created: new Date().toISOString(),
                slideCount: 5
            }
        ];
    }

    getTemplate(type) {
        const templates = {
            lecture: `#title Заглавие на лекцията
#type title
#data subtitle=Подзаглавие;author=Име

#slide
#title Въведение
#type text-only
#data content=Въведение в темата...

#slide
#title Основни понятия
#type list
#data items=Понятие 1;Понятие 2;Понятие 3`,

            tutorial: `#title Заглавие на упражнение
#type title
#data subtitle=Практическо упражнение;author=Име

#slide
#title Стъпка 1
#type text-only
#data content=Описание...`,

            project: `#title Име на проект
#type title
#data subtitle=Курсов проект;author=Екип

#slide
#title Цели
#type list
#data items=Цел 1;Цел 2;Цел 3`,

            demo: `#title Демонстрация
#type title
#data subtitle=Live Demo;author=Име

#slide
#title Преглед
#type text-only
#data content=Кратък преглед...`
        };

        return templates[type] || templates.lecture;
    }

    countSlides(content) {
        if (!content) return 0;
        
        const lines = content.split('\n');
        let count = 0;
        let hasFirstSlide = false;
        
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('#title') && !hasFirstSlide) {
                hasFirstSlide = true;
                count = 1;
            } else if (line.startsWith('#slide')) {
                count++;
            }
        }
        
        return count;
    }

    markDirty() {
        this.isDirty = true;
    }

    hasUnsavedChanges() {
        return this.isDirty;
    }

    getCurrentFile() {
        return this.currentFile;
    }

    getStatistics() {
        const total = this.presentations.length;
        const byType = {};
        
        this.presentations.forEach(p => {
            byType[p.type] = (byType[p.type] || 0) + 1;
        });
        
        const totalSlides = this.presentations.reduce(
            (sum, p) => sum + (p.slideCount || 0), 
            0
        );
        
        return {
            totalPresentations: total,
            totalSlides: totalSlides,
            byType: byType,
            storageUsed: this.getStorageSize()
        };
    }

    getStorageSize() {
        const json = JSON.stringify(this.presentations);
        const bytes = new Blob([json]).size;
        const kb = (bytes / 1024).toFixed(2);
        return `${kb} KB`;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileManager;
}

if (typeof window !== 'undefined') {
    window.FileManager = FileManager;
}
