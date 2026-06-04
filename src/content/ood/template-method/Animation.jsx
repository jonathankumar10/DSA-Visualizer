import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const STEPS_DATA = [
  { id: 'readData',    label: 'readData()',    type: 'abstract' },
  { id: 'parseData',   label: 'parseData()',   type: 'abstract' },
  { id: 'analyzeData', label: 'analyzeData()', type: 'concrete' },
  { id: 'report',      label: 'report()',      type: 'concrete' },
]

const STEPS = [
  {
    activeClass: null, activeStep: null, runningClass: null,
    message: 'The Template Method Pattern',
    detail: 'Define the skeleton of an algorithm in a base class, deferring some steps to subclasses. Subclasses can redefine specific steps without changing the algorithm\'s overall structure.',
  },
  {
    activeClass: 'abstract', activeStep: null, runningClass: null,
    message: 'The abstract class defines the algorithm skeleton',
    detail: 'DataMiner is the abstract class. Its templateMethod() calls four steps in a fixed order. Two steps are abstract — subclasses must implement them. Two are concrete — already implemented and shared by all subclasses.',
  },
  {
    activeClass: 'abstract', activeStep: 'analyzeData', runningClass: null,
    message: 'Concrete steps are already implemented — shared by all',
    detail: 'analyzeData() and report() are implemented once in the abstract class. Every subclass inherits them for free. This avoids code duplication.',
  },
  {
    activeClass: 'abstract', activeStep: 'readData', runningClass: null,
    message: 'Abstract steps must be overridden by each subclass',
    detail: 'readData() and parseData() are abstract. The abstract class declares them but provides no body. Each concrete subclass must supply its own implementation.',
  },
  {
    activeClass: 'csv', activeStep: 'readData', runningClass: 'csv',
    message: 'CSVMiner overrides readData() and parseData()',
    detail: 'CSVMiner.readData() opens a CSV file. CSVMiner.parseData() splits rows by comma. The rest of the algorithm — analyzeData() and report() — comes from the base class unchanged.',
  },
  {
    activeClass: 'csv', activeStep: null, runningClass: 'csv',
    message: 'Run CSVMiner — templateMethod() executes the full sequence',
    detail: 'When the client calls csvMiner.templateMethod(), it runs: readData() (CSV version) → parseData() (CSV version) → analyzeData() (shared) → report() (shared). One unified flow.',
  },
  {
    activeClass: 'json', activeStep: 'readData', runningClass: 'json',
    message: 'JSONMiner overrides the same abstract steps differently',
    detail: 'JSONMiner.readData() fetches JSON from an API. JSONMiner.parseData() uses JSON.parse(). Same algorithm skeleton — completely different implementation of the varying parts.',
  },
  {
    activeClass: 'json', activeStep: null, runningClass: 'json',
    message: 'Same template, different behaviour — zero duplication',
    detail: 'The algorithm structure lives in one place: the abstract class. Adding a new miner (XML, SQL) means implementing just the two abstract methods. The template method never changes.',
  },
]

const CONCRETE_CLASSES = {
  csv:  { label: 'CSVMiner',  color: '#10b981', glow: 'rgba(16,185,129,0.55)',  icon: '📊', readImpl: 'open CSV file', parseImpl: 'split by comma' },
  json: { label: 'JSONMiner', color: '#f59e0b', glow: 'rgba(245,158,11,0.55)', icon: '📦', readImpl: 'fetch from API', parseImpl: 'JSON.parse()' },
}

