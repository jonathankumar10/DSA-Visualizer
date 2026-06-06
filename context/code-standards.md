# Code Standards — DevLens

## Language & File Conventions

- **Plain JavaScript (JSX).** No TypeScript. File extensions: `.jsx` for React components, `.js` for everything else.
- **ES Modules only.** The project uses `"type": "module"`. No CommonJS `require()`.
- **Named exports for registries and utilities.** Default exports for React components and page modules.
- **No barrel `index.js` files** in `components/` or `pages/` — import directly from the file.

---

## Component Conventions

### File layout (top to bottom)
1. Imports (React first, then libraries, then local — constants before components)
2. Module-level constants / helpers (variants, static data, pure functions)
3. Sub-components (small, file-local, not exported)
4. Default export (the main component)

### Props
- Prefer destructuring in the function signature: `function Card({ title, description })`
- No PropTypes — the project skips runtime type checking

### State
- Keep state as close to where it is used as possible
- Lift only when two sibling components genuinely share state
- Hooks own playback state — components receive callbacks, not state setters

### Framer Motion
- Wrap entrance animations in `motion.div` with `initial/animate/transition` on the outermost element
- Use `whileInView` + `viewport={{ once: true }}` for scroll-triggered sections
- Define variant objects (`stagger`, `cardVariant`) outside the component to avoid re-creation on render
- Spring transitions for card entrances: `{ type: 'spring', stiffness: 280, damping: 24 }`

---

## Styling Conventions (Tailwind v4)

### Color palette
| Role | Token |
|---|---|
| Page background | `bg-[#09090b]` / `zinc-950` |
| Card background | `bg-white/[0.02]` |
| Card hover | `bg-white/[0.04]` |
| Card border | `border-white/10` |
| Primary text | `text-white` |
| Secondary text | `text-slate-400` |
| Muted text | `text-slate-500` |
| Accent (primary) | `blue-500` / `blue-600` |

### Section accent colors (never mix within a section)
| Section | Dot / text | Border |
|---|---|---|
| Algorithms | `blue-400` | `border-blue-500/20` |
| Patterns | `sky-400` | `border-sky-500/20` |
| System Design | `violet-400` | `border-violet-500/20` |
| OOD | `rose-400` | `border-rose-500/20` |
| AI | `amber-400` | `border-amber-500/20` |

### Spacing & shape
- Cards: `rounded-2xl`, inner content `p-5` or `p-6`
- Badges / chips: `rounded-full` or `rounded-md`
- Section gaps: `space-y-24` at page level, `gap-4` for grids
- Sticky code panel offset: `lg:top-20`

### Typography
- Page titles: `text-xl sm:text-2xl font-bold text-white`
- Section headings: `text-2xl sm:text-3xl font-bold text-white`
- Hero: `text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight`
- Labels / overlines: `text-[11px] font-semibold uppercase tracking-wider text-slate-500`
- Body: `text-sm text-slate-300 leading-relaxed`

---

## Registry / Content Module Conventions

### Adding a new algorithm
1. Create `src/content/algorithms/<slug>/index.js` — exports a plain object with all required fields
2. Create `src/content/algorithms/<slug>/steps.js` — exports `build<Name>Steps(...)`; all step objects must have a `type` field
3. Create `src/content/algorithms/<slug>/Visualizer.jsx` — receives `onStepChange` prop, manages its own visual state
4. Register in `src/constants/algorithmRegistry.js` — one import + one array entry

### Adding a new OOD item
1. Add inline entry to `OOD_PATTERNS` or `OOD_QUESTIONS` in `oodRegistry.js`
2. Optionally create `src/content/ood/<slug>/Animation.jsx` for an interactive diagram

### Adding a new AI topic
1. Add inline entry to `AI_ITEMS` in `aiRegistry.js`
2. Optionally create `src/content/ai/<slug>/Animation.jsx`

### Required fields per content type — see `architecture-context.md` for full shapes

---

## Naming Conventions

| Thing | Convention | Example |
|---|---|---|
| React components | PascalCase | `AlgorithmPage`, `CodePanel` |
| Hooks | `use` prefix, camelCase | `useStepRunner`, `useTtsRunner` |
| Registry constants | SCREAMING_SNAKE | `ALGORITHMS`, `OOD_PATTERNS` |
| CSS classes | Tailwind only — no custom class names unless in `index.css` |  |
| Route slugs | kebab-case | `binary-search`, `transformer-architecture` |
| File names (components) | PascalCase.jsx | `AlgorithmPage.jsx` |
| File names (hooks / utils) | camelCase.js | `useStepRunner.js` |

---

## What Not to Do

- Do not add comments that describe *what* the code does — well-named identifiers are sufficient
- Do not add error handling for impossible cases (e.g., "what if ALGORITHMS is undefined")
- Do not introduce abstractions for fewer than three identical usages
- Do not create new shared components for one-off UI pieces — keep them local to the file
- Do not add a `console.log` in committed code
- Do not use `px` units in Tailwind classes when a spacing scale value exists
