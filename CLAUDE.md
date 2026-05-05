# The Wishlist — Claude Code Project Guide

## What This Is

A PWA wishlist app built for intentional shopping. The core thesis: most apps are built to make you buy faster. This app helps you want things better — save things you're genuinely watching, track how long you've wanted them, and decide if you still do.

Installable on iPhone and Android via "Add to Home Screen". Feels like a native app.

## Docs

- [`PRD.md`](./PRD.md) — product requirements, features, out of scope
- [`TECH_SPEC.md`](./TECH_SPEC.md) — architecture, data model, key functions

## Stack

**Single-file vanilla JS PWA. No build step.**

- Everything lives in `index.html` — all CSS, HTML templates, and JS in one file
- `sw.js` — service worker for caching and offline support
- `manifest.json` — PWA manifest
- `bookmarklet.html` — browser bookmarklet for adding items from any product page
- `install.html` — redirects to `/#install` for legacy links
- Hosted on GitHub Pages at `https://theaposey.github.io/Wishlist/`

## Design Principles

**Reference: SSENSE.** The UI should feel like a direct spiritual sibling.

- **Pure white background.** `#FFFFFF`.
- **Zero decoration.** No border-radius on cards. No shadows. No gradients.
- **All caps typography throughout.** Labels, nav, buttons, card metadata — all caps, tight letter-spacing.
- **The numbered prefix system.** Days watching shown as `047` prefix on cards.
- **Bold editorial type for big moments.** Empty states, onboarding — large, bold, stacked all-caps.
- **Tight grid, minimal gutters.** Cards close together.
- **Images on white bg.** Product images float, not boxed.
- **Accent color:** `#2E45FF` (blue) — used sparingly for active states and install icon.

### Typography
- Font: `Helvetica Neue` / system-ui
- Labels: 9–10px, all-caps, `letter-spacing: 0.1em`, color `#999` for secondary

### Colors
- Background: `#FFFFFF`
- Text primary: `#000000`
- Text secondary: `#999999`
- Accent: `#2E45FF`

## Rules

- **Never** use `alert()` or `confirm()` — use in-app UI
- **Never** add features not discussed without flagging it
- **Always** handle the case where an item has no image (clean placeholder with item name)
- **Always** bump the SW cache version (`wishlist-vN`) when deploying changes so users get fresh code
- All data lives in `localStorage` under keys `vitrine_wishlists` and `vitrine_items`
- The app must work **fully offline** after first load
