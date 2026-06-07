export function buildConsistentHashingSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      activeKeys: [],
      connections: {},
      highlightedRing: false,
      message: 'Consistent Hashing — minimising data movement when servers change',
      detail:
        'Naive modulo hashing (key % N) remaps ~all keys when a server is added or removed. Consistent hashing places both servers and keys on a virtual ring so only ~1/N of keys move on any topology change.',
    },
    {
      type: 'ring-intro',
      activeNodes: ['server-a', 'server-b', 'server-c', 'server-d'],
      activeKeys: [],
      connections: {},
      highlightedRing: true,
      message: 'Servers placed on the ring via a hash of their name/address',
      detail:
        'Each server is hashed to a position on the 0–2³² ring. The ring is continuous — position 2³²-1 wraps back to 0. Four servers occupy four positions spread roughly around the ring.',
    },
    {
      type: 'key-mapping',
      activeNodes: ['server-a', 'server-b', 'server-c'],
      activeKeys: ['key-1', 'key-2', 'key-3'],
      connections: { 'key-1': 'a', 'key-2': 'b', 'key-3': 'c' },
      highlightedRing: true,
      message: 'Keys map to the first server clockwise on the ring',
      detail:
        'A key is hashed to a ring position, then we walk clockwise until we hit a server — that server owns the key. "user:42" hashes to a position between Server B and Server C, so Server C owns it.',
    },
    {
      type: 'add-server',
      activeNodes: ['server-a', 'server-b', 'server-c', 'server-d', 'server-e'],
      activeKeys: ['key-1', 'key-2', 'key-3'],
      connections: { 'key-1': 'a', 'key-2': 'e', 'key-3': 'c' },
      highlightedRing: true,
      message: 'Adding Server E — only keys between D and E move',
      detail:
        'Server E is inserted between D and B on the ring. Only keys that previously resolved to B but now sit between D and E are remapped to E. All other keys are unaffected — ~1/N of keys move instead of all of them.',
    },
    {
      type: 'remove-server',
      activeNodes: ['server-a', 'server-b', 'server-c', 'server-d'],
      activeKeys: ['key-1', 'key-2', 'key-3'],
      connections: { 'key-1': 'a', 'key-2': 'b', 'key-3': 'c' },
      highlightedRing: true,
      message: 'Removing a server — only its keys rehome to the next server clockwise',
      detail:
        'When Server E is removed, only the keys it owned are rehomed to the next clockwise server (B). Every other server keeps its existing keys. This is why CDNs and Cassandra use consistent hashing for cache and shard assignment.',
    },
    {
      type: 'skewed-ring',
      activeNodes: ['server-a', 'server-b', 'server-c', 'server-d'],
      activeKeys: ['key-1', 'key-2', 'key-3'],
      connections: { 'key-1': 'a', 'key-2': 'b', 'key-3': 'b' },
      highlightedRing: true,
      message: 'Problem: uneven ring positions create load hotspots',
      detail:
        'With only a few servers the ring positions may cluster. One server may own 40% of the ring while another owns only 10%, creating a write hotspot. Virtual nodes solve this by giving each physical server multiple ring positions.',
    },
    {
      type: 'virtual-nodes',
      activeNodes: ['server-a', 'server-b', 'server-c', 'server-d'],
      activeKeys: ['key-1', 'key-2', 'key-3'],
      connections: { 'key-1': 'a', 'key-2': 'b', 'key-3': 'c' },
      highlightedRing: true,
      vnodes: true,
      message: 'Virtual nodes (vnodes) — each server owns multiple ring positions',
      detail:
        'Hash each physical server N times (e.g., "ServerA#0", "ServerA#1"…"ServerA#150") to create 150 virtual ring positions per physical server. Load distributes smoothly and a failing server\'s keys spread across all remaining servers proportionally.',
    },
    {
      type: 'real-world',
      activeNodes: ['server-a', 'server-b', 'server-c', 'server-d'],
      activeKeys: ['key-1', 'key-2', 'key-3'],
      connections: { 'key-1': 'a', 'key-2': 'b', 'key-3': 'c' },
      highlightedRing: false,
      message: 'Real-world usage: Cassandra, DynamoDB, Memcached, load balancers',
      detail:
        'Apache Cassandra uses a consistent hash ring as its primary data distribution mechanism. Amazon DynamoDB partitions data the same way. Memcached client libraries implement consistent hashing for cache node assignment. It is the standard algorithm for distributing load in large-scale horizontally sharded systems.',
    },
  ]
}
