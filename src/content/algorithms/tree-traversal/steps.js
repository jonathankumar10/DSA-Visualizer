export function buildTraversalSteps(tree, order) {
  const steps = []
  const visited = []

  function traverse(node, nodeId) {
    if (!node) return

    if (order === 'preorder') {
      visited.push(nodeId)
      steps.push({
        visited: [...visited],
        current: nodeId,
        message: `[Preorder] Visit node ${node.val} → then left → then right.`,
      })
    }

    traverse(node.left, `${nodeId}L`)

    if (order === 'inorder') {
      visited.push(nodeId)
      steps.push({
        visited: [...visited],
        current: nodeId,
        message: `[Inorder] Left done → Visit node ${node.val} → now right.`,
      })
    }

    traverse(node.right, `${nodeId}R`)

    if (order === 'postorder') {
      visited.push(nodeId)
      steps.push({
        visited: [...visited],
        current: nodeId,
        message: `[Postorder] Left done, Right done → Visit node ${node.val}.`,
      })
    }
  }

  steps.push({
    visited: [],
    current: null,
    message: `Starting ${order} traversal. Watch the tree light up.`,
  })

  traverse(tree, 'root')

  steps.push({
    visited: [...visited],
    current: null,
    message: `${order.charAt(0).toUpperCase() + order.slice(1)} traversal complete. Order: ${visited.map((id) => getNodeVal(tree, id)).join(' → ')}.`,
  })

  return steps
}

function getNodeVal(tree, nodeId) {
  const parts = nodeId.replace('root', '').split('')
  let cur = tree
  for (const dir of parts) {
    if (!cur) return '?'
    cur = dir === 'L' ? cur.left : cur.right
  }
  return cur?.val ?? '?'
}

export const DEFAULT_TREE = {
  val: 4,
  left: {
    val: 2,
    left:  { val: 1, left: null, right: null },
    right: { val: 3, left: null, right: null },
  },
  right: {
    val: 6,
    left:  { val: 5, left: null, right: null },
    right: { val: 7, left: null, right: null },
  },
}
