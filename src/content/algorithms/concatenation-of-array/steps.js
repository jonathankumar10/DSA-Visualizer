/**
 * Builds the step trace for Concatenation of Array.
 *
 * Step types
 *   init  – result array of length 2n created, all null
 *   fill  – nums[i] written into result[i] AND result[n+i] simultaneously
 *   done  – full result array returned
 *
 * Each step carries:
 *   index   – current position i (-1 for init/done)
 *   value   – nums[i] being stamped (fill only)
 *   result  – snapshot of the result array at this point
 */
export function buildConcatenationSteps(nums) {
  const steps = []
  const n = nums.length
  const result = new Array(2 * n).fill(null)

  steps.push({
    type: 'init',
    index: -1,
    result: [...result],
    message: `Create result array of length ${2 * n} — we'll stamp each value into both halves.`,
  })

  for (let i = 0; i < n; i++) {
    result[i]     = nums[i]
    result[n + i] = nums[i]

    steps.push({
      type: 'fill',
      index: i,
      value: nums[i],
      result: [...result],
      message: `nums[${i}] = ${nums[i]} → stamp into result[${i}] (first half) and result[${n + i}] (second half).`,
    })
  }

  steps.push({
    type: 'done',
    index: -1,
    result: [...result],
    message: `Done! result = [${result.join(', ')}].`,
  })

  return steps
}
