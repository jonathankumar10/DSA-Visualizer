export function buildRateLimitingSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      tokens: 5,
      status: null,
      message: 'A rate limiter sits between clients and your API',
      detail:
        'Every incoming request must pass the rate limiter before reaching the API server. The limiter checks the token bucket in Redis, decrements if a token is available, and either forwards the request or returns a 429.',
    },
    {
      type: 'tokens-full',
      activeNodes: ['limiter', 'redis'],
      connections: { 'limiter-redis': 'refill' },
      tokens: 5,
      status: null,
      message: 'Token bucket starts full — 5/5 tokens available',
      detail:
        'At startup the bucket is at maximum capacity. Redis stores the counter atomically using INCR and EXPIRE. Tokens refill at a fixed rate — e.g. 5 per second — so sustained throughput is capped even when short bursts are permitted.',
    },
    {
      type: 'request-1',
      activeNodes: ['client', 'limiter', 'api'],
      connections: { 'client-limiter': 'request', 'limiter-api': 'response', 'limiter-redis': 'request' },
      tokens: 4,
      status: 'allowed',
      message: 'Request 1: token consumed — allowed (4/5 remaining)',
      detail:
        'The request arrives. The rate limiter atomically decrements the counter from 5 to 4 in Redis. Counter > 0 so the request is forwarded to the API. The response carries X-RateLimit-Remaining: 4 so the client knows its remaining budget.',
    },
    {
      type: 'request-2',
      activeNodes: ['client', 'limiter', 'api'],
      connections: { 'client-limiter': 'request', 'limiter-api': 'response', 'limiter-redis': 'request' },
      tokens: 3,
      status: 'allowed',
      message: 'Request 2: another token consumed (3/5 remaining)',
      detail:
        'Requests keep consuming tokens. Well-behaved API clients read X-RateLimit-Remaining and self-throttle before hitting zero — reducing the number of rejected requests in practice and keeping traffic smooth.',
    },
    {
      type: 'burst',
      activeNodes: ['client', 'limiter', 'api'],
      connections: { 'client-limiter': 'request', 'limiter-api': 'response', 'limiter-redis': 'request' },
      tokens: 1,
      status: 'allowed',
      message: 'Burst: 2 rapid requests — only 1 token left',
      detail:
        'A burst of 2 rapid requests arrives. Token bucket allows the burst up to the bucket capacity — a key advantage over fixed-window counters. The next request will empty the bucket entirely.',
    },
    {
      type: 'request-rejected',
      activeNodes: ['client', 'limiter'],
      connections: { 'client-limiter': 'rejected' },
      tokens: 0,
      status: 'rejected',
      message: 'Bucket empty — 429 Too Many Requests',
      detail:
        'No tokens remain. The rate limiter rejects immediately: HTTP 429 with a Retry-After header specifying when the next token becomes available. The API server never sees this request — it is shielded entirely.',
    },
    {
      type: 'refill',
      activeNodes: ['limiter', 'redis'],
      connections: { 'limiter-redis': 'refill' },
      tokens: 3,
      status: null,
      message: 'Tokens refill over time — 3/5 restored',
      detail:
        "Tokens are added back at a fixed rate. After enough time the bucket has 3 tokens again. Redis's EXPIRE ensures the counter fully resets at each window boundary even if no requests arrive during that window.",
    },
    {
      type: 'retry-ok',
      activeNodes: ['client', 'limiter', 'api'],
      connections: { 'client-limiter': 'request', 'limiter-api': 'response', 'limiter-redis': 'request' },
      tokens: 2,
      status: 'allowed',
      message: 'Client retries after Retry-After — allowed (2/5)',
      detail:
        'The client respected the Retry-After header and waited before retrying. The request succeeds. This cooperative protocol — rate limit + Retry-After + client self-throttling — keeps traffic smooth without overwhelming the backend.',
    },
    {
      type: 'distributed',
      activeNodes: ['client', 'limiter', 'api', 'redis'],
      connections: { 'client-limiter': 'request', 'limiter-api': 'response', 'limiter-redis': 'both' },
      tokens: 2,
      status: 'allowed',
      message: 'Distributed: Redis is the single shared counter',
      detail:
        'With multiple gateway nodes in production each node checks the same Redis counter instead of a local in-memory count. An atomic Lua script does the check-and-decrement in one round trip — preventing race conditions where two nodes both approve a request that should be blocked.',
    },
  ]
}
