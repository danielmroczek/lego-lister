# Lego Lister

## Overview

Lego Lister is a lightweight, client-side web app built to help rebuild sets from mixed brick collections.  
Enter a set number, load parts from Rebrickable, and print a list that is easy to browse while shopping for missing pieces.

Lego Lister was created to make rebuilding old mixed LEGO collections practical, with clear part lists you can print and use while sourcing missing pieces.

## Live Demo
Try it here: [Lego Lister](https://danielmroczek.github.io/lego-lister/)

## Project Origin

As a child, I was a huge LEGO fan. My brothers and I would occasionally receive LEGO sets from our parents for various occasions. All these bricks eventually ended up mixed together in one large suitcase. Twenty years later, my nephews discovered this suitcase. Being even bigger LEGO enthusiasts than I was at their age, they decided to embark on an ambitious project: finding all the original sets that my brothers and I had received in our childhood.

They took on this challenging task by first sorting all the bricks by color, then methodically trying to match them to their original sets. After many days of dedication, they succeeded! They managed to identify 40 different sets - I had no idea we had so many! However, they discovered that many sets were missing several pieces and weren't complete.

This inspired my project - to help source the missing pieces online. While similar tools existed, none provided parts lists in a clear, print-friendly format that could be easily added to a binder. That's how Lego Lister was born. Using it, I could print organized parts lists for each set, making it simple to track missing pieces and order replacements. The journey to complete these childhood sets continues!

## Features

- Set lookup by set number, with automatic suffix handling such as turning 1234 into 1234-1.
- Detailed set summary: name, number, theme, year, part totals.
- Parts grouped for practical use:
   - regular parts
   - spare regular parts
   - minifig parts grouped by minifig
- Stable sorting by BrickLink color id, then BrickLink part id.
- Direct links to BrickLink for both set and part pages.
- Print-focused layout with page-aware formatting.
- API key persistence in browser local storage.

## Tech Stack

- Alpine.js 3 (CDN)
- Vanilla JavaScript (no build tooling)
- Rebrickable API v3
- Plain HTML and CSS

## Quick Start

1. Clone or download this repository.
2. Open index.html in a browser.
3. On first run, paste your Rebrickable API key when prompted.
4. Search for a set number and review the generated parts list.

> [!TIP]
> You can get a free API key here: https://rebrickable.com/api/

## Printing

1. Load a set.
2. Press Ctrl+P (or Cmd+P on macOS).
3. Print using the built-in print styles.

The print view is optimized for compact cards and includes generated page footer information.

## Data and Security

> [!IMPORTANT]
> Your Rebrickable API key is stored only in your browser local storage.
> It is used only for direct requests to Rebrickable.

If the key becomes invalid, the app clears it and asks for a new one.

## Project Structure

- `index.html`: App markup and Alpine templates.
- `script.js`: Alpine component state, API integration, sorting, grouping, and view-model mapping.
- `style.css`: Screen and print styles.
- `manifest.json`: PWA metadata and icon configuration.
