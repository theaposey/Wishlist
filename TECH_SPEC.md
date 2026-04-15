# Vitrine — Technical Specification

## Project Setup

```bash
npm create vite@latest vitrine -- --template react-ts
cd vitrine
npm install
npm install -D vite-plugin-pwa tailwindcss @tailwindcss/vite
npm install react-router-dom uuid
npm install -D @types/uuid
```

### `vite.config.ts`
```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
      manifest: {
        name: 'Vitrine',
        short_name: 'Vitrine',
        description: 'Save what you\'re watching.',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ],
        share_target: {
          action: '/share-target',
          method: 'GET',
          params: {
            title: 'title',
            text: 'text',
            url: 'url'
          }
        }
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.+\.(png|jpg|jpeg|webp|gif)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: { maxEntries: 200, maxAgeSeconds: 30 * 24 * 60 * 60 }
            }
          }
        ]
      }
    })
  ]
})
```

### `tailwind.config.ts`
```ts
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Helvetica Neue"', 'Helvetica', 'Arial', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        widest: '0.15em',
      },
      fontSize: {
        '2xs': ['10px', '14px'],
      }
    },
  },
}
```

---

## File Structure

```
src/
├── main.tsx
├── App.tsx                    # Router setup
├── index.css                  # Global styles, CSS reset
│
├── types/
│   └── index.ts               # All TypeScript types
│
├── store/
│   └── useStore.ts            # All data operations (localStorage wrapper)
│
├── hooks/
│   └── useNudges.ts           # Nudge logic — which items need check-in
│
├── pages/
│   ├── Vitrine.tsx            # Main grid view (tab 1)
│   ├── Archive.tsx            # Archived items (tab 2)
│   ├── AddItem.tsx            # Add/edit flow (tab 3 / modal)
│   ├── ItemDetail.tsx         # Single item view
│   └── ShareTarget.tsx        # Handles Web Share Target incoming URLs
│
├── components/
│   ├── layout/
│   │   ├── AppShell.tsx       # Wraps all pages, renders BottomNav
│   │   ├── BottomNav.tsx      # 3-tab nav: VITRINE / ARCHIVE / ADD
│   │   └── Header.tsx         # Top bar: left label + right label
│   │
│   ├── items/
│   │   ├── ItemCard.tsx       # Card in the grid
│   │   ├── ItemGrid.tsx       # 2-col grid wrapper
│   │   └── EmptyState.tsx     # Empty vitrine state
│   │
│   ├── nudge/
│   │   └── NudgeBanner.tsx    # "X items need your verdict" top banner
│   │
│   ├── forms/
│   │   ├── AddItemForm.tsx    # Add/edit item form
│   │   └── ImagePicker.tsx    # Upload or URL input for image
│   │
│   └── ui/
│       ├── Button.tsx         # Consistent button styles
│       ├── Input.tsx          # Text input
│       └── CheckIn.tsx        # "Still want it?" prompt UI
```

---

## Data Model

```ts
// src/types/index.ts

export type ItemStatus = 'watching' | 'archived'
export type ArchivedReason = 'let_go' | 'got_it' | null

export interface VitrineItem {
  id: string                    // uuid v4
  name: string                  // max 100 chars
  url?: string                  // original product link
  imageData?: string            // base64 encoded image OR external URL
  note?: string                 // max 500 chars
  priceTarget?: number          // optional savings goal
  savedAmount?: number          // how much saved so far (manually updated)
  addedAt: number               // Date.now() timestamp
  lastCheckedIn: number         // Date.now() — resets on "still want it"
  status: ItemStatus
  archivedReason: ArchivedReason
  archivedAt?: number           // Date.now() when archived
}

export interface Store {
  items: VitrineItem[]
  lastUpdated: number
}
```

---

## Store — `useStore.ts`

All data operations go through this single hook. Components never touch localStorage directly.

