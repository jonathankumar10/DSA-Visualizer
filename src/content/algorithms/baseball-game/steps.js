/**
 * Builds the step trace for Baseball Game (LeetCode #682).
 * Each stack item carries a stable `id` so AnimatePresence can
 * animate enter / exit correctly even when values repeat.
 */
export function buildBaseballGameSteps(ops = ['5', '2', 'C', 'D', '+']) {
  const steps = []
  const stack = []   // [{ value, id }, ...]
  let nextId = 0

  steps.push({
    type: 'init',
    opIndex: -1,
    op: null,
    stack: [],
    message: 'Starting with an empty scoreboard stack.',
  })

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]

    if (op === '+') {
      const top    = stack[stack.length - 1]
      const second = stack[stack.length - 2]
      const newVal = top.value + second.value
      stack.push({ value: newVal, id: nextId++, source: 'plus' })
      steps.push({
        type: 'plus',
        opIndex: i,
        op,
        stack: stack.map((s) => ({ ...s })),
        newValue: newVal,
        message: `"+" → top two are ${second.value} and ${top.value}; push their sum ${newVal}.`,
      })
    } else if (op === 'C') {
      const removed = stack[stack.length - 1]
      stack.pop()
      steps.push({
        type: 'cancel',
        opIndex: i,
        op,
        stack: stack.map((s) => ({ ...s })),
        removedValue: removed.value,
        message: `"C" → cancel last score (${removed.value}). Pop it off the stack.`,
      })
    } else if (op === 'D') {
      const top    = stack[stack.length - 1]
      const newVal = top.value * 2
      stack.push({ value: newVal, id: nextId++, source: 'double' })
      steps.push({
        type: 'double',
        opIndex: i,
        op,
        stack: stack.map((s) => ({ ...s })),
        newValue: newVal,
        message: `"D" → double last score (${top.value} × 2 = ${newVal}). Push ${newVal}.`,
      })
    } else {
      const newVal = parseInt(op, 10)
      stack.push({ value: newVal, id: nextId++, source: 'num' })
      steps.push({
        type: 'num',
        opIndex: i,
        op,
        stack: stack.map((s) => ({ ...s })),
        newValue: newVal,
        message: `Score "${op}" → push ${newVal} onto the stack.`,
      })
    }
  }

  const total = stack.reduce((acc, s) => acc + s.value, 0)
  steps.push({
    type: 'sum',
    opIndex: -1,
    op: null,
    stack: stack.map((s) => ({ ...s })),
    total,
    message: `All rounds complete! ${stack.map((s) => s.value).join(' + ')} = ${total}.`,
  })

  return steps
}
