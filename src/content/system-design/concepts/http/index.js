export default {
  id:          'http',
  type:        'concept',
  title:       'HTTP',
  category:    'apis',
  tags:        ['http', 'https', 'request', 'response', 'stateless', 'rest', 'http2'],
  description: 'The request-response protocol powering the web — stateless text-based messages over TCP that allow clients and servers to exchange data.',
  metaphor:    'A waiter taking your order (request) and returning with food (response). Each table visit is independent — the waiter remembers nothing between trips, and every order must carry full context.',
  path:        '/system-design/http',
  keyPoints: [
    'HTTP is stateless — each request must carry all context (headers, auth tokens)',
    'HTTP/1.1 introduced keep-alive connections to avoid per-request TCP handshakes',
    'HTTP/2 multiplexes multiple requests over one TCP connection — eliminating head-of-line blocking',
    'Status codes communicate outcome: 2xx success, 3xx redirect, 4xx client error, 5xx server error',
    'HTTPS wraps HTTP in TLS — all modern APIs require it',
  ],
}
