/** Coins, gems, inventory, gamepasses */

import type { ItemId } from './items';
import { getItem, ITEMS } from './items';
import { SFX } from './audio';

const KEY = 'zenoku_economy_v1';

export interface EconomyState {
  coins: number;
  gems: number;
  inventory: Partial<Record<ItemId, number>>;
  owned: ItemId[]; // permanent unlocks
  buffs: {
    doubleCoins: boolean;
    luckyCharm: boolean;
    shield: boolean;
    focusBoost: boolean;
    timeFreezeUntil: number;
  };
  stats: {
    completed: number;
    bestTimes: Record<string, number>;
    dailyStreak: number;
    lastDaily: string;
    totalCoinsEarned: number;
  };
}

const defaultState = (): EconomyState => ({
  coins: 120,
  gems: 5,
  inventory: { magnifier: 2, robot: 1 },
  owned: [],
  buffs: {
    doubleCoins: false,
    luckyCharm: false,
    shield: false,
    focusBoost: false,
    timeFreezeUntil: 0,
  },
  stats: {
    completed: 0,
    bestTimes: {},
    dailyStreak: 0,
    lastDaily: '',
    totalCoinsEarned: 0,
  },
});

function load(): EconomyState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return defaultState();
    return { ...defaultState(), ...JSON.parse(raw) };
  } catch {
    return defaultState();
  }
}

function save(s: EconomyState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    /* ignore */
  }
}

export class Economy {
  state: EconomyState;

  constructor() {
    this.state = load();
  }

  persist(): void {
    save(this.state);
  }

  hasPass(id: ItemId): boolean {
    return this.state.owned.includes(id);
  }

  count(id: ItemId): number {
    return this.state.inventory[id] ?? 0;
  }

  canAfford(id: ItemId): boolean {
    const item = getItem(id);
    if (item.permanent && this.hasPass(id)) return false;
    return item.currency === 'coins'
      ? this.state.coins >= item.price
      : this.state.gems >= item.price;
  }

  buy(id: ItemId): boolean {
    const item = getItem(id);
    if (!this.canAfford(id)) return false;
    if (item.currency === 'coins') this.state.coins -= item.price;
    else this.state.gems -= item.price;

    if (item.permanent) {
      if (!this.state.owned.includes(id)) this.state.owned.push(id);
    } else {
      this.state.inventory[id] = (this.state.inventory[id] ?? 0) + 1;
    }
    SFX.buy();
    this.persist();
    return true;
  }

  /** Consume one from inventory; returns false if none */
  consume(id: ItemId): boolean {
    const n = this.count(id);
    if (n <= 0) return false;
    this.state.inventory[id] = n - 1;
    this.persist();
    return true;
  }

  rewardWin(diff: string, seconds: number, isDaily: boolean): { coins: number; gems: number } {
    const base: Record<string, number> = { easy: 25, medium: 45, hard: 70, expert: 100, daily: 80 };
    let coins = base[isDaily ? 'daily' : diff] ?? 30;
    if (this.state.buffs.doubleCoins) {
      coins *= 2;
      this.state.buffs.doubleCoins = false;
    }
    // time bonus
    if (seconds < 180) coins += 15;
    else if (seconds < 300) coins += 8;

    let gems = 0;
    if (this.state.buffs.luckyCharm) {
      this.state.buffs.luckyCharm = false;
      if (Math.random() < 0.45) gems = 1;
    }
    if (isDaily) gems += 1;

    this.state.coins += coins;
    this.state.gems += gems;
    this.state.stats.completed += 1;
    this.state.stats.totalCoinsEarned += coins;

    const key = isDaily ? 'daily' : diff;
    const prev = this.state.stats.bestTimes[key];
    if (prev === undefined || seconds < prev) this.state.stats.bestTimes[key] = seconds;

    if (isDaily) {
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (this.state.stats.lastDaily === yesterday) this.state.stats.dailyStreak += 1;
      else if (this.state.stats.lastDaily !== today) this.state.stats.dailyStreak = 1;
      this.state.stats.lastDaily = today;
    }

    this.state.buffs.shield = false;
    this.state.buffs.focusBoost = false;
    this.persist();
    return { coins, gems };
  }

  catalog(): typeof ITEMS {
    return ITEMS;
  }
}
