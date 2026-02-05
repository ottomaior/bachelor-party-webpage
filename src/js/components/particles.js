/**
 * Interactive Particle System
 * Creates a canvas-based particle animation with mouse interaction
 */

class ParticleSystem {
    constructor(options = {}) {
        this.options = {
            containerId: 'particles-container',
            canvasId: 'particles-canvas',
            particleCount: 80,
            connectionDistance: 150,
            mouseRadius: 150,
            particleSpeed: 0.5,
            particleSize: { min: 1, max: 3 },
            colors: [
                'rgba(0, 212, 255, 0.8)',   // accent-blue
                'rgba(255, 0, 110, 0.6)',    // accent-pink
                'rgba(255, 214, 10, 0.5)',   // accent-gold
                'rgba(102, 126, 234, 0.7)'   // accent-purple
            ],
            lineColor: 'rgba(255, 255, 255, 0.1)',
            mouseLineColor: 'rgba(0, 212, 255, 0.3)',
            enableMouse: true,
            enableConnections: true,
            ...options
        };
        
        this.particles = [];
        this.mouse = { x: null, y: null, radius: this.options.mouseRadius };
        this.canvas = null;
        this.ctx = null;
        this.animationId = null;
        this.isRunning = false;
        
        this.init();
    }
    
    init() {
        // Create or get container
        let container = document.getElementById(this.options.containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = this.options.containerId;
            container.className = 'particles-container';
            document.body.prepend(container);
        }
        
        // Create canvas
        this.canvas = document.getElementById(this.options.canvasId);
        
        if (!this.canvas) {
            this.canvas = document.createElement('canvas');
            this.canvas.id = this.options.canvasId;
            container.appendChild(this.canvas);
        }
        
        this.ctx = this.canvas.getContext('2d');
        
        // Set canvas size
        this.resize();
        
        // Create particles
        this.createParticles();
        
        // Event listeners
        window.addEventListener('resize', () => this.resize());
        
        if (this.options.enableMouse) {
            window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
            window.addEventListener('mouseout', () => this.handleMouseOut());
            
            // Touch support
            window.addEventListener('touchmove', (e) => this.handleTouchMove(e));
            window.addEventListener('touchend', () => this.handleMouseOut());
        }
        
        // Start animation
        this.start();
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Recreate particles on resize
        if (this.particles.length > 0) {
            this.createParticles();
        }
    }
    
    createParticles() {
        this.particles = [];
        
        for (let i = 0; i < this.options.particleCount; i++) {
            const size = Math.random() * (this.options.particleSize.max - this.options.particleSize.min) + this.options.particleSize.min;
            const color = this.options.colors[Math.floor(Math.random() * this.options.colors.length)];
            
            this.particles.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height,
                vx: (Math.random() - 0.5) * this.options.particleSpeed,
                vy: (Math.random() - 0.5) * this.options.particleSpeed,
                size: size,
                baseSize: size,
                color: color,
                opacity: Math.random() * 0.5 + 0.5
            });
        }
    }
    
    handleMouseMove(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }
    
    handleTouchMove(e) {
        if (e.touches.length > 0) {
            this.mouse.x = e.touches[0].clientX;
            this.mouse.y = e.touches[0].clientY;
        }
    }
    
    handleMouseOut() {
        this.mouse.x = null;
        this.mouse.y = null;
    }
    
    update() {
        this.particles.forEach(particle => {
            // Move particles
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off edges
            if (particle.x < 0 || particle.x > this.canvas.width) {
                particle.vx *= -1;
            }
            if (particle.y < 0 || particle.y > this.canvas.height) {
                particle.vy *= -1;
            }
            
            // Keep particles in bounds
            particle.x = Math.max(0, Math.min(this.canvas.width, particle.x));
            particle.y = Math.max(0, Math.min(this.canvas.height, particle.y));
            
            // Mouse interaction
            if (this.mouse.x !== null && this.mouse.y !== null) {
                const dx = this.mouse.x - particle.x;
                const dy = this.mouse.y - particle.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.mouse.radius) {
                    // Push particles away from mouse
                    const force = (this.mouse.radius - distance) / this.mouse.radius;
                    const angle = Math.atan2(dy, dx);
                    
                    particle.x -= Math.cos(angle) * force * 2;
                    particle.y -= Math.sin(angle) * force * 2;
                    
                    // Increase size near mouse
                    particle.size = particle.baseSize * (1 + force * 0.5);
                } else {
                    particle.size = particle.baseSize;
                }
            } else {
                particle.size = particle.baseSize;
            }
        });
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw connections
        if (this.options.enableConnections) {
            this.drawConnections();
        }
        
        // Draw particles
        this.particles.forEach(particle => {
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.opacity;
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });
        
        // Draw mouse connections
        if (this.options.enableMouse && this.mouse.x !== null && this.mouse.y !== null) {
            this.drawMouseConnections();
        }
    }
    
    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < this.options.connectionDistance) {
                    const opacity = 1 - distance / this.options.connectionDistance;
                    
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.strokeStyle = this.options.lineColor;
                    this.ctx.globalAlpha = opacity * 0.5;
                    this.ctx.lineWidth = 0.5;
                    this.ctx.stroke();
                    this.ctx.globalAlpha = 1;
                }
            }
        }
    }
    
    drawMouseConnections() {
        this.particles.forEach(particle => {
            const dx = this.mouse.x - particle.x;
            const dy = this.mouse.y - particle.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < this.mouse.radius) {
                const opacity = 1 - distance / this.mouse.radius;
                
                this.ctx.beginPath();
                this.ctx.moveTo(particle.x, particle.y);
                this.ctx.lineTo(this.mouse.x, this.mouse.y);
                this.ctx.strokeStyle = this.options.mouseLineColor;
                this.ctx.globalAlpha = opacity;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            }
        });
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.update();
        this.draw();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    start() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        this.animate();
    }
    
    stop() {
        this.isRunning = false;
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }
    
    destroy() {
        this.stop();
        
        window.removeEventListener('resize', () => this.resize());
        window.removeEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.removeEventListener('mouseout', () => this.handleMouseOut());
        
        if (this.canvas && this.canvas.parentNode) {
            this.canvas.parentNode.removeChild(this.canvas);
        }
    }
}

// Initialize on load with reduced motion check
document.addEventListener('DOMContentLoaded', () => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    
    if (!prefersReducedMotion) {
        window.particleSystem = new ParticleSystem({
            particleCount: window.innerWidth < 768 ? 40 : 80, // Fewer particles on mobile
            connectionDistance: window.innerWidth < 768 ? 100 : 150
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ParticleSystem;
}

// Make available globally
window.ParticleSystem = ParticleSystem;
