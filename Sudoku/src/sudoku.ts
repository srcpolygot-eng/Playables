/** Zenoku — Sudoku engine (generator + validator + hints) */

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

export function solve(board: Board): boolean {
  const pos = findEmpty(board);
  if (!pos) return true;
  const [r, c] = pos;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  for (let i = nums.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [nums[i], nums[j]] = [nums[j], nums[i]];
  }
  for (const n of nums) {
    if (isValid(board, r, c, n)) {
      board[r][c] = n;
      if (solve(board)) return true;
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

export function generatePuzzle(diff: Difficulty = 'medium'): { puzzle: Board; solution: Board } {
  const solution = emptyBoard();
  solve(solution);

  const puzzle = copyBoard(solution);
  const targetClues = DIFFICULTY[diff]?.clues ?? 32;

  const cells: [number, number][] = [];
  for (let r = 0; r < 9; r++) for (let c = 0; c < 9; c++) cells.push([r, c]);

  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

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

/** Check if placing val at r,c conflicts (ignoring the cell itself) */
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
