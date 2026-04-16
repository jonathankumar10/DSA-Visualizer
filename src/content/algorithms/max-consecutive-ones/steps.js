/**
 * Builds the step-by-step trace for Max Consecutive Ones.
 *
 * Step types
 *   init      – variables initialised, nothing scanned yet
 *   increment – nums[i] == 1, count increased (newMax=true when best updated)
 *   reset     – nums[i] == 0, count resets to 0
 *   done      – loop finished, maxCount is the answer
 */
export function buildMaxConsecutiveOnesSteps(nums) {
  const steps = []

  steps.push({
    type: 'init', index: -1, count: 0, maxCount: 0,
    message: 'Initialise count = 0, maxCount = 0.',
  })

  let count    = 0
  let maxCount = 0

  for (let i = 0; i < nums.length; i++) {
    if (nums[i] === 1) {
      count++
      const newMax = count > maxCount
      if (newMax) maxCount = count
      steps.push({
        type: 'increment', index: i, count, maxCount, newMax,
        message: newMax
          ? `nums[${i}] = 1 → streak = ${count}  (new best!)`
          : `nums[${i}] = 1 → streak = ${count}`,
      })
    } else {
      count = 0
      steps.push({
        type: 'reset', index: i, count: 0, maxCount,
        message: `nums[${i}] = 0 → streak resets to 0  (best stays ${maxCount})`,
      })
    }
  }

  steps.push({
    type: 'done', index: -1, count, maxCount,
    message: `Done!  Max consecutive 1s = ${maxCount}.`,
  })

  return steps
}
