export function buildApiParadigmsSteps() {
  return [
    {
      type:        'intro',
      activeNodes: [],
      connections: {},
      message:     'API Paradigms: REST, GraphQL, and gRPC — choosing the right protocol',
      detail:      'Three paradigms dominate modern API design. REST is the default for public HTTP APIs. GraphQL gives clients query flexibility. gRPC delivers high-performance binary communication between services. Each represents a different set of trade-offs between flexibility, performance, and tooling.',
    },
    {
      type:        'rest-intro',
      activeNodes: ['client', 'rest'],
      connections: { 'client-rest': 'both' },
      message:     'REST — HTTP + JSON, resource-based, universally supported',
      detail:      'REST maps CRUD operations to HTTP verbs on resource URLs. Simple, stateless, and cacheable by default. Every HTTP client in every language works out of the box. The downside: endpoints return fixed shapes, so clients often over-fetch (too many fields) or under-fetch (need multiple requests for related data).',
    },
    {
      type:        'rest-overfetch',
      activeNodes: ['client', 'rest'],
      connections: { 'client-rest': 'both' },
      message:     'REST problem: over-fetching and under-fetching',
      detail:      'GET /users/42 returns all 30 fields even if the mobile app only needs name and avatar. GET /users/42 + GET /users/42/orders requires two round trips. As APIs grow, the number of specialised endpoints explodes (BFF pattern). GraphQL was invented specifically to solve this — clients declare exactly what they need.',
    },
    {
      type:        'graphql-intro',
      activeNodes: ['client', 'graphql'],
      connections: { 'client-graphql': 'both' },
      message:     'GraphQL — single endpoint, query exactly the fields you need',
      detail:      'All GraphQL requests go to POST /graphql. The client sends a query specifying exactly which fields to return, including nested relations in one round trip. { user(id: 42) { name, orders { total } } } returns only name and order totals. No over-fetching. Mutations replace POST/PUT/DELETE. Subscriptions add real-time push.',
    },
    {
      type:        'graphql-tradeoffs',
      activeNodes: ['client', 'graphql'],
      connections: { 'client-graphql': 'both' },
      message:     'GraphQL trade-offs — flexible but complex to operate',
      detail:      'GraphQL eliminates over-fetching but introduces N+1 query problems (solved with DataLoader), complex caching (no HTTP GET caching for POST queries), and query depth attacks (infinite nesting). It shines when client data requirements vary widely — mobile needs 3 fields, web needs 20. Heavy on tooling investment.',
    },
    {
      type:        'grpc-intro',
      activeNodes: ['client', 'grpc'],
      connections: { 'client-grpc': 'both' },
      message:     'gRPC — binary protocol over HTTP/2, strongly typed with Protocol Buffers',
      detail:      'gRPC defines services and messages in .proto files. Messages are serialised as Protocol Buffers (binary) — 5–10× smaller and faster to parse than JSON. HTTP/2 multiplexing allows many concurrent streams over one TCP connection. Strongly typed contracts are enforced at compile time — breaking changes are caught before deployment.',
    },
    {
      type:        'grpc-streaming',
      activeNodes: ['client', 'grpc'],
      connections: { 'client-grpc': 'both' },
      message:     'gRPC streaming — server, client, and bidirectional stream modes',
      detail:      'gRPC supports four RPC modes: Unary (1 request, 1 response), Server Streaming (1 request, stream of responses), Client Streaming (stream of requests, 1 response), Bidirectional Streaming (both sides stream simultaneously). Bidirectional streaming replaces WebSockets for inter-service real-time communication in many microservice stacks.',
    },
    {
      type:        'comparison',
      activeNodes: ['client', 'rest', 'graphql', 'grpc'],
      connections: { 'client-rest': 'request', 'client-graphql': 'request', 'client-grpc': 'request' },
      message:     'Choosing a paradigm — public API vs internal service vs mobile',
      detail:      'REST: public APIs, simple CRUD, maximum compatibility. GraphQL: when different clients need different data shapes (web, mobile, IoT). gRPC: internal microservice-to-microservice communication where performance and strong typing matter. Many architectures use all three: REST externally, gRPC internally, GraphQL for the BFF layer.',
    },
    {
      type:        'websocket-note',
      activeNodes: ['client', 'rest'],
      connections: { 'client-rest': 'both' },
      message:     'Real-time additions — WebSockets, SSE, and long polling',
      detail:      'REST, GraphQL, and gRPC are all primarily request-response. For server-pushed real-time data: WebSockets (bidirectional, low latency), Server-Sent Events (SSE, server-to-client only, works over HTTP/1.1), or long polling (HTTP fallback). GraphQL Subscriptions typically use WebSockets under the hood. gRPC streaming handles the same use case in service meshes.',
    },
  ]
}
