export function buildCdnsSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      edgeCache: { 'us-edge': 'cold', 'eu-edge': 'cold' },
      hitResult: null,
      message: 'CDN — a global network of edge caches close to users',
      detail:
        'A CDN distributes your static content across edge nodes worldwide. Users download assets from the nearest edge instead of your origin server — cutting latency from ~200 ms to < 20 ms.',
    },
    {
      type: 'first-request',
      activeNodes: ['user-a', 'us-edge', 'origin'],
      connections: { 'ua-edge': 'request', 'us-origin': 'both' },
      edgeCache: { 'us-edge': 'cold', 'eu-edge': 'cold' },
      hitResult: { node: 'us-edge', type: 'miss' },
      message: 'First request: US Edge cache miss → fetches from origin',
      detail:
        'User A in the US requests /index.js. The nearest US edge has no cached copy (cold cache). It fetches the file from the origin server, stores it with the Cache-Control TTL, then serves the response.',
    },
    {
      type: 'us-warm',
      activeNodes: ['us-edge'],
      connections: {},
      edgeCache: { 'us-edge': 'warm', 'eu-edge': 'cold' },
      hitResult: null,
      message: 'US Edge warms up — content cached for 24 hours',
      detail:
        'Cache-Control: max-age=86400 tells the edge to serve this file for 24 hours without revalidating with the origin. The US edge is now warm — every US user gets a cache hit.',
    },
    {
      type: 'cache-hit',
      activeNodes: ['user-a', 'us-edge'],
      connections: { 'ua-edge': 'both' },
      edgeCache: { 'us-edge': 'warm', 'eu-edge': 'cold' },
      hitResult: { node: 'us-edge', type: 'hit' },
      message: 'Second request: US Edge HIT — served in < 20 ms, origin not touched',
      detail:
        'Any US user requesting the same file gets an instant cache hit. The origin sees zero traffic for this request. At scale this means millions of hits handled at the edge with the origin only receiving compulsory misses.',
    },
    {
      type: 'eu-miss',
      activeNodes: ['user-b', 'eu-edge', 'origin'],
      connections: { 'ub-edge': 'request', 'eu-origin': 'both' },
      edgeCache: { 'us-edge': 'warm', 'eu-edge': 'cold' },
      hitResult: { node: 'eu-edge', type: 'miss' },
      message: 'EU user: EU Edge cache miss → fetches from origin',
      detail:
        "User B in Europe hits the nearest EU edge node. That edge doesn't have the file yet — a compulsory miss — so it fetches from origin. Each edge independently caches the content after its first request.",
    },
    {
      type: 'eu-warm',
      activeNodes: ['user-b', 'eu-edge'],
      connections: { 'ub-edge': 'both' },
      edgeCache: { 'us-edge': 'warm', 'eu-edge': 'warm' },
      hitResult: { node: 'eu-edge', type: 'hit' },
      message: 'EU Edge warms up — subsequent EU users get cache hits',
      detail:
        'Both edges are warm. Origin traffic drops to near zero for this file. Every user worldwide is served from an edge within ~20 ms rather than reaching the origin server across continents.',
    },
    {
      type: 'cache-control',
      activeNodes: ['origin'],
      connections: {},
      edgeCache: { 'us-edge': 'warm', 'eu-edge': 'warm' },
      hitResult: null,
      message: 'Cache-Control headers control what edges cache and for how long',
      detail:
        'Cache-Control: max-age=86400, s-maxage=604800 caches at the edge for 7 days but at the client for 1 day. Content-addressed assets (app.abc123.js) use max-age=31536000 — a full year. Dynamic or personalised responses use Cache-Control: no-store to bypass the edge entirely.',
    },
    {
      type: 'ddos',
      activeNodes: ['user-a', 'user-b', 'us-edge', 'eu-edge'],
      connections: { 'ua-edge': 'request', 'ub-edge': 'request' },
      edgeCache: { 'us-edge': 'warm', 'eu-edge': 'warm' },
      hitResult: null,
      message: 'DDoS protection — edges absorb attack traffic far from the origin',
      detail:
        'CDNs absorb volumetric DDoS traffic at the edge — often 10+ Tbps of distributed scrubbing capacity. The origin is hidden behind the CDN and never exposed to raw internet traffic. Legitimate users continue receiving cache hits; only edge misses ever reach the origin.',
    },
  ]
}
