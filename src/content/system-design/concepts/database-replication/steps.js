export function buildDatabaseReplicationSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      replicaStatus: { 'replica-1': 'synced', 'replica-2': 'synced', 'replica-3': 'synced' },
      mode: null,
      message: 'Database Replication — availability and read scaling through copies',
      detail:
        'Replication keeps identical copies of the database on multiple servers. It solves two problems: fault tolerance (if the primary fails, a replica takes over) and read scaling (route SELECT queries to replicas, reducing primary load).',
    },
    {
      type: 'write-primary',
      activeNodes: ['client', 'primary'],
      connections: { 'client-primary': 'request' },
      replicaStatus: { 'replica-1': 'synced', 'replica-2': 'synced', 'replica-3': 'synced' },
      mode: 'async',
      message: 'Write goes to the primary — all writes route here exclusively',
      detail:
        'In primary-replica replication, writes always go to the single primary. The primary is the authoritative source of truth. Sending writes to a replica directly would cause divergence and conflicts.',
    },
    {
      type: 'wal-write',
      activeNodes: ['primary'],
      connections: {},
      replicaStatus: { 'replica-1': 'synced', 'replica-2': 'synced', 'replica-3': 'synced' },
      mode: 'async',
      message: 'Primary writes to the Write-Ahead Log (WAL) for durability',
      detail:
        'Before acknowledging the write, the primary appends the change to its WAL — a sequential log on disk. Even if the primary crashes mid-write, the WAL lets it recover. The WAL is also the stream that replication sends to replicas.',
    },
    {
      type: 'async-replicate',
      activeNodes: ['primary', 'replica-1', 'replica-2', 'replica-3'],
      connections: {
        'primary-replica-1': 'request',
        'primary-replica-2': 'request',
        'primary-replica-3': 'request',
      },
      replicaStatus: { 'replica-1': 'lagging', 'replica-2': 'lagging', 'replica-3': 'lagging' },
      mode: 'async',
      message: 'Async replication — WAL streamed to replicas in the background',
      detail:
        'The primary acknowledges the write immediately after writing to its own WAL, then streams the WAL to replicas asynchronously. Replicas apply the changes in background. Low write latency, but if the primary crashes before replication completes, the most recent writes are lost.',
    },
    {
      type: 'replica-lag',
      activeNodes: ['replica-1', 'replica-2'],
      connections: { 'primary-replica-1': 'request', 'primary-replica-2': 'request' },
      replicaStatus: { 'replica-1': 'lagging', 'replica-2': 'lagging', 'replica-3': 'synced' },
      mode: 'async',
      message: 'Replication lag — replicas may be milliseconds (or seconds) behind',
      detail:
        'Replication lag is the delay between a write on the primary and its application on a replica. Normally single-digit milliseconds, but spikes under load. A client reading from a lagging replica may not see their own recent write — "read-your-own-writes" consistency breaks.',
    },
    {
      type: 'read-replica',
      activeNodes: ['client', 'replica-3'],
      connections: { 'client-replica-3': 'both' },
      replicaStatus: { 'replica-1': 'lagging', 'replica-2': 'synced', 'replica-3': 'synced' },
      mode: 'async',
      message: 'Read replicas absorb SELECT traffic — offload the primary',
      detail:
        'Route SELECT queries to replicas, writes to the primary. A 1:3 primary-to-replica ratio absorbs ~75% of read traffic. Application code or a read/write splitting proxy (ProxySQL, RDS Proxy) handles the routing.',
    },
    {
      type: 'sync-replication',
      activeNodes: ['client', 'primary', 'replica-1'],
      connections: { 'client-primary': 'both', 'primary-replica-1': 'both' },
      replicaStatus: { 'replica-1': 'synced', 'replica-2': 'synced', 'replica-3': 'synced' },
      mode: 'sync',
      message: 'Synchronous replication — zero data loss, higher write latency',
      detail:
        'The primary waits for at least one replica to confirm the write before acknowledging to the client. Zero data loss on primary failure — but every write incurs an extra network round trip to the replica. PostgreSQL\'s "synchronous_commit = on" enables this mode.',
    },
    {
      type: 'failover',
      activeNodes: ['replica-1', 'replica-2', 'replica-3'],
      connections: {
        'primary-replica-1': 'response',
        'primary-replica-2': 'response',
        'primary-replica-3': 'response',
      },
      replicaStatus: { 'replica-1': 'promoted', 'replica-2': 'synced', 'replica-3': 'synced' },
      mode: 'failover',
      message: 'Failover — most up-to-date replica promoted to new primary',
      detail:
        'An orchestration layer (AWS RDS Multi-AZ, Patroni, MHA) detects the primary failure via health checks, selects the most up-to-date replica, promotes it to primary, and updates DNS. Applications reconnect automatically. Typical RTO: 30–60 seconds.',
    },
  ]
}
