/**
 * Builds the step-by-step trace for Replace Elements (O(n) reverse scan).
 *
 * Step types
 *   init  – result array created, maxValue = -1
 *   scan  – visiting index i from the right: write maxValue into result[i],
 *           then update maxValue with arr[i]
 *   done  – full result array is ready
 *
 * Each step carries:
 *   index     – current position being processed (-1 for init/done)
 *   maxValue  – the running maximum BEFORE writing to result[i]
 *   result    – snapshot of the result array at this point
 */
export function buildReplaceElementsSteps(arr) {
  const steps = []
  const result = new Array(arr.length).fill(null)

  steps.push({
    type: 'init',
    index: -1,
    maxValue: -1,
    result: [...result],
    message: 'Create result array. Set maxValue = −1 (last element always becomes −1).',
  })

  let maxValue = -1

  for (let i = arr.length - 1; i >= 0; i--) {
    result[i] = maxValue
    const prevMax = maxValue
    maxValue = Math.max(maxValue, arr[i])

    steps.push({
      type: 'scan',
      index: i,
      maxValue: prevMax,
      newMax: maxValue,
      result: [...result],
      message:
        i === arr.length - 1
          ? `arr[${i}] = ${arr[i]} (last element) → result[${i}] = −1. Update maxValue = max(−1, ${arr[i]}) = ${maxValue}.`
          : `arr[${i}] = ${arr[i]} → result[${i}] = ${prevMax} (current max). Update maxValue = max(${prevMax}, ${arr[i]}) = ${maxValue}.`,
    })
  }

  steps.push({
    type: 'done',
    index: -1,
    maxValue,
    result: [...result],
    message: `Done! result = [${result.join(', ')}].`,
  })

  return steps
}
