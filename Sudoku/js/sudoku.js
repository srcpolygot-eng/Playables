/**
 * Zenoku — Sudoku engine
 * Generator + validator + simple solver (for hints)
 */

const DIFFICULTY = {
  easy:   { clues: 40, name: 'Easy' },
  medium: { clues: 32, name: 'Medium' },
  hard:   { clues: 26, name: 'Hard' },
  expert: { clues: 22, name: 'Expert' },
};

function emptyBoard() {
  return Array.from({ length: 9 }, () => Array(9).fill(0));
}

function copyBoard(b) {
  return b.map(row => row.slice());
}

function isValid(board, row, col, num) {
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

function findEmpty(board) {
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      if (board[r][c] === 0) return [r, c];
    }
  }
  return null;
}

function solve(board) {
  const pos = findEmpty(board);
  if (!pos) return true;
  const [r, c] = pos;
  const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  // shuffle for variety when generating
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

function countSolutions(board, limit = 2) {
  let count = 0;
  function dfs(b) {
    if (count >= limit) return;
    const pos = findEmpty(b);
    if (!pos) { count++; return; }
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

function generatePuzzle(diff = 'medium') {
  const solution = emptyBoard();
  solve(solution); // full solved grid

  const puzzle = copyBoard(solution);
  const targetClues = DIFFICULTY[diff]?.clues ?? 32;

  // cells to try removing
  const cells = [];
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      cells.push([r, c]);

  // shuffle
  for (let i = cells.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cells[i], cells[j]] = [cells[j], cells[i]];
  }

  let clues = 81;
  for (const [r, c] of cells) {
    if (clues <= targetClues) break;
    const backup = puzzle[r][c];
    puzzle[r][c] = 0;
    // keep uniqueness
    if (countSolutions(puzzle, 2) !== 1) {
      puzzle[r][c] = backup;
    } else {
      clues--;
    }
  }

  return { puzzle, solution };
}

function getCandidates(board, row, col) {
  if (board[row][col] !== 0) return [];
  const cands = [];
  for (let n = 1; n <= 9; n++) {
    if (isValid(board, row, col, n)) cands.push(n);
  }
  return cands;
}

/** Simple hint: find a cell with only one candidate (naked single) */
function getHint(board) {
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
  // fallback: any empty cell from solution perspective is handled by caller
  return null;
}

function isComplete(board) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] === 0) return false;
  return true;
}

function isCorrect(board, solution) {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board[r][c] !== solution[r][c]) return false;
  return true;
}
