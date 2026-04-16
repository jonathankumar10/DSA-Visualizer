export default {
  id: 'contains-duplicate',
  title: 'Contains Duplicate',
  difficulty: 'Easy',
  pattern: 'Hash Set',
  category: 'arrays-hashing',
  path: '/algorithms/contains-duplicate',
  description: 'Given an integer array nums, return true if any value appears at least twice, and false if every element is distinct.',
  metaphor: 'We picture each number as a pile of gold coins — the pile height equals the value. As we scan left to right we drop each height into a seen bin; the moment we reach a pile whose height is already in the bin, the alarm sounds.',
  tags: ['array', 'hash-set', 'sorting'],
  problemUrl: 'https://leetcode.com/problems/contains-duplicate/',
  problemLabel: 'LeetCode #217',

  solution: {
    approaches: [
      {
        id: 'hashset',
        label: 'Hash Set',
        complexity: { time: 'O(n)', space: 'O(n)' },
        java: {
          code: `public boolean containsDuplicate2(int[] nums) {
    // Step 1: Create set for tracking
    final Set<Integer> set = new HashSet<>();

    // Step 2: Find if number is in set, else add it
    for (int i = 0; i < nums.length; i++) {
        if (set.contains(nums[i])) {
            return true;
        }
        set.add(nums[i]);
    }
    return false;
}`,
          getHighlightLines(step) {
            if (step.type === 'init')      return [3]
            if (step.type === 'check')     return [6, 7]
            if (step.type === 'duplicate') return [8]
            if (step.type === 'add')       return [10]
            if (step.type === 'done')      return [12]
            return []
          },
        },
        python: {
          code: `def hasDuplicate2(self, nums: List[int]) -> bool:
    # Step 1: Create set for tracking
    seen = set()

    # Step 2: Find if number is in set, else add it
    for num in nums:
        if num in seen:
            return True
        seen.add(num)
    return False`,
          getHighlightLines(step) {
            if (step.type === 'init')      return [3]
            if (step.type === 'check')     return [6, 7]
            if (step.type === 'duplicate') return [8]
            if (step.type === 'add')       return [9]
            if (step.type === 'done')      return [10]
            return []
          },
        },
      },
      {
        id: 'sorting',
        label: 'Sort',
        complexity: { time: 'O(n log n)', space: 'O(1)' },
        java: {
          code: `public boolean containsDuplicate3(int[] nums) {

    // Step 1: Sort list
    Arrays.sort(nums);

    // Step 2: Check if duplicate is present in the list
    for (int i = 1; i < nums.length; i++) {
        if (nums[i] == nums[i - 1]) {
            return true;
        }
    }
    return false;
}`,
          getHighlightLines(_step) { return [] },
        },
        python: {
          code: `def hasDuplicate(self, nums: List[int]) -> bool:
    # Step 1: Sort the list
    nums.sort()

    # Step 2: Check if duplicate is present in the list
    for i in range(1, len(nums)):
        if(nums[i] == nums[i-1]):
            return True
    return False`,
          getHighlightLines(_step) { return [] },
        },
      },
      {
        id: 'brute',
        label: 'Brute Force',
        complexity: { time: 'O(n²)', space: 'O(1)' },
        java: {
          code: `public boolean containsDuplicate(int[] nums) {
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] == nums[j]) {
                return true;
            }
        }
    }
    return false;
}`,
          getHighlightLines(_step) { return [] },
        },
        python: {
          code: `def containsDuplicate(nums):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] == nums[j]:
                return True
    return False`,
          getHighlightLines(_step) { return [] },
        },
      },
    ],
  },
}
