export default {
  id: 'bfs',
  title: 'Breadth-First Search',
  difficulty: 'Medium',
  pattern: 'Graph Traversal',
  category: 'graphs',
  path: '/algorithms/bfs',
  description: 'Given an m × n 2D binary grid of "1"s (land) and "0"s (water), return the number of islands. An island is formed by connecting adjacent land cells horizontally or vertically, and is surrounded by water.',
  metaphor: 'We picture the grid as a city where each land cell is a district. A car starts at one district and drives outward level by level — exactly how BFS explores a graph.',
  tags: ['graph', 'queue', 'bfs'],
  problemUrl: 'https://leetcode.com/problems/number-of-islands/',
  problemLabel: 'LeetCode #200',

  solution: {
    approaches: [
      {
        id: 'bfs-queue',
        label: 'BFS (Queue)',
        complexity: { time: 'O(V + E)', space: 'O(V)' },
        java: {
          code: `public int numIslands(char[][] grid) {

    // Step 1: Get rows, columns and visited arrays
    int ROWS = grid.length;
    int COLS = grid[0].length;
    int numOfIslands = 0;
    boolean[][] visited = new boolean[ROWS][COLS];

    // Step 2: Iterate through each node and perform bfs
    for (int i = 0; i < ROWS; i++) {
        for (int j = 0; j < COLS; j++) {
            if (grid[i][j] == '1' && !visited[i][j]) {
                bfs(grid, i, j, visited);
                numOfIslands++;
            }
        }
    }
    return numOfIslands;
}

private final int[][] directions = { { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } };

private void bfs(char[][] grid, int rows, int cols, boolean[][] visited) {
    // Step 3: Initialize queue for BFS and set the initial node traversed to true
    LinkedList<int[]> queue = new LinkedList<>();
    queue.add(new int[] { rows, cols });
    visited[rows][cols] = true;

    while (!queue.isEmpty()) {
        int[] node = queue.poll();
        int row = node[0];
        int col = node[1];

        // Step 4: Traverse each direction by one, check for node with value 1
        // and not visited and add to queue and set visited to true
        for (int[] dir : directions) {
            int nr = row + dir[0];
            int nc = col + dir[1];

            if (nr >= 0 && nc >= 0 && nr < grid.length
                    && nc < grid[0].length
                    && grid[nr][nc] == '1' && !visited[nr][nc]) {
                queue.add(new int[] { nr, nc });
                visited[nr][nc] = true;
            }
        }
    }
}`,
          getHighlightLines(step) {
            const isInit     = step.current == null && step.queue?.length > 0
            const isComplete = step.current == null && step.queue?.length === 0
            const isVisiting = step.current != null && !step.enqueuing
            const isEnqueue  = step.current != null && step.enqueuing != null

            if (isInit)     return [25, 26, 27]
            if (isComplete) return [29]
            if (isVisiting) return [29, 30, 31, 32]
            if (isEnqueue)  return [35, 38, 39, 40, 41]
            return []
          },
        },
        python: {
          code: `def bfs(start):
    visited = set([start])
    queue = deque([start])

    while queue:
        node = queue.popleft()  # dequeue
        process(node)           # ← visit

        for neighbor in node.neighbors:
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append(neighbor)  # enqueue`,
          getHighlightLines(step) {
            const isInit     = step.current == null && step.queue?.length > 0
            const isComplete = step.current == null && step.queue?.length === 0
            const isVisiting = step.current != null && !step.enqueuing
            const isEnqueue  = step.current != null && step.enqueuing != null

            if (isInit)     return [2, 3]
            if (isComplete) return [5]
            if (isVisiting) return [5, 6, 7]
            if (isEnqueue)  return [9, 10, 11, 12]
            return []
          },
        },
      },
    ],
  },
}
