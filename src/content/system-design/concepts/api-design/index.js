export default {
  id:          'api-design',
  type:        'concept',
  title:       'API Design',
  category:    'apis',
  tags:        ['api-design', 'versioning', 'pagination', 'idempotency', 'rate-limiting', 'rest'],
  description: 'Principles for designing APIs that are intuitive, stable, and scalable — covering versioning, pagination, idempotency, error handling, and rate limiting.',
  metaphor:    'Designing a public door — it must be clearly labelled, wide enough for everyone, safe to open repeatedly, and must not break when the building is renovated. A good API is a contract that outlasts the code behind it.',
  path:        '/system-design/api-design',
  keyPoints: [
    'Version your API from day one — /v1/ in the URL; breaking changes are inevitable',
    'Paginate all list endpoints — never return unbounded result sets (use cursor-based pagination for large datasets)',
    'Idempotent methods (PUT, DELETE, GET) can be safely retried — design POST endpoints carefully',
    'Rate limit to protect downstream services — return 429 with Retry-After header',
    'Return structured errors with machine-readable codes and human-readable messages',
  ],
}
