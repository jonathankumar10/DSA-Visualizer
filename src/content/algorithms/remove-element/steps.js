/**
 * Builds the step trace for Remove Element.
 *
 * Two-pointer technique: k = write pointer, i = read pointer.
 * When nums[i] == val → skip (k unchanged).
 * When nums[i] != val → write nums[k] = nums[i], advance k.
 *
 * Step types
 *   init  – k initialised to 0
 *   skip  – nums[i] equals val, skipped
 *   keep  – nums[i] differs from val, copied forward to nums[k]
 *   done  – return k
 *
 * step.k is the write pointer AFTER this step completes.
 * Cells [0, step.k - 1] are always the confirmed result region.
 */
export function buildRemoveElementSteps(nums, val) {
  const steps = []
  const arr   = [...nums]

  steps.push({
    type: 'init', i: -1, k: 0, val,
    nums: [...arr],
    message: `Initialise k = 0. We'll compact elements ≠ ${val} to the front.`,
  })

  let k = 0

  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === val) {
      steps.push({
        type: 'skip', i, k, val,
        nums: [...arr],
        message: `nums[${i}] = ${arr[i]} equals val (${val}) → skip.`,
      })
    } else {
      arr[k] = arr[i]
      k++
      steps.push({
        type: 'keep', i, k, val,
        nums: [...arr],
        message: `nums[${i}] = ${arr[i]} ≠ val → write to nums[${k - 1}], k = ${k}.`,
      })
    }
  }

  steps.push({
    type: 'done', i: -1, k, val,
    nums: [...arr],
    message: `Done! Return k = ${k}. The first ${k} element${k === 1 ? '' : 's'} are the answer.`,
  })

  return steps
}
