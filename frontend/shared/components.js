// === MODAL COMPONENT ===
class Modal {
    constructor(options = {}) {
        this.options = {
            title: '',
            content: '',
            onClose: null,
            showCloseButton: true,
            ...options
        };
        
        this.modal = null;
        this.init();
    }
    
    init() {
        this.modal = document.createElement('div');
        this.modal.className = 'modal-overlay';
        this.modal.innerHTML = `
            <div class="modal">
                <div class="modal-header">
                    <h3>${this.options.title}</h3>
                    ${this.options.showCloseButton ? '<button class="modal-close">&times;</button>' : ''}
                </div>
                <div class="modal-content">
                    ${this.options.content}
                </div>
            </div>
        `;
        
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        const closeBtn = this.modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => this.close());
        }
        
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.close();
            }
        });
    }
    
    open() {
        document.body.appendChild(this.modal);
        document.body.style.overflow = 'hidden';
    }
    
    close() {
        if (this.modal && this.modal.parentNode) {
            this.modal.parentNode.removeChild(this.modal);
            document.body.style.overflow = '';
            
            if (typeof this.options.onClose === 'function') {
                this.options.onClose();
            }
        }
    }
    
    setContent(content) {
        const contentEl = this.modal.querySelector('.modal-content');
        if (contentEl) {
            contentEl.innerHTML = content;
        }
    }
}

// === TOOLTIP COMPONENT ===
class Tooltip {
    constructor(element, text) {
        this.element = element;
        this.text = text;
        this.tooltip = null;
        this.init();
    }
    
    init() {
        this.element.style.position = 'relative';
        
        this.element.addEventListener('mouseenter', () => this.show());
        this.element.addEventListener('mouseleave', () => this.hide());
    }
    
    show() {
        this.tooltip = document.createElement('div');
        this.tooltip.className = 'tooltip';
        this.tooltip.textContent = this.text;
        
        const rect = this.element.getBoundingClientRect();
        this.tooltip.style.cssText = `
            position: absolute;
            top: ${rect.height + 5}px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 12px;
            white-space: nowrap;
            z-index: 1000;
        `;
        
        this.element.appendChild(this.tooltip);
    }
    
    hide() {
        if (this.tooltip && this.tooltip.parentNode) {
            this.tooltip.parentNode.removeChild(this.tooltip);
            this.tooltip = null;
        }
    }
}

// === EXPORTS ===
export { Modal, Tooltip };