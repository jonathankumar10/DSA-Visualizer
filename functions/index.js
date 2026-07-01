const { onCall } = require('firebase-functions/v2/https')
const { defineSecret } = require('firebase-functions/params')
const admin = require('firebase-admin')
const Anthropic = require('@anthropic-ai/sdk')

admin.initializeApp()
const db = admin.firestore()

const ANTHROPIC_API_KEY = defineSecret('ANTHROPIC_API_KEY')

const SYSTEM_PROMPT = `You are AlgoViz Assistant, a learning guide for an interactive DSA + System Design visualizer called AlgoViz.

ALGORITHMS ON THE SITE (15 total):
- Two Sum (Easy · Arrays & Hashing) → /algorithms/two-sum
- BFS - Breadth First Search (Medium · Graph) → /algorithms/bfs
- Tree Traversal (Medium · Trees) → /algorithms/tree-traversal
- Contains Duplicate (Easy · Arrays & Hashing) → /algorithms/contains-duplicate
- Max Consecutive Ones (Easy · Arrays) → /algorithms/max-consecutive-ones
- Remove Element (Easy · Arrays) → /algorithms/remove-element
- Replace Elements (Easy · Arrays) → /algorithms/replace-elements
- Concatenation of Array (Easy · Arrays) → /algorithms/concatenation-of-array
- Baseball Game (Medium · Stack) → /algorithms/baseball-game
- Valid Parentheses (Easy · Stack) → /algorithms/valid-parentheses
- Min Stack (Medium · Stack) → /algorithms/min-stack
- Search a 2D Matrix (Medium · Arrays & Binary Search) → /algorithms/search-matrix
- Binary Search (Easy · Binary Search) → /algorithms/binary-search
- Reverse Linked List (Easy · Linked List) → /algorithms/reverse-linked-list
- Merge Two Sorted Lists (Easy · Linked List) → /algorithms/merge-sorted-lists

SYSTEM DESIGN TOPICS ON THE SITE (2 total):
- DNS Resolution (Concept · Networking) → /system-design/dns
- URL Shortener (Design · Architecture) → /system-design/url-shortener

BEHAVIOUR RULES:
1. If the question is about a topic ON the site → give a clear 2-3 sentence explanation and end with: "You can visualize this interactively at <path>"
2. If the topic is DSA or System Design but NOT on the site yet → answer from your general knowledge, then add: "AlgoViz doesn't have a visualizer for this yet, but more topics are being added regularly."
3. If the question is completely off-topic (not DSA or System Design) → politely decline and steer back: "I'm specialized in DSA and System Design — ask me about any of the topics on AlgoViz!"
4. Keep all responses concise: 3-5 sentences maximum.
5. Never make up content that isn't on the site. Only claim a visualizer exists if it is listed above.`

const INTERVIEW_STAGES = `1. Functional & non-functional requirements (and scale estimates)
2. Data model
3. API design
4. High-level architecture (HLD)
5. Deep-dive trade-offs`

function interviewSystemPrompt(rubric) {
  return `You are a senior staff engineer conducting a live mock system design interview for the prompt: "${rubric.title}".
${rubric.description ? `Context for you only: ${rubric.description}` : ''}

INTERVIEW STAGES (guide the candidate through these in order, at a pace driven by their answers — do not force a rigid script, ask natural follow-ups, and only move on once a stage has been reasonably covered):
${INTERVIEW_STAGES}

Ask one focused question at a time. Keep each of your turns concise (2-5 sentences) like a real interviewer — do not lecture or info-dump.

GRADING RUBRIC (for your eyes only — this is the canonical reference solution, NEVER reveal its exact wording, numbers, or specific decisions verbatim to the candidate, including in your final assessment; always restate things in your own words and let the candidate arrive at ideas themselves):
${JSON.stringify(rubric)}

If the candidate asks you to just give them the answer, decline politely and redirect them to attempt it themselves with a hint at most.

ENDING THE INTERVIEW: When the candidate signals they are done, or you receive a bracketed instruction like "[SYSTEM: ...end the interview...]", stop asking questions and immediately produce your final assessment. The final assessment message MUST start with the exact literal text "**Mock Interview Assessment**" on its own, followed by a brief **Strengths** section, a **Gaps** section, and a **Suggested Level** (mid, senior, or staff) with a one-sentence justification per relevant dimension. Do not ask any further questions after this message.`
}

