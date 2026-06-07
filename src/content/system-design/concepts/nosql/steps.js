export function buildNoSqlSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      dbMode: null,
      message: 'NoSQL — the right data model for the right access pattern',
      detail:
        'NoSQL databases store data in formats other than relational tables — documents, key-value pairs, wide columns, or graphs. Each model is optimised for a specific access pattern that SQL handles poorly at scale.',
    },
    {
      type: 'schema-less',
      activeNodes: ['client', 'nosql'],
      connections: { 'client-nosql': 'request' },
      dbMode: 'document',
      message: 'Document store — schema-less JSON documents, no migrations required',
      detail:
        'MongoDB and Firestore store each record as a self-contained JSON document. Fields can vary between documents — user A has a "company" field, user B does not. No ALTER TABLE required. Ideal for content, user profiles, and catalogs with evolving schemas.',
    },
    {
      type: 'horizontal-scaling',
      activeNodes: ['nosql', 'node-1', 'node-2', 'node-3'],
      connections: {
        'nosql-node-1': 'request',
        'nosql-node-2': 'request',
        'nosql-node-3': 'request',
      },
      dbMode: 'document',
      message: 'Horizontal scaling — add nodes, capacity grows linearly',
      detail:
        'NoSQL databases shard data across nodes natively. Adding a node increases storage and write throughput proportionally. MongoDB auto-balances chunks; Cassandra uses a consistent hash ring. SQL sharding requires significant custom engineering to achieve the same.',
    },
    {
      type: 'denormalization',
      activeNodes: ['client', 'nosql'],
      connections: { 'client-nosql': 'both' },
      dbMode: 'document',
      message: 'Denormalized data — embed related data to eliminate JOINs',
      detail:
        'SQL normalises: orders and users are separate tables joined at query time. NoSQL embeds: the user document contains their last 10 orders inline. One read returns everything. Trade-off: data duplication on writes. Optimise for your dominant read pattern.',
    },
    {
      type: 'eventual-consistency',
      activeNodes: ['nosql', 'node-1', 'node-2', 'node-3'],
      connections: {
        'nosql-node-1': 'response',
        'nosql-node-2': 'response',
        'nosql-node-3': 'response',
      },
      dbMode: 'eventual',
      message: 'Eventual consistency — writes propagate to all replicas with a small delay',
      detail:
        'After a write, different replicas may return different values for a few milliseconds. Under the CAP theorem, NoSQL typically favours Availability + Partition tolerance over Consistency. Acceptable for social feeds and analytics; dangerous for bank balances or inventory.',
    },
    {
      type: 'base-vs-acid',
      activeNodes: ['client', 'nosql'],
      connections: { 'client-nosql': 'both' },
      dbMode: 'base',
      message: 'BASE vs ACID — NoSQL trades strict consistency for availability',
      detail:
        'SQL databases are ACID (Atomic, Consistent, Isolated, Durable). NoSQL databases are BASE: Basically Available (always respond), Soft state (data may change over time), Eventually consistent (converges to truth). DynamoDB\'s "eventually consistent reads" are cheaper; "strongly consistent reads" cost 2× but are always up to date.',
    },
    {
      type: 'use-cases',
      activeNodes: ['client', 'nosql', 'node-1', 'node-2', 'node-3'],
      connections: {
        'client-nosql': 'both',
        'nosql-node-1': 'response',
        'nosql-node-2': 'response',
        'nosql-node-3': 'response',
      },
      dbMode: 'document',
      message: 'When to choose NoSQL — access pattern drives the decision',
      detail:
        'Choose key-value (Redis, DynamoDB) for O(1) session and cache lookups. Choose document (MongoDB, Firestore) for flexible schemas and embedded-entity reads. Choose wide-column (Cassandra) for write-heavy time-series. Use SQL for relational, transactional data. Most production systems use both.',
    },
  ]
}
