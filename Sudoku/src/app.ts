/** Zenoku — Game controller v2 */

import {
  type Board,
  type Difficulty,
  copyBoard,
  generateDaily,
  generatePuzzle,
  getCandidates,
  getHint,
  fillNakedSingles,
  isComplete,
  isCorrect,
  isValidPlacement,
} from './sudoku';
import { Economy } from './economy';
import { type ItemId, getItem, ITEMS } from './items';
import { SFX, unlockAudio } from './audio';
import { YT } from './ytgame';

interface CellPos { r: number; c: number }
interface HistorySnap { board: Board; notes: Set<number>[][] }

export class ZenokuApp {
  difficulty: Difficulty = 'easy';
  isDaily = false;
  puzzle: Board = [];
  solution: Board = [];
  board: Board = [];
  notes: Set<number>[][] = [];
  selected: CellPos | null = null;
  notesMode = false;
  history: HistorySnap[] = [];
  historyIndex = -1;
  seconds = 0;
  timerId: ReturnType<typeof setInterval> | null = null;
  won = false;
  showSolution = false;
  economy = new Economy();

  private $board: HTMLElement;
  private $timer: HTMLElement;
  private $winOverlay: HTMLElement;
  private $winTime: HTMLElement;
  private $confetti: HTMLCanvasElement;

  constructor() {
    this.$board = document.getElementById('board')!;
    this.$timer = document.getElementById('timer')!;
    this.$winOverlay = document.getElementById('win-overlay')!;
    this.$winTime = document.getElementById('win-time')!;
    this.$confetti = document.getElementById('confetti') as HTMLCanvasElement;

    this.bindUI();
    this.bindSdk();
    this.refreshCurrency();
    this.renderQuickItems();
    this.newGame('easy');
  }

  private bindSdk(): void {
    YT.onPause(() => this.stopTimer());
    YT.onResume(() => {
      if (!this.won) this.startTimer();
    });
    YT.onAudioEnabledChange(() => {
      /* SFX checks live */
    });
  }