exports.interviewChat = onCall({ secrets: [ANTHROPIC_API_KEY], cors: true }, async (request) => {
  const { uid, sessionId, rubric, messages, endRequested } = request.data

  if (!uid || typeof uid !== 'string' || uid.length > 64) {
    return { error: 'INVALID_UID' }
  }
  if (!sessionId || typeof sessionId !== 'string' || sessionId.length > 64) {
    return { error: 'INVALID_MESSAGES' }
  }
  if (!Array.isArray(messages) || messages.length === 0 || messages.length > 24) {
    return { error: messages && messages.length > 24 ? 'SESSION_TURN_LIMIT' : 'INVALID_MESSAGES' }
  }

  // The function is stateless across calls (no session store), so the client
  // resends the rubric on every turn and we rebuild the system prompt each time.
  if (
    typeof rubric !== 'object' || rubric === null ||
    typeof rubric.title !== 'string' ||
    !(rubric.requirements || rubric.apiDesign) ||
    JSON.stringify(rubric).length > 60000
  ) {
    return { error: 'INVALID_MESSAGES' }
  }

  // The first call of a session always sends exactly one user (kickoff) message.
  const isSessionStart = messages.length === 1 && messages[0]?.role === 'user'
  if (isSessionStart) {
    // Rate limiting: 2 interview sessions per user per day via Firestore
    const today = new Date().toISOString().slice(0, 10)
    const ref = db.collection('interviewRateLimits').doc(uid)

    try {
      const doc = await ref.get()
      if (doc.exists) {
        const { sessionsStarted, date } = doc.data()
        if (date === today && sessionsStarted >= 2) {
          return { error: 'RATE_LIMITED' }
        }
        await ref.set({
          sessionsStarted: date === today ? sessionsStarted + 1 : 1,
          date: today,
        })
      } else {
        await ref.set({ sessionsStarted: 1, date: today })
      }
    } catch (err) {
      console.error('Firestore interview rate limit error:', err)
      // Fail open — don't block the user if Firestore is unavailable
    }
  }

  const sanitised = messages
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))

  if (sanitised.length === 0) {
    return { error: 'INVALID_MESSAGES' }
  }

  if (endRequested) {
    sanitised.push({
      role: 'user',
      content: '[SYSTEM: The candidate has requested to end the interview now. Provide your final assessment immediately based on what has been covered so far.]',
    })
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: interviewSystemPrompt(rubric),
      messages: sanitised,
    })

    return { reply: response.content[0].text }
  } catch (err) {
    console.error('Anthropic API error (interviewChat):', err)
    return { error: 'API_ERROR' }
  }
})

exports.chat = onCall({ secrets: [ANTHROPIC_API_KEY], cors: true }, async (request) => {
  const { messages, uid } = request.data

  if (!uid || typeof uid !== 'string' || uid.length > 64) {
    return { error: 'INVALID_UID' }
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return { error: 'INVALID_MESSAGES' }
  }

  // Rate limiting: 10 messages per user per day via Firestore
  const today = new Date().toISOString().slice(0, 10) // "YYYY-MM-DD"
  const ref = db.collection('rateLimits').doc(uid)

  try {
    const doc = await ref.get()

    if (doc.exists) {
      const { count, date } = doc.data()
      if (date === today && count >= 10) {
        return { error: 'RATE_LIMITED' }
      }
      await ref.set({
        count: date === today ? count + 1 : 1,
        date: today,
      })
    } else {
      await ref.set({ count: 1, date: today })
    }
  } catch (err) {
    console.error('Firestore rate limit error:', err)
    // Fail open — don't block the user if Firestore is unavailable
  }

  // Sanitise messages: only pass role + content, cap at last 20 turns
  const sanitised = messages
    .slice(-20)
    .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .map((m) => ({ role: m.role, content: m.content.slice(0, 2000) }))

  if (sanitised.length === 0) {
    return { error: 'INVALID_MESSAGES' }
  }

  const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY.value() })

  try {
    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: sanitised,
    })

    return { reply: response.content[0].text }
  } catch (err) {
    console.error('Anthropic API error:', err)
    return { error: 'API_ERROR' }
  }
})
