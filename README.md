# Astro NPF · Astrophotography Field Toolkit

A modern, fully client-side rebuild of Frédéric Michaud's astrophotography calculator, expanded with a mobile night-sky planner and approachable Lightroom presets.

**Live site:** https://pyinthesky.github.io/astrophoto/

## Features

- Full NPF, simplified NPF, 4–Crop, and 500-rule comparisons
- Three sharpness tolerances
- A reconstructed 3×3 exposure map based on latitude and camera direction
- Current camera sensor profiles with custom-sensor support
- Location-aware Milky Way, bright-star, Moon, and astronomical-darkness planner
- Six downloadable Lightroom / Camera Raw XMP presets for night-sky images
- Persistent OLED night-vision palette with pure black surfaces and dim red controls
- Indexable static routes, canonical metadata, structured data, sitemap, and social share card
- Static export with no server, account, analytics, or personal data collection

Location coordinates are used only in the browser and are not stored or transmitted.

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
