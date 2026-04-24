/**
 * Builds the step trace for Reverse Linked List (LeetCode #206).
 *
 * Step types (two sub-steps per node for maximum clarity):
 *   init       — original list; prev=null, curr=head
 *   save-next  — highlight the curr→next link before it gets severed
 *   flip       — curr.next now points to prev; the link is reversed
 *   done       — fully reversed; prevId is the new head
 *
 * processedCount: how many nodes have had their link reversed.
 *   0 = none reversed; k = nodes[0..k-1] reversed.
 *   The "break" in the chain is always at gapIndex === processedCount.
 */
export function buildReverseLinkedListSteps(vals = [1, 2, 3, 4, 5]) {
  const steps = []
  const nodes = vals.map((val, i) => ({ val, id: i }))
  const n = nodes.length

  if (n === 0) {
    steps.push({
      type: 'done', nodes: [], prevId: -1, currId: -1, nextId: -1,
      processedCount: 0, message: 'Empty list — return null.',
    })
    return steps
  }

  const head = nodes[0]

  steps.push({
    type: 'init',
    nodes: nodes.map((nd) => ({ ...nd })),
    prevId: -1,
    currId: head.id,
    nextId: n > 1 ? nodes[1].id : -1,
    processedCount: 0,
    message: `Initialize: prev = null, curr = ${head.val}. All links point forward →.`,
  })

  let prevId = -1
  let currId = head.id

  while (currId !== -1) {
    const ci       = nodes.findIndex((nd) => nd.id === currId)
    const currNode = nodes[ci]
    const nextId   = ci + 1 < n ? nodes[ci + 1].id : -1
    const nextNode = nextId !== -1 ? nodes[ci + 1] : null
    const prevNode = prevId !== -1 ? nodes.find((nd) => nd.id === prevId) : null

    const prevLabel = prevNode ? String(prevNode.val) : 'null'
    const nextLabel = nextNode ? String(nextNode.val) : 'null'

    // Sub-step A: save curr.next before severing it
    steps.push({
      type: 'save-next',
      nodes: nodes.map((nd) => ({ ...nd })),
      prevId,
      currId,
      nextId,
      processedCount: ci,          // NOT yet flipped
      message: `curr = ${currNode.val}: save next = ${nextLabel}. About to redirect curr.next away from next.`,
    })

    // Sub-step B: flip curr.next = prev — the link is now reversed
    steps.push({
      type: 'flip',
      nodes: nodes.map((nd) => ({ ...nd })),
      prevId,
      currId,
      nextId,
      processedCount: ci + 1,     // link at gapIndex ci is now reversed
      message: `Flip! curr.next = ${prevLabel} — arrow between ${prevLabel} and ${currNode.val} now points ←. Advance prev = ${currNode.val}, curr = ${nextLabel}.`,
    })

    prevId = currId
    currId = nextId
  }

  const headNode = nodes.find((nd) => nd.id === prevId)

  steps.push({
    type: 'done',
    nodes: nodes.map((nd) => ({ ...nd })),
    prevId,
    currId: -1,
    nextId: -1,
    processedCount: n,
    message: `Done! Every link reversed. New head = ${headNode?.val}. Return prev.`,
  })

  return steps
}
