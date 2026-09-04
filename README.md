# Astro NPF · Astrophotography Field Toolkit

A modern, fully client-side rebuild of Frédéric Michaud's astrophotography calculator, expanded with a mobile night-sky planner and approachable Lightroom presets.

**Live site:** https://pyinthesky.github.io/astrophoto/

## Features

- Full NPF, simplified NPF, 4–Crop, and 500-rule comparisons
- Three sharpness tolerances
- A reconstructed 3×3 exposure map based on latitude and camera direction
- Current camera sensor profiles with custom-sensor support
- Location-aware Milky Way, bright-star, Moon, and astronomical-darkness planner
- Target-aware trip planner that recommends catalogue objects for a location and date, accepts any catalogue object, ranks nights, and finds nearby outdoor areas to scout
- Monthly Sun and Moon calendar with phases, rise/set times, twilight, astronomical darkness, and moonless observing hours
- Searchable 13,000-object Messier, Caldwell, NGC, and IC catalogue
- Optional on-demand cloud, precipitation, wind, visibility, and dew forecast
- Field-of-view, pixel-scale, star-drift, exposure-value, integration-time, and pixel-étendue / sky-limited SNR comparison calculators
- Six downloadable Lightroom / Camera Raw XMP presets for night-sky images
- Persistent OLED night-vision palette with pure black surfaces and dim red controls
- Indexable static routes, canonical metadata, structured data, sitemap, and social share card
- Static export with no server, account, analytics, or personal data collection

Sky calculations run in the browser. Coordinates are transmitted only after an explicit weather or nearby-place request, rounded to 0.01°, to Open-Meteo or the OpenStreetMap Overpass API respectively. Trip Planner searches over 250 km match against an embedded catalogue of certified dark-sky destinations and do not transmit coordinates. The trip planner can save a chosen starting point in the browser for convenience.

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

## Catalogue data

Deep-sky target data is derived from [OpenNGC](https://github.com/mattiaverga/OpenNGC), created by Mattia Verga and contributors and licensed under [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/). Run `npm run update:targets` to rebuild the compact browser catalogue from the current OpenNGC source files.
