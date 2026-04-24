/**
 * Builds the step trace for Merge Two Sorted Lists (LeetCode #21).
 *
 * Step types:
 *   init   — show both lists, p1=0, p2=0
 *   pick   — compare list1[p1] vs list2[p2], append the smaller, advance its pointer
 *   drain  — one list exhausted; append each remaining node from the other
 *   done   — fully merged
 */

export function buildMergeSortedListsSteps(
  list1 = [1, 2, 4],
  list2 = [1, 3, 4],
) {
  const steps = []

  const nodes1 = list1.map((val, i) => ({ val, id: `l1-${i}` }))
  const nodes2 = list2.map((val, i) => ({ val, id: `l2-${i}` }))

  const merged = []
  let p1 = 0
  let p2 = 0

  steps.push({
    type: 'init',
    list1: [...nodes1],
    list2: [...nodes2],
    merged: [],
    p1,
    p2,
    chosen: null,
    comparison: null,
    drainFrom: null,
    message:
      list1.length === 0 && list2.length === 0
        ? 'Both lists are empty — return null.'
        : `Initialize: dummy head, p1 → list1[0]=${nodes1[0]?.val ?? '—'}, p2 → list2[0]=${nodes2[0]?.val ?? '—'}.`,
  })

  while (p1 < nodes1.length && p2 < nodes2.length) {
    const v1  = nodes1[p1].val
    const v2  = nodes2[p2].val
    const cmp = v1 < v2 ? '<' : v1 > v2 ? '>' : '='

    const prevP1 = p1
    const prevP2 = p2

    if (v1 <= v2) {
      merged.push({ ...nodes1[p1], fromList: 1 })
      p1++
      steps.push({
        type: 'pick',
        list1: [...nodes1],
        list2: [...nodes2],
        merged: [...merged],
        p1,
        p2,
        chosen: 1,
        comparison: cmp,
        drainFrom: null,
        message: `list1[${prevP1}]=${v1} ${cmp} list2[${prevP2}]=${v2} → pick ${v1} from list1, advance p1.`,
      })
    } else {
      merged.push({ ...nodes2[p2], fromList: 2 })
      p2++
      steps.push({
        type: 'pick',
        list1: [...nodes1],
        list2: [...nodes2],
        merged: [...merged],
        p1,
        p2,
        chosen: 2,
        comparison: cmp,
        drainFrom: null,
        message: `list1[${prevP1}]=${v1} ${cmp} list2[${prevP2}]=${v2} → pick ${v2} from list2, advance p2.`,
      })
    }
  }

  // Drain list1 remainder
  while (p1 < nodes1.length) {
    const prevP1 = p1
    merged.push({ ...nodes1[p1], fromList: 1 })
    p1++
    steps.push({
      type: 'drain',
      list1: [...nodes1],
      list2: [...nodes2],
      merged: [...merged],
      p1,
      p2,
      chosen: null,
      comparison: null,
      drainFrom: 1,
      message: `list2 exhausted — append list1[${prevP1}]=${nodes1[prevP1].val} to merged.`,
    })
  }

  // Drain list2 remainder
  while (p2 < nodes2.length) {
    const prevP2 = p2
    merged.push({ ...nodes2[p2], fromList: 2 })
    p2++
    steps.push({
      type: 'drain',
      list1: [...nodes1],
      list2: [...nodes2],
      merged: [...merged],
      p1,
      p2,
      chosen: null,
      comparison: null,
      drainFrom: 2,
      message: `list1 exhausted — append list2[${prevP2}]=${nodes2[prevP2].val} to merged.`,
    })
  }

  steps.push({
    type: 'done',
    list1: [...nodes1],
    list2: [...nodes2],
    merged: [...merged],
    p1,
    p2,
    chosen: null,
    comparison: null,
    drainFrom: null,
    message: `Done! Merged: [${merged.map((n) => n.val).join(', ')}]`,
  })

  return steps
}
