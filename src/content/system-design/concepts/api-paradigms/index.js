export default {
  id:          'api-paradigms',
  type:        'concept',
  title:       'API Paradigms',
  category:    'apis',
  tags:        ['rest', 'graphql', 'grpc', 'api', 'protobuf', 'http', 'microservices'],
  description: 'The three dominant API styles — REST, GraphQL, and gRPC — and when each is the right tool for the job.',
  metaphor:    'Three ways to order food: REST is a fixed menu with clear item codes; GraphQL lets you specify exactly which ingredients you want on your plate; gRPC is a direct line to the kitchen with machine-readable order forms.',
  path:        '/system-design/api-paradigms',
  keyPoints: [
    'REST uses HTTP verbs and resources — simple, widely supported, but often over-fetches data',
    'GraphQL lets clients request exactly the fields they need — fewer round-trips, flexible for mobile',
    'gRPC uses Protocol Buffers over HTTP/2 — strongly typed, high-performance, ideal for internal services',
    'REST dominates public APIs; gRPC dominates internal microservice communication',
    'GraphQL wins when client data requirements vary widely (e.g. web vs. mobile vs. IoT)',
  ],
}
