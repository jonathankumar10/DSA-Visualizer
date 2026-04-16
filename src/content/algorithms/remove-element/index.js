export default {
  id: 'remove-element',
  title: 'Remove Element',
  difficulty: 'Easy',
  pattern: 'Two Pointers',
  category: 'arrays-hashing',
  path: '/algorithms/remove-element',
  description: 'Given an integer array nums and an integer val, remove all occurrences of val in-place. Return k — the count of elements not equal to val. The first k elements of nums must hold those values.',
  metaphor: 'We use two runners on a track: a reader (i) sprints ahead, and a writer (k) trails behind. Whenever the reader steps on a tile marked val they leap over it; otherwise they hand the tile to the writer and both advance one step.',
  tags: ['array', 'two-pointers', 'in-place'],
  problemUrl: 'https://leetcode.com/problems/remove-element/',
  problemLabel: 'LeetCode #27',

  solution: {
    approaches: [
      {
        id: 'two-pointer',
        label: 'Two Pointers',
        complexity: { time: 'O(n)', space: 'O(1)' },
        java: {
          code: `public int removeElement(int[] nums, int val) {
    // Step 1: initialze counter to 0
    int counter = 0;

    // Step 2: Iterate through the list and skip elements equal to val,
    // copy others forward to compact array
    for(int i = 0; i < nums.length; i++){
        if(nums[i] == val){
            continue;
        }else{
            nums[counter] = nums[i];
            counter++;
        }
    }
    return counter;
}`,
          getHighlightLines(step) {
            if (step.type === 'init') return [3]
            if (step.type === 'skip') return [8, 9]
            if (step.type === 'keep') return [8, 11, 12]
            if (step.type === 'done') return [15]
            return []
          },
        },
        python: {
          code: `def removeElement(self, nums: List[int], val: int) -> int:
    # Step 1: initialze counter to 0
    counter = 0

    # Step 2: Iterate through the list and skip elements equal to val,
    # copy others forward to compact array
    for i in range(len(nums)):
        if nums[i] == val:
            continue
        else:
            nums[counter] = nums[i]
            counter += 1

    return counter`,
          getHighlightLines(step) {
            if (step.type === 'init') return [3]
            if (step.type === 'skip') return [8, 9]
            if (step.type === 'keep') return [8, 11, 12]
            if (step.type === 'done') return [14]
            return []
          },
        },
      },
    ],
  },
}
