/**
 * Steps for Computer Architecture — full computer system view.
 *
 * Step shape:
 *   activeNodes   — which components glow: 'cpu' | 'ram' | 'gpu' | 'ssd' | 'nic'
 *   connections   — which buses are lit, keyed by ID, value is direction
 *                   { 'cpu-ram': 'request' | 'response' | 'both' | null, ... }
 *   message       — short step label
 *   detail        — plain-English explanation
 */
export function buildComputerArchitectureSteps() {
  return [
    {
      type:        'init',
      activeNodes: [],
      connections: {},
      message:     'Meet the five components',
      detail:      'Every computer is built from five parts: a CPU, RAM, a GPU, storage (SSD or HDD), and a network card. They each do one job really well — and the CPU ties them all together.',
    },
    {
      type:        'storage-intro',
      activeNodes: ['ssd'],
      connections: {},
      message:     'Storage: where everything lives permanently',
      detail:      'Your apps, files, photos, and the operating system all live on the SSD or HDD. Unlike RAM, storage keeps data even when the power is off. SSDs are fast (~100ms to load); HDDs are slower but cheaper per gigabyte.',
    },
    {
      type:        'app-launch',
      activeNodes: ['cpu', 'ssd', 'ram'],
      connections: { 'cpu-ssd': 'request', 'cpu-ram': 'response' },
      message:     'Opening an app: storage → RAM',
      detail:      'When you launch an app, the CPU reads it from the SSD and loads it into RAM. RAM is about 1,000 times faster than an SSD, so the CPU works from RAM rather than going back to disk every time.',
    },
    {
      type:        'ram-access',
      activeNodes: ['cpu', 'ram'],
      connections: { 'cpu-ram': 'both' },
      message:     'The CPU runs your code from RAM',
      detail:      'The CPU fetches each instruction from RAM, figures out what it means, executes it, and writes the result back — billions of times per second. Every variable, every function call, every piece of data in a running program lives in RAM.',
    },
    {
      type:        'gpu-dispatch',
      activeNodes: ['cpu', 'gpu'],
      connections: { 'cpu-gpu': 'both' },
      message:     'Heavy work gets offloaded to the GPU',
      detail:      'Rendering graphics, running AI models, and encoding video all require doing the same calculation millions of times at once. The CPU hands this work to the GPU, which has thousands of small cores built exactly for that kind of parallel job.',
    },
    {
      type:        'network-io',
      activeNodes: ['cpu', 'nic'],
      connections: { 'cpu-nic': 'both' },
      message:     'Talking to the internet via the network card',
      detail:      'When your app makes a web request, the CPU packages the data and hands it to the network card (NIC). The NIC handles the actual sending and receiving, so the CPU is free to keep working on other things while the data is in transit.',
    },
    {
      type:        'page-fault',
      activeNodes: ['cpu', 'ram', 'ssd'],
      connections: { 'cpu-ram': 'both', 'cpu-ssd': 'both' },
      message:     'RAM full: the OS spills to disk',
      detail:      'RAM has limited capacity. When it fills up, the OS quietly moves the least-used data to a swap file on the SSD to make room. The problem: the CPU now waits ~100ms for the SSD instead of ~60ns for RAM — a 1,000x slowdown. This is why running out of memory kills performance.',
    },
    {
      type:        'full-system',
      activeNodes: ['cpu', 'ram', 'gpu', 'ssd', 'nic'],
      connections: { 'cpu-ram': 'both', 'cpu-gpu': 'both', 'cpu-ssd': 'both', 'cpu-nic': 'both' },
      message:     'All five working together',
      detail:      'Loading a webpage: the CPU coordinates everything — RAM holds the page data, the SSD serves cached assets, the GPU renders the layout, and the NIC streams in new content. Every component is active, and all traffic flows through the CPU.',
    },
    {
      type:        'sd-insight',
      activeNodes: ['cpu', 'ram', 'gpu', 'ssd', 'nic'],
      connections: { 'cpu-ram': 'both', 'cpu-gpu': 'both', 'cpu-ssd': 'both', 'cpu-nic': 'both' },
      message:     'The same pattern exists at cloud scale',
      detail:      'System design is just this diagram made bigger. Redis plays the role of RAM — a fast in-memory store. A database plays the role of the SSD — slower but permanent. GPU clusters handle AI and video. CDNs act like a NIC moved closer to the user. The hierarchy never changes, only the scale does.',
    },
  ]
}
