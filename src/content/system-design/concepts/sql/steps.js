export function buildSqlSteps() {
  return [
    {
      type:        'intro',
      activeNodes: [],
      connections: {},
      message:     'SQL: structured data, schemas, and ACID guarantees',
      detail:      'Relational databases organise data into tables with defined columns and types. Every row in a table conforms to the schema. Relationships between tables are expressed as foreign keys — a pointer from one row to another. SQL is the query language that traverses these relationships.',
    },
    {
      type:        'relational-model',
      activeNodes: ['client', 'db'],
      connections: { 'client-db': 'request' },
      message:     'Relational model — tables connected by foreign keys',
      detail:      'A Users table and an Orders table share a user_id foreign key. This normalised design stores each piece of data once: changing a user\'s email updates one row in one table, not many. The relational model is the foundation of 50+ years of database theory.',
    },
    {
      type:        'simple-select',
      activeNodes: ['client', 'db', 'index'],
      connections: { 'client-db': 'request', 'db-index': 'request' },
      message:     'SELECT query — reads rows matching a WHERE clause',
      detail:      'SELECT * FROM orders WHERE user_id = 42. Without an index, the database performs a full table scan — O(n). With a B-tree index on user_id, it navigates to the matching rows in O(log n). At millions of rows, the difference is milliseconds vs. seconds.',
    },
    {
      type:        'join-query',
      activeNodes: ['client', 'db', 'index'],
      connections: { 'client-db': 'both', 'db-index': 'both' },
      message:     'JOIN — combine rows from multiple tables in one query',
      detail:      'SELECT u.name, o.total FROM users u JOIN orders o ON u.id = o.user_id. The query planner uses statistics to choose the cheapest join strategy (hash join, nested loop, merge join). JOINs are powerful but expensive at scale — a major reason to denormalise or cache query results.',
    },
    {
      type:        'index-scan',
      activeNodes: ['db', 'index'],
      connections: { 'db-index': 'both' },
      message:     'B-tree index — O(log n) lookup instead of O(n) table scan',
      detail:      'A B-tree index stores column values in sorted order as a balanced tree. Each lookup traverses ~log₂(n) nodes. A table with 10 million rows needs ~23 comparisons to find any row by indexed column. Composite indexes (a, b) support ORDER BY and WHERE on both columns. Index too many columns and write performance degrades.',
    },
    {
      type:        'transaction',
      activeNodes: ['client', 'db'],
      connections: { 'client-db': 'both' },
      transactionState: 'active',
      message:     'Transaction: BEGIN → multiple statements → COMMIT or ROLLBACK',
      detail:      'BEGIN TRANSACTION groups multiple SQL statements into one atomic unit. Either all statements commit or none do. Critical for financial operations: debit one account and credit another in one transaction. If the server crashes mid-way, the database rolls back automatically.',
    },
    {
      type:        'acid',
      activeNodes: ['db'],
      connections: {},
      transactionState: 'committed',
      message:     'ACID: Atomicity, Consistency, Isolation, Durability',
      detail:      'Atomicity — all or nothing. Consistency — every transaction moves data from one valid state to another. Isolation — concurrent transactions don\'t see each other\'s partial writes (configurable via isolation levels). Durability — committed data survives crashes via WAL (Write-Ahead Log) flushed to disk.',
    },
    {
      type:        'normalization',
      activeNodes: ['client', 'db', 'index'],
      connections: { 'client-db': 'request', 'db-index': 'request' },
      message:     'Normalisation reduces duplication — denormalisation reduces JOINs',
      detail:      '3NF normalisation eliminates repeating groups and transitive dependencies. Each fact lives in exactly one place — no anomalies on update or delete. Denormalisation deliberately duplicates data to avoid expensive JOINs at read time. Interview trade-off: normalise for write-heavy or OLTP workloads; denormalise for read-heavy or analytical workloads.',
    },
    {
      type:        'scaling',
      activeNodes: ['client', 'db', 'index'],
      connections: { 'client-db': 'both', 'db-index': 'request' },
      message:     'Scaling SQL — read replicas, connection pooling, sharding',
      detail:      'SQL scales vertically first: more CPU, RAM, faster disk. Read replicas handle read traffic (async replication). Connection pooling (PgBouncer) reduces overhead for thousands of short-lived connections. Horizontal sharding partitions data across nodes — complex, breaks JOINs across shards, but necessary at extreme scale (Vitess, Citus).',
    },
  ]
}
