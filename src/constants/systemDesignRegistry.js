// ── Background ────────────────────────────────────────────────────────────────
import computerArchitecture    from '../content/system-design/concepts/computer-architecture/index.js'
import applicationArchitecture from '../content/system-design/concepts/application-architecture/index.js'
import designRequirements      from '../content/system-design/concepts/design-requirements/index.js'

// ── Networking ────────────────────────────────────────────────────────────────
import networkingBasics        from '../content/system-design/concepts/networking-basics/index.js'
import tcpAndUdp               from '../content/system-design/concepts/tcp-and-udp/index.js'
import dns                     from '../content/system-design/concepts/dns/index.js'

// ── APIs ──────────────────────────────────────────────────────────────────────
import http                    from '../content/system-design/concepts/http/index.js'
import websockets              from '../content/system-design/concepts/websockets/index.js'
import apiParadigms            from '../content/system-design/concepts/api-paradigms/index.js'
import apiDesign               from '../content/system-design/concepts/api-design/index.js'

// ── Caching Basics ────────────────────────────────────────────────────────────
import caching                 from '../content/system-design/concepts/caching/index.js'
import cdns                    from '../content/system-design/concepts/cdns/index.js'

// ── Proxies ───────────────────────────────────────────────────────────────────
import proxiesAndLoadBalancing from '../content/system-design/concepts/proxies-and-load-balancing/index.js'
import consistentHashing       from '../content/system-design/concepts/consistent-hashing/index.js'

// ── Storage ───────────────────────────────────────────────────────────────────
import sql                     from '../content/system-design/concepts/sql/index.js'
import nosql                   from '../content/system-design/concepts/nosql/index.js'
import databaseReplication     from '../content/system-design/concepts/database-replication/index.js'
import databaseSharding        from '../content/system-design/concepts/database-sharding/index.js'
import databaseIndexes         from '../content/system-design/concepts/database-indexes/index.js'
import acidAndBase             from '../content/system-design/concepts/acid-and-base/index.js'
import objectStorage           from '../content/system-design/concepts/object-storage/index.js'

// ── Reliability ───────────────────────────────────────────────────────────────
import capTheorem              from '../content/system-design/concepts/cap-theorem/index.js'
import consistencyPatterns     from '../content/system-design/concepts/consistency-patterns/index.js'
import availabilityPatterns    from '../content/system-design/concepts/availability-patterns/index.js'

// ── Scalability ───────────────────────────────────────────────────────────────
import rateLimiting            from '../content/system-design/concepts/rate-limiting/index.js'

// ── Messaging ─────────────────────────────────────────────────────────────────
import messageQueues           from '../content/system-design/concepts/message-queues/index.js'

// ── Observability ─────────────────────────────────────────────────────────────
import loggingAndMonitoring    from '../content/system-design/concepts/logging-and-monitoring/index.js'
import distributedTracing      from '../content/system-design/concepts/distributed-tracing/index.js'

// ── Architecture ──────────────────────────────────────────────────────────────
import microservices           from '../content/system-design/concepts/microservices/index.js'
import eventDrivenArchitecture from '../content/system-design/concepts/event-driven-architecture/index.js'

// ── Designs ───────────────────────────────────────────────────────────────────
import urlShortener            from '../content/system-design/designs/url-shortener/index.js'
import keyValueStore           from '../content/system-design/designs/key-value-store/index.js'
import rateLimiterDesign       from '../content/system-design/designs/rate-limiter/index.js'
import notificationSystem      from '../content/system-design/designs/notification-system/index.js'
import chatSystem              from '../content/system-design/designs/chat-system/index.js'
import videoStreaming          from '../content/system-design/designs/video-streaming/index.js'
import socialMediaFeed         from '../content/system-design/designs/social-media-feed/index.js'
import fileStorage             from '../content/system-design/designs/file-storage/index.js'
import searchAutocomplete      from '../content/system-design/designs/search-autocomplete/index.js'

// Ordered following the NeetCode System Design for Beginners curriculum.
// Add new topics here — one import + one array entry.
export const SYSTEM_DESIGN = [
  // Background
  computerArchitecture,
  applicationArchitecture,
  designRequirements,
  // Networking
  networkingBasics,
  tcpAndUdp,
  dns,
  // APIs
  http,
  websockets,
  apiParadigms,
  apiDesign,
  // Caching Basics
  caching,
  cdns,
  // Proxies
  proxiesAndLoadBalancing,
  consistentHashing,
  // Storage
  sql,
  nosql,
  databaseReplication,
  databaseSharding,
  databaseIndexes,
  acidAndBase,
  objectStorage,
  // Reliability
  capTheorem,
  consistencyPatterns,
  availabilityPatterns,
  // Scalability
  rateLimiting,
  // Messaging
  messageQueues,
  // Observability
  loggingAndMonitoring,
  distributedTracing,
  // Architecture
  microservices,
  eventDrivenArchitecture,
  // Designs
  urlShortener,
  keyValueStore,
  rateLimiterDesign,
  notificationSystem,
  chatSystem,
  videoStreaming,
  socialMediaFeed,
  fileStorage,
  searchAutocomplete,
]

// type → display label
export const TYPE_LABEL = {
  concept: 'Concept',
  design:  'Design',
}

// type → colour tokens
export const TYPE_COLOR = {
  concept: 'text-sky-400 bg-sky-400/10',
  design:  'text-blue-400 bg-blue-400/10',
}

// category slug → display label
export const SD_CATEGORY_LABELS = {
  'hardware':       'Hardware',
  'architecture':   'Architecture',
  'requirements':   'Requirements',
  'networking':     'Networking',
  'apis':           'APIs',
  'caching':        'Caching',
  'proxies':        'Proxies',
  'storage':        'Storage',
  'web-services':   'Web Services',
  'databases':      'Databases',
  'security':       'Security',
  'reliability':    'Reliability',
  'scalability':    'Scalability',
  'messaging':      'Messaging & Queues',
  'observability':  'Observability',
  'designs':        'System Designs',
  'infrastructure': 'Infrastructure',
  'social-media':   'Social Media',
  'communication':  'Communication',
  'data-platform':  'Data Platform',
  'streaming':      'Streaming',
  'search':         'Search',
  'api-design':     'API Design',
}
