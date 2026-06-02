export default {
  id:          'networking-basics',
  type:        'concept',
  title:       'Networking Basics',
  category:    'networking',
  tags:        ['networking', 'ip', 'packets', 'protocols', 'osi', 'bandwidth', 'latency'],
  description: 'How computers communicate over a network — IP addresses, packets, routing, and the layered protocol model that governs all internet traffic.',
  metaphor:    'The postal system: every letter has a source address (IP), a destination address, and travels through sorting hubs (routers) to reach the right mailbox (port). Packets are the envelopes; protocols are the postal rules.',
  path:        '/system-design/networking-basics',
  keyPoints: [
    'Every device on a network has an IP address — the unique identifier for routing',
    'Data travels as packets: fixed-size chunks with headers (source, destination, checksum)',
    'The OSI model separates concerns into 7 layers — each layer adds a header',
    'Latency (time to first byte) and bandwidth (bytes per second) are independent axes',
    'Routers forward packets hop-by-hop toward the destination IP',
  ],
}
