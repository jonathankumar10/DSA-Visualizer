/**
 * Video Streaming — full system design step trace.
 *
 * Node IDs: uploader | uploadsvc | transcoder | storage | cdn | player
 *
 * Layout:
 *   uploader (left) → uploadsvc (center-left) → transcoder (center)
 *   transcoder → storage (center-right, S3)
 *   storage → cdn (right-top)
 *   player (right-bottom) ← cdn
 *   player → cdn → storage (playback path)
 *
 * Step shape:
 *   type         — identifier string
 *   activeNodes  — node IDs to highlight
 *   connections  — edge ID → direction string
 *   message      — short label shown in the panel
 *   detail       — 1–2 interview-prep sentences
 */
export function buildVideoStreamingSteps() {
  return [
    {
      type:        'init',
      activeNodes: [],
      connections: {},
      message:     'Meet the video streaming platform',
      detail:      'A video streaming service must handle two fundamentally different flows: a write-heavy upload + transcoding pipeline, and a read-heavy playback path serving millions of concurrent viewers. The key principle is that application servers should never touch video bytes — raw upload goes directly to object storage, and playback is served entirely by CDN.',
    },
    {
      type:        'chunked-upload',
      activeNodes: ['uploader', 'uploadsvc'],
      connections: { 'uploader-uploadsvc': 'request' },
      message:     'User uploads raw video — chunked with resumable protocol',
      detail:      'The Upload Service generates a presigned S3 URL and returns it to the client. The client uploads raw video directly to S3 via multipart upload — chunks of 5–500MB each. If the connection drops, the upload resumes from the last completed chunk. Never stream video through application servers: they become the bottleneck at scale.',
    },
    {
      type:        'raw-to-storage',
      activeNodes: ['uploadsvc', 'storage'],
      connections: { 'uploadsvc-storage': 'request' },
      message:     'Raw video lands in object storage (S3)',
      detail:      'The raw, unprocessed video file is stored in S3 under a raw/ prefix. The Upload Service writes metadata (title, uploader, duration hint) to a relational database and publishes a transcoding job to a message queue. The video is not yet viewable — transcoding has not run.',
    },
    {
      type:        'transcode-triggered',
      activeNodes: ['uploadsvc', 'transcoder'],
      connections: { 'uploadsvc-transcoder': 'request' },
      message:     'Transcoding job triggered via message queue',
      detail:      'A pool of transcoding workers picks up the job from the queue. Transcoding is the most compute-intensive part of the pipeline — use horizontally scalable, spot-instance workers triggered by a queue; never transcode synchronously in the upload handler, which would block the HTTP response for minutes.',
    },
    {
      type:        'multi-resolution',
      activeNodes: ['transcoder'],
      connections: {},
      message:     'Transcoding produces multiple quality levels',
      detail:      'FFmpeg or a managed service (AWS MediaConvert) converts the raw video into 240p, 480p, 720p, 1080p, and optionally 4K at multiple bitrates. Each quality level is segmented into 2–10 second chunks in HLS (.ts segments + .m3u8 manifest) or MPEG-DASH format. Audio tracks, subtitles, and thumbnail frames are extracted as separate assets.',
    },
    {
      type:        'segments-to-storage',
      activeNodes: ['transcoder', 'storage'],
      connections: { 'transcoder-storage': 'request' },
      message:     'Transcoded segments and manifests stored in S3',
      detail:      'All output segments (e.g. video/abc123/720p/seg-001.ts) and manifest files (video/abc123/master.m3u8) are written to S3 under a processed/ prefix. The master manifest lists all available quality playlists. S3 is the durable origin — CDN caches from here on first request.',
    },
    {
      type:        'cdn-cache',
      activeNodes: ['storage', 'cdn'],
      connections: { 'storage-cdn': 'both' },
      message:     'CDN distributes segments globally — first viewer triggers cache fill',
      detail:      'CDN edge nodes (CloudFront, Fastly, Akamai) cache segments regionally. The first viewer in a region triggers a cache miss: the CDN edge fetches the segment from S3 (the origin). Every subsequent viewer in that region is served from the edge cache with sub-10ms latency. Popular videos reach 99%+ CDN cache hit rate within minutes of going viral.',
    },
    {
      type:        'manifest-fetch',
      activeNodes: ['player', 'cdn'],
      connections: { 'player-cdn': 'request' },
      message:     'Player fetches the master manifest from CDN',
      detail:      'The video player requests the master .m3u8 manifest via a GeoDNS-resolved URL that routes to the nearest CDN PoP. The manifest lists all available quality playlists and their bitrates. Each segment URL is signed (expires after a short window) — unsigned URLs would allow hotlinking and bypass DRM.',
    },
    {
      type:        'adaptive-bitrate',
      activeNodes: ['player', 'cdn'],
      connections: { 'player-cdn': 'both' },
      message:     'Adaptive bitrate — player selects quality based on bandwidth',
      detail:      'The player monitors download speed and buffer health continuously. If segments are arriving slowly (buffer draining), the player switches to a lower bitrate playlist. If the buffer is healthy and connection improves, it switches up. ABR switching is seamless — the next segment is simply fetched from a different quality playlist. No rebuffering, no quality cliff.',
    },
    {
      type:        'full-system',
      activeNodes: ['uploader', 'uploadsvc', 'transcoder', 'storage', 'cdn', 'player'],
      connections: {
        'uploader-uploadsvc':   'request',
        'uploadsvc-storage':    'request',
        'uploadsvc-transcoder': 'request',
        'transcoder-storage':   'request',
        'storage-cdn':          'both',
        'player-cdn':           'both',
      },
      message:     'Full pipeline — upload, transcode, distribute, stream',
      detail:      'The upload pipeline (left to right) is asynchronous and compute-heavy. The playback path (player ↔ CDN ↔ S3) is synchronous and latency-sensitive. They share only object storage as a boundary. Application servers (Upload Service) are only in the write path — they never handle video bytes during playback.',
    },
  ]
}
