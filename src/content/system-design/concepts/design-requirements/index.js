export default {
  id:          'design-requirements',
  type:        'concept',
  title:       'Design Requirements',
  category:    'requirements',
  tags:        ['requirements', 'scalability', 'availability', 'consistency', 'throughput', 'latency', 'sla'],
  description: 'How to define and quantify what a system must do — functional requirements, non-functional requirements (latency, availability, throughput), and back-of-the-envelope estimation.',
  metaphor:    "Writing a blueprint before breaking ground — you specify load capacity, floor count, and fire exits before pouring concrete. Requirements aren't constraints; they're the design itself.",
  path:        '/system-design/design-requirements',
  keyPoints: [
    'Throughput (QPS/RPS) and latency (p50/p99) are the two core performance metrics',
    'Availability is measured in nines — 99.99% means only 52 minutes of downtime per year',
    'Back-of-the-envelope: estimate storage, bandwidth, and compute before picking architecture',
    'CAP theorem — consistency, availability, and partition-tolerance: distributed systems can guarantee only two',
    'Define SLAs and SLOs early — they drive every architectural decision downstream',
  ],
}
