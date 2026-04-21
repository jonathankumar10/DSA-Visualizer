/**
 * Builds step-by-step trace for LeetCode #74 — Search a 2D Matrix.
 *
 * The matrix is treated as a virtually flattened sorted array.
 * mid index maps back to (row, col) via:
 *   row = mid // cols
 *   col = mid % cols
 *
 * Step types:
 *   init      — show the matrix and target, pointers not yet placed
 *   inspect   — mid computed, cell highlighted, formula shown
 *   go-right  — target > midVal, left = mid + 1
 *   go-left   — target < midVal, right = mid - 1
 *   found     — target === midVal
 *   not-found — search space exhausted
 */
export function buildSearchMatrixSteps(matrix, target) {
  const steps = []
  const rows  = matrix.length
  const cols  = matrix[0].length

  let left  = 0
  let right = rows * cols - 1

  steps.push({
    type:    'init',
    left,
    right,
    mid:     -1,
    midRow:  -1,
    midCol:  -1,
    midVal:  null,
    target,
    rows,
    cols,
    matrix,
    message: `Treat the ${rows}×${cols} matrix as a flat sorted array of ${rows * cols} elements. Binary search from index 0 to ${rows * cols - 1}.`,
  })

  while (left <= right) {
    const mid    = left + Math.floor((right - left) / 2)
    const midRow = Math.floor(mid / cols)
    const midCol = mid % cols
    const midVal = matrix[midRow][midCol]

    steps.push({
      type:   'inspect',
      left,
      right,
      mid,
      midRow,
      midCol,
      midVal,
      target,
      rows,
      cols,
      matrix,
      message: `mid = ${left} + (${right} − ${left}) ÷ 2 = ${mid}  →  row = ${mid} ÷ ${cols} = ${midRow},  col = ${mid} % ${cols} = ${midCol}  →  matrix[${midRow}][${midCol}] = ${midVal}`,
    })

    if (midVal === target) {
      steps.push({
        type:   'found',
        left,
        right,
        mid,
        midRow,
        midCol,
        midVal,
        target,
        rows,
        cols,
        matrix,
        message: `matrix[${midRow}][${midCol}] = ${midVal} equals target ${target}. Found!`,
      })
      return steps
    } else if (midVal < target) {
      steps.push({
        type:   'go-right',
        left,
        right,
        mid,
        midRow,
        midCol,
        midVal,
        target,
        rows,
        cols,
        matrix,
        message: `${midVal} < ${target} — target is to the right. Move left pointer: left = ${mid} + 1 = ${mid + 1}.`,
      })
      left = mid + 1
    } else {
      steps.push({
        type:   'go-left',
        left,
        right,
        mid,
        midRow,
        midCol,
        midVal,
        target,
        rows,
        cols,
        matrix,
        message: `${midVal} > ${target} — target is to the left. Move right pointer: right = ${mid} − 1 = ${mid - 1}.`,
      })
      right = mid - 1
    }
  }

  steps.push({
    type:    'not-found',
    left,
    right,
    mid:    -1,
    midRow: -1,
    midCol: -1,
    midVal: null,
    target,
    rows,
    cols,
    matrix,
    message: `Search space exhausted (left ${left} > right ${right}). Target ${target} is not in the matrix.`,
  })

  return steps
}
