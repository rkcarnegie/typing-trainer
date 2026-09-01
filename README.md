# Typing Trainer

A simple browser-based typing speed test. Pick a difficulty, type the
passage that appears, and see your words-per-minute, accuracy, and error
count update live as you go.

## Features

- **Difficulty levels** — short, medium, and long passages, chosen at random
  from a small built-in bank for each level.
- **Live stats** — WPM, accuracy, elapsed time, and error count update as
  you type, with correct/incorrect characters highlighted in the passage.
- **Best scores** — your top WPM for each difficulty is saved in the
  browser's `localStorage` and persists between visits.
- **Dark mode** — toggle with the moon/sun button in the header; your
  preference is remembered, and it defaults to your system theme.

## Running it

This is a static HTML/CSS/JS app with no build step or dependencies. Open
[index.html](index.html) directly in a browser, or serve the folder with
any static file server, e.g.:

```bash
npx serve .
```

## Files

- `index.html` — page structure
- `style.css` — layout and theming (light/dark via CSS variables)
- `passages.js` — the passage text bank, grouped by difficulty
- `script.js` — typing logic, live stats, and score persistence
