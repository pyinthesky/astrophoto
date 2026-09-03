# Astro NPF Calculator

A modern, fully client-side rebuild of Frédéric Michaud's astrophotography calculator. It estimates the longest untracked exposure before stars visibly trail using the full declination-aware NPF rule.

## Features

- Full NPF, simplified NPF, 4–Crop, and 500-rule comparisons
- Three sharpness tolerances
- A reconstructed 3×3 exposure map based on latitude and camera direction
- Current camera sensor profiles with custom-sensor support
- Static export with no server, account, analytics, or personal data collection

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

The static site is written to `out/`. Pushes to `main` deploy automatically to GitHub Pages.
