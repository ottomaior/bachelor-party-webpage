/**
 * UI Enhancements
 * Scroll animations, skeleton loaders, and micro-interactions
 */

// ===== SCROLL REVEAL ANIMATIONS =====
class ScrollReveal {
    constructor(options = {}) {
        this.options = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px',
            ...options
        };
        
        this.observer = null;
        this.init();
    }
    
    init() {
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            // Show all elements immediately
            document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .stagger-children')
                .forEach(el => el.classList.add('revealed'));
            return;
        }
        
        this.observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('revealed');
                    // Optionally unobserve after reveal
                    // this.observer.unobserve(entry.target);
                }
            });
        }, this.options);
        
        // Observe elements
        document.querySelectorAll('.scroll-reveal, .scroll-reveal-left, .scroll-reveal-right, .stagger-children')
            .forEach(el => this.observer.observe(el));
    }
    
    refresh() {
        document.querySelectorAll('.scroll-reveal:not(.revealed), .scroll-reveal-left:not(.revealed), .scroll-reveal-right:not(.revealed), .stagger-children:not(.revealed)')
            .forEach(el => this.observer.observe(el));
    }
    
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}

// ===== SKELETON LOADER MANAGER =====
class SkeletonLoader {
    /**
     * Create a skeleton element
     * @param {string} type - Type of skeleton (text, title, avatar, card, button)
     * @param {Object} options - Additional options
     * @returns {HTMLElement}
     */
    static create(type, options = {}) {
        const skeleton = document.createElement('div');
        skeleton.className = `skeleton skeleton-${type}`;
        
        if (options.width) skeleton.style.width = options.width;
        if (options.height) skeleton.style.height = options.height;
        if (options.margin) skeleton.style.margin = options.margin;
        
        return skeleton;
    }
    
    /**
     * Create a skeleton card with multiple elements
     * @param {Object} config - Configuration for the card
     * @returns {HTMLElement}
     */
    static createCard(config = {}) {
        const card = document.createElement('div');
        card.className = 'card skeleton-card-container';
        card.style.padding = '20px';
        
        const defaults = {
            hasAvatar: true,
            titleLines: 1,
            textLines: 3,
            hasButton: false
        };
        
        const settings = { ...defaults, ...config };
        
        let html = '';
        
        if (settings.hasAvatar) {
            html += `
                <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 16px;">
                    <div class="skeleton skeleton-avatar"></div>
                    <div style="flex: 1;">
                        <div class="skeleton skeleton-title" style="width: 60%;"></div>
                        <div class="skeleton skeleton-text" style="width: 40%;"></div>
                    </div>
                </div>
            `;
        }
        
        for (let i = 0; i < settings.titleLines; i++) {
            html += `<div class="skeleton skeleton-title" style="width: ${80 - i * 20}%;"></div>`;
        }
        
        for (let i = 0; i < settings.textLines; i++) {
            const width = i === settings.textLines - 1 ? '70%' : '100%';
            html += `<div class="skeleton skeleton-text" style="width: ${width};"></div>`;
        }
        
        if (settings.hasButton) {
            html += `<div class="skeleton skeleton-button" style="margin-top: 16px;"></div>`;
        }
        
        card.innerHTML = html;
        return card;
    }
    
    /**
     * Show skeletons in a container
     * @param {HTMLElement} container - The container element
     * @param {number} count - Number of skeletons
     * @param {string} type - Type of skeleton
     */
    static show(container, count = 3, type = 'card') {
        container.innerHTML = '';
        
        for (let i = 0; i < count; i++) {
            if (type === 'card') {
                container.appendChild(this.createCard());
            } else {
                container.appendChild(this.create(type));
            }
        }
    }
    
    /**
     * Hide skeletons and show content
     * @param {HTMLElement} container - The container element
     * @param {string} content - HTML content to show
     */
    static hide(container, content) {
        container.innerHTML = content;
    }
}

// ===== 3D TILT EFFECT =====
class TiltEffect {
    constructor(elements, options = {}) {
        this.options = {
            maxTilt: 10,
            perspective: 1000,
            scale: 1.02,
            speed: 400,
            ...options
        };
        
        this.elements = typeof elements === 'string' 
            ? document.querySelectorAll(elements) 
            : elements;
            
        this.init();
    }
    
