/**
 * Builds the step trace for Min Stack (LeetCode #155).
 *
 * Operations: array of strings — "push N", "pop", "top", "getMin"
 *
 * Step types:
 *   init     — both stacks empty
 *   push     — push val to main stack; pushedToMin=true if min stack also updated
 *   pop      — pop from main stack; poppedFromMin=true if min stack also updated
 *   top      — peek main stack top
 *   getmin   — peek min stack top
 *   done     — all operations complete
 */

export function buildMinStackSteps(ops = []) {
  const steps = []
  const stack    = []   // [{ val, id }, ...]
  const minStack = []   // [{ val, id }, ...]
  let nextId = 0

  steps.push({
    type: 'init',
    opIndex: -1,
    stack: [],
    minStack: [],
    message: 'Initialize empty main stack and min stack.',
  })

  for (let i = 0; i < ops.length; i++) {
    const raw = ops[i].trim()
    const lower = raw.toLowerCase()

    if (lower.startsWith('push')) {
      const val = parseInt(lower.split(/\s+/)[1], 10)
      const mainId = nextId++
      stack.push({ val, id: mainId })

      const pushedToMin =
        minStack.length === 0 || val <= minStack[minStack.length - 1].val

      if (pushedToMin) {
        minStack.push({ val, id: nextId++ })
      }

      const currentMin = minStack[minStack.length - 1].val

      steps.push({
        type: 'push',
        opIndex: i,
        val,
        pushedToMin,
        stack:    stack.map((x) => ({ ...x })),
        minStack: minStack.map((x) => ({ ...x })),
        message: pushedToMin
          ? `push(${val}) → added to main stack. ${val} ≤ current min → also pushed to min stack.`
          : `push(${val}) → added to main stack. ${val} > current min (${currentMin}) → min stack unchanged.`,
      })

    } else if (lower === 'pop') {
      if (stack.length === 0) {
        steps.push({
          type: 'pop',
          opIndex: i,
          val: null,
          poppedFromMin: false,
          stack: [],
          minStack: minStack.map((x) => ({ ...x })),
          message: 'pop() — stack is empty, nothing to remove.',
        })
        continue
      }

      const top = stack[stack.length - 1]
      const poppedFromMin =
        minStack.length > 0 && top.val === minStack[minStack.length - 1].val

      stack.pop()
      if (poppedFromMin) minStack.pop()

      steps.push({
        type: 'pop',
        opIndex: i,
        val: top.val,
        poppedFromMin,
        stack:    stack.map((x) => ({ ...x })),
        minStack: minStack.map((x) => ({ ...x })),
        message: poppedFromMin
          ? `pop() → removed ${top.val} from main stack. It was the minimum — also removed from min stack.`
          : `pop() → removed ${top.val} from main stack. Min stack unchanged.`,
      })

    } else if (lower === 'top') {
      const val = stack.length > 0 ? stack[stack.length - 1].val : null
      steps.push({
        type: 'top',
        opIndex: i,
        val,
        stack:    stack.map((x) => ({ ...x })),
        minStack: minStack.map((x) => ({ ...x })),
        message: val === null
          ? 'top() — stack is empty.'
          : `top() → ${val}`,
      })

    } else if (lower === 'getmin') {
      const val = minStack.length > 0 ? minStack[minStack.length - 1].val : null
      steps.push({
        type: 'getmin',
        opIndex: i,
        val,
        stack:    stack.map((x) => ({ ...x })),
        minStack: minStack.map((x) => ({ ...x })),
        message: val === null
          ? 'getMin() — min stack is empty.'
          : `getMin() → ${val}`,
      })
    }
  }

  steps.push({
    type: 'done',
    opIndex: ops.length,
    stack:    stack.map((x) => ({ ...x })),
    minStack: minStack.map((x) => ({ ...x })),
    message: 'All operations complete.',
  })

  return steps
}
