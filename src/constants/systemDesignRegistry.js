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

// ── Designs ───────────────────────────────────────────────────────────────────
import urlShortener            from '../content/system-design/designs/url-shortener/index.js'

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
  // Designs
  urlShortener,
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
  'infrastructure': 'Infrastructure',
  'social-media':   'Social Media',
  'communication':  'Communication',
  'data-platform':  'Data Platform',
  'streaming':      'Streaming',
  'search':         'Search',
  'api-design':     'API Design',
}
