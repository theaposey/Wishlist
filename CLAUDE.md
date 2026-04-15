# Vitrine — Claude Code Project Guide

## What This Is

Vitrine is a PWA (Progressive Web App) wishlist app built around intentional shopping. The core thesis: most apps are built to make you buy faster. Vitrine is built to help you want things better — to save the things you're genuinely watching, track how long you've wanted them, and nudge you to decide if you still do.

It should be immediately installable on iPhone and Android via "Add to Home Screen" and feel like a native app.

## Docs

- [`PRD.md`](./PRD.md) — full product requirements, user stories, feature list, out of scope
- [`TECH_SPEC.md`](./TECH_SPEC.md) — tech stack, data models, component tree, PWA setup

## Stack

- **Vite + React** (TypeScript)
- **Tailwind CSS** for styling
- **vite-plugin-pwa** for service worker + manifest
- **localStorage** for all data (no backend in MVP)
- **uuid** for item IDs
- **React Router v6** for navigation

## Design Principles

**Reference app: SSENSE.** Study it. The Vitrine UI should feel like a direct spiritual sibling — not a clone, but clearly from the same design philosophy.

### What SSENSE does that we copy exactly
- **Pure white background.** `#FFFFFF`. Not off-white, not warm white. White.
- **Zero decoration.** No border-radius on anything. No shadows. No gradients. No accent colors. The product photography provides all the visual warmth.
- **All caps typography throughout.** Section labels, nav items, buttons, card metadata — all caps, tight letter-spacing (`tracking-widest` or `letter-spacing: 0.1em`).
- **The numbered prefix system.** SSENSE prefixes sections with a count (007, 033, 040). Vitrine adapts this: each item card shows the days watching as the prefix — `047` in small muted text, then `WATCHING` or the item name. This is a core brand moment.
- **Bold editorial type for big moments.** Empty state, onboarding — use large, bold, all-caps stacked text (like the RICK OWENS / MARYAM NASSIR ZADEH hero). This is the most distinctive SSENSE move.
- **Tight grid, minimal gutters.** Cards sit close together. `gap-px` or `gap-0.5` between grid items.
- **Images on white/transparent bg.** Product images should float, not be contained in colored boxes.
- **Bottom nav:** 4 items, all caps tiny label, active state = small dot underneath the label, no filled icons.
- **Header:** Left-aligned utility text, right-aligned utility text. No logo lockup in the header — the name "VITRINE" lives elsewhere.

### Typography
- **Font:** `Helvetica Neue` or `system-ui` stack — no Google Fonts needed, we're not going editorial serif, we're going Swiss/utilitarian
- **Headings:** Bold, all-caps, large (32–48px for hero moments)
- **Labels/metadata:** 10–11px, all-caps, `letter-spacing: 0.1em`, color `#999` for secondary

### Colors
- Background: `#FFFFFF`
- Text primary: `#000000`
- Text secondary / muted: `#999999`
- No accent color. If we need a state indicator (nudge dot), use `#000000` filled circle, small.

### What we do NOT do
- No rounded corners (`border-radius: 0` everywhere)
- No card shadows
- No color fills on buttons (outline only, or solid black)
- No icons that are decorative — only functional
- No animations beyond simple opacity fades

## Rules

- **Never** add features not in the PRD without flagging it
- **Always** handle the case where an item has no image (show a clean placeholder with the item name)
- **Always** make the app feel installable — test that the manifest and service worker are correctly configured
- **Never** use `alert()` or `confirm()` — use in-app UI for all interactions
- Use **TypeScript strictly** — no `any` types
- All data operations go through a single `useStore` hook that wraps localStorage
- The app must work **fully offline** after first load
