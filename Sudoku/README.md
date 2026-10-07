# Zenoku v2 — Soft Minimal Paper Sudoku

TypeScript + Vite. Built for **YouTube Playables**.

```bash
npm install
npm run dev
npm run build   # → dist/  (zip for Playables)
```

## Features

### Core
- Classic Sudoku · Easy → Expert
- **Daily puzzle** (seeded by date — same for everyone)
- Pencil notes · Undo · Erase
- Soft win confetti + stats + rewards
- Dark mode · system fonts (no CDN)

### Economy
- **Coins** & **Gems**
- Shop + inventory bag
- Win rewards scale by difficulty / daily / time

### Items (22)
Magnifying Glass · Robot · Eraser Plus · Time Freeze · Double Coins · Lucky Charm · Spotlight · Pencil Master · Undo Stack · Error Shield · Compass · Note Bomb · Wizard Wand · Hourglass · Daily Key · Streak Shield · Mirror Notes · Focus Boost · Night Owl · Crown

### Gamepasses
- **Admin Tools** — toggle solution ghost overlay (`S`)
- **Dev Console** — debug panel (`` ` `` key)

### YouTube Playables SDK
- Loads `game_api/v1`
- `firstFrameReady` / `gameReady`
- Pause / resume timer
- Audio flag respected (Web Audio SFX)
- `sendScore` on win

## Controls

| Input | Action |
|-------|--------|
| 1–9 | Place / note |
| N | Notes mode |
| Arrows | Move |
| Ctrl/Cmd+Z | Undo |
| ` | Dev console (if owned) |
| S | Solution overlay (Admin Tools) |
