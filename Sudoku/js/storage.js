/**
 * Zenoku — localStorage persistence
 */

const STORAGE_KEY = 'zenoku_save_v1';
const STATS_KEY = 'zenoku_stats_v1';

const Storage = {
  save(state) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) { /* quota or private mode */ }
  },

  load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  },

  clear() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  },

  getStats() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      return raw ? JSON.parse(raw) : { completed: 0, bestTimes: {} };
    } catch (e) {
      return { completed: 0, bestTimes: {} };
    }
  },

  recordWin(diff, seconds) {
    const stats = this.getStats();
    stats.completed = (stats.completed || 0) + 1;
    if (!stats.bestTimes[diff] || seconds < stats.bestTimes[diff]) {
      stats.bestTimes[diff] = seconds;
    }
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(stats));
    } catch (e) {}
  },
};
