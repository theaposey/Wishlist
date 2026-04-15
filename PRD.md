# Vitrine — Product Requirements Document

## Overview

**Product name:** Vitrine
**Type:** PWA (Progressive Web App)
**Platform:** Mobile-first, installable via browser on iOS and Android
**MVP scope:** Personal wishlist with intentionality nudges and optional savings tracking

### The Problem

People digitally window shop constantly — screenshotting things, saving links, sending things to group chats — and have no good place to put any of it. Shopping apps are built to convert you into a buyer as fast as possible. The "save for later" function is a retention tactic, not a tool for deliberate wanting. The result: impulse purchases pile up, the things you truly wanted get forgotten or sold, and closets fill with things that weren't chosen well.

### The Solution

A clean, beautiful place to save the things you're genuinely watching. Vitrine tracks how long you've wanted something, prompts you to check in after 30 days ("still want this?"), and optionally helps you save toward it. It is built for the looking — not the buying.

### North Star

> The McQueen clutch that sold after 4 years of watching it should have sent a notification. That's the product.

---

## Users

**MVP target:** One user (personal tool, no accounts, no backend). Data lives in localStorage.
**Later phases:** Multi-user, social, shared vitrines.

---

## Features — MVP

### 1. Add an Item

**Entry points:**
- Tap the `+` button in the app → manual add flow
- Share a URL from Safari/Chrome browser directly to Vitrine (Web Share Target API)

**Fields:**
| Field | Required | Notes |
|---|---|---|
| Name | Yes | Text input, max 100 chars |
| Image | No | Upload from camera roll or paste URL. If URL is pasted in the URL field, attempt to use as image source. Show placeholder if none. |
| URL | No | The original product link |
| Note | No | Freeform text, max 500 chars |
| Price target | No | Numeric. If set, shows savings tracker on card. |

**On save:** Item is added with `addedAt: now`, `status: 'watching'`, `lastCheckedIn: now`.

---

### 2. The Vitrine (Main View)

The primary screen. A grid of everything currently being watched.

**Layout:** 2-column grid on mobile. Each card is image-first.

**Card anatomy:**
- Image (full bleed, square crop, 1:1 ratio)
- Name (below image, `Cormorant Garamond`, 16px)
- "Watching for X days" (small, `Inter`, muted — this is a key differentiator, always visible)
- Savings progress bar (only if price target is set) — minimal, thin bar below name
- Nudge indicator: if item has been watching for 30+ days without a check-in, show a subtle dot or visual treatment on the card

**Sorting:** Default is most recently added first. No sort controls in MVP.

**Empty state:** Clean, centered. Brand name, tagline ("Save what you're watching."), and a large `+` to add the first item. Should feel like an invitation, not an error.

---

### 3. Item Detail View

Tapping a card opens the full item view.

**Displays:**
- Full image (if available)
- Name
- URL (tappable — opens in browser)
- Note
- "Watching for X days" (prominent)
- Savings tracker: target price, amount saved (user-editable), days until goal at current rate (if applicable)
- Date added

**Actions:**
- **Edit** — opens edit flow (same form as Add)
- **Still want it / Let it go** — the check-in prompt (see below)
- **Archive** — immediately archive without check-in
- **Delete** — permanently delete (with confirmation UI, not `confirm()`)

---

### 4. The Nudge / Check-In

This is the core behavior that differentiates Vitrine from a regular wishlist.

**Trigger:** 30 days after `lastCheckedIn` without a response.

**How it surfaces:**
- The item card in the Vitrine gets a subtle visual treatment (e.g., a thin taupe border or a small indicator dot)
- A banner or toast on app open: "A few things are waiting for your verdict." (non-intrusive)

**The prompt (shown on item detail or as a modal):**

> You've been watching this for 47 days.
> **Still want it?**
> [Yes, keep watching] [Let it go]

**Yes, keep watching:** Updates `lastCheckedIn` to now. Clears the nudge indicator. Item stays in Vitrine.

**Let it go:** Item moves to Archive with `archivedReason: 'let_go'`. A brief, non-judgmental confirmation: "Archived. You can always find it again."

---

### 5. Savings Tracker

Optional feature per item, activated if a price target is set.

**On item detail:**
- Target price (set at add time, editable)
- Amount saved so far (user manually updates — tap to edit)
- Progress bar (amount saved / target price)
- "X% of the way there"

**On card (main grid):**
- Thin progress bar below the item name, only if savings target is set

**No bank integrations, no automatic tracking in MVP.** Purely manual.

---

### 6. Archive View

Accessible from the main nav. Shows all archived items.

**Two states:**
- **Let go** — items the user decided they no longer wanted
- **Got it** — items the user marked as purchased (future: for now, just show all archived together)

**Why this matters:** Seeing what didn't stick is psychologically useful. It proves the system is working.

**Actions from Archive:** Restore to Vitrine (if you change your mind), Delete permanently.

---

### 7. PWA & Installability

This is non-negotiable. The app must be installable.

- `manifest.json` with correct `start_url`, `display: standalone`, icons at 192×192 and 512×512
- Service worker via `vite-plugin-pwa` — cache all app assets, full offline support
- **Web Share Target API** configured in manifest so users can share URLs from other apps directly into Vitrine. On receiving a share, open the Add Item flow pre-filled with the URL.
- iOS: `apple-touch-icon` meta tags, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style: black-translucent`
- Theme color: `#FAFAF8`

---

## Navigation

Bottom tab bar with 3 items:
1. **Vitrine** (grid icon) — main watchlist view
2. **Archive** (box/archive icon) — archived items
3. **+ Add** (plus, centered, slightly elevated) — opens add item flow

---

## Out of Scope for MVP

The following are explicitly NOT being built in MVP:

- User accounts or authentication
- Backend / database (localStorage only)
- Price scraping or automatic price tracking
- Push notifications (the nudge is in-app only)
- Browser extension
- Social features / shared vitrines
- Resale platform integration (Poshmark, Vestiaire, TRR)
- AI recommendations
- Multiple users
- Import from screenshots (OCR)
- Barcode scanning

---

## Success Criteria

The MVP is successful if:
1. It is installable on iOS and Android via "Add to Home Screen"
2. Adding an item takes under 30 seconds
3. The Web Share Target works — a URL shared from Safari opens the Add flow
4. The 30-day nudge surfaces correctly
5. The app works fully offline after first load
6. It looks good. This is a consumer product for people with taste. It needs to feel considered.

---

## Future Phases

| Phase | Key additions |
|---|---|
| **2** | Browser extension, price drop alerts, Poshmark/Vestiaire/TRR search integration |
| **3** | Accounts, shared vitrines, "send to a friend" |
| **4** | Full window shopping platform — curated discovery, multi-retailer browsing, social layer |
