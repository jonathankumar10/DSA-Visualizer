/**
 * Step builder for LeetCode #374 — Guess Number Higher or Lower.
 *
 * Step types:
 *   init      — range 1..n presented, no pointers set yet
 *   guess     — mid computed, guess(mid) called, API result shown
 *   too-high  — result === -1 → right = mid − 1 (pointer moved)
 *   too-low   — result === 1  → left  = mid + 1 (pointer moved)
 *   found     — result === 0  → return mid
 */
export function buildGuessNumberSteps(n, picked) {
  function guessAPI(num) {
    if (num > picked) return -1
    if (num < picked) return 1
    return 0
  }

  const steps = []
  let left  = 1
  let right = n

  steps.push({
    type: 'init',
    n, picked, left, right, mid: -1, guessResult: null, result: null,
    message: `Searching for a secret number in [1..${n}]. Set left = 1, right = ${n}.`,
  })

  while (left <= right) {
    const mid = left + Math.floor((right - left) / 2)
    const g   = guessAPI(mid)

    steps.push({
      type: 'guess',
      n, picked, left, right, mid, guessResult: g, result: null,
      message: `mid = ${left} + (${right} − ${left}) ÷ 2 = ${mid}  →  Call guess(${mid})  →  returns ${g}.`,
    })

    if (g === 0) {
      steps.push({
        type: 'found',
        n, picked, left, right, mid, guessResult: 0, result: mid,
        message: `guess(${mid}) = 0 — Correct! The secret number is ${mid}. Return ${mid}.`,
      })
      return steps
    } else if (g === -1) {
      steps.push({
        type: 'too-high',
        n, picked, left, right: mid - 1, mid, guessResult: -1, result: null,
        message: `guess(${mid}) = -1 — Too high! Eliminate [${mid}..${right}]. Move right = ${mid} − 1 = ${mid - 1}.`,
      })
      right = mid - 1
    } else {
      steps.push({
        type: 'too-low',
        n, picked, left: mid + 1, right, mid, guessResult: 1, result: null,
        message: `guess(${mid}) = 1 — Too low! Eliminate [${left}..${mid}]. Move left = ${mid} + 1 = ${mid + 1}.`,
      })
      left = mid + 1
    }
  }

  return steps
}
