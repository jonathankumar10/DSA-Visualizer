/**
 * Steps for the Chat System design.
 *
 * Story arc:
 *   1. User A opens the app — WebSocket connection established
 *   2. User A sends a message
 *   3. Chat Service receives and assigns a sequence ID
 *   4. Message persisted to Cassandra
 *   5. Presence service routes to User B's server
 *   6. Message delivered to User B via WebSocket
 *   7. User B offline — push notification fallback
 *   8. User B reconnects — sync missed messages
 *   9. Group chat fan-out
 *   10. Full system view
 *
 * Node IDs: userA | gateway | chatSvc | sequencer | cassandra | presence | mq | userB | pushSvc
 */
export function buildChatSystemSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Meet the Chat System',
      detail: 'A real-time chat system (think WhatsApp or Slack) must maintain persistent bidirectional connections, order messages consistently across servers, and deliver reliably even when recipients are offline. HTTP request-response cannot do this — the server must push to clients.',
    },
    {
      type: 'websocket-connect',
      activeNodes: ['userA', 'gateway', 'chatSvc'],
      connections: { 'userA-gateway': 'request', 'gateway-chatSvc': 'request' },
      message: 'User A connects — WebSocket handshake',
      detail: 'The client upgrades the HTTP connection to a WebSocket. From this point on, both client and server can send frames at any time without polling. Each online user holds one persistent WebSocket connection to a Chat Server. A Connection Store (Redis) maps user ID → server ID.',
    },
    {
      type: 'presence-register',
      activeNodes: ['chatSvc', 'presence'],
      connections: { 'chatSvc-presence': 'request' },
      message: 'Presence service records User A as online',
      detail: 'On connect, the Chat Server writes user_id → {server_id, last_seen} into the Presence Service (Redis). Clients send a heartbeat every 5 s; if the server sees no heartbeat for 30 s it marks the user offline. This is how "online" indicators work — not a separate API, just a TTL in Redis.',
    },
    {
      type: 'send-message',
      activeNodes: ['userA', 'gateway', 'chatSvc'],
      connections: { 'userA-gateway': 'request', 'gateway-chatSvc': 'request' },
      message: 'User A sends a message',
      detail: 'The client sends a WebSocket frame: { conversation_id, sender_id, content, client_seq }. The client_seq is a temporary local ID — the server will replace it with a globally ordered sequence ID before storing.',
    },
    {
      type: 'sequence-id',
      activeNodes: ['chatSvc', 'sequencer'],
      connections: { 'chatSvc-sequencer': 'request' },
      message: 'Sequence ID generator assigns a global order',
      detail: 'The Chat Server calls a Snowflake-style ID generator that returns a 64-bit ID encoding timestamp + machine ID + sequence. This is the canonical message ID — not wall-clock time. Relying on wall-clock timestamps for ordering breaks when clients have skewed clocks or when messages arrive out of order at the server.',
    },
    {
      type: 'persist-message',
      activeNodes: ['chatSvc', 'cassandra'],
      connections: { 'chatSvc-cassandra': 'request' },
      message: 'Message persisted to Cassandra',
      detail: 'Schema: partition key = conversation_id, clustering key = message_id (descending). This maps the access pattern — "give me the last 50 messages in conversation X" — to a single partition scan. Cassandra writes are fast (append-only LSM tree) and naturally handle high write throughput from thousands of concurrent conversations.',
    },
    {
      type: 'route-to-recipient',
      activeNodes: ['chatSvc', 'presence', 'mq'],
      connections: { 'chatSvc-presence': 'request', 'chatSvc-mq': 'request' },
      message: 'Routing: look up User B\'s server, publish to Message Queue',
      detail: 'The Chat Server looks up User B in the Presence Service to find which server B is connected to. It then publishes the message to a Kafka topic (or Redis Pub/Sub channel) for that server. A Message Queue decouples the sender\'s server from the recipient\'s server — no direct server-to-server calls needed.',
    },
    {
      type: 'deliver-online',
      activeNodes: ['mq', 'chatSvc', 'userB'],
      connections: { 'mq-chatSvc': 'response', 'chatSvc-userB': 'response' },
      message: 'Message delivered to User B via WebSocket',
      detail: 'User B\'s Chat Server consumes from the queue and pushes the message frame down B\'s WebSocket connection. B\'s client acknowledges receipt; the server updates the message status to "delivered." Sub-second delivery end-to-end when both users are online.',
    },
    {
      type: 'offline-push',
      activeNodes: ['chatSvc', 'pushSvc', 'userB'],
      connections: { 'chatSvc-pushSvc': 'request', 'pushSvc-userB': 'response' },
      message: 'User B is offline — push notification via APNs/FCM',
      detail: 'If User B has no active WebSocket connection, the Chat Server calls the Push Notification Service, which dispatches to APNs (iOS) or FCM (Android). The push notification contains a "you have a new message" alert, not the message content — the full message is fetched when B opens the app and reconnects.',
    },
    {
      type: 'reconnect-sync',
      activeNodes: ['userB', 'gateway', 'chatSvc', 'cassandra'],
      connections: { 'userB-gateway': 'request', 'gateway-chatSvc': 'request', 'chatSvc-cassandra': 'request' },
      message: 'User B reconnects — sync missed messages',
      detail: 'On reconnect, the client sends its last known message_id. The server queries Cassandra for all messages in relevant conversations after that ID. No "you missed X messages" lossy summary — a full ordered replay. This is why storing messages with monotonically increasing IDs in a range-queryable store matters.',
    },
    {
      type: 'group-fanout',
      activeNodes: ['chatSvc', 'mq', 'presence'],
      connections: { 'chatSvc-mq': 'request', 'chatSvc-presence': 'request' },
      message: 'Group chat: fan-out to N members',
      detail: 'When a message is sent to a group, the Chat Service looks up all group members in the Presence Service and publishes one message per member to the queue. This "fan-out on write" is expensive at scale — WhatsApp caps groups at 256; Slack uses coarser presence and lazy fan-out. For massive groups, fan-out on read (pull model) may be more efficient.',
    },
  ]
}
