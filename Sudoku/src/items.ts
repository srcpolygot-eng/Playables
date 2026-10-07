/** Catalog: consumables + gamepasses */

export type Currency = 'coins' | 'gems';

export type ItemId =
  | 'magnifier'
  | 'robot'
  | 'eraser_plus'
  | 'time_freeze'
  | 'double_coins'
  | 'lucky_charm'
  | 'spotlight'
  | 'pencil_master'
  | 'undo_stack'
  | 'shield'
  | 'compass'
  | 'bomb'
  | 'wand'
  | 'hourglass'
  | 'key'
  | 'streak_shield'
  | 'mirror'
  | 'boost'
  | 'night_owl'
  | 'crown'
  | 'admin_tools'
  | 'dev_console';

export interface ItemDef {
  id: ItemId;
  name: string;
  icon: string;
  desc: string;
  price: number;
  currency: Currency;
  permanent?: boolean; // gamepass
  consumable?: boolean;
}

export const ITEMS: ItemDef[] = [
  { id: 'magnifier', name: 'Magnifying Glass', icon: '🔍', desc: 'Reveal one correct number (hint).', price: 40, currency: 'coins', consumable: true },
  { id: 'robot', name: 'Robot Helper', icon: '🤖', desc: 'Auto-fill one logical cell.', price: 60, currency: 'coins', consumable: true },
  { id: 'eraser_plus', name: 'Eraser Plus', icon: '🧹', desc: 'Clear all pencil notes on the board.', price: 25, currency: 'coins', consumable: true },
  { id: 'time_freeze', name: 'Time Freeze', icon: '❄️', desc: 'Pause the timer for 30 seconds.', price: 50, currency: 'coins', consumable: true },
  { id: 'double_coins', name: 'Double Coins', icon: '✨', desc: '2× coins on your next win.', price: 80, currency: 'coins', consumable: true },
  { id: 'lucky_charm', name: 'Lucky Charm', icon: '🍀', desc: 'Chance of bonus gem on win.', price: 3, currency: 'gems', consumable: true },
  { id: 'spotlight', name: 'Spotlight', icon: '💡', desc: 'Highlight all cells of selected number.', price: 30, currency: 'coins', consumable: true },
  { id: 'pencil_master', name: 'Pencil Master', icon: '✏️', desc: 'Auto-fill candidate notes everywhere.', price: 100, currency: 'coins', consumable: true },
  { id: 'undo_stack', name: 'Undo Stack', icon: '↩️', desc: 'Restore 5 extra undo steps capacity.', price: 35, currency: 'coins', consumable: true },
  { id: 'shield', name: 'Error Shield', icon: '🛡️', desc: 'Ignore the next mistake (no red flash).', price: 45, currency: 'coins', consumable: true },
  { id: 'compass', name: 'Compass', icon: '🧭', desc: 'Select the next best empty cell.', price: 35, currency: 'coins', consumable: true },
  { id: 'bomb', name: 'Note Bomb', icon: '💣', desc: 'Clear notes in the selected 3×3 box.', price: 40, currency: 'coins', consumable: true },
  { id: 'wand', name: 'Wizard Wand', icon: '🪄', desc: 'Fill all naked singles at once.', price: 5, currency: 'gems', consumable: true },
  { id: 'hourglass', name: 'Hourglass', icon: '⏳', desc: 'Cosmetic: soft sand animation on timer.', price: 2, currency: 'gems', permanent: true },
  { id: 'key', name: 'Daily Key', icon: '🔑', desc: 'Unlock today’s Expert daily early.', price: 4, currency: 'gems', consumable: true },
  { id: 'streak_shield', name: 'Streak Shield', icon: '🔥', desc: 'Protect daily streak once.', price: 3, currency: 'gems', consumable: true },
  { id: 'mirror', name: 'Mirror Notes', icon: '🪞', desc: 'Copy notes from a related filled pattern.', price: 55, currency: 'coins', consumable: true },
  { id: 'boost', name: 'Focus Boost', icon: '⚡', desc: 'Stronger same-number highlight for 1 game.', price: 20, currency: 'coins', consumable: true },
  { id: 'night_owl', name: 'Night Owl', icon: '🦉', desc: 'Permanent dark theme unlock badge.', price: 2, currency: 'gems', permanent: true },
  { id: 'crown', name: 'Crown', icon: '👑', desc: 'Prestige badge on win screen.', price: 8, currency: 'gems', permanent: true },
  { id: 'admin_tools', name: 'Admin Tools', icon: '🛠️', desc: 'Gamepass: reveal solution overlay.', price: 25, currency: 'gems', permanent: true },
  { id: 'dev_console', name: 'Dev Console', icon: '💻', desc: 'Gamepass: open debug console.', price: 30, currency: 'gems', permanent: true },
];

export function getItem(id: ItemId): ItemDef {
  return ITEMS.find((i) => i.id === id)!;
}
