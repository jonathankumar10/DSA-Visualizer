/**
 * Builds the step trace for Valid Parentheses (LeetCode #20).
 * Stack items carry a stable `id` for AnimatePresence.
 *
 * Step types:
 *   init      — initial state
 *   push      — open bracket pushed onto stack
 *   match     — close bracket matched top of stack; top is removed
 *   mismatch  — close bracket does NOT match top (top stays, algorithm ends)
 *   orphan    — close bracket but stack is empty (algorithm ends)
 *   valid     — end of string, stack empty → valid
 *   invalid   — end of string with unclosed brackets, or early exit
 *               carries { cause: 'mismatch' | 'orphan' | 'unclosed' }
 */

const PAIRS = { ')': '(', ']': '[', '}': '{' }
const OPENS = new Set(['(', '[', '{'])

export function buildValidParenthesesSteps(s = '()[]{}') {
  const steps = []
  const stack = []   // [{ char, id }, ...]
  let nextId = 0

  steps.push({
    type: 'init',
    charIndex: -1,
    stack: [],
    message: 'Initialize empty stack and bracket map.',
  })

  for (let i = 0; i < s.length; i++) {
    const c = s[i]

    if (OPENS.has(c)) {
      stack.push({ char: c, id: nextId++ })
      steps.push({
        type: 'push',
        charIndex: i,
        char: c,
        stack: stack.map((x) => ({ ...x })),
        message: `'${c}' is an opening bracket → push onto stack.`,
      })
    } else if (PAIRS[c] !== undefined) {
      if (stack.length > 0) {
        const top = stack[stack.length - 1]
        if (top.char === PAIRS[c]) {
          stack.pop()
          steps.push({
            type: 'match',
            charIndex: i,
            char: c,
            matched: top.char,
            matchedId: top.id,
            stack: stack.map((x) => ({ ...x })),
            message: `'${c}' matches '${top.char}' on top → pop and continue.`,
          })
        } else {
          // Keep the mismatched item in the stack snapshot so it visually shakes
          steps.push({
            type: 'mismatch',
            charIndex: i,
            char: c,
            topChar: top.char,
            topId: top.id,
            stack: stack.map((x) => ({ ...x })),
            message: `'${c}' expected '${PAIRS[c]}' but found '${top.char}' on top → invalid!`,
          })
          steps.push({
            type: 'invalid',
            cause: 'mismatch',
            charIndex: i,
            stack: stack.map((x) => ({ ...x })),
            message: 'String is invalid — mismatched brackets.',
          })
          return steps
        }
      } else {
        steps.push({
          type: 'orphan',
          charIndex: i,
          char: c,
          stack: [],
          message: `'${c}' is a closing bracket but the stack is empty → invalid!`,
        })
        steps.push({
          type: 'invalid',
          cause: 'orphan',
          charIndex: i,
          stack: [],
          message: 'String is invalid — closing bracket with nothing to match.',
        })
        return steps
      }
    }
  }

  if (stack.length === 0) {
    steps.push({
      type: 'valid',
      charIndex: -1,
      stack: [],
      message: 'All brackets matched and stack is empty → valid! ✓',
    })
  } else {
    steps.push({
      type: 'invalid',
      cause: 'unclosed',
      charIndex: -1,
      stack: stack.map((x) => ({ ...x })),
      message: `${stack.length} unclosed bracket${stack.length > 1 ? 's' : ''} remain on the stack → invalid!`,
    })
  }

  return steps
}
