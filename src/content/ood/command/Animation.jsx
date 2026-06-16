import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const STEPS = [
  {
    invokerActive: false, commandActive: false, receiverActive: false,
    historyItems: [], editorText: 'Hello', undoAvailable: false, action: null,
    message: 'The Command Pattern',
    detail: 'Encapsulate a request as an object. This lets you queue requests, log them, and support undo — without the invoker knowing anything about what the command actually does.',
  },
  {
    invokerActive: true, commandActive: false, receiverActive: false,
    historyItems: [], editorText: 'Hello', undoAvailable: false, action: null,
    message: 'The Invoker — fires commands without knowing their details',
    detail: 'The text editor toolbar is the Invoker. It has a bold button, undo button, and a command history. It knows nothing about how bold is applied — it just fires commands.',
  },
  {
    invokerActive: true, commandActive: true, receiverActive: false,
    historyItems: ['BoldCommand'], editorText: 'Hello', undoAvailable: true, action: 'create',
    message: 'User clicks Bold — a BoldCommand is created',
    detail: 'Clicking Bold creates a BoldCommand object that holds a reference to the editor (Receiver) and the selected text. The command is pushed onto the history stack before executing.',
  },
  {
    invokerActive: false, commandActive: true, receiverActive: true,
    historyItems: ['BoldCommand'], editorText: '**Hello**', undoAvailable: true, action: 'execute',
    message: 'BoldCommand.execute() calls the editor',
    detail: 'The command calls editor.applyBold(selection). The editor does the actual work. The command is just the messenger — it delegates to the Receiver.',
  },
  {
    invokerActive: true, commandActive: false, receiverActive: false,
    historyItems: ['BoldCommand', 'InsertCommand'], editorText: '**Hello** World', undoAvailable: true, action: null,
    message: 'Another command added to history',
    detail: 'An InsertCommand is executed and pushed onto the stack. The history grows. Every action is recorded as a command object — this is what makes undo possible.',
  },
  {
    invokerActive: true, commandActive: true, receiverActive: true,
    historyItems: ['BoldCommand'], editorText: '**Hello**', undoAvailable: true, action: 'undo',
    message: 'Ctrl+Z — Invoker pops the stack and calls undo()',
    detail: 'The Invoker pops InsertCommand from the stack and calls undo(). InsertCommand.undo() tells the editor to remove the inserted text. The operation reverses perfectly.',
  },
  {
    invokerActive: false, commandActive: false, receiverActive: false,
    historyItems: ['BoldCommand'], editorText: '**Hello**', undoAvailable: true, action: null,
    message: 'Commands decouple the sender from the receiver',
    detail: 'The toolbar (Invoker) never touched the editor directly. Commands can be queued, logged, replayed, or undone — all without changing the Invoker or the Receiver.',
  },
]

export default function CommandAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)', backgroundSize: '20px 20px' }}>

        {/* Top row: Invoker → Command → Receiver */}
        <div className="flex items-stretch gap-3 mb-3">
          {/* Invoker */}
          <motion.div
            className="flex-1 rounded-xl border-2 p-3 overflow-hidden"
            animate={{ borderColor: step.invokerActive ? '#6366f1' : 'rgba(255,255,255,0.08)', backgroundColor: step.invokerActive ? 'rgba(99,102,241,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.invokerActive ? '0 0 18px -5px rgba(99,102,241,0.5)' : 'none' }}
          >
            <p className="text-[9px] text-slate-600 font-mono uppercase">invoker</p>
            <p className="text-xs font-bold text-indigo-300 font-mono mb-2">Toolbar</p>
            <div className="flex gap-1.5">
              {['Bold', 'Undo'].map((btn) => (
                <motion.div key={btn}
                  className="rounded border px-2 py-0.5 text-[10px] font-mono"
                  animate={{ borderColor: step.invokerActive ? '#6366f1' : 'rgba(255,255,255,0.1)', color: step.invokerActive ? '#a5b4fc' : '#64748b' }}
                >
                  {btn}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="flex items-center">
            <motion.div className="h-px w-6 rounded-full" animate={{ backgroundColor: step.commandActive ? '#6366f1' : 'rgba(255,255,255,0.08)' }} />
            <div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${step.commandActive ? '#6366f1' : 'rgba(255,255,255,0.08)'}` }} />
          </div>

          {/* Command */}
          <motion.div
            className="flex-1 rounded-xl border-2 p-3"
            animate={{ borderColor: step.commandActive ? '#8b5cf6' : 'rgba(255,255,255,0.08)', backgroundColor: step.commandActive ? 'rgba(139,92,246,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.commandActive ? '0 0 18px -5px rgba(139,92,246,0.5)' : 'none' }}
          >
            <p className="text-[9px] text-slate-600 font-mono uppercase">«interface» command</p>
            <p className="text-xs font-bold text-violet-300 font-mono mb-1.5">
              {step.action === 'undo' ? 'InsertCommand' : step.historyItems.length > 0 ? step.historyItems[step.historyItems.length - 1] : 'Command'}
            </p>
            <div className="space-y-0.5">
              <motion.p className="text-[10px] font-mono" animate={{ color: step.action === 'execute' ? '#8b5cf6' : '#475569' }}>
                + execute()
              </motion.p>
              <motion.p className="text-[10px] font-mono" animate={{ color: step.action === 'undo' ? '#f43f5e' : '#475569' }}>
                + undo()
              </motion.p>
            </div>
          </motion.div>

          {/* Arrow */}
          <div className="flex items-center">
            <motion.div className="h-px w-6 rounded-full" animate={{ backgroundColor: step.receiverActive ? '#10b981' : 'rgba(255,255,255,0.08)' }} />
            <div style={{ borderTop: '4px solid transparent', borderBottom: '4px solid transparent', borderLeft: `5px solid ${step.receiverActive ? '#10b981' : 'rgba(255,255,255,0.08)'}` }} />
          </div>

          {/* Receiver */}
          <motion.div
            className="flex-1 rounded-xl border-2 p-3"
            animate={{ borderColor: step.receiverActive ? '#10b981' : 'rgba(255,255,255,0.08)', backgroundColor: step.receiverActive ? 'rgba(16,185,129,0.1)' : 'rgba(10,18,36,1)', boxShadow: step.receiverActive ? '0 0 18px -5px rgba(16,185,129,0.5)' : 'none' }}
          >
            <p className="text-[9px] text-slate-600 font-mono uppercase">receiver</p>
            <p className="text-xs font-bold text-emerald-300 font-mono mb-1.5">TextEditor</p>
            <motion.div
              className="rounded bg-white/5 border border-white/10 px-2 py-1 font-mono text-xs"
              animate={{ borderColor: step.receiverActive ? '#10b981' : 'rgba(255,255,255,0.1)' }}
            >
              <span className="text-slate-300">{step.editorText}</span>
              <span className="text-slate-600 animate-pulse">|</span>
            </motion.div>
          </motion.div>
        </div>

        {/* History stack */}
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
          <p className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mb-2">Command History (Undo Stack)</p>
          <div className="flex gap-2 flex-wrap min-h-[24px] items-center">
            <AnimatePresence>
              {step.historyItems.map((item, i) => (
                <motion.div key={`${item}-${i}`}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0, opacity: 0 }}
                  className="rounded border border-violet-500/40 bg-violet-500/10 px-2 py-0.5 text-[10px] font-mono text-violet-300"
                >
                  {item}
                </motion.div>
              ))}
              {step.historyItems.length === 0 && (
                <span className="text-[10px] text-slate-600 italic">empty</span>
              )}
            </AnimatePresence>
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
