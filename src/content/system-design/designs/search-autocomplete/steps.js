/**
 * Search Autocomplete — full system design step trace.
 *
 * Node IDs: user | frontend | cache | autocomplete | trie | ranking | pipeline
 *
 * Layout:
 *   user → frontend → cache (above) → autocomplete → trie → ranking
 *   pipeline (bottom) → trie (offline updates)
 *
 * Step shape:
 *   type         — identifier string
 *   activeNodes  — node IDs to highlight
 *   connections  — edge ID → direction string
 *   message      — short label shown in the panel
 *   detail       — 1–2 interview-prep sentences
 */
export function buildSearchAutocompleteSteps() {
  return [
    {
      type:        'init',
      activeNodes: [],
      connections: {},
      message:     'Meet the search autocomplete system',
      detail:      'A typeahead system returns the top 5–10 query completions for each prefix the user types with sub-100ms response time. The key insight: suggestions must be pre-computed offline — sorting at query time is too slow at thousands of requests per second.',
    },
    {
      type:        'user-types',
      activeNodes: ['user', 'frontend'],
      connections: {},
      message:     'User starts typing "te…"',
      detail:      'Every keystroke is a potential query, but firing a network request on each character would flood the backend. The frontend debounces input: it waits 150–300ms after the last keystroke before sending a suggestion request. A 150ms debounce cuts query volume by ~50% while being imperceptible to the user.',
    },
    {
      type:        'debounce-request',
      activeNodes: ['frontend', 'cache'],
      connections: { 'frontend-cache': 'request' },
      message:     'Debounced request fires — check Redis cache first',
      detail:      'After the debounce delay, the frontend sends GET /autocomplete?q=te to the backend. The first stop is a Redis cache holding the top 1,000 most popular prefixes. These cover the vast majority of traffic — popular prefixes like "te", "the", "to" account for a disproportionate share of all keystrokes.',
    },
    {
      type:        'cache-hit',
      activeNodes: ['frontend', 'cache'],
      connections: { 'frontend-cache': 'both' },
      message:     'Cache HIT — top suggestions returned instantly',
      detail:      'For a popular prefix like "te", Redis returns the pre-ranked top-5 list in under 1ms. The frontend cancels any in-flight request for the previous prefix and renders the new suggestions. Browser-side LRU cache stores results for prefixes typed in the current session, making back-navigation instant.',
    },
    {
      type:        'cache-miss',
      activeNodes: ['frontend', 'cache', 'autocomplete'],
      connections: { 'frontend-cache': 'request', 'cache-autocomplete': 'request' },
      message:     'Cache MISS — request forwarded to Autocomplete Service',
      detail:      'For a rare or novel prefix, the cache misses and the request is forwarded to the Autocomplete Service. Cache miss rate is typically under 5% — the service only ever sees the cold long tail. This tiered approach keeps the Redis instance small and the trie service appropriately sized.',
    },
    {
      type:        'trie-lookup',
      activeNodes: ['autocomplete', 'trie'],
      connections: { 'autocomplete-trie': 'both' },
      message:     'Trie lookup — O(prefix_length) traversal',
      detail:      'The Autocomplete Service queries the Trie. Each path from root to node represents a prefix; each node stores the pre-computed top-K suggestions for that prefix. Lookup is O(prefix_length) — traversing "te" requires exactly 2 hops regardless of how many words the trie contains. No sorting at query time.',
    },
    {
      type:        'ranking',
      activeNodes: ['trie', 'ranking'],
      connections: { 'trie-ranking': 'both' },
      message:     'Ranking Service scores and orders completions',
      detail:      'The Ranking Service blends global popularity with recency signals — a query that surged in the last hour (breaking news) outranks a historically popular query that has gone cold. Optionally, per-user query history from a Personalization Service is blended here, adding at most 10ms to the response.',
    },
    {
      type:        'response-returned',
      activeNodes: ['ranking', 'autocomplete', 'cache', 'frontend', 'user'],
      connections: { 'trie-ranking': 'response', 'cache-autocomplete': 'response', 'frontend-cache': 'response' },
      message:     'Top 5 suggestions returned to the user',
      detail:      'The ranked list flows back through the Autocomplete Service, is written to the Redis cache with a short TTL (minutes), and rendered in the search dropdown. The total round-trip for a cache miss is typically 20–50ms — well within the 100ms target where users perceive responses as instant.',
    },
    {
      type:        'pipeline-update',
      activeNodes: ['pipeline', 'trie'],
      connections: { 'pipeline-trie': 'request' },
      message:     'Offline pipeline refreshes the Trie with new rankings',
      detail:      'A MapReduce or Spark job runs hourly, aggregating search logs to recompute query frequencies and top-K lists. It builds a new trie in a staging environment and atomically swaps traffic to it. Never mutate a live trie during query serving — partial updates corrupt top-K lists mid-query.',
    },
    {
      type:        'full-system',
      activeNodes: ['user', 'frontend', 'cache', 'autocomplete', 'trie', 'ranking', 'pipeline'],
      connections: {
        'frontend-cache':      'both',
        'cache-autocomplete':  'both',
        'autocomplete-trie':   'both',
        'trie-ranking':        'both',
        'pipeline-trie':       'request',
      },
      message:     'Full system — read path, cache, and offline pipeline together',
      detail:      'The read path (user → cache → trie → ranking) handles millisecond-latency suggestions. The write path (search logs → pipeline → trie swap) refreshes rankings without touching the live serving path. The separation of read and write is the architectural key: the live trie is read-only.',
    },
  ]
}
