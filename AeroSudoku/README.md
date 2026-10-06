# AeroSudoku 4K Paradox

Professional aerospace Sudoku. Pure **HTML + CSS + JS** — no build step, 100% offline-safe after the first CDN load for Tailwind, Font Awesome, and Google Fonts.

Open `index.html` in a browser, or serve the folder with any static file server.

## Project layout

```
AeroSudoku/
├── index.html              HTML shell & UI
├── css/
│   ├── main.css            Board, cells, HUD
│   ├── themes.css          Cyber / Classic / Cockpit
│   └── animations.css      Pop, shake
├── js/
│   ├── sudoku.js           Puzzle generator (classic, killer, X, alpha)
│   ├── solver.js           Backtracking solver + logic hints
│   ├── app.js              Game loop, input, modes
│   ├── particles.js        Win / line-clear effects
│   ├── storage.js          Autosave + stats (localStorage)
│   └── main.js             Boot
└── audio/
    └── audio.js            Web Audio synthesizer SFX
```

## Modes

Classic · Killer · X-Diagonals · Alpha Paradox · Daily Paradox · Time Attack · Robot Race

Difficulties: Easy → Medium → Hard → Expert → Master → Paradox

## Controls

| Input | Action |
|---|---|
| Click / tap cell | Select |
| 1–9 | Place number (or pencil note) |
| Backspace / Delete | Erase |
| N | Toggle notes |
| Arrows | Move selection |
| Ctrl/Cmd+Z | Undo |
| Ctrl/Cmd+Shift+Z | Redo |

## Features

- Pencil notes, smart hints, step-by-step logic
- Undo / redo, instant solve, mistake limit
- Theme cycle, 3D parallax, synthesizer SFX
- Autosave + player stats in `localStorage`
