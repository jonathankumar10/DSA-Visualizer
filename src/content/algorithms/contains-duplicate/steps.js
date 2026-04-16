export function buildContainsDuplicateSteps(nums) {
  const steps = []
  const set = new Set()

  steps.push({
    type: 'init',
    currentIndex: null,
    set: new Set(),
    result: null,
    message: `${nums.length} coin piles. Scanning left to right — will any two have the same height?`,
  })

  for (let i = 0; i < nums.length; i++) {
    steps.push({
      type: 'check',
      currentIndex: i,
      set: new Set(set),
      result: null,
      message: `Pile [${i}] has ${nums[i]} coin${nums[i] === 1 ? '' : 's'}. Have we seen a pile this tall before?`,
    })

    if (set.has(nums[i])) {
      steps.push({
        type: 'duplicate',
        currentIndex: i,
        duplicateValue: nums[i],
        set: new Set(set),
        result: true,
        message: `A pile of ${nums[i]} is already in the set! Duplicate height found → return true.`,
      })
      return steps
    }

    set.add(nums[i])
    steps.push({
      type: 'add',
      currentIndex: i,
      set: new Set(set),
      result: null,
      message: `No pile of ${nums[i]} seen yet. Recording this height in the set.`,
    })
  }

  steps.push({
    type: 'done',
    currentIndex: null,
    set: new Set(set),
    result: false,
    message: `All ${nums.length} piles checked. Every height is unique → return false.`,
  })

  return steps
}
