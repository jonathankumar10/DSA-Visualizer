export function buildApiDesignSteps() {
  return [
    {
      type:        'intro',
      activeNodes: [],
      connections: {},
      message:     'API Design: building contracts that outlast the code behind them',
      detail:      'A well-designed API is a stable contract between your system and its clients. Poor API design creates migration nightmares — clients break when you change things. Good design makes changes additive, not destructive. Every decision at design time reduces pain at scale.',
    },
    {
      type:        'rest-principles',
      activeNodes: ['client', 'gateway'],
      connections: { 'client-gateway': 'request' },
      message:     'REST — resource-based URLs with HTTP verbs',
      detail:      'REST treats every entity as a resource with a URL: GET /users/42, POST /orders, DELETE /sessions/abc. HTTP verbs carry the action — GET (read), POST (create), PUT/PATCH (update), DELETE (remove). Resources are nouns, verbs are HTTP methods. Breaking this creates RPC-style APIs that fight the protocol.',
    },
    {
      type:        'get-request',
      activeNodes: ['client', 'gateway', 'service-a'],
      connections: { 'client-gateway': 'request', 'gateway-a': 'request' },
      message:     'GET /v1/users/42 — safe, idempotent read',
      detail:      'GET requests are safe (no side effects) and idempotent (same result on repeat calls). The gateway adds auth, rate limiting, and routing before forwarding to the service. Always include a version prefix — /v1/ — so you can ship /v2/ when breaking changes are needed without disrupting existing clients.',
    },
    {
      type:        'post-put',
      activeNodes: ['client', 'gateway', 'service-a'],
      connections: { 'client-gateway': 'both', 'gateway-a': 'both' },
      message:     'POST creates; PUT/PATCH updates — design for idempotency',
      detail:      'POST /orders creates a new resource (not idempotent — retrying creates duplicates). PUT /orders/42 replaces the whole resource (idempotent). PATCH /orders/42 applies partial updates. For safe retries on POST, use an idempotency key header: if the client retries with the same key, return the original response without re-executing.',
    },
    {
      type:        'versioning',
      activeNodes: ['client', 'gateway'],
      connections: { 'client-gateway': 'both' },
      message:     'Versioning — /v1/ in the URL, never break existing clients',
      detail:      'Version your API from day one. URL versioning (/v1/, /v2/) is explicit and cache-friendly. Header versioning (Accept: application/vnd.api.v2+json) is cleaner but harder to test. Whatever you pick, maintain backward compatibility within a version — add optional fields freely, never remove required ones. Deprecation should give clients 6–12 months notice.',
    },
    {
      type:        'pagination',
      activeNodes: ['client', 'gateway', 'service-b'],
      connections: { 'client-gateway': 'request', 'gateway-b': 'both' },
      message:     'Pagination — never return unbounded result sets',
      detail:      'GET /orders?limit=20&cursor=eyJpZCI6MTAwfQ returns 20 items and a next cursor. Cursor-based pagination is stable — offset pagination breaks when rows are inserted between pages. Always include a meta.nextCursor or Link: <url>; rel="next" header. Default page size should be small (20–50 items) and max page size should be capped (e.g. 100).',
    },
    {
      type:        'rate-limiting',
      activeNodes: ['client', 'gateway'],
      connections: { 'client-gateway': 'both' },
      rateLimitState: 'limited',
      message:     'Rate limiting — 429 Too Many Requests with Retry-After',
      detail:      'Rate limiting protects downstream services from overload. Return HTTP 429 with a Retry-After header (seconds to wait) and an X-RateLimit-Limit / X-RateLimit-Remaining header for observability. Use token bucket or sliding window algorithms. Limit per user/API key, not just per IP — IPs can be shared by NAT.',
    },
    {
      type:        'error-responses',
      activeNodes: ['client', 'gateway', 'service-a'],
      connections: { 'client-gateway': 'both', 'gateway-a': 'both' },
      message:     'Structured errors — machine-readable codes + human messages',
      detail:      'Never return raw stack traces. Use a consistent error envelope: { "error": { "code": "USER_NOT_FOUND", "message": "No user with id 42", "requestId": "abc123" } }. Use appropriate HTTP status codes: 400 (bad input), 401 (unauthenticated), 403 (unauthorized), 404 (not found), 422 (validation error), 500 (server bug). requestId enables log correlation.',
    },
    {
      type:        'idempotency',
      activeNodes: ['client', 'gateway', 'service-b'],
      connections: { 'client-gateway': 'both', 'gateway-b': 'both' },
      message:     'Idempotency keys — safe retries on network failures',
      detail:      'Network failures are common. Clients should retry failed requests. For mutating operations (POST), accept an Idempotency-Key header. Store the key + response for 24 hours. On a duplicate request, return the stored response without re-executing. Stripe, Braintree, and most payment APIs use this pattern to prevent double charges.',
    },
  ]
}
