export function buildObjectStorageSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Object Storage — exabyte-scale files accessible via HTTP API',
      detail:
        'Object storage (S3, GCS, Azure Blob) replaces file systems for unstructured data. Unlike a database, it stores discrete objects — each with its own key, data, and metadata — in a flat namespace. No file paths, no directories, no size limits. Costs pennies per GB per month.',
    },
    {
      type: 'upload',
      activeNodes: ['client', 'api'],
      connections: { 'client-api': 'request' },
      message: 'Client uploads file via HTTP PUT to the storage API',
      detail:
        'The client sends a PUT request with the file body. For files under 5 MB, a single PUT is fine. For larger files, use multipart upload: split into ≥5 MB parts, upload in parallel, then call CompleteMultipartUpload. A failed network only wastes the current part, not the whole transfer.',
    },
    {
      type: 'key-generated',
      activeNodes: ['api'],
      connections: {},
      badge: 'KEY ASSIGNED',
      message: 'Storage assigns a globally unique key to the object',
      detail:
        'The object is stored at a key like "uploads/2024/user-123/profile.jpg". Keys can contain slashes to simulate a directory structure, but the namespace is fundamentally flat — there are no real directories or inodes. The key is the only address you need to retrieve the object.',
    },
    {
      type: 'replication',
      activeNodes: ['api', 'nodeA', 'nodeB', 'nodeC'],
      connections: { 'api-nodeA': 'request', 'api-nodeB': 'request', 'api-nodeC': 'request' },
      message: 'Object replicated across multiple storage nodes for durability',
      detail:
        'S3 stores each object across at least 3 availability zones within a region. Durability is 99.999999999% (11 nines). After replication, S3 acknowledges the PUT. Read-after-write consistency: a GET immediately after the PUT returns the new object, guaranteed.',
    },
    {
      type: 'retrieve',
      activeNodes: ['client', 'api', 'nodeA'],
      connections: { 'client-api': 'request', 'api-nodeA': 'response' },
      message: 'Retrieve by key — no path traversal, no filesystem overhead',
      detail:
        'The client issues GET bucket/key. The API locates the object in constant time — no directory traversal, no inode table walk. Object storage is optimized for this access pattern: large sequential reads of whole objects, not random byte-range access.',
    },
    {
      type: 'immutability',
      activeNodes: ['api'],
      connections: {},
      message: 'Objects are immutable — overwrite creates a new version',
      detail:
        'You cannot partially update an object. A new PUT under the same key either overwrites it (versioning off) or creates a new version (versioning on). With versioning, deleting an object creates a delete marker — the original is preserved. This makes object storage safe for audit trails and backups.',
    },
    {
      type: 'presigned-url',
      activeNodes: ['client', 'api'],
      connections: { 'client-api': 'response' },
      badge: 'PRESIGNED URL',
      message: 'Presigned URL — temporary scoped access without exposing credentials',
      detail:
        'The backend generates a URL signed with its credentials that expires in N minutes. The client uses this URL to upload/download directly to S3, bypassing your API servers entirely. This eliminates bandwidth cost and server load for large file transfers — a critical pattern for any upload feature.',
    },
    {
      type: 'lifecycle',
      activeNodes: ['api', 'nodeA', 'nodeB', 'nodeC'],
      connections: {},
      message: 'Lifecycle policies: Standard → Infrequent Access → Glacier automatically',
      detail:
        'Lifecycle rules transition objects through storage tiers based on age or last access. Standard (4¢/GB/month) for active data, Infrequent Access (1¢/GB/month) for cold data, Glacier (0.4¢/GB/month) for archives. Policies also delete objects after N days — essential for log retention and GDPR compliance.',
    },
    {
      type: 'cdn',
      activeNodes: ['client', 'api'],
      connections: { 'client-api': 'response' },
      message: 'CDN caches objects at edge — latency drops from 150 ms to 5 ms',
      detail:
        'Attach CloudFront (or Fastly, Akamai) as a CDN in front of S3. The first request per edge location hits S3; subsequent requests are served from the CDN cache. For globally distributed users, this is the difference between a snappy app and a sluggish one. Always use a CDN for public static assets.',
    },
  ]
}
