# Project Overview — DevLens

## Overview

DevLens is a SWE interview preparation platform that makes abstract computer science concepts concrete through interactive visualizations. Every topic is framed around interview readiness: trade-offs, edge cases, and the "why" behind every decision.

The product is a React + Vite SPA deployed on Netlify, backed by a Firebase Cloud Function that proxies an AI study assistant.

---

## Requirements

### Functional
- Users can browse five content sections: Algorithms, Patterns, System Design, OOD, AI
- Each section has an index listing all items and individual detail pages
- Algorithm detail pages show a step-through visualizer synchronized with a code panel (Java + Python)
- OOD and AI detail pages show concept cards (description, how it works, key points, interview angles) and optional interactive animations
- System Design detail pages explain concepts and designs, with optional animated diagrams
- A floating chat assistant answers study questions (10 messages/user/day, rate-limited via Firestore)
- Navigation is consistent across the app via a shared Layout + Navbar

### Non-Functional
- Page loads must feel instant — lazy-loaded visualizers and code splitting per section
- Mobile-responsive layout at all breakpoints
- No auth required — the product is fully public

---

## Goals

1. **Interview-first depth** — every topic surfaces the angles interviewers actually ask, not just definitions
2. **Visual intuition** — learners should understand *why* an algorithm works by watching it, not just reading about it
3. **Zero friction** — no sign-up, no paywall, no setup; open the URL and start learning
4. **Content velocity** — adding a new topic should require only dropping files in the right folder and registering one entry

---

## Core User Flows

### 1. Browse → Learn
```
Home (hero + 5 section cards)
  → Section index (AlgorithmsIndex / PatternsIndex / etc.)
    → Detail page (AlgorithmPage / OODPage / AIPage / etc.)
```

### 2. Algorithm Step-Through
```
AlgorithmPage loads
  → Visualizer lazy-loaded via import.meta.glob
  → User presses Play / Next / Prev on StepControls
  → useStepRunner drives currentStep
  → Visualizer renders current state; CodePanel highlights matching lines
```

### 3. OOD / AI Concept Deep-Dive
```
OODPage / AIPage loads item from registry
  → Renders concept card: description, howItWorks, keyPoints, interviewAngles
  → If Animation.jsx exists for the slug: renders interactive diagram in left column, Key Takeaways in bottom
  → If no animation: renders Key Takeaways in right column
  → Optional TTS narration via useTtsRunner (OOD only)
```

### 4. AI Study Chat
```
User opens ChatBot (FAB bottom-right)
  → Types question → Enter or Send button
  → Frontend calls Firebase callable function `chat`
  → Function checks Firestore rate limit (10/user/day by stable browser UUID)
  → Function calls Claude Haiku, returns reply
  → Reply rendered with lightweight markdown (bold + inline code)
  → If reply references /algorithms or /system-design paths, chips are shown as deep links
```

---

## In Scope

- All five content sections (Algorithms, Patterns, System Design, OOD, AI)
- Interactive visualizers for algorithms
- Animated diagrams for OOD, AI, System Design topics
- AI chat assistant with rate limiting
- Dark-theme UI, responsive layout
- Firebase Functions backend
- Netlify frontend deployment

## Out of Scope

- User authentication / accounts / progress tracking
- Spaced repetition or quiz features
- Frontend internals section (roadmap)
- Backend internals section (roadmap)
- Mobile app
- Search / filtering across sections

---

## Features

| Feature | Status | Notes |
|---|---|---|
| Algorithm visualizers | Live | 13 algorithms |
| DSA pattern reference | Live | 7 patterns with animations |
| System Design concepts | Live | ~28 concepts + ~10 designs |
| OOD patterns | Live | 11 patterns with animations |
| OOD interview questions | Live | defined in oodRegistry |
| AI topic pages | Live | 19 topics, 4 with animations |
| AI chat assistant | Live | Claude Haiku, 10 msg/day |
| TTS narration (OOD) | Live | opt-in, browser Speech API |
| Frontend internals | Planned | on roadmap |
| Backend internals | Planned | on roadmap |
