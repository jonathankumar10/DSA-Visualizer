export function buildDatabaseShardingSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      shardLoads: { 'shard-1': 'normal', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Database Sharding — horizontal partitioning across multiple machines',
      detail:
        'A single database machine has hard limits on storage and write throughput. Sharding horizontally partitions the dataset — each shard holds a distinct subset of rows. Together they hold the complete dataset and handle independent write streams.',
    },
    {
      type: 'single-db-overload',
      activeNodes: ['client', 'router', 'shard-1'],
      connections: { 'client-router': 'request', 'router-shard-1': 'both' },
      shardLoads: { 'shard-1': 'overloaded', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Single database overloaded — writes, storage, and connections all maxed out',
      detail:
        'At scale, one machine cannot keep up: storage fills up, CPU saturates from write amplification, and connection limits are hit. Vertical scaling (bigger machine) is expensive and has a ceiling. Sharding distributes both the data and the write load.',
    },
    {
      type: 'shard-key',
      activeNodes: ['router', 'shard-1', 'shard-2', 'shard-3'],
      connections: {
        'router-shard-1': 'request',
        'router-shard-2': 'request',
        'router-shard-3': 'request',
      },
      shardLoads: { 'shard-1': 'normal', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Shard key chosen — routes every row to exactly one shard',
      detail:
        'A shard key (often user_id or tenant_id) determines which shard holds a given row. Hash the key modulo the shard count: user_id % 3 → shard 0, 1, or 2. The shard key must be present in every write and in the WHERE clause of most queries.',
    },
    {
      type: 'write-routing',
      activeNodes: ['client', 'router', 'shard-2'],
      connections: { 'client-router': 'request', 'router-shard-2': 'both' },
      shardLoads: { 'shard-1': 'normal', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Router directs writes to the correct shard by shard key',
      detail:
        'The shard router (or application layer) hashes the shard key and forwards the write to the owning shard. Users 0-999K → Shard 1; 1M-1.99M → Shard 2; 2M+ → Shard 3. Each shard receives ~1/N of total writes.',
    },
    {
      type: 'cross-shard-query',
      activeNodes: ['client', 'router', 'shard-1', 'shard-2', 'shard-3'],
      connections: {
        'client-router': 'both',
        'router-shard-1': 'both',
        'router-shard-2': 'both',
        'router-shard-3': 'both',
      },
      shardLoads: { 'shard-1': 'normal', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Cross-shard query — fan out to all shards, merge in memory (expensive)',
      detail:
        'SELECT SUM(revenue) FROM orders spans all shards — the router fans out the query to each shard and aggregates the partial results. No shard-local index helps; every shard does its own scan. Cross-shard JOINs are similarly expensive. Design schemas to make most queries single-shard.',
    },
    {
      type: 'hot-shard',
      activeNodes: ['client', 'router', 'shard-1'],
      connections: { 'client-router': 'request', 'router-shard-1': 'both' },
      shardLoads: { 'shard-1': 'overloaded', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Hot shard problem — celebrity user drives disproportionate traffic to one shard',
      detail:
        'Hash-based sharding distributes rows evenly but not access. A viral user (user_id = 1) on Shard 1 generates 100× the writes of an average user. Shard 1 becomes a hotspot while 2 and 3 sit idle. Mitigations: sub-shard that user, add a suffix to their key, or move to a time-based shard key.',
    },
    {
      type: 'resharding',
      activeNodes: ['router', 'shard-1', 'shard-2', 'shard-3'],
      connections: {
        'router-shard-1': 'both',
        'router-shard-2': 'both',
        'router-shard-3': 'both',
      },
      shardLoads: { 'shard-1': 'normal', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Resharding — adding shards while the system is live',
      detail:
        'Growing from 3 to 6 shards requires moving ~50% of data to new machines while the system serves traffic. Consistent hashing minimises movement: only keys that map to new shards move, rather than remapping everything. This is an expensive, high-risk operation — plan shard count conservatively at design time.',
    },
    {
      type: 'summary',
      activeNodes: ['client', 'router', 'shard-1', 'shard-2', 'shard-3'],
      connections: {
        'client-router': 'both',
        'router-shard-1': 'response',
        'router-shard-2': 'response',
        'router-shard-3': 'response',
      },
      shardLoads: { 'shard-1': 'normal', 'shard-2': 'normal', 'shard-3': 'normal' },
      message: 'Sharding + replication together — the production pattern',
      detail:
        'Production systems replicate each shard for fault tolerance (3 replicas per shard in Cassandra/DynamoDB). Sharding handles write scale; replication handles fault tolerance and read scale. Together they are the architecture behind every large-scale distributed database.',
    },
  ]
}
