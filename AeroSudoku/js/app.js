class AeroSudokuApp {
    constructor() {
        this.engine = new SudokuEngine();
        this.grid = Array(81).fill(0);
        this.solution = Array(81).fill(0);
        this.initial = Array(81).fill(0);
        this.notes = Array.from({ length: 81 }, () => new Set());
        this.selectedIndex = -1;
        this.pencilMode = false;
        this.difficulty = 'expert';
        this.gameMode = 'classic';
        this.errorMode = 'warn';
        this.autoPencilClean = true;
        this.parallaxEnabled = true;
        this.currentTheme = 'cyber';
        this.undoStack = [];
        this.redoStack = [];
        this.timer = 0;
        this.timeAttackRemaining = 300;
        this.timerInterval = null;
        this.mistakes = 0;
        this.maxMistakes = 3;
        this.isPaused = false;
        this.completedUnits = new Set();
        this.robotProgress = 0;
        this.robotTimer = null;
        this.stats = { solved: 0, streak: 0, bestTime: null, totalIq: 0 };
        this.initDOM();
        this.initParticles();
        this.initParallax();
        this.loadStats();
        if (!this.loadAutoSave()) this.newGame();
    }
    initDOM() {
        this.boardEl = document.getElementById('sudokuBoard');
        this.timerText = document.getElementById('timerText');
        this.mistakeCount = document.getElementById('mistakeCount');
        this.pencilBtn = document.getElementById('pencilBtn');
        this.pencilBadge = document.getElementById('pencilBadge');
        this.pencilText = document.getElementById('pencilText');
        this.boardEl.innerHTML = '';
        for (let i = 0; i < 81; i++) {
            const cell = document.createElement('div');
            cell.className = 'sudoku-cell flex items-center justify-center font-bold text-xl cursor-pointer select-none';
            cell.dataset.index = i;
            const row = Math.floor(i / 9);
            const col = i % 9;
            if (col === 2 || col === 5) cell.classList.add('border-r-thick');
            if (row === 2 || row === 5) cell.classList.add('border-b-thick');
            cell.addEventListener('click', () => this.selectCell(i));
            this.boardEl.appendChild(cell);
        }
        document.querySelectorAll('.numpad-btn').forEach(btn => {
            btn.addEventListener('click', () => this.handleInput(parseInt(btn.dataset.num)));
        });
        document.getElementById('undoBtn').addEventListener('click', () => this.undo());
        document.getElementById('redoBtn').addEventListener('click', () => this.redo());
        document.getElementById('eraseBtn').addEventListener('click', () => this.erase());
        document.getElementById('pencilBtn').addEventListener('click', () => this.togglePencil());
        document.getElementById('hintBtn').addEventListener('click', () => this.giveSmartHint());
        document.getElementById('stepBtn').addEventListener('click', () => this.explainStep());
        document.getElementById('solveBtn').addEventListener('click', () => this.instantSolve());
        document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
        document.getElementById('restartBtn').addEventListener('click', () => this.restartPuzzle());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause(true));
        document.getElementById('resumeBtn').addEventListener('click', () => this.togglePause(false));
        document.getElementById('themeBtn').addEventListener('click', () => this.cycleTheme());
        document.getElementById('settingsBtn').addEventListener('click', () => document.getElementById('settingsModal').classList.remove('hidden'));
        document.getElementById('closeSettingsBtn').addEventListener('click', () => document.getElementById('settingsModal').classList.add('hidden'));
        document.getElementById('errorModeSelect').addEventListener('change', (e) => this.errorMode = e.target.value);
        document.getElementById('autoPencilToggle').addEventListener('change', (e) => this.autoPencilClean = e.target.checked);
        document.getElementById('parallaxToggle').addEventListener('change', (e) => this.parallaxEnabled = e.target.checked);
        document.getElementById('soundToggle').addEventListener('change', (e) => SFX.enabled = e.target.checked);
        document.getElementById('statsBtn').addEventListener('click', () => { this.updateStatsUI(); document.getElementById('statsModal').classList.remove('hidden'); });
        document.getElementById('closeStatsBtn').addEventListener('click', () => document.getElementById('statsModal').classList.add('hidden'));
        document.getElementById('nextPuzzleBtn').addEventListener('click', () => { document.getElementById('winModal').classList.add('hidden'); this.newGame(); });
        document.getElementById('shareBtn').addEventListener('click', () => this.shareResult());
        document.getElementById('closeHintBtn').addEventListener('click', () => document.getElementById('hintModal').classList.add('hidden'));
        const diffBtn = document.getElementById('diffDropdownBtn');
        const diffMenu = document.getElementById('diffMenu');
        diffBtn.addEventListener('click', (e) => { e.stopPropagation(); diffMenu.classList.toggle('hidden'); });
        document.addEventListener('click', () => diffMenu.classList.add('hidden'));
        document.querySelectorAll('.diff-option').forEach(opt => {
            opt.addEventListener('click', (e) => {
                this.difficulty = e.target.dataset.diff;
                document.getElementById('currentDiffLabel').innerText = e.target.innerText;
                this.newGame();
            });
        });
        document.querySelectorAll('.mode-tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.mode-tab').forEach(t => {
                    t.classList.remove('active-mode', 'border', 'border-cyan-400/40', 'bg-cyan-500/20', 'text-cyan-300');
                    t.classList.add('text-gray-400');
                });
                e.target.classList.add('active-mode', 'border', 'border-cyan-400/40', 'bg-cyan-500/20', 'text-cyan-300');
                e.target.classList.remove('text-gray-400');
                this.gameMode = e.target.dataset.mode;
                document.getElementById('modeBadge').innerText = this.gameMode.toUpperCase() + ' MODE • ' + this.difficulty.toUpperCase();
                this.newGame();
            });
        });
        document.addEventListener('keydown', (e) => {
            if (this.isPaused) return;
            if (e.key >= '1' && e.key <= '9') this.handleInput(parseInt(e.key));
            else if (e.key === 'Backspace' || e.key === 'Delete') this.erase();
            else if (e.key.toLowerCase() === 'n') this.togglePencil();
            else if (e.key.toLowerCase() === 'z' && (e.ctrlKey || e.metaKey)) { if (e.shiftKey) this.redo(); else this.undo(); }
            else if (e.key === 'ArrowUp' && this.selectedIndex >= 9) this.selectCell(this.selectedIndex - 9);
            else if (e.key === 'ArrowDown' && this.selectedIndex < 72) this.selectCell(this.selectedIndex + 9);
            else if (e.key === 'ArrowLeft' && this.selectedIndex % 9 > 0) this.selectCell(this.selectedIndex - 1);
            else if (e.key === 'ArrowRight' && this.selectedIndex % 9 < 8) this.selectCell(this.selectedIndex + 1);
        });
    }
    newGame() {
        const data = this.engine.generate(this.difficulty, this.gameMode);
        this.grid = [...data.puzzle];
        this.solution = [...data.solution];
        this.initial = [...data.puzzle];
        this.cages = data.cages || [];
        this.linkedPairs = data.linkedPairs || [];
        this.notes = Array.from({ length: 81 }, () => new Set());
        this.undoStack = [];
        this.redoStack = [];
        this.mistakes = 0;
        this.selectedIndex = -1;
        this.completedUnits.clear();
        this.mistakeCount.innerText = this.mistakes + '/' + this.maxMistakes;
        const robotContainer = document.getElementById('robotRaceBarContainer');
        if (this.gameMode === 'robot') { robotContainer.classList.remove('hidden'); this.startRobotRace(); }
        else { robotContainer.classList.add('hidden'); if (this.robotTimer) clearInterval(this.robotTimer); }
        if (this.gameMode === 'timeattack') this.timeAttackRemaining = 300;
        this.resetTimer(); this.startTimer(); this.renderBoard(); this.updateNumberCounts(); this.saveAutoSave();
    }
    restartPuzzle() {
        this.grid = [...this.initial];
        this.notes = Array.from({ length: 81 }, () => new Set());
        this.undoStack = []; this.redoStack = []; this.mistakes = 0;
        this.mistakeCount.innerText = '0/' + this.maxMistakes;
        this.completedUnits.clear();
        this.resetTimer(); this.startTimer(); this.renderBoard(); this.updateNumberCounts(); this.saveAutoSave();
    }
    startTimer() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            if (this.isPaused) return;
            if (this.gameMode === 'timeattack') {
                this.timeAttackRemaining--;
                if (this.timeAttackRemaining <= 0) { clearInterval(this.timerInterval); alert('TIME EXPIRED! PUZZLE OVERLOAD!'); this.restartPuzzle(); return; }
                const mins = String(Math.floor(this.timeAttackRemaining / 60)).padStart(2, '0');
                const secs = String(this.timeAttackRemaining % 60).padStart(2, '0');
                this.timerText.innerText = mins + ':' + secs;
            } else {
                this.timer++;
                const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
                const secs = String(this.timer % 60).padStart(2, '0');
                this.timerText.innerText = mins + ':' + secs;
            }
        }, 1000);
    }
    resetTimer() { this.timer = 0; this.timerText.innerText = '00:00'; }
    togglePause(pause) {
        this.isPaused = pause;
        const overlay = document.getElementById('pauseOverlay');
        if (this.isPaused) overlay.classList.remove('hidden'); else overlay.classList.add('hidden');
    }
    renderBoard() {
        const cells = this.boardEl.children;
        const selectedVal = this.selectedIndex >= 0 ? this.grid[this.selectedIndex] : 0;
        const selRow = this.selectedIndex >= 0 ? Math.floor(this.selectedIndex / 9) : -1;
        const selCol = this.selectedIndex >= 0 ? this.selectedIndex % 9 : -1;
        const selBox = this.selectedIndex >= 0 ? Math.floor(selRow / 3) * 3 + Math.floor(selCol / 3) : -1;
        for (let i = 0; i < 81; i++) {
            const cell = cells[i];
            const val = this.grid[i];
            const row = Math.floor(i / 9);
            const col = i % 9;
            const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
            cell.className = 'sudoku-cell flex items-center justify-center font-bold text-xl cursor-pointer select-none';
            if (col === 2 || col === 5) cell.classList.add('border-r-thick');
            if (row === 2 || row === 5) cell.classList.add('border-b-thick');
            if (this.gameMode === 'xsudoku' && (row === col || row + col === 8)) cell.classList.add('diagonal-cell');
            if (this.gameMode === 'alpha' && this.linkedPairs) {
                for (let pair of this.linkedPairs) { if (pair.includes(i)) cell.classList.add('linked-cell'); }
            }
            const oldLabel = cell.querySelector('.killer-cage-label');
            if (oldLabel) oldLabel.remove();
            if (this.gameMode === 'killer' && this.cages) {
                const cage = this.cages.find(c => c.cells.includes(i));
                if (cage) {
                    cell.style.borderStyle = 'dashed';
                    cell.style.borderColor = '#f59e0b';
                    const minCell = Math.min(...cage.cells);
                    if (i === minCell) {
                        const label = document.createElement('span');
                        label.className = 'killer-cage-label';
                        label.innerText = cage.sum;
                        cell.appendChild(label);
                    }
                }
            } else { cell.style.borderStyle = ''; }
            if (i === this.selectedIndex) cell.classList.add('selected');
            else if (val > 0 && val === selectedVal) cell.classList.add('same-number');
            else if (row === selRow || col === selCol || box === selBox) cell.classList.add('highlighted');
            if (val > 0) {
                cell.innerText = val;
                if (this.initial[i] !== 0) cell.classList.add('given');
                else if (val !== this.solution[i] && this.errorMode !== 'off') cell.classList.add('error');
            } else {
                if (this.notes[i].size > 0) {
                    let noteGridHtml = '<div class="pencil-grid">';
                    for (let n = 1; n <= 9; n++) noteGridHtml += '<div>' + (this.notes[i].has(n) ? n : '') + '</div>';
                    noteGridHtml += '</div>';
                    cell.innerHTML = noteGridHtml;
                } else cell.innerText = '';
            }
        }
        this.updateProgressBar();
    }
    selectCell(index) { this.selectedIndex = index; SFX.click(); this.renderBoard(); }
    handleInput(num) {
        if (this.selectedIndex < 0 || this.initial[this.selectedIndex] !== 0) return;
        const index = this.selectedIndex;
        this.saveUndoState();
        if (this.pencilMode) {
            if (this.notes[index].has(num)) this.notes[index].delete(num); else this.notes[index].add(num);
            SFX.place();
        } else {
            if (this.errorMode === 'block' && num !== this.solution[index]) {
                SFX.error(); this.mistakes++; this.mistakeCount.innerText = this.mistakes + '/' + this.maxMistakes; return;
            }
            if (this.grid[index] === num) { this.grid[index] = 0; SFX.erase(); }
            else {
                this.grid[index] = num; this.notes[index].clear();
                if (num === this.solution[index]) {
                    SFX.place(); this.animateCellPop(index);
                    if (this.gameMode === 'timeattack') this.timeAttackRemaining += 5;
                    if (this.autoPencilClean) this.cleanNotes(index, num);
                    this.checkLineCompletions(index);
                } else {
                    SFX.error(); this.mistakes++; this.mistakeCount.innerText = this.mistakes + '/' + this.maxMistakes;
                }
            }
        }
        this.renderBoard(); this.updateNumberCounts(); this.saveAutoSave(); this.checkCompletion();
    }
    checkLineCompletions(placedIndex) {
        const row = Math.floor(placedIndex / 9);
        const col = placedIndex % 9;
        let rowComplete = true;
        for (let c = 0; c < 9; c++) if (this.grid[row * 9 + c] !== this.solution[row * 9 + c]) rowComplete = false;
        if (rowComplete && !this.completedUnits.has('row-' + row)) { this.completedUnits.add('row-' + row); SFX.lineClear(); this.triggerLineParticles('row', row); }
        let colComplete = true;
        for (let r = 0; r < 9; r++) if (this.grid[r * 9 + col] !== this.solution[r * 9 + col]) colComplete = false;
        if (colComplete && !this.completedUnits.has('col-' + col)) { this.completedUnits.add('col-' + col); SFX.lineClear(); this.triggerLineParticles('col', col); }
    }
    cleanNotes(index, num) {
        const row = Math.floor(index / 9);
        const col = index % 9;
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let i = 0; i < 9; i++) {
            this.notes[row * 9 + i].delete(num);
            this.notes[i * 9 + col].delete(num);
            this.notes[(boxRow + Math.floor(i / 3)) * 9 + (boxCol + (i % 3))].delete(num);
        }
    }
    erase() {
        if (this.selectedIndex < 0 || this.initial[this.selectedIndex] !== 0) return;
        this.saveUndoState(); this.grid[this.selectedIndex] = 0; this.notes[this.selectedIndex].clear();
        SFX.erase(); this.renderBoard(); this.updateNumberCounts(); this.saveAutoSave();
    }
    togglePencil() {
        this.pencilMode = !this.pencilMode;
        if (this.pencilMode) { this.pencilText.innerText = 'Notes ON'; this.pencilText.classList.add('text-amber-400'); this.pencilBadge.classList.remove('hidden'); }
        else { this.pencilText.innerText = 'Notes OFF'; this.pencilText.classList.remove('text-amber-400'); this.pencilBadge.classList.add('hidden'); }
        SFX.click();
    }
    saveUndoState() {
        this.undoStack.push({ grid: [...this.grid], notes: this.notes.map(s => new Set(s)) });
        if (this.undoStack.length > 50) this.undoStack.shift();
        this.redoStack = [];
    }
    undo() {
        if (this.undoStack.length === 0) return;
        this.redoStack.push({ grid: [...this.grid], notes: this.notes.map(s => new Set(s)) });
        const last = this.undoStack.pop();
        this.grid = [...last.grid]; this.notes = last.notes.map(s => new Set(s));
        SFX.click(); this.renderBoard(); this.updateNumberCounts();
    }
    redo() {
        if (this.redoStack.length === 0) return;
        this.undoStack.push({ grid: [...this.grid], notes: this.notes.map(s => new Set(s)) });
        const next = this.redoStack.pop();
        this.grid = [...next.grid]; this.notes = next.notes.map(s => new Set(s));
        SFX.click(); this.renderBoard(); this.updateNumberCounts();
    }
    giveSmartHint() {
        for (let i = 0; i < 81; i++) {
            if (this.grid[i] === 0) {
                const correctVal = this.solution[i];
                const row = Math.floor(i / 9) + 1;
                const col = (i % 9) + 1;
                this.selectCell(i);
                document.getElementById('hintContent').innerHTML = '<p><strong class="text-cyan-400">Target Location:</strong> Row <strong>' + row + '</strong>, Column <strong>' + col + '</strong>.</p><p><strong class="text-amber-300">Tactical Deduction:</strong> Analyzing candidate interactions shows that value <span class="text-emerald-400 font-extrabold text-lg">' + correctVal + '</span> must go here.</p>';
                document.getElementById('hintModal').classList.remove('hidden');
                this.saveUndoState(); this.grid[i] = correctVal;
                this.renderBoard(); this.updateNumberCounts(); this.checkCompletion();
                return;
            }
        }
    }
    explainStep() {
        const step = this.engine.findLogicStep(this.grid, this.solution);
        if (step) {
            this.selectCell(step.index);
            document.getElementById('hintContent').innerHTML = '<p><strong class="text-purple-400">Logical Rule:</strong> ' + step.type + '</p><p>' + step.msg + '</p>';
            document.getElementById('hintModal').classList.remove('hidden');
        }
    }
    instantSolve() {
        this.saveUndoState(); this.grid = [...this.solution]; SFX.victory();
        this.renderBoard(); this.updateNumberCounts(); this.triggerWin();
    }
    startRobotRace() {
        this.robotProgress = 0;
        if (this.robotTimer) clearInterval(this.robotTimer);
        const speed = this.difficulty === 'easy' ? 3200 : 1800;
        this.robotTimer = setInterval(() => {
            if (this.isPaused) return;
            this.robotProgress += 2.5;
            document.getElementById('robotProgressBar').style.width = Math.min(100, this.robotProgress) + '%';
            if (this.robotProgress >= 100) { clearInterval(this.robotTimer); alert('THE AI SOLVER OUT-PACED YOU! RESTARTING...'); this.restartPuzzle(); }
        }, speed / 20);
    }
    updateProgressBar() {
        let filled = 0;
        for (let i = 0; i < 81; i++) if (this.grid[i] === this.solution[i]) filled++;
        document.getElementById('playerProgressBar').style.width = Math.floor((filled / 81) * 100) + '%';
    }
    updateNumberCounts() {
        const counts = Array(10).fill(0);
        for (let i = 0; i < 81; i++) if (this.grid[i] > 0) counts[this.grid[i]]++;
        for (let n = 1; n <= 9; n++) {
            const el = document.getElementById('count-' + n);
            if (el) {
                el.innerText = n + ': ' + counts[n] + '/9';
                el.className = counts[n] === 9 ? 'text-emerald-400 font-bold' : 'text-cyan-400';
            }
        }
    }
    checkCompletion() {
        for (let i = 0; i < 81; i++) if (this.grid[i] !== this.solution[i]) return;
        this.triggerWin();
    }
    triggerWin() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.robotTimer) clearInterval(this.robotTimer);
        SFX.victory(); this.launchParticles();
        const baseIq = 100;
        const diffBonus = { easy: 10, medium: 25, hard: 40, expert: 55, master: 70, paradox: 90 }[this.difficulty] || 30;
        const timePenalty = Math.floor(this.timer / 15);
        const calcIq = Math.max(90, baseIq + diffBonus - timePenalty - (this.mistakes * 10));
        const mins = String(Math.floor(this.timer / 60)).padStart(2, '0');
        const secs = String(this.timer % 60).padStart(2, '0');
        document.getElementById('winTime').innerText = mins + ':' + secs;
        document.getElementById('winDiff').innerText = this.difficulty.toUpperCase();
        document.getElementById('winIq').innerText = calcIq + ' IQ';
        document.getElementById('winAcc').innerText = Math.max(0, 100 - (this.mistakes * 15)) + '%';
        this.stats.solved++; this.stats.streak++;
        if (!this.stats.bestTime || this.timer < this.stats.bestTime) this.stats.bestTime = this.timer;
        this.saveStats(); localStorage.removeItem('aerosudoku_autosave');
        setTimeout(() => document.getElementById('winModal').classList.remove('hidden'), 400);
    }
    animateCellPop(index) {
        const cell = this.boardEl.children[index];
        if (cell) { cell.classList.remove('animate-pop'); void cell.offsetWidth; cell.classList.add('animate-pop'); }
    }
    cycleTheme() {
        const themes = ['cyber', 'classic', 'cockpit'];
        this.currentTheme = themes[(themes.indexOf(this.currentTheme) + 1) % themes.length];
        document.body.className = 'h-full flex flex-col justify-between text-slate-100 select-none theme-' + this.currentTheme;
        SFX.click();
    }
    shareResult() {
        const text = 'AeroSudoku 4K Dismantled! Time: ' + this.timerText.innerText + ' Difficulty: ' + this.difficulty.toUpperCase() + ' IQ: ' + document.getElementById('winIq').innerText;
        if (navigator.clipboard) { navigator.clipboard.writeText(text); alert('RESULT COPIED TO CLIPBOARD!'); }
        else alert(text);
    }
}
