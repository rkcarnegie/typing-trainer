# Typing Trainer

A simple browser-based typing speed test. Pick a mode, type the text that
appears, and see your words-per-minute, accuracy, and error count update
live as you go.

## Features

- **Two modes** — **Passage**, where you type a fixed short, medium, or
  long passage to completion, and **Countdown**, where you type against a
  15/30/60-second timer against a continuous stream of text.
- **Difficulty levels** — short, medium, and long passages in Passage mode,
  chosen at random from a small built-in bank for each level.
- **Live stats** — WPM, accuracy, time (elapsed or remaining, depending on
  mode), and error count update as you type, with correct/incorrect
  characters highlighted in the passage.
- **Best scores** — your top WPM for each difficulty and each countdown
  duration is saved in the browser's `localStorage` and persists between
  visits.
- **Dark mode** — toggle with the moon/sun button in the header; your
  preference is remembered, and it defaults to your system theme. Both
  themes use a green color scheme with legible, high-contrast text.

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
