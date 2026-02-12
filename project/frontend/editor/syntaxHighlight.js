class SyntaxHighlighter {
    constructor(editorElement) {
        this.editor = editorElement;
        this.enabled = true;
        
        this.colors = {
            command: '#2563eb',      
            keyword: '#8b5cf6',      
            string: '#10b981',       
            comment: '#64748b',      
            error: '#ef4444'         
        };
    }

    applyHighlighting() {
        if (!this.enabled || !this.editor) return;

        const content = this.editor.value;
        const lines = content.split('\n');
        
        this.editor.classList.remove('has-errors', 'has-warnings', 'all-valid');
        
        let hasErrors = false;
        let hasWarnings = false;
        
        for (let line of lines) {
            line = line.trim();
            if (line.startsWith('#')) {
                const command = line.split(' ')[0];
                if (!['#title', '#type', '#data', '#slide', '#meta'].includes(command)) {
                    hasWarnings = true;
                }
            }
        }
        
        if (hasErrors) {
            this.editor.classList.add('has-errors');
        } else if (hasWarnings) {
            this.editor.classList.add('has-warnings');
        } else if (content.trim() !== '') {
            this.editor.classList.add('all-valid');
        }
    }

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) {
            this.applyHighlighting();
        } else {
            this.clear();
        }
    }

    clear() {
        if (this.editor) {
            this.editor.classList.remove('has-errors', 'has-warnings', 'all-valid');
        }
    }

    getHighlightedHTML(content) {
        const lines = content.split('\n');
        let html = '';
        
        for (let line of lines) {
            const trimmed = line.trim();
            
            if (trimmed === '') {
                html += '\n';
                continue;
            }
            
            if (trimmed.startsWith('//')) {
                html += `<span style="color: ${this.colors.comment}">${this.escapeHtml(line)}</span>\n`;
            } else if (trimmed.startsWith('#')) {
                const parts = line.split(' ');
                const command = parts[0];
                const rest = parts.slice(1).join(' ');
                
                html += `<span style="color: ${this.colors.command}; font-weight: bold">${this.escapeHtml(command)}</span> `;
                html += `<span style="color: ${this.colors.string}">${this.escapeHtml(rest)}</span>\n`;
            } else {
                html += `${this.escapeHtml(line)}\n`;
            }
        }
        
        return html;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = SyntaxHighlighter;
}