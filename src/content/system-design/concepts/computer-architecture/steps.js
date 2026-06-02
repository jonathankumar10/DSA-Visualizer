/**
 * Steps for Computer Architecture — full computer system view.
 *
 * Shows a complete computer (CPU, RAM, GPU, SSD, NIC) with cross-component
 * interactions for real operations.
 *
 * Step shape:
 *   activeNodes   — which components glow: 'cpu' | 'ram' | 'gpu' | 'ssd' | 'nic'
 *   connections   — which buses are lit, keyed by ID, value is direction
 *                   { 'cpu-ram': 'request' | 'response' | 'both' | null, ... }
 *   message       — short step label
 *   detail        — full explanation
 */
export function buildComputerArchitectureSteps() {
  return [
    {
      type:        'init',
      activeNodes: [],
      connections: {},
      message:     'A complete computer system',
      detail:      'Every modern computer is built from five key hardware components. The CPU is the central orchestrator — all data flows through it. Each component is specialised for speed, capacity, or connectivity.',
    },
    {
      type:        'cpu-intro',
      activeNodes: ['cpu'],
      connections: {},
      message:     'CPU — the brain of every operation',
      detail:      'The Central Processing Unit runs at 3–5 GHz with multiple cores, each executing billions of instructions per second. The CPU includes on-die L1/L2/L3 cache and coordinates every other component. No data moves without the CPU orchestrating it.',
    },
    {
      type:        'ram-access',
      activeNodes: ['cpu', 'ram'],
      connections: { 'cpu-ram': 'both' },
      message:     'CPU ↔ RAM: constant reads and writes',
      detail:      'RAM is the CPU\'s working desk. Every running program, variable, and data structure lives here (~60 ns access). The CPU reads instructions and data from RAM thousands of times per millisecond. RAM is fast but volatile — cleared on power-off.',
    },
    {
      type:        'gpu-dispatch',
      activeNodes: ['cpu', 'gpu'],
      connections: { 'cpu-gpu': 'request' },
      message:     'CPU → GPU: dispatching parallel work via PCIe',
      detail:      'When rendering a frame, running ML inference, or encoding video, the CPU packages the work and sends it to the GPU over the PCIe bus. The GPU has thousands of shader cores — ideal for massively parallel workloads that would serialize on the CPU.',
    },
    {
      type:        'gpu-result',
      activeNodes: ['cpu', 'gpu', 'ram'],
      connections: { 'cpu-gpu': 'response', 'cpu-ram': 'both' },
      message:     'GPU → CPU: completed frames and results return',
      detail:      'The GPU writes results (rendered frames, computed tensors) into shared VRAM/RAM and signals the CPU via an interrupt. The CPU then reads the results and decides what to do next — display the frame, store the output, or queue more work.',
    },
    {
      type:        'storage-read',
      activeNodes: ['cpu', 'ssd'],
      connections: { 'cpu-ssd': 'both' },
      message:     'CPU ↔ SSD: loading programs and files',
      detail:      'When you open an application, the CPU requests its binary from the SSD via NVMe/SATA. The SSD responds in ~50–150 µs (1,000× slower than RAM). The OS caches frequently-used pages in RAM to avoid repeated slow trips to storage.',
    },
    {
      type:        'network-io',
      activeNodes: ['cpu', 'nic'],
      connections: { 'cpu-nic': 'both' },
      message:     'CPU ↔ NIC: sending and receiving network packets',
      detail:      'The CPU writes outgoing data to a DMA buffer in RAM and tells the NIC to transmit it — no CPU involvement during actual transmission. Incoming packets trigger an interrupt; the CPU processes them and routes data to the right process. Network latency adds 0.5 ms (LAN) to 200 ms (internet).',
    },
    {
      type:        'page-fault',
      activeNodes: ['cpu', 'ram', 'ssd'],
      connections: { 'cpu-ram': 'both', 'cpu-ssd': 'both' },
      message:     'Page fault: RAM full → spill to SSD (~1,000× slower)',
      detail:      'When RAM fills up, the OS swaps cold memory pages to an SSD swap file (a page fault). The stalled CPU must wait ~100 µs for the SSD instead of ~60 ns for RAM — a 1,000× latency penalty. This is why "out of memory" is catastrophic for performance.',
    },
    {
      type:        'gaming',
      activeNodes: ['cpu', 'ram', 'gpu', 'nic'],
      connections: { 'cpu-ram': 'both', 'cpu-gpu': 'both', 'cpu-nic': 'both' },
      message:     'Gaming: CPU + RAM + GPU + NIC all working together',
      detail:      'During online gaming: the CPU runs game logic and physics; RAM holds the game state and asset cache; the GPU renders 60–165 frames per second; the NIC syncs player state with the server every 16–50 ms. All four components are simultaneously active, passing data through the CPU.',
    },
    {
      type:        'full-system',
      activeNodes: ['cpu', 'ram', 'gpu', 'ssd', 'nic'],
      connections: { 'cpu-ram': 'both', 'cpu-gpu': 'both', 'cpu-ssd': 'both', 'cpu-nic': 'both' },
      message:     'Full system: all five components active simultaneously',
      detail:      'A fully loaded workstation — rendering, streaming, and downloading at once. The CPU orchestrates every data transfer. RAM is the hub for in-flight data. GPU handles visual output. SSD persists state. NIC moves data in and out. The CPU\'s bandwidth and the bus speeds are now the bottleneck.',
    },
    {
      type:        'sd-insight',
      activeNodes: ['cpu', 'ram', 'gpu', 'ssd', 'nic'],
      connections: { 'cpu-ram': 'both', 'cpu-gpu': 'both', 'cpu-ssd': 'both', 'cpu-nic': 'both' },
      message:     'System design mirrors this exact hardware layout',
      detail:      'Redis = RAM (fast in-memory cache). Databases = SSD (persistent storage). GPU clusters = parallel compute nodes. CDNs = NIC moved to the network edge. Microservices = CPU cores with their own RAM. The hierarchy never changes — only the scale does.',
    },
  ]
}
