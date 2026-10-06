AeroSudokuApp.prototype.initParticles = function() {
        this.canvas = document.getElementById('particleCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
};

AeroSudokuApp.prototype.resizeCanvas = function() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
};

AeroSudokuApp.prototype.triggerLineParticles = function(type, index) {
        const colors = ['#00f0ff', '#7000ff', '#ff0077', '#00ff66', '#ffb700'];
        for (let i = 0; i < 35; i++) {
            this.particles.push({
                x: type === 'col' ? (window.innerWidth / 9) * (index + 0.5) : Math.random() * window.innerWidth,
                y: type === 'row' ? (window.innerHeight / 9) * (index + 0.5) : Math.random() * window.innerHeight,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 4 + 2,
                alpha: 1,
                decay: Math.random() * 0.03 + 0.02
            });
        }
        this.renderParticles();
};

AeroSudokuApp.prototype.launchParticles = function() {
        this.particles = [];
        const colors = ['#00f0ff', '#7000ff', '#ff0077', '#00ff66', '#ffb700'];
        for (let i = 0; i < 100; i++) {
            this.particles.push({
                x: this.canvas.width / 2,
                y: this.canvas.height / 2,
                vx: (Math.random() - 0.5) * 14,
                vy: (Math.random() - 0.5) * 14 - 2,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: Math.random() * 5 + 3,
                alpha: 1,
                decay: Math.random() * 0.02 + 0.01
            });
        }
        this.renderParticles();
};

AeroSudokuApp.prototype.renderParticles = function() {
        if (this.particles.length === 0) return;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.12;
            p.alpha -= p.decay;

            if (p.alpha <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            this.ctx.save();
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }

        if (this.particles.length > 0) {
            requestAnimationFrame(() => this.renderParticles());
        }
};

AeroSudokuApp.prototype.initParallax = function() {
        const wrapper = document.getElementById('boardWrapper');
        window.addEventListener('mousemove', (e) => {
            if (!this.parallaxEnabled) return;
            const cx = window.innerWidth / 2;
            const cy = window.innerHeight / 2;
            const dx = (e.clientX - cx) / cx;
            const dy = (e.clientY - cy) / cy;
            wrapper.style.transform = `rotateY(${dx * 6}deg) rotateX(${-dy * 6}deg)`;
        });
};
