/** Zenoku — Sudoku engine (seeded generator + validator + hints) */

export type Difficulty = 'easy' | 'medium' | 'hard' | 'expert';
export type Board = number[][];

export interface DifficultyConfig {
  clues: number;
  name: string;
}

export const DIFFICULTY: Record<Difficulty, DifficultyConfig> = {
  easy: { clues: 40, name: 'Easy' },
  medium: { clues: 32, name: 'Medium' },
  hard: { clues: 26, name: 'Hard' },
  expert: { clues: 22, name: 'Expert' },
};

export interface HintResult {
  row: number;
  col: number;
  num: number;
  type?: string;
}

/** Mulberry32 seeded PRNG */
export function makeRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashString(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function emptyBoard(): Board {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

export function copyBoard(b: Board): Board {
  return b.map((row) => row.slice());
}

export function isValid(board: Board, row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (board[row][i] === num || board[i][col] === num) return false;
  }
  const br = Math.floor(row / 3) * 3;
  const bc = Math.floor(col / 3) * 3;
  for (let r = br; r < br + 3; r++) {
    for (let c = bc; c < bc + 3; c++) {
      if (board[r][c] === num) return false;
    }
  }
  return true;
}

function findEmpty(board: Board): [number, number] | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return [r, c];
    }
  }
  return null;
}

function shuffleInPlace<T>(arr: T[], rng: () => number): void {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

export function solve(board: Board, rng: () => number = Math.random): boolean {
  const pos = findEmpty(board);
  if (!pos) return true;
  const [r, c] = pos;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  shuffleInPlace(nums, rng);
  for (const n of nums) {
    if (isValid(board, r, c, n)) {
      board[r][c] = n;
      if (solve(board, rng)) return true;
      board[r][c] = 0;
    }
  }
  return false;
}

function countSolutions(board: Board, limit = 2): number {
  let count = 0;
  function dfs(b: Board): void {
    if (count >= limit) return;
    const pos = findEmpty(b);
    if (!pos) {
      count++;
      return;
    }
    const [r, c] = pos;
    for (let n = 1; n <= 9; n++) {
      if (isValid(b, r, c, n)) {
        b[r][c] = n;
        dfs(b);
        b[r][c] = 0;
        if (count >= limit) return;
      }
    }
  }
  dfs(copyBoard(board));
  return count;
}

export function generatePuzzle(
  diff: Difficulty = 'medium',
  seed?: number,
): { puzzle: Board; solution: Board } {
  const rng = seed !== undefined ? makeRng(seed) : Math.random;
  const solution = emptyBoard();
  solve(solution, rng);

  const puzzle = copyBoard(solution);
  const targetClues = DIFFICULTY[diff]?.clues ?? 32;

  const cells: [number, number][] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);
  shuffleInPlace(cells, rng);

  let clues = 81;
  for (const [r, c] of cells) {
    if (clues <= targetClues) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[r][c] = backup;
    } else {
      clues--;
    }
  }

  return { puzzle, solution };
}

export function generateDaily(diff: Difficulty = 'medium'): { puzzle: Board; solution: Board; key: string } {
  const key = todayKey();
  const seed = hashString(`zenoku-daily-${key}-${diff}`);
  const { puzzle, solution } = generatePuzzle(diff, seed);
  return { puzzle, solution, key };
}

export function getCandidates(board: Board, row: number, col: number): number[] {
  if (board[row][col] !== 0) return [];
  const cands: number[] = [];
  for (let n = 1; n <= 9; n++) {
    if (isValid(board, row, col, n)) cands.push(n);
  }
  return cands;
}

export function getHint(board: Board): HintResult | null {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) {
        const cands = getCandidates(board, r, c);
        if (cands.length === 1) {
          return { row: r, col: c, num: cands[0], type: 'naked-single' };
        }
      }
    }
  }
  return null;
}

export function fillNakedSingles(board: Board, solution: Board): number {
  let n = 0;
  let changed = true;
  while (changed) {
    changed = false;
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          const cands = getCandidates(board, r, c);
          if (cands.length === 1) {
            board[r][c] = cands[0];
            n++;
            changed = true;
          }
        }
      }
    }
  }
  // fallback one cell if none
  if (n === 0) {
    for (let r = 0; r < 9; r++) {
      for (let c = 0; c < 9; c++) {
        if (board[r][c] === 0) {
          board[r][c] = solution[r][c];
          return 1;
        }
      }
    }
  }
  return n;
}

export function isComplete(board: Board): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) return false;
  return true;
}

export function isCorrect(board: Board, solution: Board): boolean {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] !== solution[r][c]) return false;
  return true;
}

export function isValidPlacement(board: Board, row: number, col: number, num: number): boolean {
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