```ts
// src/store/useStore.ts
import { useState, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { VitrineItem, Store } from '../types'

const STORAGE_KEY = 'vitrine_store'
const NUDGE_THRESHOLD_DAYS = 30

function loadStore(): Store {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { items: [], lastUpdated: Date.now() }
    return JSON.parse(raw)
  } catch {
    return { items: [], lastUpdated: Date.now() }
  }
}

function saveStore(store: Store): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify({
    ...store,
    lastUpdated: Date.now()
  }))
}

export function useStore() {
  const [store, setStore] = useState<Store>(loadStore)

  const update = useCallback((updater: (s: Store) => Store) => {
    setStore(prev => {
      const next = updater(prev)
      saveStore(next)
      return next
    })
  }, [])

  // Derived
  const watchingItems = store.items
    .filter(i => i.status === 'watching')
    .sort((a, b) => b.addedAt - a.addedAt)

  const archivedItems = store.items
    .filter(i => i.status === 'archived')
    .sort((a, b) => (b.archivedAt ?? 0) - (a.archivedAt ?? 0))

  const nudgeItems = watchingItems.filter(item => {
    const daysSince = (Date.now() - item.lastCheckedIn) / (1000 * 60 * 60 * 24)
    return daysSince >= NUDGE_THRESHOLD_DAYS
  })

  // Actions
  function addItem(data: Omit<VitrineItem, 'id' | 'addedAt' | 'lastCheckedIn' | 'status' | 'archivedReason'>) {
    const item: VitrineItem = {
      ...data,
      id: uuidv4(),
      addedAt: Date.now(),
      lastCheckedIn: Date.now(),
      status: 'watching',
      archivedReason: null,
    }
    update(s => ({ ...s, items: [item, ...s.items] }))
    return item.id
  }

  function updateItem(id: string, changes: Partial<VitrineItem>) {
    update(s => ({
      ...s,
      items: s.items.map(i => i.id === id ? { ...i, ...changes } : i)
    }))
  }

  function checkIn(id: string, stillWant: boolean) {
    if (stillWant) {
      updateItem(id, { lastCheckedIn: Date.now() })
    } else {
      updateItem(id, {
        status: 'archived',
        archivedReason: 'let_go',
        archivedAt: Date.now()
      })
    }
  }

  function markGotIt(id: string) {
    updateItem(id, {
      status: 'archived',
      archivedReason: 'got_it',
      archivedAt: Date.now()
    })
  }

  function restoreItem(id: string) {
    updateItem(id, {
      status: 'watching',
      archivedReason: null,
      archivedAt: undefined,
      lastCheckedIn: Date.now()
    })
  }

  function deleteItem(id: string) {
    update(s => ({ ...s, items: s.items.filter(i => i.id !== id) }))
  }

  function getItem(id: string): VitrineItem | undefined {
    return store.items.find(i => i.id === id)
  }

  return {
    watchingItems,
    archivedItems,
    nudgeItems,
    addItem,
    updateItem,
    checkIn,
    markGotIt,
    restoreItem,
    deleteItem,
    getItem,
  }
}
```

---

## Key UI Patterns (SSENSE-Inspired)

### The Numbered Prefix — Core Brand Moment

Every section header and card gets a number prefix. In SSENSE it's item counts. In Vitrine it's **days watching**.

```tsx
// On a card:
<span className="text-2xs text-gray-400 tracking-widest uppercase">
  {daysSince === 1 ? '001' : String(daysSince).padStart(3, '0')}
</span>
<span className="text-2xs tracking-widest uppercase ml-2">
  {needsNudge ? 'NEEDS VERDICT' : 'WATCHING'}
</span>
```

### ItemCard

```tsx
// 2-col grid, no gaps (gap-px for hairline between cards)
// Each card:
<div className="bg-white cursor-pointer" onClick={...}>
  {/* Image: square crop, white bg, image floats */}
  <div className="aspect-square bg-white flex items-center justify-center overflow-hidden">
    {imageData
      ? <img src={imageData} alt={name} className="w-full h-full object-contain" />
      : <div className="flex items-center justify-center w-full h-full">
          <span className="text-xs tracking-widest uppercase text-gray-300">{name}</span>
        </div>
    }
  </div>

  {/* Metadata below image */}
  <div className="px-2 py-2">
    <div className="flex items-center gap-1 mb-1">
      <span className="text-2xs text-gray-400 tracking-widest">{paddedDays}</span>
      {needsNudge && <span className="w-1 h-1 rounded-full bg-black inline-block" />}
    </div>
    <p className="text-xs tracking-widest uppercase truncate">{name}</p>
    {priceTarget && <SavingsBar target={priceTarget} saved={savedAmount ?? 0} />}
  </div>
</div>
```

### Header
```tsx
// Top of every page — no logo, just utility text
<header className="flex items-center justify-between px-4 py-4 border-b border-gray-100">
  <span className="text-xs tracking-widest uppercase">{leftLabel}</span>
  <span className="text-xs tracking-widest uppercase">{rightLabel}</span>
</header>
```

