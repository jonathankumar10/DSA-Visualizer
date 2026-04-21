/**
 * Step builder for LeetCode #704 — Binary Search.
 *
 * Step types:
 *   init      — array and target presented, no pointers yet
 *   inspect   — mid computed, cell highlighted, comparison shown
 *   go-right  — nums[mid] < target → left = mid + 1
 *   go-left   — nums[mid] > target → right = mid - 1
 *   found     — nums[mid] === target, return mid
 *   not-found — left > right, return -1
 */
export function buildBinarySearchSteps(nums, target) {
  const steps = []
  let left  = 0
  let right = nums.length - 1

  steps.push({
    type:    'init',
    nums,
    target,
    left,
    right,
    mid:    -1,
    midVal: null,
    result: null,
    message: `Array has ${nums.length} elements. Set left = 0, right = ${nums.length - 1}. Start searching for ${target}.`,
  })

  while (left <= right) {
    const mid    = left + Math.floor((right - left) / 2)
    const midVal = nums[mid]

    steps.push({
      type:    'inspect',
      nums,
      target,
      left,
      right,
      mid,
      midVal,
      result:  null,
      message: `mid = ${left} + (${right} − ${left}) ÷ 2 = ${mid}  →  nums[${mid}] = ${midVal}. Compare with target ${target}.`,
    })

    if (midVal === target) {
      steps.push({
        type:    'found',
        nums,
        target,
        left,
        right,
        mid,
        midVal,
        result:  mid,
        message: `nums[${mid}] = ${midVal} equals target ${target}. Return index ${mid}.`,
      })
      return steps
    } else if (midVal < target) {
      steps.push({
        type:    'go-right',
        nums,
        target,
        left,
        right,
        mid,
        midVal,
        result:  null,
        message: `${midVal} < ${target} — target is in the right half. Eliminate left. Move left = ${mid} + 1 = ${mid + 1}.`,
      })
      left = mid + 1
    } else {
      steps.push({
        type:    'go-left',
        nums,
        target,
        left,
        right,
        mid,
        midVal,
        result:  null,
        message: `${midVal} > ${target} — target is in the left half. Eliminate right. Move right = ${mid} − 1 = ${mid - 1}.`,
      })
      right = mid - 1
    }
  }

  steps.push({
    type:    'not-found',
    nums,
    target,
    left,
    right,
    mid:    -1,
    midVal: null,
    result: -1,
    message: `left (${left}) > right (${right}) — search space exhausted. Target ${target} not in array. Return -1.`,
  })

  return steps
}