    init() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        this.elements.forEach(element => {
            element.addEventListener('mouseenter', (e) => this.onMouseEnter(e, element));
            element.addEventListener('mousemove', (e) => this.onMouseMove(e, element));
            element.addEventListener('mouseleave', (e) => this.onMouseLeave(e, element));
        });
    }
    
    onMouseEnter(e, element) {
        element.style.transition = `transform ${this.options.speed}ms ease`;
    }
    
    onMouseMove(e, element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        const mouseX = e.clientX - centerX;
        const mouseY = e.clientY - centerY;
        
        const rotateX = (mouseY / (rect.height / 2)) * -this.options.maxTilt;
        const rotateY = (mouseX / (rect.width / 2)) * this.options.maxTilt;
        
        element.style.transform = `
            perspective(${this.options.perspective}px) 
            rotateX(${rotateX}deg) 
            rotateY(${rotateY}deg) 
            scale(${this.options.scale})
        `;
    }
    
    onMouseLeave(e, element) {
        element.style.transform = `
            perspective(${this.options.perspective}px) 
            rotateX(0deg) 
            rotateY(0deg) 
            scale(1)
        `;
    }
}

// ===== RIPPLE EFFECT =====
class RippleEffect {
    constructor(selector = '.btn, .card') {
        this.selector = selector;
        this.init();
    }
    
    init() {
        document.addEventListener('click', (e) => {
            const target = e.target.closest(this.selector);
            if (!target) return;
            
            this.createRipple(e, target);
        });
    }
    
    createRipple(e, element) {
        const rect = element.getBoundingClientRect();
        const ripple = document.createElement('span');
        
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            left: ${x}px;
            top: ${y}px;
            background: rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            transform: scale(0);
            animation: ripple 0.6s linear;
            pointer-events: none;
        `;
        
        // Ensure element has relative positioning
        const currentPosition = getComputedStyle(element).position;
        if (currentPosition === 'static') {
            element.style.position = 'relative';
        }
        element.style.overflow = 'hidden';
        
        element.appendChild(ripple);
        
        ripple.addEventListener('animationend', () => {
            ripple.remove();
        });
    }
}

// ===== NUMBER COUNTER ANIMATION =====
class NumberCounter {
    constructor(element, options = {}) {
        this.element = typeof element === 'string' ? document.querySelector(element) : element;
        this.options = {
            duration: 2000,
            startValue: 0,
            endValue: parseInt(this.element?.textContent) || 0,
            prefix: '',
            suffix: '',
            decimals: 0,
            ...options
        };
        
        this.init();
    }
    
    init() {
        if (!this.element) return;
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.animate();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });
        
        observer.observe(this.element);
    }
    
    animate() {
        const startTime = performance.now();
        const { startValue, endValue, duration, prefix, suffix, decimals } = this.options;
        
        const step = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOutQuart = 1 - Math.pow(1 - progress, 4);
            const currentValue = startValue + (endValue - startValue) * easeOutQuart;
            
            this.element.textContent = prefix + currentValue.toFixed(decimals) + suffix;
            
            if (progress < 1) {
                requestAnimationFrame(step);
            }
        };
        
        requestAnimationFrame(step);
    }
}

// ===== MAGNETIC BUTTON EFFECT =====
class MagneticButton {
    constructor(selector = '.btn-magnetic') {
        this.buttons = document.querySelectorAll(selector);
        this.init();
    }
    
    init() {
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        
        this.buttons.forEach(button => {
            button.addEventListener('mousemove', (e) => this.onMouseMove(e, button));
            button.addEventListener('mouseleave', (e) => this.onMouseLeave(e, button));
        });
    }
    
    onMouseMove(e, button) {
        const rect = button.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        
        button.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
    }
    
    onMouseLeave(e, button) {
        button.style.transform = 'translate(0, 0)';
    }
}

// ===== INITIALIZE ALL ENHANCEMENTS =====
document.addEventListener('DOMContentLoaded', () => {
    // Scroll reveal
    window.scrollReveal = new ScrollReveal();
    
    // 3D tilt on cards (only on desktop)
    if (window.innerWidth > 768) {
        window.tiltEffect = new TiltEffect('.card-3d');
    }
    
    // Ripple effect
    window.rippleEffect = new RippleEffect('.btn');
    
    // Magnetic buttons
    window.magneticButtons = new MagneticButton();
    
    // Animate stat numbers
    document.querySelectorAll('.stat-value[data-count]').forEach(el => {
        new NumberCounter(el, {
            endValue: parseInt(el.dataset.count) || 0,
            duration: 2000
        });
    });
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        ScrollReveal,
        SkeletonLoader,
        TiltEffect,
        RippleEffect,
        NumberCounter,
        MagneticButton
    };
}

// Make available globally
window.ScrollReveal = ScrollReveal;
window.SkeletonLoader = SkeletonLoader;
window.TiltEffect = TiltEffect;
window.RippleEffect = RippleEffect;
window.NumberCounter = NumberCounter;
window.MagneticButton = MagneticButton;
