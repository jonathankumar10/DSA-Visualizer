import twoSum                from '../content/algorithms/two-sum/index.js'
import bfs                   from '../content/algorithms/bfs/index.js'
import treeTraversal         from '../content/algorithms/tree-traversal/index.js'
import containsDuplicate     from '../content/algorithms/contains-duplicate/index.js'
import maxConsecutiveOnes    from '../content/algorithms/max-consecutive-ones/index.js'
import removeElement         from '../content/algorithms/remove-element/index.js'
import replaceElements       from '../content/algorithms/replace-elements/index.js'
import concatenationOfArray  from '../content/algorithms/concatenation-of-array/index.js'
import baseballGame          from '../content/algorithms/baseball-game/index.js'
import validParentheses      from '../content/algorithms/valid-parentheses/index.js'
import minStack              from '../content/algorithms/min-stack/index.js'
import searchMatrix          from '../content/algorithms/search-matrix/index.js'
import binarySearch          from '../content/algorithms/binary-search/index.js'
import reverseLinkedList     from '../content/algorithms/reverse-linked-list/index.js'
import mergeSortedLists      from '../content/algorithms/merge-sorted-lists/index.js'

// Ordered list — add new algorithms here, one import + one array entry.
export const ALGORITHMS = [
  twoSum,
  bfs,
  treeTraversal,
  containsDuplicate,
  maxConsecutiveOnes,
  removeElement,
  replaceElements,
  concatenationOfArray,
  baseballGame,
  validParentheses,
  minStack,
  searchMatrix,
  binarySearch,
  reverseLinkedList,
  mergeSortedLists,
]

export const DIFFICULTY_COLOR = {
  Easy:   'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-amber-400  bg-amber-400/10',
  Hard:   'text-rose-400   bg-rose-400/10',
}
