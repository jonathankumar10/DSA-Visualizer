export function buildDistributedTracingSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Distributed Tracing — following one request through a microservices maze',
      detail:
        'In a monolith, a stack trace shows you everything. In microservices, a single user request may touch 5–20 services. Distributed tracing reconstructs the full timeline using a shared trace ID threaded through every call.',
    },
    {
      type: 'request-enters',
      activeNodes: ['client', 'gateway'],
      connections: { 'client-gateway': 'request' },
      message: 'Request arrives at the API Gateway',
      detail:
        'The client sends an HTTP request. The API Gateway is the first internal service to receive it. This is where the trace starts — in production, this is often your Envoy sidecar, Kong, or AWS API Gateway.',
    },
    {
      type: 'trace-id-assigned',
      activeNodes: ['gateway'],
      connections: {},
      badge: 'TRACE ID ASSIGNED',
      message: 'API Gateway generates a trace ID and first span',
      detail:
        'The gateway creates a 128-bit trace ID (e.g., W3C traceparent header: 00-4bf92f3577b34da6a3ce929d0e0e4736-00f067aa0ba902b7-01). It also creates the root span recording its own start time, operation name, and HTTP metadata.',
    },
    {
      type: 'propagate-to-a',
      activeNodes: ['gateway', 'serviceA'],
      connections: { 'gateway-serviceA': 'request' },
      message: 'Trace ID propagated to Service A via HTTP header',
      detail:
        'The gateway forwards the request to Service A with the traceparent header. Service A reads the header, creates a child span referencing the gateway span as its parent, and begins tracking its own work. No code change required with OpenTelemetry auto-instrumentation.',
    },
    {
      type: 'service-a-calls-b',
      activeNodes: ['serviceA', 'serviceB'],
      connections: { 'serviceA-serviceB': 'request' },
      message: 'Service A calls Service B — trace context hops again',
      detail:
        'Service A calls Service B (e.g., a downstream data service). It injects the same trace ID plus a new parent span ID into the outgoing headers. Service B creates its own child span. This chain continues for every downstream call.',
    },
    {
      type: 'spans-emitted',
      activeNodes: ['serviceA', 'serviceB', 'tracing'],
      connections: { 'serviceA-tracing': 'response', 'serviceB-tracing': 'response' },
      message: 'Each service emits spans to the tracing backend (Jaeger)',
      detail:
        'Spans are exported asynchronously out-of-band — never blocking the request path. The tracing agent (OTel Collector) batches and forwards them to Jaeger, Zipkin, or Honeycomb. A span contains: service name, operation name, start/end time, status, and custom tags.',
    },
    {
      type: 'full-trace',
      activeNodes: ['tracing'],
      connections: {},
      badge: 'TRACE ASSEMBLED',
      message: 'Tracing backend assembles the full trace timeline',
      detail:
        'Jaeger correlates all spans by trace ID and renders a flame graph: each service is a horizontal bar on a shared timeline. You can see total end-to-end latency and which service contributed the most. This is impossible to reconstruct from individual service logs.',
    },
    {
      type: 'bottleneck',
      activeNodes: ['tracing'],
      connections: {},
      badge: 'BOTTLENECK FOUND',
      message: 'Finding the bottleneck span — p99 latency culprit identified',
      detail:
        'The trace shows Service B took 420 ms out of a 450 ms total request. This is the bottleneck. Without tracing you would only see that the overall API is slow, not which service — or which specific operation within a service — is responsible.',
    },
    {
      type: 'log-correlation',
      activeNodes: ['client', 'gateway', 'serviceA', 'serviceB', 'tracing'],
      connections: { 'client-gateway': 'request', 'gateway-serviceA': 'request', 'serviceA-serviceB': 'request', 'serviceA-tracing': 'response', 'serviceB-tracing': 'response' },
      message: 'Trace ID enables three-way correlation: metrics → traces → logs',
      detail:
        'Include the trace ID in every log line. When Prometheus fires a p99 latency alert, look up a slow trace in Jaeger, then query the logs filtered by that trace ID to see exact SQL queries, cache misses, and error messages from every service in context.',
    },
    {
      type: 'sampling',
      activeNodes: ['gateway'],
      connections: {},
      message: 'Tail-based sampling: keep 100% of slow/error traces, drop 99% of fast ones',
      detail:
        "Head-based sampling decides at trace ingress (record 1% randomly). Tail-based sampling decides after the trace completes — it can keep all traces above a latency threshold and discard the rest. The result: you see every incident without drowning in storage costs.",
    },
  ]
}
