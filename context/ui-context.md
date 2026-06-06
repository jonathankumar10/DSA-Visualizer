# UI Context — DevLens

## Design Philosophy

Dark, dense, and technical. DevLens is a tool for engineers, not a marketing site. The aesthetic signals depth and precision — like a well-configured terminal. Color is used sparingly as a semantic signal (section identity, status, accent) not decoration.

---

## Global Tokens

### Color
| Token | Value | Use |
|---|---|---|
| Page background | `#09090b` | `bg-[#09090b]` — near-black zinc |
| Card surface | `rgba(255,255,255,0.02)` | `bg-white/[0.02]` |
| Card hover | `rgba(255,255,255,0.04)` | `bg-white/[0.04]` |
| Card border | `rgba(255,255,255,0.10)` | `border-white/10` |
| Section border (subtle) | `rgba(255,255,255,0.08)` | `border-white/8` |
| Primary text | `#f1f5f9` (slate-100) | `text-white` in Tailwind |
| Secondary text | slate-400 | `text-slate-400` |
| Muted / meta text | slate-500 | `text-slate-500` |
| Primary accent | blue-500 / blue-600 | Buttons, CTAs, active states |
| Code block bg | slate-800 | `bg-slate-800` |

### Section Accent Colors
Each section owns a color. Never use one section's color on another section's UI.

| Section | Accent | Border | Usage |
|---|---|---|---|
| Algorithms | `blue-400` | `border-blue-500/20` | Top bar, tags, links |
| Patterns | `sky-400` | `border-sky-500/20` | Top bar, tags, links |
| System Design | `violet-400` | `border-violet-500/20` | Top bar, tags, links |
| OOD | `rose-400` | `border-rose-500/20` | Top bar, tags, links |
| AI | `amber-400` | `border-amber-500/20` | Top bar, tags, links |

---

## Typography Scale

| Level | Classes | Notes |
|---|---|---|
| Hero heading | `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-white` | Home page only |
| Section heading | `text-2xl sm:text-3xl font-bold text-white` | Index page sections |
| Page title | `text-xl sm:text-2xl font-bold text-white` | Detail page h1 |
| Card title | `text-base font-bold text-white` | In grid cards |
| Body | `text-sm text-slate-300 leading-relaxed` | Descriptions |
| Label / overline | `text-[11px] font-semibold uppercase tracking-wider text-slate-500` | "Problem", "Pattern" |
| Meta / count | `text-[11px] font-mono text-<accent-400> opacity-60` | Item counts in cards |
| Code | `font-mono` | `bg-slate-800` container |

Font family: `system-ui, 'Segoe UI', sans-serif` (global, set in `body`). No custom font imports.

---

## Spacing & Layout

- **Page content max-width:** constrained by Layout wrapper, centered
- **Top-level section gap:** `space-y-24` on the Home page
- **Card grid:** `grid gap-4 sm:grid-cols-2 lg:grid-cols-3`
- **Detail page split:** `grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5`
- **Card padding:** `p-5` standard, `p-6` for "how it works" style cards
- **Sticky panel offset:** `lg:top-20` for code panels on detail pages

---

## Component Patterns

### Cards
```
rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04]
transition-all duration-200 overflow-hidden
```
- Always include a colored top bar `<div className="h-1 w-full <accent-color>" />` on section cards
- Group hover: use `group` class on the card, `opacity-0 group-hover:opacity-100 transition-opacity` on hover-only elements

### Badges / Pills
- Difficulty: `rounded-full px-3 py-1 text-xs font-medium` with color from `DIFFICULTY_COLOR` map
- Pattern tag: `rounded-md bg-blue-500/15 px-3 py-1 text-xs text-blue-300`
- External link: `rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400`
- "Coming soon": `rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-medium text-slate-500`

### Buttons
- Primary CTA: `rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20`
- Ghost/outline: `rounded-xl border border-<accent>/30 bg-<accent>/10 hover:bg-<accent>/20 px-6 py-2.5 text-sm font-medium text-<accent>-300`
- Icon button: square, `rounded-lg` or `rounded-xl`, explicitly sized (`w-8 h-8`)

### Info blocks (used on detail pages)
- Problem statement: `rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4`
- Metaphor / callout: `rounded-xl border border-blue-500/20 bg-blue-500/[0.05] px-5 py-4` with a left accent bar (`w-0.5 bg-blue-500/50`)

### Breadcrumbs
`text-sm text-slate-500` with hover `text-slate-300`, separated by `/` spans

---

## Animation Conventions

- **Entrance (above fold):** `initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}`
- **Entrance (staggered grid):** define `stagger` and `cardVariant` variants outside the component; use `whileInView` + `viewport={{ once: true }}`
- **Spring for card entrance:** `{ type: 'spring', stiffness: 280, damping: 24 }`
- **Interactive hover:** `whileHover={{ scale: 1.08 }}`, `whileTap={{ scale: 0.92 }}`
- **Pulse indicator:** `animate={{ opacity: [1, 0.4, 1] }}` with `repeat: Infinity` for live status dots
- **Panel open/close:** `initial={{ opacity: 0, y: 24, scale: 0.96 }}` via `AnimatePresence`

---

## Background & Atmosphere

- **Dot grid:** `radial-gradient(rgba(59,130,246,0.10) 1px, transparent 1px)` at `28px 28px` (hero only)
- **Glow orb:** `radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 70%)` with `blur(48px)` (hero only)
- **Cursor glow:** `.cursor-glow` class in `index.css` — 700px radial blur follows the cursor. Applied at app level.
- **Scrollbar:** 6px, `bg-[#334155]`, no track

---

## Navbar

Five links: Algorithms · Patterns · System Design · OOD · AI

- "Home" is intentionally not a nav link — the DevLens logo is the home link
- Active link styling: derive from `useLocation()` or rely on NavLink's active class
- Do not add a sixth top-level nav link without updating `architecture-context.md` and `router.jsx`
