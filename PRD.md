# The Wishlist — Product Requirements Document

## Overview

**Product name:** The Wishlist (internal codename: Vitrine)
**Type:** PWA (Progressive Web App)
**Platform:** Mobile-first, installable via browser on iOS and Android
**Hosted at:** `https://theaposey.github.io/Wishlist/`

### The Problem

People digitally window shop constantly — screenshotting things, saving links, sending things to group chats — and have no good place to put any of it. Shopping apps are built to convert you into a buyer as fast as possible. The result: impulse purchases pile up, the things you truly wanted get forgotten, and closets fill with things that weren't chosen well.

### The Solution

A clean, beautiful place to save the things you're genuinely watching. Organized into wishlists. Tracks how long you've wanted something. Helps you decide if you still do. Built for the looking — not the buying.

### North Star

> The McQueen clutch that sold after 4 years of watching it should have sent a notification. That's the product.

---

## Current Feature Set

### Wishlists
- Create multiple named wishlists
- Each wishlist has a cover image (upload or URL)
- Items are organized within wishlists
- Drag to reorder items within a wishlist
- Grid and list view toggle
- Tag filtering within a wishlist
- Share a wishlist — generates a `#share=` hash URL, compressed with deflate, shareable via iOS share sheet or clipboard
- Swipe left on a list row to reveal Archive / Purchase buttons; full swipe auto-archives

### Items
- **Add by URL** — paste a product link, app fetches name/image/price/brand via Microlink + HTML proxies
- **Add manually** — fill in fields directly
- **Add via bookmarklet** — browser bookmarklet on any product page, data passed via `#bm=base64JSON` hash
- **Add via Web Share Target** — share a URL from Safari directly into the app
- Fields: Name, Brand, Image, Price, Saved So Far, Tags, Note, Intent (Casual / Serious), Wishlist
- Change image: upload from camera roll
- Status: `watching` → `purchased` or `archived (let_go)`
- Swipe to archive or mark purchased (with undo toast)

### Stats Tab
- Conviction rate (% of decisions that ended in purchase)
- Avg days to buy
- Avg days to let go
- Impulses resisted (watched 30+ days, then let go)
- Money not spent
- Total purchased value
- Most saved brand
- Top category (tag)
- Longest currently-watching item
- Total desire value

### Install / Onboarding
- iOS frosted glass floating card dialog (appears 0.8s after load for non-installed users)
- Shows "Add to Home Screen" with step-by-step instructions
- Triggered from `#install` hash (used by "Get the App" CTAs in shared wishlist view)
- Dialog only appears once unless triggered by `#install`

### Shared Wishlist View (Read-Only)
- Recipient sees wishlist name, sender name, item grid/list, prices
- "Get the App" CTA in header links to `/#install`
- No login required

### Navigation
- Bottom tab bar: Wishlists / Stats / Profile
- Wishlists tab has three sub-tabs: Wishlists / Items / Archive
- Swipe between sub-tabs
- Swipe left edge to go back (like iOS native)

### PWA
- Installable on iOS and Android
- Offline support via service worker (cache-first)
- Web Share Target — share a URL from any browser to open the Add flow
- GA4 analytics tracking `pwa_install` and `url_lookup` events

---

## Data Model

```
wishlists: [{ id, name, coverImg? }]

items: [{
  id, wid, name, brand?, url?, img?,
  price?, saved?, note?, tags[], serious,
  status: 'watching' | 'archived' | 'purchased',
  reason: 'let_go' | null,
  addedAt, archivedAt?, order?
}]
```

Stored in `localStorage` under `vitrine_wishlists` and `vitrine_items`.

---

## Out of Scope

- User accounts / authentication
- Backend / database
- Price drop notifications
- Push notifications
- AI recommendations
- Social features / discovery
- Resale platform integration
- Browser extension (bookmarklet exists as workaround)
- Import from screenshots
- Multiple users

---

## Future Phases

| Phase | Key additions |
|---|---|
| **2** | Price drop alerts, 30-day nudge check-ins, marketing gallery |
| **3** | Accounts, shared vitrines with comments, "send to a friend" |
| **4** | Full window shopping platform — curated discovery, social layer |
