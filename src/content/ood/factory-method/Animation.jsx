import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const STEPS = [
  {
    activeCreator: null, createdProduct: null, clientSees: false,
    message: 'The Factory Method Pattern',
    detail: 'Define an interface for creating an object, but let subclasses decide which class to instantiate. The creator never calls new directly — it delegates that decision to a factory method.',
  },
  {
    activeCreator: null, createdProduct: null, clientSees: true,
    message: 'The client uses a Creator — not a concrete class',
    detail: 'The client holds a reference to the abstract Creator. It calls creator.createProduct() without knowing which concrete class will be returned. This is the key decoupling.',
  },
  {
    activeCreator: 'road', createdProduct: null, clientSees: true,
    message: 'RoadLogistics — a ConcreteCreator',
    detail: 'RoadLogistics extends Creator and overrides createProduct(). When the client calls createProduct() on a RoadLogistics instance, it knows to make a Truck.',
  },
  {
    activeCreator: 'road', createdProduct: 'truck', clientSees: true,
    message: 'createProduct() returns a Truck',
    detail: 'RoadLogistics.createProduct() calls new Truck() and returns it. The client receives a Transport object — it does not know or care that it is specifically a Truck.',
  },
  {
    activeCreator: 'sea', createdProduct: null, clientSees: true,
    message: 'SeaLogistics — a different ConcreteCreator',
    detail: 'Swap the creator to SeaLogistics. The exact same client code calls createProduct() on this new creator. No changes to the client — only the creator changed.',
  },
  {
    activeCreator: 'sea', createdProduct: 'ship', clientSees: true,
    message: 'createProduct() returns a Ship',
    detail: 'SeaLogistics.createProduct() calls new Ship() instead. The client still receives a Transport and calls deliver() on it — the same interface, a completely different implementation.',
  },
  {
    activeCreator: null, createdProduct: null, clientSees: false,
    message: 'Adding a new transport requires zero client changes',
    detail: 'To support AirLogistics, you add one new Creator subclass and one new Product class. The client, the abstract Creator, and the Product interface are all untouched. Open for extension, closed for modification.',
  },
]

const CREATORS = {
  road: { label: 'RoadLogistics', color: '#3b82f6', glow: 'rgba(59,130,246,0.55)', method: 'new Truck()' },
  sea:  { label: 'SeaLogistics',  color: '#06b6d4', glow: 'rgba(6,182,212,0.55)',  method: 'new Ship()' },
}

const PRODUCTS = {
  truck: { label: 'Truck', icon: '🚛', sub: 'deliver() via road', color: '#3b82f6' },
  ship:  { label: 'Ship',  icon: '🚢', sub: 'deliver() via sea',  color: '#06b6d4' },
}

export default function FactoryMethodAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const product = step.createdProduct ? PRODUCTS[step.createdProduct] : null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="space-y-3">
          {/* Abstract Creator (top) */}
          <div className="rounded-xl border-2 border-white/10 bg-white/[0.02] p-3">
            <p className="text-[9px] text-slate-600 font-mono uppercase mb-1">«abstract» Creator</p>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-slate-300 font-mono">Logistics</p>
              <div className="h-px flex-1 bg-white/10" />
              <p className="text-xs font-mono text-slate-500 italic">createProduct(): Transport</p>
            </div>
          </div>

          {/* Two concrete creators */}
          <div className="flex gap-3">
            {Object.entries(CREATORS).map(([id, c]) => {
              const isActive = step.activeCreator === id
              return (
                <motion.div key={id}
                  className="flex-1 rounded-xl border-2 p-3 overflow-hidden"
                  animate={{
                    borderColor:     isActive ? c.color : 'rgba(255,255,255,0.07)',
                    backgroundColor: isActive ? `${c.color}12` : 'rgba(10,18,36,1)',
                    boxShadow:       isActive ? `0 0 18px -5px ${c.glow}` : 'none',
                  }}
                >
                  <p className="text-[9px] text-slate-600 font-mono uppercase">ConcreteCreator</p>
                  <p className="text-xs font-bold font-mono mt-0.5" style={{ color: isActive ? c.color : '#64748b' }}>{c.label}</p>
                  <motion.p className="text-[10px] font-mono mt-1.5" animate={{ color: isActive ? c.color : '#1f2937' }}>
                    createProduct() → {c.method}
                  </motion.p>
                </motion.div>
              )
            })}
          </div>

          {/* Arrow + Product */}
          <div className="flex items-center gap-3">
            <div className="flex-1 flex items-center">
              <motion.div className="flex-1 h-px rounded-full"
                animate={{ backgroundColor: product ? product.color : 'rgba(255,255,255,0.06)' }} />
              <div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${product ? product.color : 'rgba(255,255,255,0.06)'}` }} />
            </div>

            <AnimatePresence mode="wait">
              {product ? (
                <motion.div key={product.label}
                  initial={{ scale: 0.7, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.7, opacity: 0 }}
                  className="rounded-xl border-2 p-3 flex items-center gap-2.5"
                  style={{ borderColor: product.color, backgroundColor: `${product.color}15`, boxShadow: `0 0 18px -5px ${product.color}66`, minWidth: 140 }}
                >
                  <span className="text-2xl">{product.icon}</span>
                  <div>
                    <p className="text-[9px] text-slate-500 font-mono uppercase">«Product» Transport</p>
                    <p className="text-sm font-bold font-mono" style={{ color: product.color }}>{product.label}</p>
                    <p className="text-[9px] text-slate-500">{product.sub}</p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="rounded-xl border-2 border-dashed border-white/10 p-3 text-center" style={{ minWidth: 140 }}>
                  <p className="text-[10px] text-slate-600 font-mono">no product yet</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Client */}
            <motion.div
              className="rounded-xl border-2 p-3"
              animate={{
                borderColor:     step.clientSees ? '#8b5cf6' : 'rgba(255,255,255,0.07)',
                backgroundColor: step.clientSees ? 'rgba(139,92,246,0.1)' : 'rgba(10,18,36,1)',
              }}
              style={{ minWidth: 90 }}
            >
              <p className="text-[9px] text-slate-600 font-mono uppercase">client</p>
              <p className="text-xs font-bold text-violet-300 font-mono">App</p>
              <p className="text-[9px] font-mono text-slate-500 mt-1">uses Transport</p>
            </motion.div>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step.message} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}
          className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-1">
          <p className="text-sm font-semibold text-white">{step.message}</p>
          <p className="text-xs text-slate-400 leading-relaxed">{step.detail}</p>
        </motion.div>
      </AnimatePresence>
      <StepControls runner={runner} />
    </div>
  )
}
