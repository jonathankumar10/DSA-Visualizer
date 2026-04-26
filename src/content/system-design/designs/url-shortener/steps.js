/**
 * URL Shortener architecture step trace.
 *
 * Two phases:
 *   write — user submits a long URL → get a short code back
 *   read  — user visits the short URL → gets redirected to the original
 *
 * Node IDs: client | lb | api | cache | db
 *
 * Layout (vertical stack):
 *   client
 *     ↓
 *   lb  (load balancer)
 *     ↓
 *   api (app server)
 *    ↓ ↓
 *  cache  db
 *
 * Step shape:
 *   type         — identifier string
 *   phase        — 'write' | 'read'
 *   activeNodes  — node IDs that glow
 *   activeArrow  — { from: nodeId, to: nodeId } | null
 *   message      — short step label
 *   detail       — longer explanation
 *   shortCode    — null | 'aB3xK9z'  (shown on the short URL badge)
 */
export function buildUrlShortenerSteps() {
  return [
    // ── Write flow (shorten a URL) ─────────────────────────────────────────
    {
      type: 'write-init',
      phase: 'write',
      activeNodes: ['client'],
      activeArrow: null,
      message: 'User submits a long URL to shorten.',
      detail:
        'POST /api/shorten  { url: "https://example.com/very/long/article?ref=newsletter" }\n\nThe client may be a browser, a mobile app, or another service.',
      shortCode: null,
    },
    {
      type: 'write-lb',
      phase: 'write',
      activeNodes: ['client', 'lb'],
      activeArrow: { from: 'client', to: 'lb' },
      message: 'Request hits the Load Balancer.',
      detail:
        'The load balancer distributes incoming requests across multiple API server instances using round-robin or least-connections. It also handles SSL termination.',
      shortCode: null,
    },
    {
      type: 'write-api',
      phase: 'write',
      activeNodes: ['lb', 'api'],
      activeArrow: { from: 'lb', to: 'api' },
      message: 'API Server receives and validates the request.',
      detail:
        'The server validates the URL format, checks rate limits, and optionally deduplicates (returns the same short code if the URL was already shortened).',
      shortCode: null,
    },
    {
      type: 'write-generate',
      phase: 'write',
      activeNodes: ['api'],
      activeArrow: null,
      message: 'Server generates a unique 7-char Base62 code.',
      detail:
        'A unique integer ID is generated (auto-increment or Snowflake ID), then encoded in Base62 (a–z, A–Z, 0–9). 7 chars → 62⁷ ≈ 3.5 trillion combinations.',
      shortCode: 'aB3xK9z',
    },
    {
      type: 'write-db',
      phase: 'write',
      activeNodes: ['api', 'db'],
      activeArrow: { from: 'api', to: 'db' },
      message: 'Mapping is persisted to the database.',
      detail:
        'Schema: { id, short_code, long_url, created_at, user_id }\n\nWrite to DB first (source of truth), then warm the cache. Use a relational DB for consistency or Cassandra for high write throughput.',
      shortCode: 'aB3xK9z',
    },
    {
      type: 'write-cache',
      phase: 'write',
      activeNodes: ['api', 'cache'],
      activeArrow: { from: 'api', to: 'cache' },
      message: 'Short code is written to Redis cache.',
      detail:
        'Cache-aside strategy: after the DB write succeeds, populate Redis with key = short_code, value = long_url, TTL = 24 h. Hot URLs stay warm automatically.',
      shortCode: 'aB3xK9z',
    },
    {
      type: 'write-response',
      phase: 'write',
      activeNodes: ['api', 'client'],
      activeArrow: { from: 'api', to: 'client' },
      message: 'Short URL returned to the client.',
      detail:
        'Response: { short_url: "https://short.ly/aB3xK9z" }\n\nFull write round-trip typically < 100 ms. The user can now share the short URL.',
      shortCode: 'aB3xK9z',
    },

    // ── Read flow (follow the short URL) ──────────────────────────────────
    {
      type: 'read-init',
      phase: 'read',
      activeNodes: ['client'],
      activeArrow: null,
      message: 'User visits short.ly/aB3xK9z in their browser.',
      detail:
        'GET /aB3xK9z\n\nThe browser first resolves short.ly via DNS, then opens a TCP connection. The short code is extracted from the URL path.',
      shortCode: 'aB3xK9z',
    },
    {
      type: 'read-lb',
      phase: 'read',
      activeNodes: ['client', 'lb'],
      activeArrow: { from: 'client', to: 'lb' },
      message: 'Request hits the Load Balancer.',
      detail:
        'The same load balancer as the write path. It may route to a different API server instance, which is why cache and DB must be shared external services.',
      shortCode: 'aB3xK9z',
    },
    {
      type: 'read-api',
      phase: 'read',
      activeNodes: ['lb', 'api'],
      activeArrow: { from: 'lb', to: 'api' },
      message: 'API Server parses the short code "aB3xK9z".',
      detail:
        'The server extracts the 7-character code from the path and prepares a lookup. It checks the cache first before going to the database.',
      shortCode: 'aB3xK9z',
    },
    {
      type: 'read-cache-hit',
      phase: 'read',
      activeNodes: ['api', 'cache'],
      activeArrow: { from: 'api', to: 'cache' },
      message: 'Cache HIT — Redis returns the long URL instantly.',
      detail:
        'Redis lookup is O(1) and takes < 1 ms. Since this URL was just created, it\'s warm in cache. The database is not touched — this is the fast path for popular links.',
      shortCode: 'aB3xK9z',
    },
    {
      type: 'read-redirect',
      phase: 'read',
      activeNodes: ['api', 'client'],
      activeArrow: { from: 'api', to: 'client' },
      message: 'Server sends HTTP 301 redirect to the original URL.',
      detail:
        '301 Moved Permanently: browsers cache this mapping forever, so future visits skip the server entirely.\n\nUse 302 Found (temporary) if you need click analytics — 301 means the browser never asks again.',
      shortCode: 'aB3xK9z',
    },
  ]
}
