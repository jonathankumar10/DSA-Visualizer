import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const C = {
  blue:        '#3b82f6',
  blueDim:     'rgba(59,130,246,0.12)',
  teal:        '#14b8a6',
  tealDim:     'rgba(20,184,166,0.12)',
  violet:      '#8b5cf6',
  violetDim:   'rgba(139,92,246,0.12)',
  amber:       '#f59e0b',
  amberDim:    'rgba(245,158,11,0.12)',
  dim:         'rgba(255,255,255,0.06)',
  dimStroke:   'rgba(255,255,255,0.1)',
  bg:          '#060d1a',
}

// Fixed SVG coordinates (viewBox 0 0 400 280)
const INPUTS  = [[60, 70], [60, 140], [60, 210]]
const HIDDEN  = [[200, 42], [200, 112], [200, 168], [200, 238]]
const OUTPUTS = [[340, 98], [340, 182]]

const I_H = INPUTS.flatMap((_, i)  => HIDDEN.map((_, h)  => `i${i}h${h}`))
const H_O = HIDDEN.flatMap((_, h)  => OUTPUTS.map((_, o) => `h${h}o${o}`))

const STEPS = [
  { ins: [],        hid: [],           outs: [],   conns: [],            bp: false, loss: false, message: 'A Neural Network', detail: 'A neural network is a stack of layers — each one transforms its input into a richer representation, passing the result forward to the next layer.' },
  { ins: [0,1,2],   hid: [],           outs: [],   conns: [],            bp: false, loss: false, message: 'Input layer receives raw features', detail: 'Raw data enters through the input layer — pixel values, word embeddings, or numeric features. No computation happens here; nodes simply pass values forward.' },
  { ins: [0,1,2],   hid: [],           outs: [],   conns: I_H,           bp: false, loss: false, message: 'Weighted connections carry the signal', detail: 'Every input connects to every hidden neuron via a learnable weight. Weights amplify or suppress signals and are initialised randomly, then updated during training.' },
  { ins: [0,1,2],   hid: [0,1,2,3],   outs: [],   conns: I_H,           bp: false, loss: false, message: 'Hidden neurons activate', detail: 'Each hidden neuron computes a weighted sum of its inputs, adds a bias, then passes the result through ReLU. The activation decides whether the neuron "fires".' },
  { ins: [0,1,2],   hid: [0,1,2,3],   outs: [],   conns: H_O,           bp: false, loss: false, message: 'Signals flow to the output layer', detail: 'The same process repeats — hidden neurons send weighted signals onward. Each hidden neuron connects to every output neuron.' },
  { ins: [0,1,2],   hid: [0,1,2,3],   outs: [0,1],conns: H_O,           bp: false, loss: false, message: 'Output layer makes a prediction', detail: 'Raw output scores are converted to probabilities by softmax. The highest probability is the predicted class. This completes the forward pass.' },
  { ins: [0,1,2],   hid: [0,1,2,3],   outs: [0,1],conns: [],            bp: false, loss: true,  message: 'Loss measures the error', detail: 'The loss function compares predictions to true labels. Cross-entropy is standard for classification. High loss = very wrong prediction; near-zero = nearly correct.' },
  { ins: [0,1,2],   hid: [0,1,2,3],   outs: [0,1],conns: [...H_O,...I_H],bp: true, loss: true,  message: 'Backpropagation adjusts every weight', detail: 'Gradients flow backward through the network. Each weight learns its contribution to the error. Gradient descent then nudges every weight to reduce loss. Repeat until convergence.' },
]

function connCoords(id) {
  if (id.startsWith('i')) {
    const [i, h] = id.match(/\d+/g).map(Number)
    return [...INPUTS[i], ...HIDDEN[h]]
  }
  const [h, o] = id.match(/\d+/g).map(Number)
  return [...HIDDEN[h], ...OUTPUTS[o]]
}