  private bindUI(): void {
    document.querySelectorAll<HTMLButtonElement>('.diff-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const d = btn.dataset.diff!;
        if (d === 'daily') this.newDaily();
        else this.newGame(d as Difficulty);
      });
    });

    document.getElementById('btn-new')!.addEventListener('click', () => {
      if (this.isDaily) this.newDaily();
      else this.newGame(this.difficulty);
    });
    document.getElementById('btn-win-new')!.addEventListener('click', () => {
      this.$winOverlay.hidden = true;
      this.$confetti.hidden = true;
      if (this.isDaily) this.newDaily();
      else this.newGame(this.difficulty);
    });

    document.getElementById('btn-notes')!.addEventListener('click', () => this.toggleNotes());
    document.getElementById('btn-undo')!.addEventListener('click', () => this.undo());
    document.getElementById('btn-hint')!.addEventListener('click', () => this.useItem('magnifier'));
    document.getElementById('btn-erase')!.addEventListener('click', () => this.erase());

    document.getElementById('btn-theme')!.addEventListener('click', () => {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? '' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('zenoku_theme', next);
      SFX.click();
    });
    const savedTheme = localStorage.getItem('zenoku_theme');
    if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
    if (this.economy.hasPass('night_owl') && !savedTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    document.getElementById('btn-shop')!.addEventListener('click', () => this.openShop());
    document.getElementById('btn-bag')!.addEventListener('click', () => this.openBag());
    document.getElementById('btn-shop-close')!.addEventListener('click', () => {
      document.getElementById('shop-overlay')!.hidden = true;
    });
    document.getElementById('btn-bag-close')!.addEventListener('click', () => {
      document.getElementById('bag-overlay')!.hidden = true;
    });
    document.getElementById('btn-dev-close')!.addEventListener('click', () => {
      document.getElementById('dev-overlay')!.hidden = true;
    });

    document.getElementById('dev-solve')!.addEventListener('click', () => {
      this.board = copyBoard(this.solution);
      this.render();
      this.checkWin();
    });
    document.getElementById('dev-coins')!.addEventListener('click', () => {
      this.economy.state.coins += 500;
      this.economy.persist();
      this.refreshCurrency();
    });
    document.getElementById('dev-gems')!.addEventListener('click', () => {
      this.economy.state.gems += 20;
      this.economy.persist();
      this.refreshCurrency();
    });
    document.getElementById('dev-reset')!.addEventListener('click', () => {
      localStorage.removeItem('zenoku_economy_v1');
      this.economy = new Economy();
      this.refreshCurrency();
      this.renderQuickItems();
    });

    document.querySelectorAll<HTMLButtonElement>('.num-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        unlockAudio();
        this.inputNumber(Number(btn.dataset.num));
      });
    });

    document.addEventListener('keydown', (e) => this.onKey(e));

    // secret: open dev console with ` if owned
    document.addEventListener('keydown', (e) => {
      if (e.key === '`' && this.economy.hasPass('dev_console')) {
        document.getElementById('dev-overlay')!.hidden = false;
      }
      if (e.key === 's' && this.economy.hasPass('admin_tools')) {
        this.showSolution = !this.showSolution;
        this.render();
      }
    });
  }

  refreshCurrency(): void {
    document.getElementById('coins')!.textContent = String(this.economy.state.coins);
    document.getElementById('gems')!.textContent = String(this.economy.state.gems);
  }

  renderQuickItems(): void {
    const bar = document.getElementById('quick-items')!;
    const ids: ItemId[] = ['robot', 'magnifier', 'wand', 'time_freeze', 'pencil_master'];
    bar.innerHTML = '';
    ids.forEach((id) => {
      const n = this.economy.count(id);
      if (n <= 0 && !this.economy.hasPass(id)) return;
      const def = getItem(id);
      const btn = document.createElement('button');
      btn.className = 'q-item';
      btn.title = def.name;
      btn.innerHTML = `${def.icon}<span>${n || '∞'}</span>`;
      btn.addEventListener('click', () => this.useItem(id));
      bar.appendChild(btn);
    });
    if (this.economy.hasPass('dev_console')) {
      const btn = document.createElement('button');
      btn.className = 'q-item';
      btn.title = 'Dev Console';
      btn.textContent = '💻';
      btn.addEventListener('click', () => {
        document.getElementById('dev-overlay')!.hidden = false;
      });
      bar.appendChild(btn);
    }
  }

  openShop(): void {
    const list = document.getElementById('shop-list')!;
    list.innerHTML = '';
    ITEMS.forEach((item) => {
      const owned = item.permanent && this.economy.hasPass(item.id);
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `
        <div class="shop-icon">${item.icon}</div>
        <div class="shop-info">
          <div class="shop-name">${item.name}${owned ? ' ✓' : ''}</div>
          <div class="shop-desc">${item.desc}</div>
        </div>
        <button class="shop-buy" ${owned ? 'disabled' : ''}>
          ${owned ? 'Owned' : item.currency === 'coins' ? `🪙 ${item.price}` : `💎 ${item.price}`}
        </button>`;
      const buyBtn = row.querySelector('.shop-buy') as HTMLButtonElement;
      buyBtn.addEventListener('click', () => {
        if (this.economy.buy(item.id)) {
          this.refreshCurrency();
          this.renderQuickItems();
          this.openShop();
        }
      });
      list.appendChild(row);
    });
    document.getElementById('shop-overlay')!.hidden = false;
  }

  openBag(): void {
    const list = document.getElementById('bag-list')!;
    list.innerHTML = '';
    const inv = this.economy.state.inventory;
    const ids = Object.keys(inv) as ItemId[];
    const permanents = this.economy.state.owned;
    if (!ids.some((id) => (inv[id] ?? 0) > 0) && !permanents.length) {
      list.innerHTML = '<p class="muted">Bag is empty. Visit the shop!</p>';
    }
    ids.forEach((id) => {
      const n = inv[id] ?? 0;
      if (n <= 0) return;
      const def = getItem(id);
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `
        <div class="shop-icon">${def.icon}</div>
        <div class="shop-info">
          <div class="shop-name">${def.name} ×${n}</div>
          <div class="shop-desc">${def.desc}</div>
        </div>
        <button class="shop-buy">Use</button>`;
      row.querySelector('.shop-buy')!.addEventListener('click', () => {
        this.useItem(id);
        document.getElementById('bag-overlay')!.hidden = true;
      });
      list.appendChild(row);
    });
    permanents.forEach((id) => {
      const def = getItem(id);
      const row = document.createElement('div');
      row.className = 'shop-row';
      row.innerHTML = `
        <div class="shop-icon">${def.icon}</div>
        <div class="shop-info">
          <div class="shop-name">${def.name} (owned)</div>
          <div class="shop-desc">${def.desc}</div>
        </div>`;
      list.appendChild(row);
    });
    document.getElementById('bag-overlay')!.hidden = false;
  }

  useItem(id: ItemId): void {
    if (this.won) return;
    const def = getItem(id);

    // permanent toggles don't consume
    if (def.permanent) {
      if (id === 'admin_tools') {
        this.showSolution = !this.showSolution;
        this.render();
        SFX.click();
      }
      if (id === 'dev_console') document.getElementById('dev-overlay')!.hidden = false;
      return;
    }

    if (!this.economy.consume(id)) {
      // try buy with free hint button path for magnifier via coins
      if (id === 'magnifier' && this.economy.state.coins >= 15) {
        this.economy.state.coins -= 15;
        this.economy.persist();
        this.refreshCurrency();
      } else {
        SFX.error();
        return;
      }
    }

    switch (id) {
      case 'magnifier':
      case 'robot':
        this.applyHintFill();
        break;
      case 'eraser_plus':
        this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()));
        this.pushHistory();
        this.render();
        SFX.click();
        break;
      case 'time_freeze':
        this.economy.state.buffs.timeFreezeUntil = Date.now() + 30000;
        this.economy.persist();
        SFX.hint();
        break;
      case 'double_coins':
        this.economy.state.buffs.doubleCoins = true;
        this.economy.persist();
        SFX.buy();
        break;
      case 'lucky_charm':
        this.economy.state.buffs.luckyCharm = true;
        this.economy.persist();
        SFX.buy();
        break;
      case 'spotlight':
        // just re-render with focus — same as selection highlight
        SFX.hint();
        this.render();
        break;
      case 'pencil_master':
        this.autoNotes();
        break;
      case 'undo_stack':
        SFX.click();
        break;
      case 'shield':
        this.economy.state.buffs.shield = true;
        this.economy.persist();
        SFX.click();
        break;
      case 'compass': {
        const h = getHint(this.board);
        if (h) this.selectCell(h.row, h.col);
        else {
          for (let r = 0; r < 9; r++)
            for (let c = 0; c < 9; c++)
              if (this.board[r][c] === 0) {
                this.selectCell(r, c);
                break;
              }
        }
        SFX.hint();
        break;
      }
      case 'bomb':
        if (this.selected) {
          const br = Math.floor(this.selected.r / 3) * 3;
          const bc = Math.floor(this.selected.c / 3) * 3;
          for (let r = br; r < br + 3; r++)
            for (let c = bc; c < bc + 3; c++) this.notes[r][c].clear();
          this.pushHistory();
          this.render();
        }
        SFX.click();
        break;
      case 'wand':
        fillNakedSingles(this.board, this.solution);
        this.pushHistory();
        this.render();
        this.checkWin();
        SFX.hint();
        break;
      case 'boost':
        this.economy.state.buffs.focusBoost = true;
        this.economy.persist();
        this.render();
        break;
      case 'key':
        this.newDaily('expert');
        break;
      default:
        SFX.click();
    }

    this.renderQuickItems();
    this.refreshCurrency();
  }

  private applyHintFill(): void {
    let hint = getHint(this.board);
    if (!hint) {
      for (let r = 0; r < 9; r++) {
        for (let c = 0; c < 9; c++) {
          if (this.board[r][c] === 0) {
            hint = { row: r, col: c, num: this.solution[r][c] };
            break;
          }
        }
        if (hint) break;
      }
    }
    if (!hint) return;
    this.selected = { r: hint.row, c: hint.col };
    this.board[hint.row][hint.col] = hint.num;
    this.notes[hint.row][hint.col].clear();
    this.clearNotesAround(hint.row, hint.col, hint.num);
    this.pushHistory();
    this.render();
    SFX.hint();
    this.checkWin();
  }

  private autoNotes(): void {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (this.board[r][c] === 0) {
          this.notes[r][c] = new Set(getCandidates(this.board, r, c));
        }
      }
    }
    this.pushHistory();
    this.render();
    SFX.note();
  }

  newGame(diff: Difficulty): void {
    this.isDaily = false;
    this.difficulty = diff;
    this.startRound(generatePuzzle(diff));
    this.syncDiffUI(diff);
  }

  newDaily(diff: Difficulty = 'medium'): void {
    this.isDaily = true;
    this.difficulty = diff;
    const { puzzle, solution } = generateDaily(diff);
    this.startRound({ puzzle, solution });
    this.syncDiffUI('daily');
  }

  private syncDiffUI(active: string): void {
    document.querySelectorAll<HTMLButtonElement>('.diff-btn').forEach((b) => {
      b.classList.toggle('active', b.dataset.diff === active);
    });
  }

  private startRound(data: { puzzle: Board; solution: Board }): void {
    this.stopTimer();
    this.seconds = 0;
    this.updateTimerDisplay();
    this.won = false;
    this.showSolution = false;
    this.$winOverlay.hidden = true;
    this.$confetti.hidden = true;
    this.puzzle = data.puzzle;
    this.solution = data.solution;
    this.board = copyBoard(data.puzzle);
    this.notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set<number>()));
    this.selected = null;
    this.notesMode = false;
    document.getElementById('btn-notes')!.classList.remove('active');
    this.history = [];
    this.historyIndex = -1;
    this.pushHistory();
    this.render();
    this.startTimer();
  }

  private startTimer(): void {
    this.stopTimer();
    this.timerId = setInterval(() => {
      if (Date.now() < this.economy.state.buffs.timeFreezeUntil) {
        this.$timer.classList.add('frozen');
        return;
      }
      this.$timer.classList.remove('frozen');
      this.seconds++;
      this.updateTimerDisplay();
    }, 1000);
  }

  private stopTimer(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private updateTimerDisplay(): void {
    const m = String(Math.floor(this.seconds / 60)).padStart(2, '0');
    const s = String(this.seconds % 60).padStart(2, '0');
    this.$timer.textContent = `${m}:${s}`;
  }

  private pushHistory(): void {
    const snap: HistorySnap = {
      board: copyBoard(this.board),
      notes: this.notes.map((row) => row.map((s) => new Set(s))),
    };
    this.history = this.history.slice(0, this.historyIndex + 1);
    this.history.push(snap);
    this.historyIndex = this.history.length - 1;
    if (this.history.length > 80) {
      this.history.shift();
      this.historyIndex--;
    }
  }

  undo(): void {
    if (this.historyIndex <= 0 || this.won) return;
    this.historyIndex--;
    const snap = this.history[this.historyIndex];
    this.board = copyBoard(snap.board);
    this.notes = snap.notes.map((row) => row.map((s) => new Set(s)));
    this.render();
    SFX.click();
  }

  selectCell(r: number, c: number): void {
    this.selected = { r, c };
    this.render();
  }

  inputNumber(num: number): void {
    if (!this.selected || this.won) return;
    const { r, c } = this.selected;
    if (this.puzzle[r][c] !== 0) return;

    if (this.notesMode) {
      const set = this.notes[r][c];
      if (set.has(num)) set.delete(num);
      else set.add(num);
      this.board[r][c] = 0;
      SFX.note();
    } else {
      this.board[r][c] = num;
      this.notes[r][c].clear();
      this.clearNotesAround(r, c, num);
      if (!isValidPlacement(this.board, r, c, num) && !this.economy.state.buffs.shield) SFX.error();
      else SFX.place();
      if (this.economy.state.buffs.shield && !isValidPlacement(this.board, r, c, num)) {
        this.economy.state.buffs.shield = false;
        this.economy.persist();
      }
    }

    this.pushHistory();
    this.render();
    this.checkWin();
  }

  erase(): void {
    if (!this.selected || this.won) return;
    const { r, c } = this.selected;
    if (this.puzzle[r][c] !== 0) return;
    this.board[r][c] = 0;
    this.notes[r][c].clear();
    this.pushHistory();
    this.render();
    SFX.click();
  }

  toggleNotes(): void {
    this.notesMode = !this.notesMode;
    document.getElementById('btn-notes')!.classList.toggle('active', this.notesMode);
    SFX.click();
  }

  private clearNotesAround(row: number, col: number, num: number): void {
    for (let i = 0; i < 9; i++) {
      this.notes[row][i].delete(num);
      this.notes[i][col].delete(num);
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++) this.notes[r][c].delete(num);
  }

  private checkWin(): void {
    if (!isComplete(this.board) || !isCorrect(this.board, this.solution)) return;
    this.won = true;
    this.stopTimer();
    SFX.win();

    const reward = this.economy.rewardWin(this.difficulty, this.seconds, this.isDaily);
    this.refreshCurrency();

    // Score: higher is better — invert time
    const score = Math.max(0, 100000 - this.seconds * 10 + (this.isDaily ? 5000 : 0));
    YT.sendScore(score);

    const stats = this.economy.state.stats;
    document.getElementById('win-title')!.textContent = this.isDaily ? 'Daily Complete!' : 'Completed';
    if (this.economy.hasPass('crown')) {
      document.getElementById('win-icon')!.textContent = '👑';
    }
    this.$winTime.textContent = `Time: ${this.$timer.textContent}`;
    document.getElementById('win-stats')!.innerHTML = `
      <div>Games won: <b>${stats.completed}</b></div>
      <div>Daily streak: <b>${stats.dailyStreak}</b></div>
      <div>Best (${this.isDaily ? 'daily' : this.difficulty}): <b>${this.fmt(stats.bestTimes[this.isDaily ? 'daily' : this.difficulty])}</b></div>`;
    document.getElementById('win-rewards')!.innerHTML = `
      <span class="pill">+🪙 ${reward.coins}</span>
      ${reward.gems ? `<span class="pill">+💎 ${reward.gems}</span>` : ''}`;

    this.burstConfetti();
    this.$winOverlay.hidden = false;
  }

  private fmt(sec?: number): string {
    if (sec === undefined) return '—';
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  }

  private burstConfetti(): void {
    const canvas = this.$confetti;
    canvas.hidden = false;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext('2d')!;
    const pieces = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: -20 - Math.random() * 80,
      vy: 2 + Math.random() * 3,
      vx: -1 + Math.random() * 2,
      w: 4 + Math.random() * 6,
      h: 6 + Math.random() * 8,
      color: ['#3B4CCA', '#E8EBFA', '#E07A6A', '#F8F5F0', '#7B8CFF'][Math.floor(Math.random() * 5)],
      rot: Math.random() * Math.PI,
    }));
    let frames = 0;
    const tick = () => {
      frames++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pieces.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += 0.05;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      });
      if (frames < 90) requestAnimationFrame(tick);
      else canvas.hidden = true;
    };
    requestAnimationFrame(tick);
  }

  private onKey(e: KeyboardEvent): void {
    if (this.won) return;
    if (e.key >= '1' && e.key <= '9') {
      this.inputNumber(Number(e.key));
      e.preventDefault();
    } else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') {
      this.erase();
      e.preventDefault();
    } else if (e.key === 'n' || e.key === 'N') this.toggleNotes();
    else if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
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

  private render(): void {
    this.$board.innerHTML = '';
    const selectedNum = this.selected ? this.board[this.selected.r][this.selected.c] : 0;
    const focus = this.economy.state.buffs.focusBoost;

    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.setAttribute('role', 'gridcell');

        const val = this.board[r][c];
        const isGiven = this.puzzle[r][c] !== 0;

        if (isGiven) cell.classList.add('given');
        else if (val) cell.classList.add('player');

        if (this.selected) {
          if (this.selected.r === r && this.selected.c === c) cell.classList.add('selected');
          else if (
            this.selected.r === r ||
            this.selected.c === c ||
            (Math.floor(this.selected.r / 3) === Math.floor(r / 3) &&
              Math.floor(this.selected.c / 3) === Math.floor(c / 3))
          )
            cell.classList.add('highlight');
        }

        if (selectedNum && val === selectedNum) {
          cell.classList.add('same-number');
          if (focus) cell.classList.add('focus-boost');
        }

        if (!isGiven && val && !isValidPlacement(this.board, r, c, val) && !this.economy.state.buffs.shield) {
          cell.classList.add('error');
        }

        if (this.showSolution && this.board[r][c] === 0) {
          cell.classList.add('ghost');
          cell.textContent = String(this.solution[r][c]);
        } else if (val) {
          cell.textContent = String(val);
        } else if (this.notes[r][c].size) {
          const notesEl = document.createElement('div');
          notesEl.className = 'notes';
          for (let n = 1; n <= 9; n++) {
            const span = document.createElement('span');
            if (this.notes[r][c].has(n)) span.textContent = String(n);
            notesEl.appendChild(span);
          }
          cell.appendChild(notesEl);
        }

        cell.addEventListener('click', () => this.selectCell(r, c));
        this.$board.appendChild(cell);
      }
    }

    const counts = Array(10).fill(0) as number[];
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (this.board[r][c]) counts[this.board[r][c]]++;
    document.querySelectorAll<HTMLButtonElement>('.num-btn').forEach((btn) => {
      const n = Number(btn.dataset.num);
      btn.classList.toggle('disabled', counts[n] >= 9);
    });
  }
}
