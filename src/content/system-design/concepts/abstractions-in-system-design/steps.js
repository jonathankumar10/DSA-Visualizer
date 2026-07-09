export function buildAbstractionSteps() {
  return [
    {
      type: 'exterior',
      view: 'exterior',
      activeParts: [],
      zoomPart: null,
      message: 'From the curb, this is simply "a car"',
      detail: 'You recognize it, you could drive it, you can talk about it as a category — all without knowing anything about what\'s under the hood. That\'s the abstraction already at work.',
    },
    {
      type: 'interface',
      view: 'exterior',
      activeParts: ['wheel', 'pedals', 'dashboard'],
      zoomPart: null,
      message: 'The interface: wheel, pedals, dashboard',
      detail: 'This is the abstraction surface — the only thing you actually operate. Turn the wheel, the car turns. Press the pedal, it accelerates. You don\'t need to know why.',
    },
    {
      type: 'hood-open',
      view: 'hood-open',
      activeParts: [],
      zoomPart: null,
      message: 'Pop the hood.',
      detail: 'Now the implementation becomes visible. This is the moment every abstraction risks leaking — the moment hidden detail forces its way back into view.',
    },
    {
      type: 'internals',
      view: 'hood-open',
      activeParts: ['pistons', 'crankshaft', 'timingBelt', 'sparkPlugs', 'alternator'],
      zoomPart: null,
      message: 'Here\'s what\'s actually inside',
      detail: 'Pistons, crankshaft, timing belt, spark plugs, alternator — dozens of precisely machined parts, unique to this exact engine.',
    },
    {
      type: 'zoom',
      view: 'hood-open',
      activeParts: ['pistons'],
      zoomPart: 'pistons',
      message: 'Zoom into one piston, and "a car" disappears',
      detail: 'Study this piston\'s exact part number and tolerance closely enough, and you\'re no longer talking about "a car" — you\'re talking about one specific part of one specific engine. Precision here costs you the ability to generalize.',
    },
    {
      type: 'restored',
      view: 'exterior',
      activeParts: ['wheel', 'pedals', 'dashboard'],
      zoomPart: null,
      message: 'Abstraction is choosing to stop at the interface',
      detail: 'A distributed cache, a message queue, a database transaction — same trade-off. Name the guarantee, not the implementation, unless the requirements force you to open the hood.',
    },
  ]
}
