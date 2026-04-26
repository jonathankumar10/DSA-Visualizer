export default {
  id:          'dns',
  type:        'concept',
  title:       'DNS Resolution',
  category:    'networking',
  tags:        ['dns', 'networking', 'http', 'internet', 'ip'],
  description: 'How a domain name like google.com resolves to an IP address. DNS is the distributed phonebook of the internet — every HTTP request starts here.',
  metaphor:    'A phonebook lookup chain: your browser asks its local resolver, which fans out to root, TLD, then authoritative servers to find the final IP.',
  path:        '/system-design/dns',
  keyPoints: [
    'DNS is hierarchical: root → TLD → authoritative',
    'Recursive resolvers do the heavy lifting on your behalf',
    'TTLs control caching duration at every layer',
    'The full lookup takes 20–120 ms; cached hits are near-instant',
  ],
}
