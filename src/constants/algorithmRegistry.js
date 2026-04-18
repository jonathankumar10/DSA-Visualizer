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
]

export const DIFFICULTY_COLOR = {
  Easy:   'text-emerald-400 bg-emerald-400/10',
  Medium: 'text-amber-400  bg-amber-400/10',
  Hard:   'text-rose-400   bg-rose-400/10',
}
