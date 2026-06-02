export default {
  id:          'websockets',
  type:        'concept',
  title:       'WebSockets',
  category:    'apis',
  tags:        ['websockets', 'real-time', 'full-duplex', 'tcp', 'push', 'streaming', 'bidirectional'],
  description: 'A persistent full-duplex communication channel over a single TCP connection — enabling real-time bidirectional data flow between client and server without polling.',
  metaphor:    'A phone call instead of sending letters. Both parties stay connected and can speak simultaneously at any moment — rather than one person mailing a letter and waiting for a reply.',
  path:        '/system-design/websockets',
  keyPoints: [
    'WebSockets upgrade an HTTP connection to a persistent bidirectional channel',
    'Either side can push data at any time — no polling, no waiting for a request',
    'Ideal for: chat, live dashboards, multiplayer games, collaborative editing, stock tickers',
    'Servers maintain state per open connection — horizontal scaling requires sticky sessions or a shared pub/sub layer (Redis)',
    'Long-polling is the HTTP fallback when WebSockets are unavailable',
  ],
}
