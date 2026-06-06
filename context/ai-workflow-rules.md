# AI Workflow Rules — DevLens

## Purpose

This file defines how Claude (the AI coding assistant) should scope work, make decisions, and behave when working in this codebase. These rules exist to keep the agent disciplined and avoid unintended side effects.

---

## Core Operating Principles

### 1. Understand before implementing
Before writing any code, identify:
- Which section / page / component is affected
- Which registry (if any) needs updating
- Whether the change is additive (new content) or structural (changes existing contracts)
- What could break downstream (e.g., changing a registry shape affects every page that consumes it)

### 2. Minimal footprint
Only change what the task requires. A bug fix does not warrant surrounding refactors. A new content entry does not warrant touching the page component. Match the blast radius of the change to the scope of the request.

### 3. No TypeScript, no new frameworks
The project is intentionally plain JSX. Do not suggest or introduce TypeScript, testing frameworks, state management libraries, or CSS-in-JS. If a gap exists, fill it with the tools already in the stack.

### 4. Respect the content registry pattern
Content is data, not code. New topics go in registries and content module files — not in page components. Pages are display logic only.

---

## Scoping Work

### Adding content (algorithms, OOD, AI, system design)
- Scope: `src/content/<section>/<slug>/` + one registry edit
- Do NOT touch: pages, layout, routing, other registries
- Confirm the registry shape first — see `architecture-context.md`

### UI / page changes
- Scope: the specific page or component file only
- Do NOT refactor adjacent components that weren't broken
- If the change requires a new shared component, call that out before implementing

### Backend changes (Firebase Functions)
- Scope: `functions/index.js` only
- The `ANTHROPIC_API_KEY` must remain in Firebase secrets — never move it
- Rate limit logic (10 msg/user/day) must not be removed or bypassed

### Styling changes
- Use only Tailwind utility classes
- Match section accent colors from `code-standards.md`
- Do not introduce new CSS files or custom class names unless adding to `index.css`

---

## Decision Protocol

### When to ask before acting
Ask the user before proceeding if:
- The change affects the routing structure (`router.jsx`)
- The change alters a registry's exported shape (breaking change for all consumers)
- The change modifies the Firebase Function behavior (rate limiting, model, prompt)
- The change adds a new dependency to `package.json`
- The task is ambiguous about which section or component is in scope

### When to proceed directly
Proceed without asking if:
- Adding a new content entry to an existing registry (purely additive)
- Fixing a visual bug in a single component
- Writing a new `Animation.jsx` or `Visualizer.jsx` for an existing slug
- Adjusting Tailwind classes to match the design system

### When to push back
Push back (explain the concern, propose an alternative) if:
- The request would break an invariant listed in `architecture-context.md`
- The request adds abstractions that aren't justified by the current codebase size
- The request introduces a pattern inconsistent with how the rest of the codebase works

---

## What the Agent Should Never Do

- Add `console.log` in committed code
- Introduce TypeScript or type annotations
- Add a test file (no test suite exists — do not start one without a decision)
- Modify `vite.config.js` chunking without flagging the bundle size implications
- Push to the remote repository without being explicitly asked
- Amend an existing commit — always create a new one
- Skip ESLint hooks (`--no-verify`)
- Change the `ANTHROPIC_API_KEY` handling in the Firebase Function

---

## Common Pitfall Checklist

Before marking a task done, verify:
- [ ] Registry entry added (if adding content)
- [ ] Step objects have a `type` field (if adding an algorithm)
- [ ] New `Visualizer.jsx` / `Animation.jsx` is in the correct folder path (glob depends on it)
- [ ] Section accent color is correct for the section (not just any color)
- [ ] No hardcoded content counts or titles in components
- [ ] No new imports of `three` outside of visualizer/animation files
- [ ] `ANTHROPIC_API_KEY` not referenced on the frontend
