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

`src/router.jsx` defines six top-level sections under a shared `Layout` (each has both an index route and a detail route):
- `/algorithms/:id` — step-through algorithm visualizers
- `/patterns/:id` — DSA pattern reference pages (link to related algorithms)
- `/system-design/:id` — system design concept/design explainers
- `/ood/:id` — GoF design patterns and OOD interview questions
- `/ai/:id` — AI concepts: history, ML, LLMs, workflows, agents, and production

`Home.jsx` has four sections: a hero, a unified five-section showcase (one card per content area with count + description), a three-step "how it works" block, and a coming-soon banner. It does not render per-item preview grids.

`Navbar` has five links — Algorithms, Patterns, System Design, OOD, AI. "Home" is intentionally omitted because the DevLens logo already links to `/`.

### Content registry pattern

Each section has a registry file in `src/constants/` that is the single source of truth:
- `algorithmRegistry.js` — imports all algorithm `index.js` modules and exports the `ALGORITHMS` array
- `patternsRegistry.js` — defines pattern metadata inline and joins algorithms by `algorithmIds`
- `systemDesignRegistry.js` — imports all system-design `index.js` modules and exports `SYSTEM_DESIGN`
- `oodRegistry.js` — defines all OOD items inline and exports `OOD_PATTERNS`, `OOD_QUESTIONS`, `OOD_ITEMS`, `OOD_COLORS`, and `OOD_CATEGORY_LABELS`
- `aiRegistry.js` — defines all AI topics inline and exports `AI_ITEMS`, `AI_COLORS`, and `AI_CATEGORY_LABELS`

**To add a new algorithm**: create `src/content/algorithms/<slug>/` with `index.js`, `steps.js`, and `Visualizer.jsx`, then add one import + one array entry to `algorithmRegistry.js`.

**To add a new system-design topic**: create `src/content/system-design/<type>/<slug>/` with `index.js` (and optionally `steps.js` + `Diagram.jsx` for animated entries), then register in `systemDesignRegistry.js`.

**To add a new OOD item**: add an entry directly to `OOD_PATTERNS` or `OOD_QUESTIONS` in `oodRegistry.js`, then optionally create `src/content/ood/<slug>/Animation.jsx` for an interactive diagram.

**To add a new AI topic**: add an entry to `AI_ITEMS` in `aiRegistry.js`, then optionally create `src/content/ai/<slug>/Animation.jsx` for an interactive diagram.

### Algorithm content module shape

Each `src/content/algorithms/<slug>/index.js` exports a plain object with:
- metadata: `id`, `title`, `difficulty`, `pattern`, `category`, `path`, `description`, `metaphor`, `tags`, `problemUrl`, `problemLabel`
- `solution.approaches[]` — each approach has `id`, `label`, `complexity`, and per-language (`java`, `python`) `{ code, getHighlightLines(step) }`

Each `steps.js` exports a `build<Name>Steps(...)` function that returns an array of step objects. Step objects must have a `type` string field; everything else is visualizer-specific.

### AI content module shape

All AI topics are defined inline in `aiRegistry.js`. Each item has: `id`, `category` (history | ml | llms | workflows | agents | production), `title`, `color`, `tagline`, `description`, `howItWorks[]`, `keyPoints[]`, `interviewAngles[]`.

`AIPage.jsx` lazy-loads per-topic animations via `import.meta.glob('../content/ai/*/Animation.jsx')`. The Key Takeaways panel is **always rendered**: on the right column when no animation exists, or below the two-column grid when an animation is present.

Current topics (20 total):
- `ai-history` (history) — The History of AI
- `neural-networks` (ml) — Neural Networks *(has Animation.jsx)*
- `training-and-loss` (ml) — Training & Loss
- `transformer-architecture` (llms) — The Transformer *(has Animation.jsx)*
- `attention-mechanism` (llms) — The Attention Mechanism *(has Animation.jsx)*
- `tokenization` (llms) — Tokenization
- `context-windows` (llms) — Context Windows
- `llm-inference` (llms) — LLM Inference & Sampling
- `multimodal-models` (llms) — Multimodal Models
- `prompt-engineering` (workflows) — Prompt Engineering
- `rag` (workflows) — Retrieval-Augmented Generation *(has Animation.jsx)*
- `embeddings` (workflows) — Embeddings & Vector Search
- `function-calling` (workflows) — Function Calling & Tool Use
- `fine-tuning` (workflows) — Fine-Tuning
- `guardrails` (workflows) — Hallucinations & Guardrails
- `ai-agents` (agents) — AI Agents
- `multi-agent-systems` (agents) — Multi-Agent Systems
- `ai-engineer` (production) — The AI Engineer
- `llm-evaluation` (production) — LLM Evaluation
- `ai-observability` (production) — AI Observability

### OOD content module shape

Items are defined inline in `oodRegistry.js` (no separate `index.js` files). Two item types:
- `type: 'pattern'` — GoF design pattern. Required fields: `id`, `type`, `category` (creational/structural/behavioral), `title`, `color`, `tagline`, `description`, `howItWorks[]`, `whenToUse[]`, `participants[]`, `realWorldExamples[]`, `leetcodeProblems[]`.
- `type: 'question'` — OOD interview question. Required fields: `id`, `type`, `category: 'question'`, `title`, `color`, `difficulty`, `tagline`, `description`, `requirements[]`, `keyClasses[]`, `patternsUsed[]`, `hints[]`.

`OODPage.jsx` lazy-loads per-item animations via `import.meta.glob('../content/ood/*/Animation.jsx')`. If no `Animation.jsx` exists for a pattern, `OODPage` falls back to showing the Participants panel instead.

### Visualizer lazy loading

`AlgorithmPage.jsx` uses `import.meta.glob('../content/algorithms/*/Visualizer.jsx')` to lazy-load visualizers at runtime — no manual import needed when adding a new one. `OODPage.jsx` does the same for `src/content/ood/*/Animation.jsx`. `AIPage.jsx` does the same for `src/content/ai/*/Animation.jsx`.

### Playback hooks

- `useStepRunner(steps)` — drives step-by-step playback with play/pause/speed/prev/next/reset controls. `BASE_INTERVAL` is 900 ms at 1×.
- `useTtsRunner(steps, getText)` — drop-in replacement for `useStepRunner` that adds opt-in TTS narration via the browser Speech Synthesis API. Returns the same runner shape plus `runner.tts = { enabled, toggle, voices, selectedVoice, setVoice }` (or `null` if the browser has no speech support). `StepControls` renders the TTS toggle button automatically when `runner.tts` is non-null. Used by OOD animations.
- `useSpeech()` — low-level hook that wraps `window.speechSynthesis`. Used internally by `useTtsRunner`.
- `usePatternAnimation(durations)` — auto-cycling phase animation used on pattern index pages.

### Backend: Firebase Cloud Function

`functions/index.js` exposes a single `chat` callable function that proxies to Claude (`claude-haiku-4-5-20251001`) using the `@anthropic-ai/sdk`. It enforces a 10-messages-per-user-per-day rate limit via Firestore. The function is deployed to Firebase; the frontend calls it via the Firebase SDK (`src/lib/firebase.js`).

### Deployment

- Frontend: Netlify (`netlify.toml` present). Build command is `npm run build`, publish dir is `dist`.
- Backend: Firebase Functions (Gen 2, Node.js).

### Three.js chunking

`vite.config.js` splits `three` / `@react-three` into a separate `three-vendor` chunk to keep the main bundle lean.
