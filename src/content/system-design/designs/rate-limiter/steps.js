/**
 * Rate Limiter — full system design step trace.
 *
 * Node IDs: client | gateway | ratelimiter | redis | backend | adminui
 *
 * Layout:
 *   client → gateway → ratelimiter → redis (below ratelimiter)
 *   gateway → backend (right, stacked: service-a, service-b)
 *   adminui (top-right, manages rules)
 *
 * Step shape:
 *   type         — identifier string
 *   activeNodes  — node IDs to highlight
 *   connections  — edge ID → direction string
 *   message      — short label shown in the panel
 *   detail       — 1–2 interview-prep sentences
 */
export function buildRateLimiterSteps() {
  return [
    {
      type:        'init',
      activeNodes: [],
      connections: {},
      message:     'Meet the distributed rate limiter',
      detail:      'A rate limiter enforces request quotas per user, per IP, or per API key across a fleet of gateway nodes. The core challenge: every gateway must share the same counters so a user cannot bypass limits by hitting different nodes.',
    },
    {
      type:        'request-arrives',
      activeNodes: ['client', 'gateway'],
      connections: { 'client-gateway': 'request' },
      message:     'Client request arrives at the API Gateway',
      detail:      'The API Gateway is the single entry point for all traffic. It extracts the identifier from the request — userId, API key, or client IP — and passes it to the Rate Limiter middleware before the request reaches any backend service.',
    },
    {
      type:        'check-rules',
      activeNodes: ['gateway', 'ratelimiter'],
      connections: { 'gateway-rl': 'request' },
      message:     'Gateway invokes the Rate Limiter middleware',
      detail:      'The Rule Engine inside the Rate Limiter determines which algorithm applies — token bucket for sustained average rate with burst allowance, sliding window counter for strict per-minute quotas, or fixed window for simple low-risk contexts. Different API tiers (free, pro, enterprise) map to different bucket sizes.',
    },
    {
      type:        'redis-check',
      activeNodes: ['ratelimiter', 'redis'],
      connections: { 'rl-redis': 'both' },
      message:     'Atomic counter check in Redis via Lua script',
      detail:      'The Rate Limiter runs a Lua script on Redis: read current count, compare to limit, increment if below, return result — all atomically. Non-atomic check-then-increment has a race condition that lets concurrent requests exceed limits; Lua scripts execute on the Redis thread, so no race is possible.',
    },
    {
      type:        'allow-request',
      activeNodes: ['gateway', 'ratelimiter', 'backend'],
      connections: { 'gateway-rl': 'response', 'gateway-backend': 'request' },
      message:     'Request allowed — forwarded to backend service',
      detail:      'If the counter is below the limit, the gateway sets X-RateLimit-Remaining and X-RateLimit-Reset response headers and forwards the request to the appropriate backend service. Headers let well-behaved clients back off before hitting the limit.',
    },
    {
      type:        'reject-request',
      activeNodes: ['gateway', 'ratelimiter', 'client'],
      connections: { 'gateway-rl': 'response', 'client-gateway': 'response' },
      message:     'Limit exceeded — HTTP 429 with Retry-After header',
      detail:      'When the counter equals the limit, the gateway returns HTTP 429 Too Many Requests with a Retry-After header (seconds until the window resets). Never return 403 for rate limiting — 429 tells clients exactly what happened and when to retry.',
    },
    {
      type:        'distributed-gateways',
      activeNodes: ['client', 'gateway', 'ratelimiter', 'redis'],
      connections: { 'client-gateway': 'request', 'gateway-rl': 'request', 'rl-redis': 'both' },
      message:     'Distributed rate limiting — multiple gateways, one Redis',
      detail:      'With multiple gateway nodes (horizontal scaling), all nodes share a single Redis cluster. Redis is the coordination layer — regardless of which gateway handles a request, the same counter is incremented. This is why Redis, not local memory, must hold the state.',
    },
    {
      type:        'sliding-window',
      activeNodes: ['ratelimiter', 'redis'],
      connections: { 'rl-redis': 'both' },
      message:     'Sliding window counter algorithm in Redis',
      detail:      'The sliding window approximates accuracy by interpolating two adjacent fixed-window counters. Key pattern: "rl:{userId}:{minuteBucket}" with TTL slightly longer than the window. For 1M users × 5 windows, Redis holds 5M small keys — well within its 1B+ key capacity.',
    },
    {
      type:        'fail-open',
      activeNodes: ['gateway', 'backend'],
      connections: { 'gateway-backend': 'request' },
      message:     'Fail-open: Redis unavailable → let traffic through',
      detail:      'If Redis is down or too slow, the rate limiter must fail open — pass requests through rather than blocking all traffic. A broken rate limiter that drops all traffic causes a complete outage; a brief surge to the backend is recoverable. Log every bypass so operations detects Redis issues via alert.',
    },
    {
      type:        'admin-rules',
      activeNodes: ['adminui', 'ratelimiter', 'redis'],
      connections: { 'admin-rl': 'request', 'rl-redis': 'request' },
      message:     'Admin UI updates rate limit rules dynamically',
      detail:      'Rate limit rules (limits per tier, per endpoint, per IP range) are stored in a configuration service. The Admin UI pushes updates that gateways refresh periodically without restart. Multi-tier limits combine per-second burst (token bucket) with per-day quota (fixed window) for the same user.',
    },
  ]
}
