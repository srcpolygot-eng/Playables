/**
 * Zenoku — Game controller
 */

class ZenokuApp {
  constructor() {
    this.difficulty = 'easy';
    this.puzzle = null;      // given numbers (0 = empty)
    this.solution = null;
    this.board = null;       // current player state
    this.notes = null;       // 9x9 array of Sets
    this.selected = null;    // {r, c}
    this.notesMode = false;
    this.history = [];
    this.historyIndex = -1;
    this.seconds = 0;
    this.timerId = null;
    this.won = false;

    this.$board = document.getElementById('board');
    this.$timer = document.getElementById('timer');
    this.$winOverlay = document.getElementById('win-overlay');
    this.$winTime = document.getElementById('win-time');

    this.bindUI();
    this.tryRestore() || this.newGame('easy');
  }

  bindUI() {
    // Difficulty buttons
    document.querySelectorAll('.diff-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.newGame(btn.dataset.diff);
      });
    });

    document.getElementById('btn-new').addEventListener('click', () => this.newGame(this.difficulty));
    document.getElementById('btn-win-new').addEventListener('click', () => {
      this.$winOverlay.hidden = true;
      this.newGame(this.difficulty);
    });

    document.getElementById('btn-notes').addEventListener('click', () => this.toggleNotes());
    document.getElementById('btn-undo').addEventListener('click', () => this.undo());
    document.getElementById('btn-hint').addEventListener('click', () => this.hint());
    document.getElementById('btn-erase').addEventListener('click', () => this.erase());

    document.getElementById('btn-theme').addEventListener('click', () => {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? '' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('zenoku_theme', next);
    });

    // Restore theme
    const savedTheme = localStorage.getItem('zenoku_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);

    // Numpad
    document.querySelectorAll('.num-btn').forEach(btn => {
      btn.addEventListener('click', () => this.inputNumber(+btn.dataset.num));
    });

    // Keyboard
    document.addEventListener('keydown', e => this.onKey(e));
  }

  newGame(diff) {
    this.difficulty = diff || this.difficulty;
    this.stopTimer();
    this.seconds = 0;
    this.updateTimerDisplay();
    this.won = false;
    this.$winOverlay.hidden = true;

    const { puzzle, solution } = generatePuzzle(this.difficulty);
    this.puzzle = puzzle;
    this.solution = solution;
    this.board = copyBoard(puzzle);
    this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()));
    this.selected = null;
    this.notesMode = false;
    document.getElementById('btn-notes').classList.remove('active');
    this.history = [];
    this.historyIndex = -1;
    this.pushHistory();

    // sync difficulty UI
    document.querySelectorAll('.diff-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === this.difficulty);
    });

    this.render();
    this.startTimer();
    this.persist();
  }

  tryRestore() {
    const saved = Storage.load();
    if (!saved || !saved.board) return false;
    this.difficulty = saved.difficulty || 'easy';
    this.puzzle = saved.puzzle;
    this.solution = saved.solution;
    this.board = saved.board;
    this.notes = saved.notes.map(row => row.map(arr => new Set(arr)));
    this.seconds = saved.seconds || 0;
    this.won = false;
    this.history = [];
    this.historyIndex = -1;
    this.pushHistory();

    document.querySelectorAll('.diff-btn').forEach(b => {
      b.classList.toggle('active', b.dataset.diff === this.difficulty);
    });

    this.render();
    this.startTimer();
    return true;
  }

  persist() {
    Storage.save({
      difficulty: this.difficulty,
      puzzle: this.puzzle,
      solution: this.solution,
      board: this.board,
      notes: this.notes.map(row => row.map(s => [...s])),
      seconds: this.seconds,
    });
  }

  /* ---------- Timer ---------- */
  startTimer() {
    this.stopTimer();
    this.timerId = setInterval(() => {
      this.seconds++;
      this.updateTimerDisplay();
      if (this.seconds % 5 === 0) this.persist();
    }, 1000);
  }

  stopTimer() {
    if (this.timerId) { clearInterval(this.timerId); this.timerId = null; }
  }

  updateTimerDisplay() {
    const m = String(Math.floor(this.seconds / 60)).padStart(2, '0');
    const s = String(this.seconds % 60).padStart(2, '0');
    this.$timer.textContent = `${m}:${s}`;
  }

  /* ---------- History ---------- */
  pushHistory() {
    const snap = {
      board: copyBoard(this.board),
      notes: this.notes.map(row => row.map(s => new Set(s))),
    };
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snap);
    this.historyIndex = this.history.length - 1;
    // limit depth
    if (this.history.length > 60) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo() {
    if (this.historyIndex <= 0 || this.won) return;
    this.historyIndex--;
    const snap = this.history[this.historyIndex];
    this.board = copyBoard(snap.board);
    this.notes = snap.notes.map(row => row.map(s => new Set(s)));
    this.render();
    this.persist();
  }

  /* ---------- Input ---------- */
  selectCell(r, c) {
    this.selected = { r, c };
    this.render();
  }

  inputNumber(num) {
    if (!this.selected || this.won) return;
    const { r, c } = this.selected;
    if (this.puzzle[r][c] !== 0) return; // given

    if (this.notesMode) {
      const set = this.notes[r][c];
      if (set.has(num)) set.delete(num);
      else set.add(num);
      this.board[r][c] = 0;
    } else {
      this.board[r][c] = num;
      this.notes[r][c].clear();
      // clear this number from notes in same row/col/box
      this.clearNotesAround(r, c, num);
    }

    this.pushHistory();
    this.render();
    this.persist();
    this.checkWin();
  }

  erase() {
    if (!this.selected || this.won) return;
    const { r, c } = this.selected;
    if (this.puzzle[r][c] !== 0) return;
    this.board[r][c] = 0;
    this.notes[r][c].clear();
    this.pushHistory();
    this.render();
    this.persist();
  }

  toggleNotes() {
    this.notesMode = !this.notesMode;
    document.getElementById('btn-notes').classList.toggle('active', this.notesMode);
  }

  clearNotesAround(row, col, num) {
    for (let i = 0; i < 9; i++) {
      this.notes[row][i].delete(num);
      this.notes[i][col].delete(num);
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        this.notes[r][c].delete(num);
  }

  hint() {
    if (this.won) return;
    // try naked single first
    let hint = getHint(this.board);
    if (!hint) {
      // fallback: reveal a random empty cell from solution
      const empties = [];
      for (let r = 0; r < 9; r++)
        for (let c = 0; c < 9; c++)
          if (this.board[r][c] === 0) empties.push([r, c]);
      if (!empties.length) return;
      const [r, c] = empties[Math.floor(Math.random() * empties.length)];
      hint = { row: r, col: c, num: this.solution[r][c] };
    }
    this.selected = { r: hint.row, c: hint.col };
    this.board[hint.row][hint.col] = hint.num;
    this.notes[hint.row][hint.col].clear();
    this.clearNotesAround(hint.row, hint.col, hint.num);
    this.pushHistory();
    this.render();
    this.persist();
    this.checkWin();
  }

  checkWin() {
    if (!isComplete(this.board)) return;
    if (!isCorrect(this.board, this.solution)) return;
    this.won = true;
    this.stopTimer();
    Storage.recordWin(this.difficulty, this.seconds);
    Storage.clear();
    this.$winTime.textContent = `Time: ${this.$timer.textContent}`;
    this.$winOverlay.hidden = false;
  }

  /* ---------- Keyboard ---------- */
  onKey(e) {
    if (this.won) return;
    if (e.key >= '1' && e.key <= '9') {
      this.inputNumber(+e.key);
      e.preventDefault();
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      this.erase();
      e.preventDefault();
    } else if (e.key === 'n' || e.key === 'N') {
      this.toggleNotes();
    } else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      this.undo();
      e.preventDefault();
    } else if (this.selected) {
      const { r, c } = this.selected;
      if (e.key === 'ArrowUp' && r > 0) this.selectCell(r - 1, c);
      if (e.key === 'ArrowDown' && r < 8) this.selectCell(r + 1, c);
      if (e.key === 'ArrowLeft' && c > 0) this.selectCell(r, c - 1);
      if (e.key === 'ArrowRight' && c < 8) this.selectCell(r, c + 1);
    }
  }

  /* ---------- Render ---------- */
  render() {
    this.$board.innerHTML = '';
    const selectedNum = this.selected ? this.board[this.selected.r][this.selected.c] : 0;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.r = r;
        cell.dataset.c = c;
        cell.setAttribute('role', 'gridcell');

        const val = this.board[r][c];
        const isGiven = this.puzzle[r][c] !== 0;

        if (isGiven) cell.classList.add('given');
        else if (val) cell.classList.add('player');

        // selection & highlights
        if (this.selected) {
          if (this.selected.r === r && this.selected.c === c) {
            cell.classList.add('selected');
          } else if (
            this.selected.r === r ||
            this.selected.c === c ||
            (Math.floor(this.selected.r / 3) === Math.floor(r / 3) &&
             Math.floor(this.selected.c / 3) === Math.floor(c / 3))
          ) {
            cell.classList.add('highlight');
          }
        }

        // same number highlight
        if (selectedNum && val === selectedNum) {
          cell.classList.add('same-number');
        }

        // error check (player numbers that conflict)
        if (!isGiven && val && !isValidPlacement(this.board, r, c, val)) {
          cell.classList.add('error');
        }

        if (val) {
          cell.textContent = val;
        } else if (this.notes[r][c].size) {
          const notesEl = document.createElement('div');
          notesEl.className = 'notes';
          for (let n = 1; n <= 9; n++) {
            const span = document.createElement('span');
            if (this.notes[r][c].has(n)) span.textContent = n;
            notesEl.appendChild(span);
          }
          cell.appendChild(notesEl);
        }

        cell.addEventListener('click', () => this.selectCell(r, c));
        this.$board.appendChild(cell);
      }
    }

    // update numpad disabled state (optional: grey out completed numbers)
    const counts = Array(10).fill(0);
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++)
        if (this.board[r][c]) counts[this.board[r][c]]++;
    document.querySelectorAll('.num-btn').forEach(btn => {
      const n = +btn.dataset.num;
      btn.classList.toggle('disabled', counts[n] >= 9);
    });
  }
}

/** Check if placing val at r,c conflicts (ignoring the cell itself) */
function isValidPlacement(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (i !== col && board[row][i] === num) return false;
    if (i !== row && board[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if ((r !== row || c !== col) && board[r][c] === num) return false;
    }
  }
  return true;
}
