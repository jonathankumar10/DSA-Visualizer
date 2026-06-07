export function buildProxiesAndLoadBalancingSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Load Balancing — horizontal scaling starts here',
      detail:
        'A single server has a finite capacity ceiling. Load balancers distribute traffic across a pool of servers, enabling horizontal scaling. They also remove failed servers automatically, providing high availability. Every web system at scale has at least one.',
    },
    {
      type: 'single-server',
      activeNodes: ['client', 'lb'],
      connections: { 'client-lb': 'request' },
      message: 'Single server bottleneck — all traffic hits one machine',
      detail:
        'Without a load balancer, every request goes to a single server. When CPU hits 100% or the server crashes, all users are affected simultaneously. Vertical scaling (bigger machine) has a hard limit and is expensive. The answer is horizontal scaling: more servers behind a load balancer.',
    },
    {
      type: 'round-robin',
      activeNodes: ['client', 'lb', 'server1', 'server2', 'server3'],
      connections: { 'client-lb': 'request', 'lb-server1': 'request', 'lb-server2': 'request', 'lb-server3': 'request' },
      activeServer: 'server1',
      message: 'Round-robin distribution — requests spread evenly across servers',
      detail:
        'Round-robin cycles through servers in order: req 1 → server 1, req 2 → server 2, req 3 → server 3, req 4 → server 1. Simple and effective when all requests have similar cost. Least-connections is better when request durations vary widely.',
    },
    {
      type: 'health-check',
      activeNodes: ['lb', 'server1', 'server2'],
      connections: { 'lb-server1': 'request', 'lb-server2': 'request' },
      failedServer: 'server3',
      message: 'Health checks remove the failed server automatically',
      detail:
        'The load balancer polls each server (GET /health every 5s). Two consecutive failures mark the server unhealthy and remove it from the rotation. Traffic shifts to the remaining healthy servers instantly — zero manual intervention. The failed server is re-added once it starts passing checks again.',
    },
    {
      type: 'sticky-sessions',
      activeNodes: ['client', 'lb', 'server1'],
      connections: { 'client-lb': 'request', 'lb-server1': 'request' },
      message: 'Sticky sessions — session affinity pins a user to one server',
      detail:
        'Session affinity routes the same client IP or cookie to the same backend server. Useful when server-side session state is stored in memory (not in Redis). The downside: if the server dies, the session is lost. The better solution is stateless servers with a shared session store.',
    },
    {
      type: 'l4-vs-l7',
      activeNodes: ['lb'],
      connections: {},
      message: 'L4 vs L7 load balancing — where in the stack is routing done?',
      detail:
        'L4 (transport layer) routes by IP address and TCP port — fast, low CPU cost, no HTTP visibility. L7 (application layer) reads the HTTP request — can route /api/* to API servers and /static/* to CDN origin. L7 enables content-based routing, A/B testing, and canary deployments. Most modern load balancers (AWS ALB, nginx) operate at L7.',
    },
    {
      type: 'reverse-proxy',
      activeNodes: ['client', 'lb', 'server1', 'server2', 'server3'],
      connections: { 'client-lb': 'request', 'lb-server1': 'response', 'lb-server2': 'response', 'lb-server3': 'response' },
      message: 'Reverse proxy: SSL termination, compression, caching at the edge',
      detail:
        'A reverse proxy (nginx, HAProxy) terminates TLS so backend servers handle plain HTTP — simpler certificate management and less CPU load on backends. It also gzip-compresses responses, caches static assets, and can rate-limit clients. The backend servers never see the real client IP — X-Forwarded-For header carries it.',
    },
    {
      type: 'active-active',
      activeNodes: ['client', 'lb', 'server1', 'server2', 'server3'],
      connections: { 'client-lb': 'request', 'lb-server1': 'both', 'lb-server2': 'both', 'lb-server3': 'both' },
      message: 'Active-active vs active-passive — HA topology choice',
      detail:
        'Active-active: all servers handle traffic simultaneously, maximizing throughput and providing instant failover. Active-passive: one primary handles traffic; the standby takes over only if the primary fails. Active-passive wastes capacity but is simpler for stateful workloads (primary DB + hot standby). Use active-active for stateless app servers.',
    },
  ]
}
