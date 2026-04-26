/**
 * DNS Resolution step trace.
 *
 * Node IDs:  browser | resolver | root | tld | auth
 * Edge indices (between adjacent nodes in the horizontal chain):
 *   0 = browser ↔ resolver
 *   1 = resolver ↔ root
 *   2 = root ↔ tld
 *   3 = tld ↔ auth
 *
 * For non-adjacent connections (e.g. resolver → tld) the packet
 * "travels through" intermediate nodes via edges [1, 2], giving a
 * satisfying chain-travel effect even though DNS is point-to-point.
 *
 * Step shape:
 *   type          — identifier string
 *   activeNodes   — node IDs that glow (violet ring)
 *   activeEdges   — edge indices that are lit up and carry a moving particle
 *   edgeDirection — 'forward' (left→right) | 'backward' (right→left) | null
 *   message       — short step label (shown in the message strip)
 *   detail        — longer explanation (shown in the detail panel)
 *   revealedIp    — null | '142.250.80.46'  (shown as an IP badge on the browser node)
 */
export function buildDnsSteps() {
  return [
    {
      type: 'init',
      activeNodes: [],
      activeEdges: [],
      edgeDirection: null,
      message: 'User types "google.com" in the browser.',
      detail:
        'Before the browser can send any HTTP request it must resolve the domain name to an IP address. This kicks off the DNS resolution process.',
      revealedIp: null,
    },
    {
      type: 'browser-cache',
      activeNodes: ['browser'],
      activeEdges: [],
      edgeDirection: null,
      message: 'Browser checks its own DNS cache — miss.',
      detail:
        "Browsers cache recent DNS results (TTL: ~60 s). On first visit there's no cached entry, so the lookup continues outward.",
      revealedIp: null,
    },
    {
      type: 'os-cache',
      activeNodes: ['browser'],
      activeEdges: [],
      edgeDirection: null,
      message: 'OS checks /etc/hosts and its resolver cache — miss.',
      detail:
        'Before hitting the network the OS checks its local cache and the hosts file. Still no match for google.com.',
      revealedIp: null,
    },
    {
      type: 'resolver-query',
      activeNodes: ['browser', 'resolver'],
      activeEdges: [0],
      edgeDirection: 'forward',
      message: 'Browser sends query to the Recursive Resolver.',
      detail:
        "The recursive resolver is configured by your ISP or network (e.g. 8.8.8.8 for Google Public DNS). It will do all the recursive work of finding the IP on your browser's behalf.",
      revealedIp: null,
    },
    {
      type: 'root-query',
      activeNodes: ['resolver', 'root'],
      activeEdges: [1],
      edgeDirection: 'forward',
      message: 'Resolver asks a Root Nameserver: "Who handles .com?"',
      detail:
        'There are 13 sets of root name servers (A–M) distributed globally via anycast. They hold the map of every TLD but not individual domain records.',
      revealedIp: null,
    },
    {
      type: 'root-response',
      activeNodes: ['root', 'resolver'],
      activeEdges: [1],
      edgeDirection: 'backward',
      message: 'Root NS refers: "Ask the .com TLD nameservers."',
      detail:
        "The root server doesn't know google.com's IP but knows who does: the .com TLD nameservers operated by Verisign.",
      revealedIp: null,
    },
    {
      type: 'tld-query',
      activeNodes: ['resolver', 'root', 'tld'],
      activeEdges: [1, 2],
      edgeDirection: 'forward',
      message: 'Resolver asks the .com TLD Nameserver.',
      detail:
        'The resolver now contacts the .com TLD servers. These know which authoritative nameservers each .com registrant has configured.',
      revealedIp: null,
    },
    {
      type: 'tld-response',
      activeNodes: ['tld', 'root', 'resolver'],
      activeEdges: [2, 1],
      edgeDirection: 'backward',
      message: 'TLD NS refers: "Ask Google\'s nameservers at ns1.google.com."',
      detail:
        "The TLD server returns the authoritative nameservers for google.com. These were registered when Google set up their domain.",
      revealedIp: null,
    },
    {
      type: 'auth-query',
      activeNodes: ['resolver', 'root', 'tld', 'auth'],
      activeEdges: [1, 2, 3],
      edgeDirection: 'forward',
      message: 'Resolver asks Google\'s Authoritative NS: "IP for google.com?"',
      detail:
        "The authoritative nameserver is the source of truth. Google runs ns1–ns4.google.com. This is the final hop.",
      revealedIp: null,
    },
    {
      type: 'auth-response',
      activeNodes: ['auth', 'tld', 'root', 'resolver'],
      activeEdges: [3, 2, 1],
      edgeDirection: 'backward',
      message: 'Auth NS responds: "google.com → 142.250.80.46  (TTL 300 s)"',
      detail:
        'The A record is returned: 142.250.80.46. The TTL of 300 s tells the resolver to cache this answer for 5 minutes.',
      revealedIp: '142.250.80.46',
    },
    {
      type: 'cached',
      activeNodes: ['resolver', 'browser'],
      activeEdges: [0],
      edgeDirection: 'backward',
      message: 'Resolver caches the result and returns the IP to the browser.',
      detail:
        'The resolver stores the record for the TTL duration. Any client asking for google.com within those 5 minutes gets an instant cached answer.',
      revealedIp: '142.250.80.46',
    },
    {
      type: 'done',
      activeNodes: ['browser'],
      activeEdges: [],
      edgeDirection: null,
      message: 'Browser connects to 142.250.80.46 — DNS complete!',
      detail:
        'The full uncached lookup typically takes 20–120 ms. The browser now has the IP and opens a TCP (then TLS) connection to load google.com.',
      revealedIp: '142.250.80.46',
    },
  ]
}
