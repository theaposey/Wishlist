# The Wishlist — Technical Specification

## Architecture

**Single-file vanilla JS PWA. No framework. No build step.**

Everything is in `index.html`. All CSS is in a `<style>` block in `<head>`. All JS is in a `<script>` block at the end of `<body>`. HTML is rendered by string template functions, not a virtual DOM.

```
index.html        — entire app (CSS + JS + HTML shell)
sw.js             — service worker (cache-first, bump version on every deploy)
manifest.json     — PWA manifest (name, icons, share_target)
bookmarklet.html  — bookmarklet UI for adding items from product pages
install.html      — instant redirect to /#install (legacy link support)
icon.png          — app icon (180×180)
```

**Deployed to:** `https://theaposey.github.io/Wishlist/`
**Repo:** `theaposey/Wishlist` on GitHub (GitHub Pages from main branch)

---

## Data Storage

All data lives in `localStorage`.

```
vitrine_wishlists  →  JSON array of wishlist objects
vitrine_items      →  JSON array of item objects
vtr_user_name      →  string (user's display name)
vtr_ob_dismissed   →  '1' if install dialog has been dismissed
vtr_standalone_seen → '1' after first standalone PWA launch (for iOS install analytics)
```

### Data shapes

```js
// Wishlist
{ id: string, name: string, coverImg?: string }

// Item
{
  id: string,
  wid: string | null,       // wishlist ID
  name: string,
  brand: string | null,
  url: string,
  img: string,              // HTTP URL or data: URL
  price: number | null,
  saved: number,
  note: string,
  tags: string[],
  serious: boolean,         // 'Serious' vs 'Casual' intent
  status: 'watching' | 'archived' | 'purchased',
  reason: 'let_go' | null,
  addedAt: number,          // Date.now()
  archivedAt?: number,
  order?: number,           // for drag-reorder (higher = earlier in list)
}
```

---

## Render Model

No virtual DOM. State → string templates → `innerHTML`.

```js
const s = { screen, overlay, addForm, ... } // mutable state object

function render() {
  document.getElementById('app').innerHTML = buildScreen();
  // overlays injected separately
}
```

`buildScreen()` routes to the correct screen builder based on `s.screen`:
- `wishlists` → `screenWishlists()`
- `wishlist-detail` → `screenWlDetail()`
- `item-detail` → `screenItemDetail()`
- `items` → `screenItems()`
- `archive` → `screenArchive()`
- `stats` → `screenStats()`
- `add-item` → `screenAddItem()` → `addItemUrl()` / `addItemFetching()` / `addItemForm()`
- `shared-wl` → `screenSharedWl()`
- `shared-item` → `screenSharedItemDetail()`

---

## URL Fetching

When a product URL is pasted, `fetchUrl()` fires four parallel requests and takes the first successful result:

1. **Microlink API** — renders JS, handles Cloudflare-protected pages
2. **allorigins.win proxy** — raw HTML fetch
3. **corsproxy.io** — raw HTML fetch
4. **codetabs.com proxy** — raw HTML fetch
5. **thingproxy.freeboard.io** — raw HTML fetch

`parseOgFromHtml()` extracts title, image, price, brand from raw HTML (OG tags, JSON-LD, schema.org, SSR blobs).

`cleanUrl()` strips tracking params (UTM, gclid, fbclid, vtp*, etc.) before fetching.

`parseUrlFallback()` extracts product name/brand from URL slug when all proxies fail.

---

## Share Wishlist

`shareWishlist(wid)` builds a compact payload and encodes it into a `#share=` URL hash:

```
Payload → JSON → deflate compress (CompressionStream) → URL-safe base64 → 'z' + encoded
```

Falls back to plain `btoa(JSON)` if `CompressionStream` unavailable.

**Critical:** `navigator.share()` must be called with no network `await` before it — iOS Safari drops user-gesture activation after any network request. Image uploads happen in the background *after* sharing.

`decodeShare()` reverses the process. `expandShare()` handles both v2 compact format and legacy full-key format.

---

## Bookmarklet

`bookmarklet.html` is a drag-to-bookmarks UI. The bookmarklet itself runs in-page on any product site, extracts name/brand/image/price from OG tags + JSON-LD, then opens the app at:

```
https://theaposey.github.io/Wishlist/#bm=<base64JSON>
```

The app's init reads `#bm=`, skips URL fetching, and pre-fills the add form.

---

## Install / Onboarding

`showOnboarding()` creates a frosted glass floating card dialog (iOS native style):
- Screen 1: header + "Add to Home Screen" action row
- Screen 2: step-by-step instructions (globe → ••• → share icon → +)
- 2-screen transition with opacity animation

Triggered:
- Automatically at 0.8s delay on first visit (non-installed, non-dismissed)
- From `#install` hash (e.g. "Get the App" CTAs from shared wishlists)

`dismissOnboarding()` sets `vtr_ob_dismissed` in localStorage.

---

## Service Worker

`sw.js` — cache-first strategy:
- Navigation requests → serve `index.html` from cache
- Same-origin assets → cache-first, update cache on miss
- Cross-origin (images, APIs) → network only

**Always bump `wishlist-vN` version when deploying** — triggers `skipWaiting()` + `clients.claim()` + page reload via `controllerchange` event.

---

## Analytics

Google Analytics 4 property: `G-XFFKTX850F`

Custom events:
- `pwa_install` — method: `android` or `ios_standalone`
- `url_lookup` — domain: hostname of fetched product URL
- `share_wishlist` — method: `native_share` or `clipboard`, item_count

---

## Key Functions Reference

| Function | Purpose |
|---|---|
| `render()` | Rebuild entire app DOM from state |
| `showToast(msg)` | 2.6s toast |
| `showUndoToast(msg, undoFn)` | 4s toast with Undo button |
| `fetchUrl()` | Fetch product metadata from URL |
| `saveItem()` | Save add/edit form to localStorage |
| `shareWishlist(wid)` | Build share URL + call navigator.share |
| `encodeShare(payload)` | Compress payload → URL-safe hash |
| `decodeShare(str)` | Decode hash → payload |
| `showOnboarding()` | Show install dialog |
| `swipeRowStart(e, id)` | Handle swipe-to-act on list rows |
| `swipeArchiveItem(id)` | Archive item with undo toast |
| `swipePurchaseItem(id)` | Mark purchased with undo toast |
| `cleanUrl(url)` | Strip tracking params |
| `parseUrlFallback(url)` | Extract name/brand from URL slug |

---

## Deploy

```bash
cd "/Users/theaposey/Desktop/Claude Thoughts/Wishlist App"
git add index.html sw.js        # (and any other changed files)
git commit -m "description"
git push
```

GitHub Pages deploys automatically from the main branch. Changes live within ~1 minute.
