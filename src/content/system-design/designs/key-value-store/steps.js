/**
 * Steps for the Key-Value Store design.
 *
 * Story arc:
 *   1. Overview — what we're building
 *   2. Consistent hashing — how keys map to nodes
 *   3. PUT request — write to primary node
 *   4. Replication — write to N nodes
 *   5. Quorum — W + R > N guarantees overlap
 *   6. GET request — read with quorum
 *   7. Gossip protocol — failure detection
 *   8. Sloppy quorum + hinted handoff on node failure
 *   9. Vector clocks — conflict resolution
 *   10. Full system — read repair and anti-entropy
 *
 * Node IDs: client | coordinator | nodeA | nodeB | nodeC | ring
 */
export function buildKeyValueStoreSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Meet the Distributed Key-Value Store',
      detail: 'A distributed key-value store (think DynamoDB or Cassandra) must serve reads and writes across many nodes with no single point of failure. The key challenge: any node can fail at any time, yet the system must remain available and consistent enough for the application.',
    },
    {
      type: 'consistent-hashing',
      activeNodes: ['ring', 'nodeA', 'nodeB', 'nodeC'],
      connections: {},
      message: 'Consistent hashing — mapping keys to nodes',
      detail: 'All nodes are placed on a virtual hash ring. A key is hashed to a point on the ring; the key is owned by the first node clockwise from that point. When a node is added or removed, only keys between the new node and its predecessor are remapped — not the entire keyspace. Virtual nodes (vnodes) spread each physical node across multiple ring positions for even load distribution.',
    },
    {
      type: 'put-request',
      activeNodes: ['client', 'coordinator'],
      connections: { 'client-coordinator': 'request' },
      message: 'PUT(key, value) — client sends write to coordinator',
      detail: 'The client sends PUT("user:1234", {...}) to any node (the coordinator). The coordinator hashes the key to find the primary node on the ring. The coordinator is not a special role — any node can be coordinator for a given request. This is why Dynamo-style stores have no single leader.',
    },
    {
      type: 'write-primary',
      activeNodes: ['coordinator', 'nodeA'],
      connections: { 'coordinator-nodeA': 'request' },
      message: 'Write routed to primary node on the ring',
      detail: 'The coordinator routes the write to the node that owns this key range. The primary node writes to its local storage (an LSM tree or B-tree). The write is acknowledged as durable once it hits the write-ahead log (WAL), before the memtable is flushed — fast, sequential I/O.',
    },
    {
      type: 'replication',
      activeNodes: ['nodeA', 'nodeB', 'nodeC'],
      connections: { 'nodeA-nodeB': 'request', 'nodeA-nodeC': 'request' },
      message: 'Replication — write propagated to N nodes',
      detail: 'The primary node (A) replicates the write to the next N−1 nodes clockwise (B, C). With N=3, any single node failure leaves 2 replicas alive. Replication is asynchronous by default — the coordinator does not wait for all replicas before responding. This is the source of eventual consistency.',
    },
    {
      type: 'quorum-write',
      activeNodes: ['coordinator', 'nodeA', 'nodeB', 'nodeC'],
      connections: { 'coordinator-nodeA': 'request', 'coordinator-nodeB': 'request', 'coordinator-nodeC': 'response' },
      message: 'Quorum write: wait for W acknowledgements',
      detail: 'With N=3, W=2: the coordinator sends the write to all 3 nodes but waits for only 2 acknowledgements before returning success. The third replica will catch up asynchronously. W=2 means one node can be slow or unreachable without blocking the write. Trade-off: set W=N for strong durability at the cost of availability.',
    },
    {
      type: 'get-request',
      activeNodes: ['client', 'coordinator'],
      connections: { 'client-coordinator': 'request' },
      message: 'GET(key) — read with quorum',
      detail: 'The client sends GET("user:1234") to any coordinator node. The coordinator fans out the read to all N replicas and waits for R responses. With R=2, W=2, N=3: W+R=4 > N=3, so the write set and read set must overlap by at least one node — guaranteeing the latest write is visible.',
    },
    {
      type: 'quorum-read',
      activeNodes: ['coordinator', 'nodeA', 'nodeB', 'nodeC'],
      connections: { 'coordinator-nodeA': 'request', 'coordinator-nodeB': 'request', 'nodeA-coordinator': 'response', 'nodeB-coordinator': 'response' },
      message: 'Read returns latest version from quorum',
      detail: 'Coordinator receives R=2 responses and returns the one with the highest version (vector clock or timestamp). If the responses differ, read repair is triggered — the coordinator sends the latest version to any stale replica. This is lazy consistency repair rather than blocking all reads until replicas sync.',
    },
    {
      type: 'gossip',
      activeNodes: ['nodeA', 'nodeB', 'nodeC'],
      connections: { 'nodeA-nodeB': 'both', 'nodeB-nodeC': 'both' },
      message: 'Gossip protocol — node failure detection',
      detail: 'Each node randomly selects a peer every few seconds and exchanges its view of the cluster: which nodes are alive, their heartbeat timestamps, and their ring positions. Cluster membership propagates in O(log N) rounds — no central coordinator to fail. When Node C misses heartbeats for 30 s, Node A and B mark it as suspected failed and route around it.',
    },
    {
      type: 'hinted-handoff',
      activeNodes: ['coordinator', 'nodeA', 'nodeB'],
      connections: { 'coordinator-nodeA': 'request', 'coordinator-nodeB': 'request' },
      message: 'Node C is down — sloppy quorum + hinted handoff',
      detail: 'Node C is unavailable. Rather than fail the write, the coordinator uses a sloppy quorum: it writes to Node A and Node B (the next healthy nodes on the ring) with a hint: "this write belongs to Node C." When C recovers, hinted handoff delivers the buffered writes. This ensures the system remains writable even during partial failures — Dynamo\'s "always writable" design.',
    },
    {
      type: 'vector-clocks',
      activeNodes: ['coordinator', 'nodeA', 'nodeB'],
      connections: { 'nodeA-coordinator': 'response', 'nodeB-coordinator': 'response' },
      message: 'Conflict resolution with vector clocks',
      detail: 'Two concurrent writes (from different clients before syncing) produce divergent versions: Node A has [A:2, B:1] and Node B has [A:1, B:2]. Neither version causally dominates the other — this is a true conflict. The coordinator returns both versions to the client; the client resolves (last-write-wins, or application-level merge) and re-writes. DynamoDB\'s conditional writes prevent this by requiring a known version to update.',
    },
  ]
}
