export default {
  id:          'application-architecture',
  type:        'concept',
  title:       'Application Architecture',
  category:    'architecture',
  tags:        ['architecture', 'client-server', 'monolith', 'microservices', 'scalability', 'stateless'],
  description: 'How software is structured across clients, servers, and services — and why the architectural choices you make today shape every scaling decision tomorrow.',
  metaphor:    'A restaurant: the front-of-house (client) takes orders, the kitchen (server) fulfils them, and the supply chain (databases/services) keeps everything stocked. Good architecture means no single station ever becomes the bottleneck.',
  path:        '/system-design/application-architecture',
  keyPoints: [
    'Client-server is the foundation of all networked applications',
    'Monoliths are simpler to build and deploy — scale vertically until you hit a wall',
    'Microservices scale horizontally but add operational complexity (service discovery, distributed tracing)',
    'Stateless servers make horizontal scaling trivial — session state belongs in a shared cache or DB',
    'Every added layer introduces latency — design for the minimum number of network hops',
  ],
}
