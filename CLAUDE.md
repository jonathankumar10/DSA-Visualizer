# CLAUDE.md

@context/project-overview.md
@context/architecture-context.md
@context/code-standards.md
@context/ui-context.md
@context/ai-workflow-rules.md

## Commands

```bash
npm run dev       # Start dev server (Vite HMR)
npm run build     # Production build
npm run preview   # Preview production build locally
npm run lint      # ESLint (no --fix by default)
```

No test suite.

### Firebase Functions

```bash
cd functions && npm install
firebase deploy --only functions
firebase functions:secrets:set ANTHROPIC_API_KEY
```

## Routing

`src/router.jsx` — shared `Layout`, each section has an index + detail route:

| Path | Description |
|---|---|
| `/algorithms/:id` | Step-through algorithm visualizers |
| `/patterns/:id` | DSA pattern reference pages |
| `/system-design/:id` | System design concept/design explainers |
| `/ood/:id` | GoF design patterns and OOD interview questions |
| `/ai/:id` | AI concepts: history, ML, LLMs, workflows, agents, production |

## Registries (`src/constants/`)

| File | Exports | Content type |
|---|---|---|
| `algorithmRegistry.js` | `ALGORITHMS` | Imports `index.js` modules |
| `patternsRegistry.js` | `PATTERNS` | Inline, joins algorithms by `algorithmIds` |
| `systemDesignRegistry.js` | `SYSTEM_DESIGN` | Imports `index.js` modules |
| `oodRegistry.js` | `OOD_PATTERNS`, `OOD_QUESTIONS`, `OOD_ITEMS`, `OOD_COLORS`, `OOD_CATEGORY_LABELS` | Inline |
| `aiRegistry.js` | `AI_ITEMS`, `AI_COLORS`, `AI_CATEGORY_LABELS` | Inline |

## Content Module Shapes

### Algorithm — `src/content/algorithms/<slug>/`

`index.js` exports a plain object:
- `id`, `title`, `difficulty`, `pattern`, `category`, `path`, `description`, `metaphor`, `tags`, `problemUrl`, `problemLabel`
- `solution.approaches[]` — each: `id`, `label`, `complexity`, and per-language (`java`, `python`) `{ code, getHighlightLines(step) }`

`steps.js` exports `build<Name>Steps(...)` → array of step objects, each must have a `type` field.

`Visualizer.jsx` is lazy-loaded via `import.meta.glob` in `AlgorithmPage.jsx` — no manual import needed.

### AI topic — `aiRegistry.js` inline

Each item: `id`, `category` (history | ml | llms | workflows | agents | production), `title`, `color`, `tagline`, `description`, `howItWorks[]`, `keyPoints[]`, `interviewAngles[]`

`AIPage.jsx` lazy-loads `src/content/ai/*/Animation.jsx`. Key Takeaways always renders — right column when no animation, below the two-column grid when animation is present.

### OOD item — `oodRegistry.js` inline

`type: 'pattern'` — `id`, `type`, `category` (creational | structural | behavioral), `title`, `color`, `tagline`, `description`, `howItWorks[]`, `whenToUse[]`, `participants[]`, `realWorldExamples[]`, `leetcodeProblems[]`

`type: 'question'` — `id`, `type`, `category: 'question'`, `title`, `color`, `difficulty`, `tagline`, `description`, `requirements[]`, `keyClasses[]`, `patternsUsed[]`, `hints[]`

`OODPage.jsx` lazy-loads `src/content/ood/*/Animation.jsx`. Falls back to Participants panel if no animation.

## Playback Hooks

- `useStepRunner(steps)` — play/pause/speed/prev/next/reset. `BASE_INTERVAL` 900ms at 1×.
- `useTtsRunner(steps, getText)` — drop-in for `useStepRunner` with opt-in TTS via browser Speech Synthesis. Returns same runner shape plus `runner.tts = { enabled, toggle, voices, selectedVoice, setVoice }` (or `null` if unsupported). `StepControls` renders TTS toggle automatically when `runner.tts` is non-null.
- `useSpeech()` — low-level `window.speechSynthesis` wrapper, used internally by `useTtsRunner`.
- `usePatternAnimation(durations)` — auto-cycling phase animation for pattern index pages.