function NNDiagram({ step }) {
  const allConns = [...I_H, ...H_O]
  return (
    <svg viewBox="0 0 400 280" className="w-full" style={{ maxHeight: 220 }}>
      {/* Layer labels */}
      {[['INPUT', 60], ['HIDDEN', 200], ['OUTPUT', 340]].map(([lbl, x]) => (
        <text key={lbl} x={x} y={14} textAnchor="middle" fontSize="7.5" fill="#334155"
          fontFamily="system-ui,sans-serif" fontWeight="700" letterSpacing="0.08em">{lbl}</text>
      ))}

      {/* Connections */}
      {allConns.map((id) => {
        const active = step.conns.includes(id)
        const [x1, y1, x2, y2] = connCoords(id)
        const color = active ? (step.bp ? C.amber : C.blue) : C.dimStroke
        return (
          <motion.line key={id} x1={x1} y1={y1} x2={x2} y2={y2}
            animate={{ stroke: color, opacity: active ? 0.65 : 0.18, strokeWidth: active ? 1.2 : 0.5 }}
            transition={{ duration: 0.35 }} strokeLinecap="round" />
        )
      })}

      {/* Input nodes */}
      {INPUTS.map(([cx, cy], i) => {
        const active = step.ins.includes(i)
        return (
          <g key={`i${i}`}>
            <motion.circle cx={cx} cy={cy} r={17}
              animate={{ fill: active ? C.blueDim : C.dim, stroke: active ? C.blue : C.dimStroke, strokeWidth: active ? 1.8 : 1 }}
              transition={{ duration: 0.3 }} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill={active ? '#93c5fd' : '#334155'}
              fontFamily="monospace" fontWeight="600">{`x${i+1}`}</text>
          </g>
        )
      })}

      {/* Hidden nodes */}
      {HIDDEN.map(([cx, cy], i) => {
        const active = step.hid.includes(i)
        return (
          <g key={`h${i}`}>
            <motion.circle cx={cx} cy={cy} r={17}
              animate={{ fill: active ? C.tealDim : C.dim, stroke: active ? C.teal : C.dimStroke, strokeWidth: active ? 1.8 : 1 }}
              transition={{ duration: 0.3 }} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill={active ? '#5eead4' : '#334155'}
              fontFamily="monospace" fontWeight="600">{`h${i+1}`}</text>
          </g>
        )
      })}

      {/* Output nodes */}
      {OUTPUTS.map(([cx, cy], i) => {
        const active = step.outs.includes(i)
        return (
          <g key={`o${i}`}>
            <motion.circle cx={cx} cy={cy} r={17}
              animate={{ fill: active ? C.violetDim : C.dim, stroke: active ? C.violet : C.dimStroke, strokeWidth: active ? 1.8 : 1 }}
              transition={{ duration: 0.3 }} />
            <text x={cx} y={cy + 4} textAnchor="middle" fontSize="10" fill={active ? '#c4b5fd' : '#334155'}
              fontFamily="monospace" fontWeight="600">{`ŷ${i+1}`}</text>
          </g>
        )
      })}
    </svg>
  )
}

export default function NeuralNetworksAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  return (
    <div className="space-y-4">
      {/* Diagram */}
      <div className="rounded-2xl border border-white/10 p-3"
        style={{ background: C.bg, backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '20px 20px' }}>
        <NNDiagram step={step} />

        {/* Loss indicator */}
        <AnimatePresence>
          {step.loss && (
            <motion.div
              initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mt-2 mx-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 flex items-center gap-2"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse" />
              <p className="text-[11px] font-mono text-amber-300">Loss = ℒ(ŷ, y) — computing gradient…</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 mt-3 px-1">
          {[['bg-blue-400', 'Input'], ['bg-teal-400', 'Hidden'], ['bg-violet-400', 'Output']].map(([cls, lbl]) => (
            <div key={lbl} className="flex items-center gap-1.5">
              <div className={`w-2.5 h-2.5 rounded-full ${cls}`} />
              <span className="text-[10px] text-slate-500">{lbl}</span>
            </div>
          ))}
          <div className="flex items-center gap-1.5">
            <div className="w-4 h-px rounded-full bg-amber-400" />
            <span className="text-[10px] text-slate-500">Backprop</span>
          </div>
        </div>
      </div>

      {/* Step message */}
      <AnimatePresence mode="wait">
        <motion.div key={step.message}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.18 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}
