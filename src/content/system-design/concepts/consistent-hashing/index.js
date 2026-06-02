export default {
  id:          'consistent-hashing',
  type:        'concept',
  title:       'Consistent Hashing',
  category:    'proxies',
  tags:        ['consistent-hashing', 'distributed', 'sharding', 'cache', 'ring', 'hash', 'rebalancing'],
  description: 'A hash distribution technique that minimises data movement when servers are added or removed — the foundation of horizontally scalable caches and distributed databases.',
  metaphor:    'A circular clock face where servers and keys share positions. When a server is removed, only the keys "just behind" it need to move to the next server — not the entire keyspace.',
  path:        '/system-design/consistent-hashing',
  keyPoints: [
    'Regular hashing (key % N) remaps nearly all keys when N changes — unusable for live systems',
    'Consistent hashing places servers and keys on a ring — each key routes to the nearest server clockwise',
    'Adding or removing a server moves only ~1/N of keys on average',
    'Virtual nodes improve distribution uniformity and make rebalancing smoother',
    'Used in Amazon DynamoDB, Apache Cassandra, Memcached clusters, and distributed load balancers',
  ],
}
