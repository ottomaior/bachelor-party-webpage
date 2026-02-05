/**
 * Toast Notification System
 * A modern, elegant toast notification system replacing native alert() calls
 */

class ToastManager {
    constructor(options = {}) {
        this.container = null;
        this.toasts = [];
        this.defaultOptions = {
            position: 'top-right',
            duration: 4000,
            showProgress: true,
            pauseOnHover: true,
            closeOnClick: true,
            maxToasts: 5,
            ...options
        };
        
        this.init();
    }
    
    init() {
        // Create or get toast container
        this.container = document.getElementById('toast-container');
        
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.id = 'toast-container';
            this.container.className = `toast-container ${this.defaultOptions.position}`;
            document.body.appendChild(this.container);
        }
    }
    
    /**
     * Show a toast notification
     * @param {Object} options - Toast options
     * @returns {HTMLElement} - The toast element
     */
    show(options) {
        const config = {
            ...this.defaultOptions,
            ...options
        };
        
        // Limit number of toasts
        while (this.toasts.length >= config.maxToasts) {
            this.dismiss(this.toasts[0]);
        }
        
        const toast = this.createToast(config);
        this.container.appendChild(toast);
        this.toasts.push(toast);
        
        // Trigger entrance animation
        requestAnimationFrame(() => {
            toast.classList.add('active');
        });
        
        // Auto dismiss
        if (config.duration > 0) {
            const progressBar = toast.querySelector('.toast-progress');
            if (progressBar && config.showProgress) {
                progressBar.style.animationDuration = `${config.duration}ms`;
            }
            
            toast.timeoutId = setTimeout(() => {
                this.dismiss(toast);
            }, config.duration);
            
            // Pause on hover
            if (config.pauseOnHover) {
                toast.addEventListener('mouseenter', () => {
                    clearTimeout(toast.timeoutId);
                    if (progressBar) {
                        progressBar.style.animationPlayState = 'paused';
                    }
                });
                
                toast.addEventListener('mouseleave', () => {
                    const remaining = config.duration * 0.5; // Resume with half time
                    if (progressBar) {
                        progressBar.style.animationPlayState = 'running';
                    }
                    toast.timeoutId = setTimeout(() => {
                        this.dismiss(toast);
                    }, remaining);
                });
            }
        }
        
        return toast;
    }
    
    /**
     * Create toast DOM element
     * @param {Object} config - Toast configuration
     * @returns {HTMLElement} - The toast element
     */
    createToast(config) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${config.type || 'info'}`;
        
        // Build toast HTML
        let html = '';
        
        // Icon
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ'
        };
        
        html += `
            <div class="toast-icon">
                ${config.icon || icons[config.type] || icons.info}
            </div>
        `;
        
        // Content
        html += '<div class="toast-content">';
        
        if (config.title) {
            html += `<div class="toast-title">${config.title}</div>`;
        }
        
        if (config.message) {
            html += `<div class="toast-message">${config.message}</div>`;
        }
        
        // Actions
        if (config.actions && config.actions.length > 0) {
            html += '<div class="toast-actions">';
            config.actions.forEach((action, index) => {
                const btnClass = index === 0 ? 'toast-action-primary' : 'toast-action-secondary';
                html += `<button class="toast-action ${btnClass}" data-action="${index}">${action.label}</button>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        
        // Close button
        html += `
            <button class="toast-close" aria-label="Bezárás">×</button>
        `;
        
        // Progress bar
        if (config.showProgress && config.duration > 0) {
            html += '<div class="toast-progress"></div>';
        }
        
        toast.innerHTML = html;
        
        // Event listeners
        const closeBtn = toast.querySelector('.toast-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.dismiss(toast);
            });
        }
        
        // Action handlers
        if (config.actions) {
            const actionBtns = toast.querySelectorAll('.toast-action');
            actionBtns.forEach((btn, index) => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (config.actions[index].onClick) {
                        config.actions[index].onClick();
                    }
                    if (config.actions[index].dismissOnClick !== false) {
                        this.dismiss(toast);
                    }
                });
            });
        }
        
        // Click to close
        if (config.closeOnClick) {
            toast.addEventListener('click', () => {
                this.dismiss(toast);
            });
        }
        
        return toast;
    }
    
    /**
     * Dismiss a toast
     * @param {HTMLElement} toast - The toast element to dismiss
     */
    dismiss(toast) {
        if (!toast || !toast.parentNode) return;
        
        clearTimeout(toast.timeoutId);
        toast.classList.add('exiting');
        
        toast.addEventListener('animationend', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
            const index = this.toasts.indexOf(toast);
            if (index > -1) {
                this.toasts.splice(index, 1);
            }
        }, { once: true });
    }
    
    /**
     * Dismiss all toasts
     */
    dismissAll() {
        [...this.toasts].forEach(toast => this.dismiss(toast));
    }
    
    // Convenience methods
    success(message, options = {}) {
        return this.show({
            type: 'success',
            title: 'Siker!',
            message,
            icon: '✓',
            ...options
        });
    }
    
    error(message, options = {}) {
        return this.show({
            type: 'error',
            title: 'Hiba!',
            message,
            icon: '✕',
            duration: 6000, // Errors stay longer
            ...options
        });
    }
    
    warning(message, options = {}) {
        return this.show({
            type: 'warning',
            title: 'Figyelem!',
            message,
            icon: '⚠',
            ...options
        });
    }
    
    info(message, options = {}) {
        return this.show({
            type: 'info',
            title: 'Info',
            message,
            icon: 'ℹ',
            ...options
        });
    }
    
    /**
     * Show a promise toast (loading -> success/error)
     * @param {Promise} promise - The promise to track
     * @param {Object} options - Options for loading, success, and error states
     */
    async promise(promise, options = {}) {
        const loadingToast = this.show({
            type: 'info',
            title: options.loading?.title || 'Betöltés...',
            message: options.loading?.message || '',
            icon: '⏳',
            duration: 0, // Don't auto-dismiss
            showProgress: false
        });
        
        try {
            const result = await promise;
            this.dismiss(loadingToast);
            this.success(
                options.success?.message || 'Sikeres művelet!',
                { title: options.success?.title }
            );
            return result;
        } catch (error) {
            this.dismiss(loadingToast);
            this.error(
                options.error?.message || error.message || 'Hiba történt!',
                { title: options.error?.title }
            );
            throw error;
        }
    }
}

// Create global instance
const toast = new ToastManager();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { ToastManager, toast };
}

// Make available globally
window.toast = toast;
window.ToastManager = ToastManager;
