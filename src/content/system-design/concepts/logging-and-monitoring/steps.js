export function buildLoggingAndMonitoringSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Logging & Monitoring — you cannot fix what you cannot see',
      detail:
        'Logs record discrete events; metrics track continuous system health. Together they form observability. Without them, every production incident is a black-box puzzle. The goal is to move from "something is broken" to "here is exactly what, where, and why."',
    },
    {
      type: 'app-logs',
      activeNodes: ['app'],
      connections: {},
      message: 'Application emits structured logs to stdout',
      detail:
        'Each log line is JSON with fixed fields: timestamp, severity, service, trace_id, user_id, and an event payload. Structured logs are machine-parseable — you can filter for error severity across 50 services in milliseconds. Free-text logs become unsearchable at scale.',
    },
    {
      type: 'log-aggregation',
      activeNodes: ['app', 'aggregator'],
      connections: { 'app-aggregator': 'request' },
      message: 'Log aggregator (Fluentd) ships logs to central store',
      detail:
        'A sidecar agent (Fluentd, Filebeat, Vector) tails stdout, buffers, and forwards logs to Elasticsearch or CloudWatch Logs. Never SSH into a server to read raw logs — the pod may be dead by the time you look. Centralized logs survive container restarts and scale-downs.',
    },
    {
      type: 'app-metrics',
      activeNodes: ['app', 'metrics'],
      connections: { 'app-metrics': 'request' },
      message: 'App exposes /metrics endpoint — Prometheus scrapes it',
      detail:
        'The app exposes counters, gauges, and histograms via a /metrics endpoint. Prometheus polls it every 15 seconds. Unlike logs (one event per request), metrics are aggregated: HTTP request rate, p99 latency, active DB connections — all as time-series data.',
    },
    {
      type: 'metrics-scrape',
      activeNodes: ['metrics'],
      connections: {},
      message: 'Prometheus stores time-series — the Four Golden Signals',
      detail:
        'The Four Golden Signals (Google SRE): Latency (p50/p95/p99 response times), Traffic (requests/second), Errors (4xx/5xx rate), Saturation (CPU%, memory%, queue depth). Instrument all four. Alert on the ones that directly predict user impact.',
    },
    {
      type: 'alert-fires',
      activeNodes: ['metrics', 'alerting'],
      connections: { 'metrics-alerting': 'request' },
      badge: 'ALERT FIRED',
      message: 'Alert threshold breached — p99 latency > 500 ms for 5 minutes',
      detail:
        'Alerting rules evaluate time-series expressions: when p99_latency > 500ms for 5m, fire PagerDuty. Good alerts are actionable (the engineer knows what to do) and rare (alert fatigue makes all alerts useless). Alert on symptoms — high error rate — not causes like high CPU.',
    },
    {
      type: 'dashboard',
      activeNodes: ['alerting'],
      connections: {},
      message: 'Grafana dashboard shows the full picture: logs + metrics correlated',
      detail:
        'Grafana queries Prometheus and renders time-series graphs for each service. Dashboards show the Four Golden Signals, service dependency health, and business KPIs. During incidents, the metric timeline pinpoints when things broke — essential for root cause analysis.',
    },
    {
      type: 'log-query',
      activeNodes: ['app', 'aggregator'],
      connections: { 'app-aggregator': 'response' },
      message: 'Query logs filtered by trace ID — drill into a single failing request',
      detail:
        'With the trace ID from a Jaeger span, query Elasticsearch for all log lines matching that trace. You see the exact SQL query that timed out, the cache miss, the upstream 503 — all in chronological order from every service involved in that one request.',
    },
    {
      type: 'correlation',
      activeNodes: ['app', 'aggregator', 'metrics', 'alerting'],
      connections: { 'app-aggregator': 'request', 'app-metrics': 'request', 'metrics-alerting': 'request' },
      message: 'Full observability loop: metrics alert → trace → log correlation',
      detail:
        'The complete observability loop: (1) Prometheus fires a high error rate alert, (2) Jaeger shows which service and operation is failing, (3) log query for that trace ID reveals the exact error message and stack trace. Resolution time drops from hours to minutes.',
    },
  ]
}
