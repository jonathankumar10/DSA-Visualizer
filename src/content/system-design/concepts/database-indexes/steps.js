export function buildDatabaseIndexesSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      queryType: null,
      message: 'Database Indexes — from O(n) scans to O(log n) lookups',
      detail:
        'Without an index every query scans every row in the table sequentially. With a B-tree index on the right column the query jumps directly to matching rows. The trade-off: indexes speed up reads but slow down every write.',
    },
    {
      type: 'full-scan',
      activeNodes: ['table', 'disk'],
      connections: { 'table-disk': 'both' },
      queryType: 'scan',
      message: 'Full table scan — O(n) — reads every row from disk',
      detail:
        'SELECT * FROM users WHERE email = \'alice@example.com\' with no index reads all 10 million rows. PostgreSQL estimates ~150 ms on a table that fits in memory; far longer if rows are spread across disk pages. Avoid full scans on large tables in production.',
    },
    {
      type: 'create-index',
      activeNodes: ['table', 'btree', 'disk'],
      connections: { 'table-btree': 'request', 'table-disk': 'request' },
      queryType: 'create',
      message: 'CREATE INDEX — build a B-tree over the target column',
      detail:
        'The database reads all rows once, sorts the indexed column values, and builds a balanced B-tree. Each leaf node stores the column value and a pointer (ctid / rowid) to the heap row on disk. On a 10M row table this takes seconds — and consumes ~10–30% of the table size in storage.',
    },
    {
      type: 'indexed-query',
      activeNodes: ['btree', 'disk'],
      connections: { 'table-btree': 'both', 'btree-disk': 'both' },
      queryType: 'indexed',
      message: 'Indexed query — O(log n) — traverse tree, fetch row pointer',
      detail:
        'The query planner sees the index, traverses ~24 levels of the B-tree to find the matching email, reads the ctid pointer, then fetches only that row from the heap. 10M row table: ~0.1 ms instead of 150 ms. This is why index creation is the highest-leverage DB performance action.',
    },
    {
      type: 'range-scan',
      activeNodes: ['btree', 'disk'],
      connections: { 'table-btree': 'both', 'btree-disk': 'both' },
      queryType: 'range',
      message: 'Range scan — B-trees support WHERE age BETWEEN 20 AND 30',
      detail:
        'B-tree leaf nodes are stored in sorted order and linked as a doubly-linked list. A range query traverses to the lower bound, then walks the leaf list rightward to the upper bound — no need to re-traverse from the root. Hash indexes cannot do this.',
    },
    {
      type: 'composite-index',
      activeNodes: ['btree', 'table'],
      connections: { 'table-btree': 'both' },
      queryType: 'composite',
      message: 'Composite index — (last_name, first_name) covers two columns',
      detail:
        'An index on (last_name, first_name) helps queries filtering on last_name alone or on both columns, but NOT first_name alone. The leftmost-prefix rule: the planner can only use the index from the leftmost column. Put the highest-selectivity column first.',
    },
    {
      type: 'write-overhead',
      activeNodes: ['table', 'btree', 'disk'],
      connections: { 'table-btree': 'request', 'table-disk': 'request' },
      queryType: 'write',
      message: 'Write overhead — every INSERT/UPDATE/DELETE must update each index',
      detail:
        'A table with 10 indexes incurs 11 writes on every insert: 1 heap row + 10 index entries. On write-heavy workloads this causes write amplification. Always benchmark: an unused index is strictly harmful — drop it.',
    },
    {
      type: 'covering-index',
      activeNodes: ['btree'],
      connections: { 'table-btree': 'both' },
      queryType: 'covering',
      message: 'Covering index — query answered from the index alone, no heap access',
      detail:
        'CREATE INDEX ON orders(user_id) INCLUDE (total, created_at). A query SELECT total, created_at FROM orders WHERE user_id = 42 reads only the index pages — the heap (disk) is never touched. Called an "index-only scan" in PostgreSQL. Maximum read performance.',
    },
  ]
}
