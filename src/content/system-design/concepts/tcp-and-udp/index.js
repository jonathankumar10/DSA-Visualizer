export default {
  id:          'tcp-and-udp',
  type:        'concept',
  title:       'TCP and UDP',
  category:    'networking',
  tags:        ['tcp', 'udp', 'transport', 'reliability', 'latency', 'handshake', 'streaming'],
  description: 'The two transport-layer protocols powering almost all internet communication — TCP for reliable ordered delivery, UDP for fast best-effort transmission.',
  metaphor:    'TCP is a phone call — both sides acknowledge, nothing is lost, the conversation is ordered. UDP is a radio broadcast — fast and one-way, some listeners might miss a word but nobody waits to confirm.',
  path:        '/system-design/tcp-and-udp',
  keyPoints: [
    'TCP establishes a connection with a 3-way handshake before sending any data',
    'TCP guarantees ordering, delivery, and error correction — at a latency cost',
    'UDP sends datagrams with no setup, no guarantee, and minimal overhead',
    'Real-time apps (gaming, video calls, DNS lookups) use UDP for speed',
    'File transfers, HTTP, and databases use TCP for reliability',
  ],
}
