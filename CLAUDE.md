# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # ESLint (no --fix by default)
```

There is no test suite.

### Firebase Functions (backend)

```bash
cd functions && npm install   # Install function deps separately
firebase deploy --only functions   # Deploy the chat Cloud Function
```

The `ANTHROPIC_API_KEY` secret must be set in Firebase before deploying:
```bash
firebase functions:secrets:set ANTHROPIC_API_KEY
```

## Architecture

This is a React + Vite SPA (no TypeScript). Tailwind v4 is used via its Vite plugin (not PostCSS config).

### Routing

`src/router.jsx` defines three top-level sections under a shared `Layout`:
- `/algorithms/:id` — step-through algorithm visualizers
- `/patterns/:id` — DSA pattern reference pages (link to related algorithms)
- `/system-design/:id` — system design concept/design explainers

### Content registry pattern

Each section has a registry file in `src/constants/` that is the single source of truth:
- `algorithmRegistry.js` — imports all algorithm `index.js` modules and exports the `ALGORITHMS` array
- `patternsRegistry.js` — defines pattern metadata inline and joins algorithms by `algorithmIds`
- `systemDesignRegistry.js` — imports all system-design `index.js` modules and exports `SYSTEM_DESIGN`

**To add a new algorithm**: create `src/content/algorithms/<slug>/` with `index.js`, `steps.js`, and `Visualizer.jsx`, then add one import + one array entry to `algorithmRegistry.js`.

**To add a new system-design topic**: create `src/content/system-design/<type>/<slug>/` with `index.js`, `steps.js`, and `Diagram.jsx`, then register in `systemDesignRegistry.js`.

### Algorithm content module shape

Each `src/content/algorithms/<slug>/index.js` exports a plain object with:
- metadata: `id`, `title`, `difficulty`, `pattern`, `category`, `path`, `description`, `metaphor`, `tags`, `problemUrl`, `problemLabel`
- `solution.approaches[]` — each approach has `id`, `label`, `complexity`, and per-language (`java`, `python`) `{ code, getHighlightLines(step) }`

Each `steps.js` exports a `build<Name>Steps(...)` function that returns an array of step objects. Step objects must have a `type` string field; everything else is visualizer-specific.

### Visualizer lazy loading

`AlgorithmPage.jsx` uses `import.meta.glob('../content/algorithms/*/Visualizer.jsx')` to lazy-load visualizers at runtime — no manual import needed when adding a new one.

### Playback hooks

- `useStepRunner(steps)` — drives step-by-step playback with play/pause/speed/prev/next/reset controls. `BASE_INTERVAL` is 900 ms at 1×.
- `usePatternAnimation(durations)` — auto-cycling phase animation used on pattern index pages.

### Backend: Firebase Cloud Function

`functions/index.js` exposes a single `chat` callable function that proxies to Claude (`claude-haiku-4-5-20251001`) using the `@anthropic-ai/sdk`. It enforces a 10-messages-per-user-per-day rate limit via Firestore. The function is deployed to Firebase; the frontend calls it via the Firebase SDK (`src/lib/firebase.js`).

### Deployment

- Frontend: Netlify (`netlify.toml` present). Build command is `npm run build`, publish dir is `dist`.
- Backend: Firebase Functions (Gen 2, Node.js).

### Three.js chunking

`vite.config.js` splits `three` / `@react-three` into a separate `three-vendor` chunk to keep the main bundle lean.