export default function TemplateMethodAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  const concrete = step.runningClass ? CONCRETE_CLASSES[step.runningClass] : null

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        <div className="flex gap-3">
          {/* Abstract class */}
          <motion.div
            className="flex-1 rounded-2xl border-2 overflow-hidden"
            animate={{ borderColor: step.activeClass === 'abstract' ? '#6366f1' : 'rgba(255,255,255,0.08)', backgroundColor: step.activeClass === 'abstract' ? 'rgba(99,102,241,0.08)' : 'rgba(10,18,36,1)' }}
          >
            <div className="px-3 pt-2.5 pb-1.5 border-b border-white/[0.07]">
              <p className="text-[9px] text-slate-600 font-mono uppercase">«abstract»</p>
              <p className="text-xs font-bold text-indigo-300 font-mono">DataMiner</p>
            </div>
            <div className="px-3 py-2 space-y-1.5">
              <div className="rounded border border-indigo-500/30 bg-indigo-500/10 px-2 py-1">
                <p className="text-[9px] text-indigo-400 font-mono font-semibold">templateMethod() ← fixed</p>
              </div>
              {STEPS_DATA.map((s) => (
                <motion.div key={s.id}
                  className="rounded px-2 py-0.5 border"
                  animate={{
                    borderColor:     step.activeStep === s.id ? (s.type === 'abstract' ? '#f43f5e' : '#6366f1') : 'rgba(255,255,255,0.06)',
                    backgroundColor: step.activeStep === s.id ? (s.type === 'abstract' ? 'rgba(244,63,94,0.1)' : 'rgba(99,102,241,0.1)') : 'transparent',
                  }}
                >
                  <p className="text-[10px] font-mono" style={{ color: s.type === 'abstract' ? '#f87171' : '#818cf8' }}>
                    {s.type === 'abstract' ? '«abstract» ' : ''}
                    {s.label}
                  </p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Concrete classes */}
          <div className="flex flex-col gap-2 flex-1">
            {Object.entries(CONCRETE_CLASSES).map(([id, cls]) => {
              const isActive   = step.activeClass === id || step.runningClass === id
              return (
                <motion.div key={id}
                  className="flex-1 rounded-xl border-2 p-2.5 overflow-hidden"
                  animate={{ borderColor: isActive ? cls.color : 'rgba(255,255,255,0.07)', backgroundColor: isActive ? `${cls.color}12` : 'rgba(10,18,36,1)', boxShadow: isActive ? `0 0 16px -5px ${cls.glow}` : 'none' }}
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span>{cls.icon}</span>
                    <p className="text-[10px] font-bold font-mono" style={{ color: isActive ? cls.color : '#64748b' }}>{cls.label}</p>
                  </div>
                  <motion.div className="space-y-0.5" animate={{ opacity: isActive ? 1 : 0.4 }}>
                    <p className="text-[9px] font-mono" style={{ color: cls.color }}>readData() → {cls.readImpl}</p>
                    <p className="text-[9px] font-mono" style={{ color: cls.color }}>parseData() → {cls.parseImpl}</p>
                    <p className="text-[9px] text-slate-600 font-mono">analyzeData() ← inherited</p>
                    <p className="text-[9px] text-slate-600 font-mono">report() ← inherited</p>
                  </motion.div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* Execution trace */}
        {concrete && (
          <motion.div initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-xl border border-white/10 bg-white/[0.02] px-3 py-2">
            <p className="text-[9px] text-slate-500 font-mono uppercase mb-1.5">execution trace — {concrete.label}.templateMethod()</p>
            <div className="flex gap-1.5 flex-wrap">
              {STEPS_DATA.map((s, i) => (
                <div key={s.id} className="flex items-center gap-1">
                  <motion.div
                    className="rounded border px-2 py-0.5 text-[9px] font-mono"
                    style={{ borderColor: s.type === 'abstract' ? concrete.color : '#6366f1', color: s.type === 'abstract' ? concrete.color : '#818cf8', backgroundColor: s.type === 'abstract' ? `${concrete.color}15` : 'rgba(99,102,241,0.1)' }}
                  >
                    {s.label.replace('()', '')}
                    <span className="text-slate-600 ml-1">{s.type === 'abstract' ? '↑own' : '↑base'}</span>
                  </motion.div>
                  {i < STEPS_DATA.length - 1 && <span className="text-slate-700 text-[10px]">→</span>}
                </div>
              ))}
            </div>
          </motion.div>
        )}
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
