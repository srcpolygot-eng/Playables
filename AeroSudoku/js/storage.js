AeroSudokuApp.prototype.saveAutoSave = function() {
        const state = {
            grid: this.grid,
            solution: this.solution,
            initial: this.initial,
            timer: this.timer,
            difficulty: this.difficulty,
            gameMode: this.gameMode,
            mistakes: this.mistakes
        };
        localStorage.setItem('aerosudoku_autosave', JSON.stringify(state));
};

AeroSudokuApp.prototype.loadAutoSave = function() {
        const saved = localStorage.getItem('aerosudoku_autosave');
        if (!saved) return false;
        try {
            const state = JSON.parse(saved);
            this.grid = state.grid;
            this.solution = state.solution;
            this.initial = state.initial;
            this.timer = state.timer;
            this.difficulty = state.difficulty;
            this.gameMode = state.gameMode;
            this.mistakes = state.mistakes;

            this.mistakeCount.innerText = `${this.mistakes}/${this.maxMistakes}`;
            document.getElementById('currentDiffLabel').innerText = this.difficulty.toUpperCase();
            this.startTimer();
            this.renderBoard();
            this.updateNumberCounts();
            return true;
        } catch (e) {
            return false;
        }
};

AeroSudokuApp.prototype.loadStats = function() {
        const data = localStorage.getItem('aerosudoku_stats');
        if (data) {
            try { this.stats = JSON.parse(data); } catch (e) {}
        }
};

AeroSudokuApp.prototype.saveStats = function() {
        localStorage.setItem('aerosudoku_stats', JSON.stringify(this.stats));
};

AeroSudokuApp.prototype.updateStatsUI = function() {
        document.getElementById('statSolved').innerText = this.stats.solved;
        document.getElementById('statStreak').innerText = this.stats.streak;
        if (this.stats.bestTime) {
            const m = String(Math.floor(this.stats.bestTime / 60)).padStart(2, '0');
            const s = String(this.stats.bestTime % 60).padStart(2, '0');
            document.getElementById('statBestTime').innerText = `${m}:${s}`;
        }
};
