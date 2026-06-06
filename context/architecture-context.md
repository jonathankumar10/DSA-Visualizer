# Architecture Context — DevLens

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | React 19 + Vite 8 | JSX only — no TypeScript |
| Styling | Tailwind v4 | Via `@tailwindcss/vite` plugin, not PostCSS |
| Routing | React Router v7 | `createBrowserRouter`, single Layout shell |
| Animation | Framer Motion | Spring transitions, scroll-triggered |
| 3D (rare) | Three.js + @react-three/fiber | Isolated chunk via Vite chunking |
| Backend | Firebase Cloud Functions Gen 2 | Node.js, callable function |
| AI | Anthropic SDK → Claude Haiku | `claude-haiku-4-5-20251001` |
| Rate limiting | Firestore | Per-user UUID, 10 msg/day |
| Deployment | Netlify (frontend) + Firebase (functions) | `netlify.toml` present |

---

## Boundaries Between Layers

```
┌─────────────────────────────────────────────────────┐
│  Browser (SPA)                                      │
│  ┌──────────────┐  ┌───────────────┐               │
│  │   Pages /    │  │  Components   │               │
│  │   Router     │  │  (layout, ui) │               │
│  └──────┬───────┘  └──────┬────────┘               │
│         │                 │                         │
│  ┌──────▼─────────────────▼────────┐               │
│  │   Constants / Registries        │               │
│  │   (single source of truth for   │               │
│  │    all content metadata)        │               │
│  └──────────────────┬──────────────┘               │
│                     │                               │
│  ┌──────────────────▼──────────────┐               │
│  │   Content Modules               │               │
│  │   src/content/<section>/<slug>/ │               │
│  │   (lazy-loaded via import.meta  │               │
│  │    .glob at the page level)     │               │
│  └─────────────────────────────────┘               │
│                                                     │
│  ┌─────────────────────────────────┐               │
│  │   Hooks                         │               │
│  │   useStepRunner / useTtsRunner  │               │
│  │   useSpeech / usePatternAnim    │               │
│  └─────────────────────────────────┘               │
└────────────────────────┬────────────────────────────┘
                         │ Firebase SDK (callable)
┌────────────────────────▼────────────────────────────┐
│  Firebase Cloud Function: `chat`                    │
│  • Reads/writes Firestore (rate limit)              │
│  • Calls Anthropic SDK → Claude Haiku               │
└─────────────────────────────────────────────────────┘
```

### Key boundaries

- **Pages are route-level containers only.** They import from registries and lazy-load content modules. They do not contain business logic.
- **Registries are read-only config.** No component should mutate registry data. They are the contract between content authors and the UI.
- **Content modules are self-contained.** Each `index.js` is a plain object export. Each `Visualizer.jsx` / `Animation.jsx` receives props from its page and manages only its own animation state.
- **Hooks own playback state.** `useStepRunner` / `useTtsRunner` are the single source of truth for step index, play/pause, and speed. Visualizers receive `onStepChange` and call it; they do not own step state.
- **Firebase is the only network boundary.** The frontend calls no external APIs directly — everything goes through the Firebase callable function. The `ANTHROPIC_API_KEY` never touches the browser.

---

## Invariants the Codebase Must Never Break

1. **No TypeScript.** The project is intentionally plain JSX. Do not introduce `.ts`/`.tsx` files or `tsconfig`.

2. **Tailwind v4 via Vite plugin only.** There is no `tailwind.config.js` or `postcss.config.js`. Do not add them.

3. **Registries are the single source of truth.** Never hardcode content counts, titles, or metadata in pages or components — always derive from the registry.

4. **Visualizers are never manually imported in pages.** `AlgorithmPage` uses `import.meta.glob` exclusively. Adding a new `Visualizer.jsx` file is sufficient — no page edit required.

5. **`ANTHROPIC_API_KEY` must never appear on the frontend.** It lives only in Firebase Functions secrets. The frontend calls `httpsCallable(functions, 'chat')` and nothing else.

6. **No auth dependency.** The product must be fully usable without sign-in. The rate limiter uses a stable browser UUID (`localStorage`), not a user account.

7. **`three` / `@react-three` must stay in the `three-vendor` chunk.** This is enforced in `vite.config.js`. Do not import Three.js in files that are part of the main bundle path.

8. **Step objects must have a `type` field.** All step arrays (from `build*Steps` functions) must include `type: string` on every step object. Visualizers switch on `type`.

9. **Content module `index.js` exports a plain object, not a React component.** It is metadata + solution code only. Never import React in a content `index.js`.

10. **No test suite.** Do not add a test framework unless explicitly decided — the absence of tests is intentional, not an oversight.
