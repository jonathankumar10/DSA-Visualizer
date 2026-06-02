export default {
  id:          'sql',
  type:        'concept',
  title:       'SQL',
  category:    'storage',
  tags:        ['sql', 'databases', 'acid', 'indexing', 'transactions', 'relational', 'b-tree'],
  description: 'Relational databases and SQL — ACID transactions, B-tree indexes, normalisation, and when SQL is the right persistence layer for your system.',
  metaphor:    'A perfectly organised filing cabinet — every document has a defined type (schema), cross-referenced with other files (foreign keys). With the right index you can find any document in milliseconds across millions of files.',
  path:        '/system-design/sql',
  keyPoints: [
    'ACID guarantees Atomicity, Consistency, Isolation, and Durability — the gold standard for financial systems',
    'B-tree indexes turn O(n) full-table scans into O(log n) lookups',
    'Normalisation eliminates data duplication — at the cost of JOIN complexity',
    'SQL databases excel at vertical scaling; horizontal sharding is complex but achievable',
    'Use SQL when you need complex queries, transactions, or strong consistency guarantees',
  ],
}
