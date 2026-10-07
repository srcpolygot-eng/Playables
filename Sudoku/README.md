# Zenoku — Soft Minimal Paper Sudoku

Clean, calm, premium Sudoku built for **YouTube Playables**.
Pure HTML + CSS + JS. No frameworks, no build step.

Open `index.html` or serve the folder with any static server.

## Design

**Soft Minimal Paper**
- Warm off-white background (`#F8F5F0`)
- Soft shadows, rounded cells
- Deep indigo player numbers
- Calm accents only
- Dark mode toggle included

## Features

- Classic Sudoku with 4 difficulties (Easy → Expert)
- Pencil notes (toggle or press `N`)
- Undo, Hint, Erase
- Timer + autosave (localStorage)
- Keyboard support (arrows, 1–9, Backspace)
- Soft win celebration
- Responsive portrait-first layout

## Controls

| Input | Action |
|-------|--------|
| Tap / click cell | Select |
| 1–9 | Place number or note |
| Backspace / Delete | Erase |
| N | Toggle notes mode |
| Arrows | Move selection |
| Ctrl/Cmd + Z | Undo |

## Files

```
Sudoku/
├── index.html
├── css/main.css
├── js/
│   ├── sudoku.js    Generator + solver helpers
│   ├── storage.js   localStorage
│   ├── app.js       Game controller
│   └── main.js      Boot
└── README.md
```
