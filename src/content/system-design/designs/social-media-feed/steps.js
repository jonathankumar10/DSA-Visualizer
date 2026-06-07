/**
 * Social Media Feed — full system design step trace.
 *
 * Node IDs: user | feedservice | fanout | feedcache | postsdb | followgraph
 *
 * Layout:
 *   user → feedservice (center-left)
 *   feedservice ↔ feedcache (center-right)
 *   feedservice ↔ postsdb (right-top)
 *   user → fanout (center, write path)
 *   fanout ↔ followgraph (right-bottom)
 *   fanout → feedcache
 *
 * Step shape:
 *   type         — identifier string
 *   activeNodes  — node IDs to highlight
 *   connections  — edge ID → direction string
 *   message      — short label shown in the panel
 *   detail       — 1–2 interview-prep sentences
 */
export function buildSocialMediaFeedSteps() {
  return [
    {
      type:        'init',
      activeNodes: [],
      connections: {},
      message:     'Meet the social media feed system',
      detail:      'A social feed shows each user a ranked stream of posts from accounts they follow, updated in near-real-time. The core challenges are fan-out at scale (one post by a celebrity with 10M followers needs to reach 10M feeds) and keeping feed loads fast even for users who follow thousands of accounts.',
    },
    {
      type:        'user-posts',
      activeNodes: ['user', 'fanout'],
      connections: { 'user-fanout': 'request' },
      message:     'User publishes a post → Fan-out Service notified',
      detail:      'When a user posts, the Post Service stores the post content and ID in the Posts DB, then emits an event to the Fan-out Service via a message queue. The fan-out is asynchronous — the author sees their post immediately; followers see it within 1–5 seconds as the fan-out propagates.',
    },
    {
      type:        'get-followers',
      activeNodes: ['fanout', 'followgraph'],
      connections: { 'fanout-followgraph': 'both' },
      message:     'Fan-out reads the author\'s follower list from Follow Graph',
      detail:      'The Follow Graph service stores who follows whom. For a regular user with thousands of followers, the fan-out queries the entire list and fans out to each follower\'s feed cache. The follow graph can be stored as adjacency lists in a graph DB (Neo4j) or in Redis sets for O(1) member checks.',
    },
    {
      type:        'push-to-feeds',
      activeNodes: ['fanout', 'feedcache'],
      connections: { 'fanout-feedcache': 'request' },
      message:     'Fan-out on write — push post ID into each follower\'s feed cache',
      detail:      'For each follower, the Fan-out Service executes ZADD feed:{followerId} {score} {postId} in Redis. The feed is a sorted set (ZSET) where score is the ranking signal (timestamp or engagement estimate). This is fan-out on write (push model): each follower\'s feed is always pre-computed and ready to read.',
    },
    {
      type:        'read-feed',
      activeNodes: ['user', 'feedservice', 'feedcache'],
      connections: { 'user-feedservice': 'request', 'feedservice-feedcache': 'both' },
      message:     'User opens feed → Feed Service reads from Redis ZSET',
      detail:      'Feed load is a single ZRANGE feed:{userId} with a cursor for pagination. Redis returns the top post IDs in rank order in sub-millisecond time — no joins, no aggregation. The cursor is the score of the last seen post, not an offset: offset-based pagination drifts when new posts are inserted, causing items to skip or appear twice.',
    },
    {
      type:        'hydrate-posts',
      activeNodes: ['feedservice', 'postsdb'],
      connections: { 'feedservice-postsdb': 'both' },
      message:     'Feed Service hydrates post IDs with full content from Posts DB',
      detail:      'The feed cache contains only post IDs and rank scores — not post content. The Feed Service batch-fetches post details (text, media URL, author, engagement counts) from the Posts DB in a single batched query. Separating ID storage from content means post edits or deletions only require updating one record, not millions of feed caches.',
    },
    {
      type:        'celebrity-problem',
      activeNodes: ['user', 'fanout', 'followgraph', 'feedservice', 'postsdb'],
      connections: { 'user-fanout': 'request', 'fanout-followgraph': 'both', 'feedservice-postsdb': 'both' },
      message:     'Celebrity problem — hybrid push/pull for mega-accounts',
      detail:      'Fan-out for an account with 10M followers means 10M Redis writes per post — infeasible at tweet frequency. The hybrid model skips fan-out for celebrities (> 1M followers) and uses fan-out on read instead: when loading a feed, merge the pre-built Redis cache with a real-time pull of posts from celebrity accounts the user follows. Celebrities are < 0.01% of accounts but cause disproportionate fan-out.',
    },
    {
      type:        'feed-ranking',
      activeNodes: ['feedservice', 'feedcache'],
      connections: { 'feedservice-feedcache': 'both' },
      message:     'Feed ranking — chronological vs. engagement-weighted',
      detail:      'Chronological feeds are simple but ranked feeds (by estimated engagement) retain users longer. The ZSET score encodes the ranking signal: for chronological feeds it is the post timestamp; for ranked feeds it is a lightweight model score computed from recency, engagement rate, author affinity, and content type preference.',
    },
    {
      type:        'pagination',
      activeNodes: ['user', 'feedservice', 'feedcache'],
      connections: { 'user-feedservice': 'request', 'feedservice-feedcache': 'both' },
      message:     'Cursor-based pagination — never use offset',
      detail:      'Pagination uses the score of the last-seen post as the cursor for the next page (ZRANGEBYSCORE feed:{userId} -inf (lastScore LIMIT 0 20). Offset-based pagination (LIMIT 20 OFFSET 40) breaks when new posts are inserted between requests — items shift and users see posts twice or miss posts entirely.',
    },
    {
      type:        'eventual-consistency',
      activeNodes: ['user', 'fanout', 'feedcache', 'feedservice'],
      connections: { 'user-fanout': 'request', 'fanout-feedcache': 'request', 'user-feedservice': 'request', 'feedservice-feedcache': 'response' },
      message:     'Full system — eventual consistency is acceptable',
      detail:      'A post from a followed user appears in followers\' feeds within 1–5 seconds of posting — not instantly. This eventual consistency is fine for timelines. The one exception is "read your own writes": the author must see their own post immediately on their own profile page. This is solved by routing the author\'s profile reads to a source that includes unprocessed fan-out.',
    },
  ]
}