### BottomNav
```tsx
// 4 items (but we have 3): VITRINE / ARCHIVE / ADD
// Active: dot underneath label
const tabs = ['VITRINE', 'ARCHIVE', 'ADD']

<nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex">
  {tabs.map(tab => (
    <button key={tab} className="flex-1 flex flex-col items-center py-3 gap-1">
      <span className="text-2xs tracking-widest">{tab}</span>
      {isActive && <span className="w-1 h-1 rounded-full bg-black" />}
    </button>
  ))}
</nav>
```

### Empty State (Big Editorial Moment)
```tsx
// When vitrine is empty — SSENSE-style giant stacked type
<div className="flex flex-col items-start justify-center h-full px-4">
  <p className="text-5xl font-bold tracking-tight uppercase leading-none text-gray-100">
    SAVE<br />WHAT<br />YOU'RE<br />WATCHING.
  </p>
  <button onClick={onAdd} className="mt-8 text-xs tracking-widest uppercase border-b border-black pb-0.5">
    + ADD YOUR FIRST ITEM
  </button>
</div>
```

### NudgeBanner
```tsx
// Non-intrusive — sits just below header when nudges exist
{nudgeItems.length > 0 && (
  <div className="bg-black text-white px-4 py-2 flex items-center justify-between">
    <span className="text-2xs tracking-widest uppercase">
      {nudgeItems.length} {nudgeItems.length === 1 ? 'ITEM NEEDS' : 'ITEMS NEED'} YOUR VERDICT
    </span>
    <button className="text-2xs tracking-widest uppercase underline">REVIEW</button>
  </div>
)}
```

---

## Router Setup

```tsx
// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell from './components/layout/AppShell'
import Vitrine from './pages/Vitrine'
import Archive from './pages/Archive'
import AddItem from './pages/AddItem'
import ItemDetail from './pages/ItemDetail'
import ShareTarget from './pages/ShareTarget'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/vitrine" replace />} />
          <Route path="vitrine" element={<Vitrine />} />
          <Route path="vitrine/:id" element={<ItemDetail />} />
          <Route path="archive" element={<Archive />} />
          <Route path="add" element={<AddItem />} />
        </Route>
        <Route path="/share-target" element={<ShareTarget />} />
      </Routes>
    </BrowserRouter>
  )
}
```

---

## Web Share Target — ShareTarget.tsx

When a user shares a URL from Safari/Chrome to Vitrine, they land here.

```tsx
// src/pages/ShareTarget.tsx
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ShareTarget() {
  const navigate = useNavigate()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const url = params.get('url') ?? params.get('text') ?? ''
    const title = params.get('title') ?? ''
    // Navigate to Add form with pre-filled values
    navigate(`/add?url=${encodeURIComponent(url)}&name=${encodeURIComponent(title)}`)
  }, [navigate])

  return <div className="flex items-center justify-center h-screen text-xs tracking-widest uppercase">Opening...</div>
}
```

---

## Helper: Days Watching

```ts
// src/utils/time.ts
export function daysWatching(addedAt: number): number {
  return Math.floor((Date.now() - addedAt) / (1000 * 60 * 60 * 24))
}

export function padDays(days: number): string {
  return String(Math.min(days, 999)).padStart(3, '0')
}

export function needsNudge(lastCheckedIn: number, thresholdDays = 30): boolean {
  return (Date.now() - lastCheckedIn) / (1000 * 60 * 60 * 24) >= thresholdDays
}
```

---

## Image Handling

Images are stored as base64 strings in localStorage. This is fine for MVP with a small number of items. Warn in a comment that this will hit localStorage limits (~5MB) at scale — Phase 2 should use IndexedDB or a backend.

```ts
// src/utils/image.ts
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function isValidImageUrl(url: string): boolean {
  return /\.(jpg|jpeg|png|gif|webp|avif)(\?.*)?$/i.test(url)
}
```

---

## iOS PWA Meta Tags — `index.html`

```html
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
  <meta name="theme-color" content="#ffffff" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Vitrine" />
  <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
  <title>Vitrine</title>
</head>
```

---

## Build & Deploy

For immediate sharing, deploy to Vercel:

```bash
npm run build
npx vercel --prod
```

HTTPS is required for PWA install prompts and service workers. Vercel provides this automatically.

---

## Phase 2 Considerations (Do Not Build Now)

Document these here so architectural decisions don't close doors:

- **IndexedDB** instead of localStorage for image storage at scale
- **Supabase** for backend when multi-user is needed — localStorage store shape maps cleanly to a Postgres table
- **Price tracking**: will require a serverless function to scrape OG tags / use a pricing API
- **Push notifications**: requires backend + Web Push API — the nudge logic in `useNudges.ts` is already isolated so this is a drop-in
- **Browser extension**: separate codebase, shares the same data model
