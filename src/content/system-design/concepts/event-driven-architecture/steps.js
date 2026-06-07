export function buildEventDrivenArchitectureSteps() {
  return [
    {
      type:        'intro',
      activeNodes: [],
      connections: {},
      message:     'Event-Driven Architecture: services communicate through events, not direct calls',
      detail:      'In EDA, services are producers and consumers of events. An event is an immutable fact — "OrderPlaced", "PaymentProcessed" — broadcast to a central broker. Producers emit events without knowing who will react. Consumers subscribe without knowing who emitted. This decoupling is the foundational property that makes EDA extensible and resilient.',
    },
    {
      type:        'produce',
      activeNodes: ['order-svc'],
      connections: {},
      message:     'Producer: Order Service emits "OrderPlaced"',
      detail:      'The Order Service processes a new order and emits an "OrderPlaced" event — an immutable record stamped with what happened, when, and all relevant data. The Order Service does not call Inventory, Notifications, or Analytics directly. It publishes the fact and moves on. Zero knowledge of consumers.',
    },
    {
      type:        'broker-receives',
      activeNodes: ['order-svc', 'kafka'],
      connections: { 'order-kafka': 'request' },
      message:     'Event Broker: Kafka durably stores the event in a partitioned log',
      detail:      'The event lands in a Kafka topic — a partitioned, append-only log. Kafka acknowledges the write and the producer is done. The event is now durable: it will be delivered to all subscribers regardless of whether they are online at publish time. Kafka retains events for a configurable period, enabling full replay and backfilling of new consumers.',
    },
    {
      type:        'fan-inventory',
      activeNodes: ['kafka', 'inventory-svc'],
      connections: { 'order-kafka': 'request', 'kafka-inventory': 'request' },
      message:     'Consumer 1: Inventory Service reacts — reserves stock',
      detail:      'The Inventory Service subscribes to the "OrderPlaced" topic. On receiving the event, it reserves the ordered items and commits its consumer offset. If the service restarts, Kafka resumes from the last committed offset — no event is processed twice. This consumer runs independently of every other consumer.',
    },
    {
      type:        'fan-notifs',
      activeNodes: ['kafka', 'notif-svc'],
      connections: { 'order-kafka': 'request', 'kafka-notifs': 'request' },
      message:     'Consumer 2: Notification Service reacts — sends confirmation email',
      detail:      'The Notification Service independently subscribes to the same "OrderPlaced" event. It sends a confirmation email. This service was added without changing a single line in the Order Service — zero producer changes required. Any future consumer (fraud detection, loyalty points) can be plugged in the same way.',
    },
    {
      type:        'fan-analytics',
      activeNodes: ['kafka', 'analytics-svc'],
      connections: { 'order-kafka': 'request', 'kafka-analytics': 'request' },
      message:     'Consumer 3: Analytics Service reacts — updates real-time dashboards',
      detail:      'The Analytics Service subscribes to multiple event types and maintains real-time dashboards and aggregates. It can replay events from offset 0 to backfill historical data or build new projections. This is event sourcing in practice: current state is derived by replaying the event log, not from a single snapshot.',
    },
    {
      type:        'full-fan-out',
      activeNodes: ['order-svc', 'kafka', 'inventory-svc', 'notif-svc', 'analytics-svc'],
      connections: {
        'order-kafka':     'request',
        'kafka-inventory': 'request',
        'kafka-notifs':    'request',
        'kafka-analytics': 'request',
      },
      message:     'Fan-out: one event, three independent reactions',
      detail:      'A single "OrderPlaced" event fans out to all three consumer groups simultaneously. Each processes at its own pace. Inventory may lag during a flash sale without blocking notifications or analytics. Kafka\'s consumer groups guarantee each event is processed exactly once per group — even when multiple replicas of a consumer run for horizontal scale.',
    },
    {
      type:        'payment-flow',
      activeNodes: ['payment-svc', 'kafka', 'notif-svc'],
      connections: {
        'payment-kafka': 'request',
        'kafka-notifs':  'request',
      },
      message:     'Payment Service publishes "PaymentProcessed" — Notifications reacts',
      detail:      'The Payment Service is also a producer. After charging the card it emits "PaymentProcessed". Notifications subscribes to this event and sends a payment receipt. Payment Service and Notification Service share zero direct dependency — they are coupled only through the event schema. Schema evolution follows backward-compatible rules: add optional fields, never remove.',
    },
    {
      type:        'full-system',
      activeNodes: ['order-svc', 'payment-svc', 'kafka', 'inventory-svc', 'notif-svc', 'analytics-svc'],
      connections: {
        'order-kafka':     'request',
        'payment-kafka':   'request',
        'kafka-inventory': 'request',
        'kafka-notifs':    'request',
        'kafka-analytics': 'request',
      },
      message:     'Full system: choreography without a central conductor',
      detail:      'Two producers publish domain events; three consumers react independently. No orchestrator knows the full flow — each service knows only the events it cares about. Adding a fourth consumer (fraud detection, loyalty rewards) requires zero changes to any existing service. Each consumer group scales independently based on event lag. The outbox pattern guarantees events are published if and only if the originating transaction commits.',
    },
  ]
}
