/**
 * Steps for Application Architecture.
 *
 * Two interlocking stories:
 *   Deploy path  — Developer → CI/CD → Server
 *   Request path — User → Frontend → Load Balancer → Server → Cache → Database
 *
 * Step shape:
 *   activeNodes  — node ids to highlight
 *   connections  — edge ids mapped to 'request' | 'response' | 'both'
 *   message      — short label
 *   detail       — plain-English explanation
 */
export function buildApplicationArchitectureSteps() {
  return [
    {
      type:        'init',
      activeNodes: [],
      connections: {},
      message:     'Meet a production web application',
      detail:      'Every web application you use is built from the same set of layers: a frontend the user sees, a backend that handles logic, a data layer that keeps things persistent, a pipeline that ships code safely, and an observability layer that watches everything. This is how they fit together.',
    },
    {
      type:        'dev-writes',
      activeNodes: ['developer'],
      connections: {},
      message:     'A developer writes and pushes code',
      detail:      'All code lives in a version-controlled repository — Git, GitHub, GitLab. Every change is tracked, reviewed by teammates, and can be rolled back in seconds. The repository is the single source of truth for what is running in production.',
    },
    {
      type:        'cicd-runs',
      activeNodes: ['developer', 'cicd'],
      connections: { 'dev-cicd': 'request' },
      message:     'The push triggers the CI/CD pipeline',
      detail:      'The moment code is pushed, an automated pipeline kicks off: it compiles the code, runs every test, and packages the app into a deployable image. If any test fails the pipeline stops and nothing reaches production — no human decides when to deploy.',
    },
    {
      type:        'deploy',
      activeNodes: ['cicd', 'server'],
      connections: { 'cicd-server': 'request' },
      message:     'The pipeline deploys the new version to the server',
      detail:      'With tests passing, the pipeline pushes the new build live — swapping old code for new with zero downtime. Teams that do this well ship dozens of times a day, each change small and easy to reverse.',
    },
    {
      type:        'user-frontend',
      activeNodes: ['user', 'frontend'],
      connections: { 'user-frontend': 'both' },
      message:     'A user opens the app — the frontend loads from the CDN',
      detail:      'The user\'s browser requests the app. The HTML, JavaScript bundle, CSS, and images are all served by a CDN — a network of servers distributed worldwide. The user gets assets from a server close to them, so the app loads in milliseconds regardless of where your origin servers are.',
    },
    {
      type:        'lb-routes',
      activeNodes: ['user', 'frontend', 'lb', 'server'],
      connections: { 'user-frontend': 'both', 'frontend-lb': 'request', 'lb-server': 'request' },
      message:     'The frontend makes an API call — the load balancer routes it',
      detail:      'Once loaded, the frontend app (running in the browser) makes API calls to fetch real data. These hit the load balancer, which forwards each request to one of the available backend servers. If a server goes down, the load balancer stops sending traffic to it automatically.',
    },
    {
      type:        'cache-hit',
      activeNodes: ['server', 'cache'],
      connections: { 'server-cache': 'both' },
      message:     'The server checks the cache before touching the database',
      detail:      'Before querying the database, the server asks the cache: "Do you have this already?" A cache hit returns the data in under a millisecond — no database query, no disk access. This is often the single highest-impact optimisation in a production application.',
    },
    {
      type:        'db-query',
      activeNodes: ['server', 'cache', 'db'],
      connections: { 'server-cache': 'both', 'server-db': 'both' },
      message:     'Cache miss: server queries the database and stores the result',
      detail:      'When the cache does not have the data, the server queries the database — the permanent source of truth. The result is written back to the cache so the next identical request is instant. Writes almost always go directly to the database to ensure nothing is ever lost.',
    },
    {
      type:        'scaling',
      activeNodes: ['lb', 'server'],
      connections: { 'frontend-lb': 'request', 'lb-server': 'request' },
      message:     'Traffic grows — add more servers behind the load balancer',
      detail:      'Because each server is stateless — no session data, no user state stored locally — any server can handle any request. To handle twice the traffic, run twice as many servers. The load balancer discovers them automatically. This is horizontal scaling, and it is why modern apps can serve millions of users.',
    },
    {
      type:        'monitoring',
      activeNodes: ['developer', 'cicd', 'frontend', 'lb', 'server', 'cache', 'db', 'monitor'],
      connections: {
        'dev-cicd':       'request',
        'cicd-server':    'request',
        'frontend-lb':    'request',
        'lb-server':      'both',
        'server-cache':   'both',
        'server-db':      'both',
        'server-monitor': 'both',
      },
      message:     'Monitoring watches everything — alerts fire when things break',
      detail:      'Every request is logged. Every error is captured. Latency, error rate, and traffic are tracked on dashboards in real time. When a metric crosses a threshold — too many errors, a server too slow, the database overloaded — an alert fires and an engineer is paged. You cannot fix what you cannot see.',
    },
  ]
}
