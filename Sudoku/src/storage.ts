/** Zenoku — localStorage persistence */

import type { Board, Difficulty } from './sudoku';

const STORAGE_KEY = 'zenoku_save_v1';
const STATS_KEY = 'zenoku_stats_v1';

export interface GameState {
  difficulty: Difficulty;
  puzzle: Board;
  solution: Board;
  board: Board;
  notes: number[][][];
  seconds: number;
}

export interface Stats {
  completed: number;
  bestTimes: Partial<Record<Difficulty, number>>;
}

export const Storage = {
  save(state: GameState): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* quota or private mode */
    }
  },

  load(): GameState | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as GameState) : null;
    } catch {
      return null;
    }
  },

  clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  },

  getStats(): Stats {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      return raw ? (JSON.parse(raw) as Stats) : { completed: 0, bestTimes: {} };
    } catch {
      return { completed: 0, bestTimes: {} };
    }
  },

  recordWin(diff: Difficulty, seconds: number): void {
    const stats = this.getStats();
    stats.completed = (stats.completed || 0) + 1;
    if (!stats.bestTimes[diff] || seconds < stats.bestTimes[diff]!) {
      stats.bestTimes[diff] = seconds;
    }
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch {
      /* ignore */
    }
  },
};
