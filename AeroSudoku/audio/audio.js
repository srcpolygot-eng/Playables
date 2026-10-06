class SoundEngine {
    constructor() {
        this.ctx = null;
        this.enabled = true;
    }

    init() {
        if (!this.ctx) {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx) this.ctx = new AudioCtx();
        }
    }

    playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.08) {
        if (!this.enabled) return;
        this.init();
        if (!this.ctx) return;

        try {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
            gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        } catch (e) {}
    }

    click() { this.playTone(800, 'sine', 0.05, 0.05); }
    place() { this.playTone(520, 'triangle', 0.08, 0.1); }
    erase() { this.playTone(300, 'sawtooth', 0.08, 0.08); }
    lineClear() {
        this.playTone(600, 'sine', 0.1, 0.1);
        setTimeout(() => this.playTone(850, 'sine', 0.15, 0.12), 80);
    }
    error() { 
        this.playTone(150, 'sawtooth', 0.18, 0.2);
        setTimeout(() => this.playTone(120, 'sawtooth', 0.18, 0.2), 90);
    }
    victory() {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((n, idx) => {
            setTimeout(() => this.playTone(n, 'sine', 0.3, 0.15), idx * 110);
        });
    }
}

const SFX = new SoundEngine();
