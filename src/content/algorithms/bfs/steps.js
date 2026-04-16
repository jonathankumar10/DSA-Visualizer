export function buildBFSSteps(nodes, edges, startId) {
  const steps = []
  const adj = {}
  nodes.forEach((n) => (adj[n.id] = []))
  edges.forEach(({ from, to }) => {
    adj[from].push(to)
    adj[to].push(from)
  })

  const visited = new Set()
  const queue = [startId]
  visited.add(startId)

  steps.push({
    visited: new Set(),
    queue: [startId],
    current: null,
    message: `Starting BFS from district "${nodes.find((n) => n.id === startId)?.label}". Queue: [${startId}].`,
  })

  while (queue.length > 0) {
    const current = queue.shift()

    steps.push({
      visited: new Set(visited),
      queue: [...queue],
      current,
      message: `Visiting district "${nodes.find((n) => n.id === current)?.label}". Exploring roads to neighbors.`,
    })

    for (const neighbor of adj[current]) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor)
        queue.push(neighbor)
        steps.push({
          visited: new Set(visited),
          queue: [...queue],
          current,
          enqueuing: neighbor,
          message: `Discovered district "${nodes.find((n) => n.id === neighbor)?.label}". Added to queue.`,
        })
      }
    }
  }

  steps.push({
    visited: new Set(visited),
    queue: [],
    current: null,
    message: 'BFS complete. All reachable districts have been visited.',
  })

  return steps
}

export const DEFAULT_CITY = {
  nodes: [
    { id: 'A', label: 'City Hall',     x: 300, y: 60  },
    { id: 'B', label: 'Market',        x: 140, y: 170 },
    { id: 'C', label: 'Library',       x: 460, y: 170 },
    { id: 'D', label: 'Park',          x: 60,  y: 310 },
    { id: 'E', label: 'School',        x: 240, y: 310 },
    { id: 'F', label: 'Hospital',      x: 380, y: 310 },
    { id: 'G', label: 'Train Station', x: 540, y: 310 },
    { id: 'H', label: 'Airport',       x: 300, y: 430 },
  ],
  edges: [
    { from: 'A', to: 'B' },
    { from: 'A', to: 'C' },
    { from: 'B', to: 'D' },
    { from: 'B', to: 'E' },
    { from: 'C', to: 'F' },
    { from: 'C', to: 'G' },
    { from: 'E', to: 'H' },
    { from: 'F', to: 'H' },
  ],
}
