class FileManager {
    constructor() {
        this.currentFile = null;
        this.presentations = [];
        this.isDirty = false; 
        
        this.storageKey = 'slim_presentations';
        
        this.loadFromStorage();
    }

    loadFromStorage() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                this.presentations = JSON.parse(stored);
            } else {
                this.presentations = this.getDefaultPresentations();
                this.saveToStorage();
            }
        } catch (e) {
            console.error('Грешка при зареждане:', e);
            this.presentations = this.getDefaultPresentations();
        }
    }

    saveToStorage() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.presentations));
            return true;
        } catch (e) {
            console.error('Грешка при запазване:', e);
            return false;
        }
    }

    getDefaultPresentations() {
        return [
            {
                id: 'intro-webtech',
                title: 'Въведение в Web Technologies',
                type: 'lecture',
                content: `#title Въведение в Web Technologies
#type title
#data subtitle=Лекция 1;author=Преподавател

#slide
#title HTML Основи
#type text-only
#data content=HTML (HyperText Markup Language) е маркиращ език за създаване на уеб страници.

#slide
#title CSS Стилизиране
#type image-text
#data image=css-example.png;text=CSS се използва за стилизиране и оформление на HTML елементи.

#slide
#title JavaScript
#type code
#data language=javascript;code=console.log('Hello, World!');content=Базов JavaScript код`,
                lastModified: new Date().toISOString(),
                created: new Date().toISOString()
            },
            {
                id: 'css-grid',
                title: 'CSS Grid Layout',
                type: 'tutorial',
                content: `#title CSS Grid Layout
#type title
#data subtitle=Модерни лейаути;author=Упражнение

#slide
#title Какво е CSS Grid?
#type text-only
#data content=CSS Grid е мощна двумерна система за лейаут, която позволява създаването на сложни уеб дизайни.

#slide
#title Grid Container
#type code
#data language=css;code=.container { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; }`,
                lastModified: new Date().toISOString(),
                created: new Date().toISOString()
            }
        ];
    }

    createNew(title, type = 'lecture') {
        const id = this.generateId(title);
        const template = this.getTemplate(type);
        
        const newPresentation = {
            id: id,
            title: title || 'Нова презентация',
            type: type,
            content: template,
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        this.presentations.push(newPresentation);
        this.currentFile = newPresentation;
        this.isDirty = false;
        this.saveToStorage();

        return newPresentation;
    }

    generateId(title) {
        const base = title
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-|-$/g, '');
        
        let id = base;
        let counter = 1;
        
        while (this.presentations.find(p => p.id === id)) {
            id = `${base}-${counter}`;
            counter++;
        }
        
        return id;
    }

    getTemplate(type) {
        const templates = {
            lecture: `#title Заглавие на лекцията
#type title
#data subtitle=Подзаглавие;author=Име на преподавател

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
#data content=Описание на първата стъпка...

#slide
#title Примерен код
#type code
#data language=javascript;code=// Вашият код тук`,

            project: `#title Име на проект
#type title
#data subtitle=Курсов проект;author=Екип

#slide
#title Цели
#type text-only
#data content=Описание на целите на проекта...

#slide
#title Технологии
#type list
#data items=HTML;CSS;JavaScript;PHP`,

            demo: `#title Демонстрация
#type title
#data subtitle=Live Demo;author=Име

#slide
#title Преглед
#type text-only
#data content=Кратък преглед на демото...`
        };

        return templates[type] || templates.lecture;
    }

    load(id) {
        const presentation = this.presentations.find(p => p.id === id);
        if (presentation) {
            this.currentFile = presentation;
            this.isDirty = false;
            return presentation;
        }
        return null;
    }

    save(content, title) {
        if (!this.currentFile) {
            return this.createNew(title);
        }

        this.currentFile.content = content;
        if (title) {
            this.currentFile.title = title;
        }
        this.currentFile.lastModified = new Date().toISOString();
        this.isDirty = false;

        this.saveToStorage();
        return this.currentFile;
    }

    delete(id) {
        const index = this.presentations.findIndex(p => p.id === id);
        if (index !== -1) {
            this.presentations.splice(index, 1);
            this.saveToStorage();
            
            if (this.currentFile && this.currentFile.id === id) {
                this.currentFile = null;
            }
            
            return true;
        }
        return false;
    }

    getAll() {
        return this.presentations;
    }

    filterByType(type) {
        return this.presentations.filter(p => p.type === type);
    }

    search(query) {
        query = query.toLowerCase();
        return this.presentations.filter(p => 
            p.title.toLowerCase().includes(query) ||
            p.content.toLowerCase().includes(query)
        );
    }

    export(id, format = 'slim') {
        const presentation = this.presentations.find(p => p.id === id);
        if (!presentation) return null;

        const filename = `${presentation.id}.${format}`;
        const content = presentation.content;

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        
        URL.revokeObjectURL(url);
        
        return { filename, content };
    }

    import(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const content = e.target.result;
                const title = file.name.replace(/\.(slim|txt)$/, '');
                
                const presentation = this.createNew(title);
                presentation.content = content;
                this.save(content, title);
                
                resolve(presentation);
            };
            
            reader.onerror = () => {
                reject(new Error('Грешка при четене на файл'));
            };
            
            reader.readAsText(file);
        });
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
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FileManager;
}