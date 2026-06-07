export function buildHttpSteps() {
  return [
    {
      type:       'intro',
      connection: null,
      messages:   [],
      panel:      null,
      message:    'HTTP: the request-response protocol of the web',
      detail:     'HTTP (HyperText Transfer Protocol) is a stateless request-response protocol. A client sends a request — method, path, headers, optional body. A server returns a response — status code, headers, optional body. Every exchange is self-contained: the server holds no memory between requests, which is what makes HTTP services easy to scale horizontally.',
    },
    {
      type:       'tcp-connect',
      connection: 'connecting',
      messages:   [],
      panel:      null,
      message:    'TCP connection established (+ TLS handshake for HTTPS)',
      detail:     'Before HTTP can exchange a single byte, TCP performs a three-way handshake (SYN → SYN-ACK → ACK). For HTTPS, a TLS handshake follows: server sends its certificate, client verifies it, both agree on a cipher suite and derive a session key. HTTP/1.0 repeated this overhead for every request — HTTP/1.1 eliminated it with keep-alive connections.',
    },
    {
      type:       'get-request',
      connection: 'http11',
      messages:   [{ dir: 'forward', label: 'GET /api/users', color: '#6366f1', glow: 'rgba(99,102,241,0.8)' }],
      panel: {
        type:    'request',
        first:   'GET /api/users HTTP/1.1',
        headers: [
          ['Host',          'api.example.com'],
          ['Accept',        'application/json'],
          ['Authorization', 'Bearer eyJ0eXAiOiJKV1QiL...'],
          ['Connection',    'keep-alive'],
        ],
        body: null,
      },
      message: 'Client sends a GET request',
      detail:  'A request line (method + path + HTTP version) is followed by headers — key-value metadata. Host is required in HTTP/1.1 and identifies the virtual host. Accept tells the server what MIME types the client handles. Authorization carries the bearer token. GET requests have no body — only POST, PUT, and PATCH carry a payload.',
    },
    {
      type:       '200-ok',
      connection: 'http11',
      messages:   [{ dir: 'backward', label: '200 OK', color: '#10b981', glow: 'rgba(16,185,129,0.8)' }],
      panel: {
        type:       'response',
        first:      'HTTP/1.1 200 OK',
        statusCode: 200,
        headers: [
          ['Content-Type',   'application/json; charset=utf-8'],
          ['Content-Length', '842'],
          ['Cache-Control',  'max-age=300, public'],
          ['X-Request-Id',   'a3f9d2c1-4b8e-11ef'],
        ],
        body: '[ { "id": 1, "name": "Alice" }, ... ]',
      },
      message: 'Server responds with 200 OK',
      detail:  'The status line (version + code + reason) is followed by headers, a blank line, then the optional body. Status codes: 2xx success (200 OK, 201 Created, 204 No Content), 3xx redirect (301 Permanent, 302 Temporary, 304 Not Modified), 4xx client error (400, 401, 403, 404, 429), 5xx server error (500, 502 Bad Gateway, 503 Unavailable).',
    },
    {
      type:       'keepalive',
      connection: 'http11',
      messages:   [{ dir: 'forward', label: 'POST /api/orders', color: '#6366f1', glow: 'rgba(99,102,241,0.8)' }],
      panel: {
        type:    'request',
        first:   'POST /api/orders HTTP/1.1',
        headers: [
          ['Host',           'api.example.com'],
          ['Content-Type',   'application/json'],
          ['Content-Length', '38'],
          ['Connection',     'keep-alive'],
        ],
        body: '{ "item": "widget", "quantity": 3 }',
      },
      message: 'HTTP/1.1 keep-alive: second request reuses the TCP connection',
      detail:  'HTTP/1.1 defaults to Connection: keep-alive — the TCP (and TLS) connection stays open after each response. On a 50 ms RTT link, reusing the connection saves ~150 ms per request (TCP + TLS handshake costs). Connections close after an idle timeout or an explicit Connection: close header. HTTP/1.1 still serializes: request 2 waits for request 1\'s response.',
    },
    {
      type:       'http2-multiplex',
      connection: 'http2',
      messages: [
        { dir: 'forward', label: 'GET /users',  color: '#6366f1', glow: 'rgba(99,102,241,0.8)',  stream: 1 },
        { dir: 'forward', label: 'GET /posts',  color: '#8b5cf6', glow: 'rgba(139,92,246,0.8)',  stream: 3 },
        { dir: 'forward', label: 'GET /images', color: '#a855f7', glow: 'rgba(168,85,247,0.8)', stream: 5 },
      ],
      panel: null,
      message: 'HTTP/2: three requests fly in parallel on one TCP connection',
      detail:  'HTTP/2 multiplexes multiple request-response exchanges over a single TCP connection using streams (each assigned an integer stream ID). HTTP/1.1 serialized — request 2 had to wait for request 1\'s response. HTTP/2 eliminates head-of-line blocking at the HTTP layer. Odd IDs are client-initiated; even are server push.',
    },
    {
      type:       'http2-responses',
      connection: 'http2',
      messages: [
        { dir: 'backward', label: '200 /images', color: '#10b981', glow: 'rgba(16,185,129,0.8)',  stream: 5 },
        { dir: 'backward', label: '200 /users',  color: '#34d399', glow: 'rgba(52,211,153,0.8)',  stream: 1 },
        { dir: 'backward', label: '200 /posts',  color: '#6ee7b7', glow: 'rgba(110,231,183,0.8)', stream: 3 },
      ],
      panel: null,
      message: 'HTTP/2: responses return out-of-order — whichever is ready first',
      detail:  'Responses arrive in any order — the client reassembles them by stream ID. HTTP/2 also binary-frames data (instead of text), compresses headers with HPACK, and supports server push. HTTP/3 replaces the underlying TCP with QUIC to eliminate transport-level head-of-line blocking (a TCP packet drop stalls all streams; QUIC isolates losses per stream).',
    },
  ]
}
