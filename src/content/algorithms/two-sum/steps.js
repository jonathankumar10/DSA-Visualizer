export function buildTwoSumSteps(nums, target) {
  const steps = []
  const map = {}

  steps.push({
    type: 'init',
    activeIndex: null,
    complementIndex: null,
    foundPair: null,
    map: {},
    message: `Looking for two numbers that add up to ${target}.`,
  })

  for (let i = 0; i < nums.length; i++) {
    const complement = target - nums[i]

    steps.push({
      type: 'check',
      activeIndex: i,
      complementIndex: null,
      foundPair: null,
      map: { ...map },
      message: `Checking bottle #${i} (value ${nums[i]}). Need complement: ${complement}.`,
    })

    if (map[complement] !== undefined) {
      steps.push({
        type: 'found',
        activeIndex: i,
        complementIndex: map[complement],
        foundPair: [map[complement], i],
        map: { ...map },
        message: `Found! Bottle #${map[complement]} (${complement}) + Bottle #${i} (${nums[i]}) = ${target}.`,
      })
      return steps
    }

    map[nums[i]] = i
    steps.push({
      type: 'store',
      activeIndex: i,
      complementIndex: null,
      foundPair: null,
      map: { ...map },
      message: `No match yet. Stored bottle #${i} (value ${nums[i]}) in the lookup table.`,
    })
  }

  steps.push({
    type: 'notfound',
    activeIndex: null,
    complementIndex: null,
    foundPair: null,
    map: { ...map },
    message: 'No two bottles add up to the target.',
  })

  return steps
}
