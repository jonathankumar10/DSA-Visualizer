# Progress Tracker — DevLens

_Update this file whenever work is completed, started, or planned. Move cards between columns. Keep it honest._

---

## Board

### Done

#### Content — Algorithms (13 visualizers)
- binary-search, two-sum, contains-duplicate, valid-parentheses
- reverse-linked-list, merge-sorted-lists, min-stack
- bfs, tree-traversal, search-matrix
- baseball-game, concatenation-of-array, max-consecutive-ones, remove-element, replace-elements

#### Content — DSA Patterns (7 with animations)
- arrays, binary-search, graphs-bfs, hash-map, linked-list, stack, trees

#### Content — System Design
- **Concepts (~28):** computer-architecture, application-architecture, design-requirements, dns, networking-basics, tcp-and-udp, http, websockets, sql, nosql, database-indexes, database-replication, database-sharding, caching, cdns, proxies-and-load-balancing, consistent-hashing, rate-limiting, message-queues, event-driven-architecture, microservices, cap-theorem, acid-and-base, consistency-patterns, availability-patterns, api-design, api-paradigms, object-storage, logging-and-monitoring, distributed-tracing
- **Designs (~10):** url-shortener, chat-system, rate-limiter, key-value-store, file-storage, notification-system, search-autocomplete, social-media-feed, video-streaming

#### Content — OOD
- **Patterns (11 with animations):** singleton, factory-method, builder, adapter, decorator, facade, observer, strategy, command, state, template-method
- **Interview questions:** defined in oodRegistry (parking lot, elevator, etc.)

#### Content — AI (19 topics)
- history: ai-history
- ml: neural-networks *(animation)*, training-and-loss
- llms: transformer-architecture *(animation)*, attention-mechanism *(animation)*, tokenization, context-windows, llm-inference, multimodal-models
- workflows: prompt-engineering, rag *(animation)*, embeddings, function-calling, fine-tuning, guardrails
- agents: ai-agents, multi-agent-systems
- production: ai-engineer, llm-evaluation, ai-observability

#### Infrastructure
- Firebase Cloud Function (`chat`) with Anthropic SDK integration
- Firestore rate limiting (10 msg/user/day)
- Netlify deployment + `netlify.toml`
- Vite `three-vendor` chunk splitting
- TTS narration (`useTtsRunner`) on OOD pages
- ChatBot component with typing indicator, markdown rendering, deep-link chips

---

### In Progress

_(nothing currently active — update when work starts)_

---

### Backlog

#### New Content
- [ ] More algorithm visualizers (sliding window, two pointers, dynamic programming)
- [ ] Additional OOD interview questions
- [ ] AI topic animations for: training-and-loss, tokenization, context-windows, llm-inference, ai-agents, multi-agent-systems, embeddings, function-calling

#### New Sections
- [ ] Frontend Internals (browser rendering, JS engine, DOM)
- [ ] Backend Internals (databases internals, OS concepts)

#### Features / UX
- [ ] Progress tracking (mark topics as complete)
- [ ] Section-level filtering / search
- [ ] Keyboard navigation for step controls
- [ ] "Related topics" links between sections

#### Infrastructure
- [ ] Claude model upgrade decision (Haiku → Sonnet for chat quality)
- [ ] Analytics / usage tracking

---

## Conventions

- **Done** = shipped and live on Netlify
- **In Progress** = actively being worked on
- **Backlog** = decided but not started
- Move items left → right as they progress
- When starting a backlog item, add your name/date and move to In Progress
