/**
 * Steps for the File Storage (Dropbox / Google Drive) design.
 *
 * Story arc:
 *   1. Overview of the system
 *   2. Client uploads — file is chunked
 *   3. Deduplication check (hash lookup)
 *   4. New chunks uploaded to object storage
 *   5. Metadata committed to DB
 *   6. Other devices notified — sync trigger
 *   7. Download: fetch metadata
 *   8. Download: retrieve chunks from object storage / CDN
 *   9. Delta sync — only changed chunks re-uploaded
 *   10. Conflict resolution — two devices edit offline
 *
 * Node IDs: client | syncClient | apiSvc | metaDB | chunkStore | cdn | notifSvc | device2
 */
export function buildFileStorageSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      connections: {},
      message: 'Meet the File Storage Service',
      detail: 'A cloud file sync system like Dropbox or Google Drive must handle files of any size efficiently, sync changes across multiple devices, and avoid storing duplicate data. The key insight: split files into content-addressed chunks so you only transfer what actually changed.',
    },
    {
      type: 'chunking',
      activeNodes: ['client', 'syncClient'],
      connections: {},
      message: 'Client splits the file into fixed-size chunks',
      detail: 'The sync client on the user\'s device divides the file into 4–8 MB blocks. Each chunk is hashed with SHA-256 — the hash IS the chunk\'s ID. A 1 GB file becomes ~128–256 chunks. The client computes the full chunk list and diffs it against its local index to see what changed.',
    },
    {
      type: 'dedup-check',
      activeNodes: ['syncClient', 'apiSvc', 'metaDB'],
      connections: { 'syncClient-apiSvc': 'request', 'apiSvc-metaDB': 'request' },
      message: 'Deduplication check — does this chunk already exist?',
      detail: 'The client sends the list of chunk hashes to the API Service. The Metadata DB checks which hashes are already stored. If two users have the same PDF chapter, that chunk is stored once. Dropbox reported enormous storage savings from cross-user deduplication — the same common files appear millions of times.',
    },
    {
      type: 'upload-chunks',
      activeNodes: ['syncClient', 'apiSvc', 'chunkStore'],
      connections: { 'syncClient-apiSvc': 'request', 'apiSvc-chunkStore': 'request' },
      message: 'Upload only new chunks to object storage',
      detail: 'Only chunks with hashes not found in the store are uploaded. The API Service streams each new chunk to object storage (S3, GCS, or Azure Blob). Chunks are immutable — they are never overwritten, only new chunks are added. This enables safe parallel uploads and CDN caching.',
    },
    {
      type: 'commit-metadata',
      activeNodes: ['apiSvc', 'metaDB'],
      connections: { 'apiSvc-metaDB': 'request' },
      message: 'Commit file metadata — path, version, chunk list',
      detail: 'Once all chunks are stored, the API Service commits a new file version to the Metadata DB: { file_id, user_id, path, version, chunk_hashes[], size, modified_at }. The metadata DB is the source of truth for the file tree, permissions, and version history. Object storage holds only raw bytes.',
    },
    {
      type: 'notify-devices',
      activeNodes: ['apiSvc', 'notifSvc', 'device2'],
      connections: { 'apiSvc-notifSvc': 'request', 'notifSvc-device2': 'response' },
      message: 'Notification service pushes sync event to other devices',
      detail: 'After metadata commit, the API Service publishes a "file changed" event. The Notification Service (long polling or WebSocket) pushes the event to all other logged-in devices for this user. Device 2 receives: { file_id, new_version, changed_chunk_hashes }. It then fetches only the changed chunks.',
    },
    {
      type: 'download-meta',
      activeNodes: ['device2', 'apiSvc', 'metaDB'],
      connections: { 'device2-apiSvc': 'request', 'apiSvc-metaDB': 'request' },
      message: 'Download: device fetches file metadata',
      detail: 'To download (or sync), Device 2 asks the API Service for the file\'s current chunk list. The Metadata DB returns the ordered list of chunk hashes for the latest version. The device compares against its local cache — chunks it already has need not be fetched again.',
    },
    {
      type: 'download-chunks',
      activeNodes: ['device2', 'cdn', 'chunkStore'],
      connections: { 'device2-cdn': 'request', 'cdn-chunkStore': 'request' },
      message: 'Chunks served from CDN or object storage',
      detail: 'Hot (recently accessed) chunks are cached at CDN edge nodes close to the user. Cold chunks are fetched from object storage directly. CDN reduces latency and egress costs for popular shared files. The client downloads each missing chunk by its SHA-256 hash, reassembles in order, and writes the file to disk.',
    },
    {
      type: 'delta-sync',
      activeNodes: ['client', 'syncClient', 'apiSvc', 'chunkStore'],
      connections: { 'syncClient-apiSvc': 'request', 'apiSvc-chunkStore': 'request' },
      message: 'Delta sync — only changed chunks are re-uploaded',
      detail: 'User edits the last paragraph of a 500 MB document. Only the final chunk(s) change — all other chunk hashes stay the same. The sync client uploads just the changed chunks (a few MB) and commits a new version pointing to the same old chunks + the new ones. This is delta sync: bandwidth proportional to the change, not the file size.',
      banner: {
        icon: '⚡',
        color: 'violet',
        title: 'Delta Sync Active',
        text: 'Only changed chunks are uploaded. Bandwidth is proportional to the edit, not the file size — editing 1 KB of a 500 MB file uploads 1 KB.',
      },
    },
    {
      type: 'conflict',
      activeNodes: ['client', 'device2', 'apiSvc', 'metaDB'],
      connections: { 'client-apiSvc': 'request', 'device2-apiSvc': 'request', 'apiSvc-metaDB': 'request' },
      message: 'Conflict: two devices edited the same file offline',
      detail: 'Device 1 and Device 2 both modify "report.docx" while offline. When they reconnect, the first sync wins — "report.docx" gets its changes. The second device\'s version is saved as "report (Device 2\'s conflicted copy 2024-01-15).docx". The user resolves manually. Automatic merge is only reliable for plain text with line-level diffing; binary files cannot be merged safely.',
      banner: {
        icon: '⚠️',
        color: 'rose',
        title: 'Conflict Detected',
        text: 'Two offline devices created divergent versions. A conflict copy is saved — the user resolves manually. Auto-merge is unsafe for binary files.',
      },
    },
  ]
}
