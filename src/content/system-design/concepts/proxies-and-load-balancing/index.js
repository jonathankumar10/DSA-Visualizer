export default {
  id:          'proxies-and-load-balancing',
  type:        'concept',
  title:       'Proxies and Load Balancing',
  category:    'proxies',
  tags:        ['proxy', 'load-balancer', 'reverse-proxy', 'nginx', 'round-robin', 'scaling', 'ssl'],
  description: 'How traffic is routed, distributed, and filtered between clients and servers — forward proxies for client anonymity, reverse proxies for server protection, load balancers for horizontal scaling.',
  metaphor:    'A traffic controller at a busy intersection — directing vehicles to open lanes, hiding the internal road layout, and preventing any single road from becoming gridlocked.',
  path:        '/system-design/proxies-and-load-balancing',
  keyPoints: [
    'Forward proxies sit in front of clients — used for privacy, filtering, and corporate security',
    'Reverse proxies sit in front of servers — SSL termination, caching, and routing',
    'Load balancers distribute requests across a server pool: round-robin, least-connections, or IP hash',
    'Health checks automatically remove failed servers from the pool',
    'L4 load balancers route by IP/TCP; L7 load balancers route by HTTP path, headers, or cookies',
  ],
}
