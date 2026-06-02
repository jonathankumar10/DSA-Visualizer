export default {
  id:          'caching',
  type:        'concept',
  title:       'Caching',
  category:    'caching',
  tags:        ['caching', 'redis', 'memcached', 'ttl', 'cache-invalidation', 'latency', 'lru'],
  description: 'How storing frequently accessed data closer to the requester eliminates redundant computation and dramatically reduces latency at every layer of the stack.',
  metaphor:    'Memorising the answer to a question you get asked constantly — instead of re-reading the textbook every time, you keep the answer at the tip of your tongue. The challenge: knowing when to update your memory.',
  path:        '/system-design/caching',
  keyPoints: [
    'Cache hit ratio is the key metric — a 99% hit rate means 100× less database load',
    'TTL (Time To Live) controls how long cached data stays valid before expiring',
    'Cache invalidation is the hard problem — stale data can be worse than no cache at all',
    'Write-through caches update cache and DB together; write-back caches defer DB writes (faster, risk of data loss)',
    'LRU (Least Recently Used) eviction keeps the hottest data in memory when the cache is full',
  ],
}
