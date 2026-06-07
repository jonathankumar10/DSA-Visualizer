export function buildCachingSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      cacheState: 'warm',
      hitResult: null,
      message: 'Caching — the fastest request is one that never reaches the database',
      detail:
        'A cache sits in front of the database. On a cache hit, the server returns data in under a millisecond without touching the DB. Cache invalidation — knowing when to discard stale data — is the hard problem.',
    },
    {
      type: 'cache-hit-1',
      activeNodes: ['server', 'cache'],
      connections: { 'server-cache': 'both' },
      cacheState: 'warm',
      hitResult: 'hit',
      message: 'Cache HIT — data returned in ~1 ms, database not touched',
      detail:
        'The server queries the cache first. The key exists and is within its TTL — a cache hit. The cached value is returned immediately. The database sees zero queries for this request.',
    },
    {
      type: 'cache-hit-2',
      activeNodes: ['server', 'cache'],
      connections: { 'server-cache': 'both' },
      cacheState: 'warm',
      hitResult: 'hit',
      message: 'Hit again — a 99% hit rate means the DB sees 1% of traffic',
      detail:
        'With a high hit rate the majority of reads never touch the database. Absorbing 99% of reads at the cache means 100× less database load — often the single biggest scaling lever in a production system.',
    },
    {
      type: 'cache-miss',
      activeNodes: ['server', 'cache'],
      connections: { 'server-cache': 'miss' },
      cacheState: 'warm',
      hitResult: 'miss',
      message: 'Cache MISS — key not found (cold cache or TTL expired)',
      detail:
        "The cache doesn't have this key — either it was never stored, its TTL expired, or it was evicted under memory pressure. The server must fall back to the database.",
    },
    {
      type: 'db-query',
      activeNodes: ['server', 'cache', 'db'],
      connections: { 'server-cache': 'miss', 'server-db': 'both' },
      cacheState: 'warm',
      hitResult: 'miss',
      message: 'Cache miss → query the database (~10 ms)',
      detail:
        'The server queries the database. A DB read is ~10× slower than a cache hit — network round trip, disk I/O, query execution. The result must now be stored in the cache to avoid repeating this on the next request.',
    },
    {
      type: 'populate',
      activeNodes: ['server', 'cache', 'db'],
      connections: { 'server-cache': 'write', 'server-db': 'response' },
      cacheState: 'warm',
      hitResult: null,
      message: 'Populate cache — write result with a TTL (lazy-loading pattern)',
      detail:
        'The DB result is stored in the cache with a TTL. The next identical request is a cache hit. This is the look-aside / lazy-loading pattern: populate the cache only on a miss, never eagerly.',
    },
    {
      type: 'ttl-expiry',
      activeNodes: ['cache'],
      connections: {},
      cacheState: 'expired',
      hitResult: null,
      message: 'TTL expires — stale entries are evicted automatically',
      detail:
        'After the TTL elapses the cache evicts the entry. Short TTLs keep data fresh at the cost of more DB hits. Long TTLs reduce DB load but risk serving stale data. Tune TTL for your consistency requirements.',
    },
    {
      type: 'write-through',
      activeNodes: ['server', 'cache', 'db'],
      connections: { 'server-cache': 'write', 'server-db': 'write' },
      cacheState: 'warm',
      hitResult: null,
      message: 'Write-through: update cache and DB together on every write',
      detail:
        'Write-through keeps cache and DB in sync on writes — no stale reads after a write. Trade-off: every write is two round trips. Write-back (update cache only, flush to DB later) is faster but risks data loss on a crash.',
    },
    {
      type: 'eviction',
      activeNodes: ['cache'],
      connections: {},
      cacheState: 'evicting',
      hitResult: null,
      message: 'LRU eviction — least-recently-used entries dropped when memory is full',
      detail:
        'When the cache is full, new entries displace the least-recently-used ones. This keeps the hottest data in memory. Redis supports LRU, LFU (least frequently used), and FIFO via maxmemory-policy.',
    },
  ]
}
