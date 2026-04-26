export default {
  id:          'url-shortener',
  type:        'design',
  title:       'Design a URL Shortener',
  category:    'web-services',
  tags:        ['api', 'database', 'cache', 'redis', 'hash', 'scalability'],
  description: 'A service that maps long URLs to short codes (like bit.ly). Handles high read traffic with caching, generates unique codes with Base62, and persists mappings to a database.',
  metaphor:    'A coat-check counter: you hand in a long URL and receive a short ticket (code). Anyone with the ticket can redeem it later for the original coat (URL).',
  path:        '/system-design/url-shortener',
  keyPoints: [
    'Write path: validate → generate Base62 code → persist to DB → warm cache',
    'Read path: parse code → cache lookup → 301 redirect (DB fallback on miss)',
    '7-char Base62 gives 62⁷ ≈ 3.5 trillion unique short codes',
    '301 (permanent) caches at browser; 302 (temporary) preserves analytics',
  ],
}
