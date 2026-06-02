export default {
  id:          'cdns',
  type:        'concept',
  title:       'CDNs',
  category:    'caching',
  tags:        ['cdn', 'edge', 'caching', 'latency', 'static-assets', 'distributed', 'ddos'],
  description: 'Content Delivery Networks distribute static assets across global edge servers — serving users from the nearest location to slash latency and absorb traffic spikes.',
  metaphor:    'A chain of local warehouses — instead of shipping every order from one central factory, you pre-position inventory in cities close to your customers. Most orders ship in hours, not days.',
  path:        '/system-design/cdns',
  keyPoints: [
    'CDNs cache static assets at edge nodes close to users — reducing latency from 200 ms to < 20 ms',
    'Origin servers receive only a fraction of traffic once the CDN cache is warm',
    'Cache-Control headers tell the CDN how long to cache each response',
    'Dynamic or personalised content cannot be cached at the edge — only static or shared content can',
    'CDNs absorb DDoS traffic far from the origin, protecting infrastructure',
  ],
}
