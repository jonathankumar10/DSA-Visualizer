/**
 * Steps for Design Requirements.
 *
 * Step shape:
 *   activeSection — which section glows:
 *     null | 'move' | 'store' | 'transform' |
 *     'throughput' | 'latency' | 'availability' | 'reliability' | 'all'
 *   message — short step label
 *   detail  — plain-English explanation
 */
export function buildDesignRequirementsSteps() {
  return [
    {
      type:          'intro',
      activeSection: null,
      message:       'Every system design problem is the same three problems',
      detail:        'No matter the system — a URL shortener, a video platform, or a payment processor — every design challenge reduces to three primitives: moving data between services, storing data in the right place, and transforming data into something useful. Get these three right and the architecture follows.',
    },
    {
      type:          'move-data',
      activeSection: 'move',
      message:       'Moving data: the network is the bottleneck',
      detail:        'Unlike local data transfer (RAM to CPU in ~60 ns), moving data across a network takes milliseconds. Every component in a distributed system — load balancers, CDNs, message queues, caches — exists to move data efficiently across geographic and service boundaries. Bad design choices here show up as latency and timeouts.',
    },
    {
      type:          'store-data',
      activeSection: 'store',
      message:       'Storing data: pick the right storage for the access pattern',
      detail:        'Relational databases, NoSQL, blob stores, distributed file systems — each has different trade-offs. Choosing wrong is expensive: migrating a production database requires rewriting application code and moving data with zero downtime. Always choose based on the data\'s access pattern (random reads vs sequential scans vs key-value lookups), not on familiarity.',
    },
    {
      type:          'transform-data',
      activeSection: 'transform',
      message:       'Transforming data: raw data is rarely the final product',
      detail:        'Server logs become error-rate dashboards. Transaction records become fraud scores. Sensor readings become real-time alerts. Transforming data efficiently — through stream processors, batch jobs, or real-time aggregators — is the third core problem every system must solve. A bad transformation pipeline creates the same bottlenecks as a bad database choice.',
    },
    {
      type:          'availability',
      activeSection: 'availability',
      message:       'Availability: uptime ÷ (uptime + downtime)',
      detail:        '99% availability = 3.65 days of downtime per year — unacceptable for most products. 99.9% = 8.7 hours. 99.99% = 52 minutes. 99.999% = 5 minutes. Availability is formalized into SLOs (internal targets your team must hit) and SLAs (external contracts with financial penalties — like AWS refunding credits when monthly uptime drops below 99.99%).',
    },
    {
      type:          'reliability',
      activeSection: 'reliability',
      message:       'Reliability and redundancy: design for failure, not for success',
      detail:        'Availability measures whether the system is up. Reliability measures whether individual requests succeed when it is. Redundancy is the mechanism behind both. Active-passive redundancy keeps a standby server that promotes on failure but wastes capacity. Active-active redundancy has all nodes serving live traffic — losing one reduces throughput rather than causing an outage.',
    },
    {
      type:          'throughput',
      activeSection: 'throughput',
      message:       'Throughput: QPS for APIs, bytes/second for pipelines',
      detail:        'Throughput is how much work the system handles per unit of time. For user-facing APIs, measure in QPS. For data pipelines, measure in bytes/second. Vertical scaling (bigger machine) increases throughput up to a hardware ceiling. Horizontal scaling (more machines behind a load balancer) removes that ceiling — but introduces coordination complexity.',
    },
    {
      type:          'latency',
      activeSection: 'latency',
      message:       'Latency: always set targets at p99, never just the average',
      detail:        'Latency is the round-trip time from request to response. p50 (median) is what most users experience; p99 is what the worst-off 1% experience. In a system handling 1M requests per day, p99 affects 10,000 users. Averages hide outliers completely. A p99 more than 10× the p50 is a red flag — investigate tail latency before it becomes a user complaint.',
    },
    {
      type:          'all',
      activeSection: 'all',
      message:       'Good design navigates trade-offs — not avoids them',
      detail:        'Availability, reliability, throughput, and latency are not independent. More redundancy improves availability but costs more. Caching improves latency but can serve stale data. More replication improves reliability but increases write latency. The art of system design is making these trade-offs explicitly — choosing which constraint to relax — rather than pretending all four can be maximized simultaneously.',
    },
  ]
}
