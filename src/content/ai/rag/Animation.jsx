import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTtsRunner } from '../../../hooks/useTtsRunner'
import StepControls from '../../../components/ui/StepControls'

const DOCS = [
  { title: 'RAG overview', snippet: 'Retrieval-Augmented Generation combines…', score: 0.94 },
  { title: 'Vector databases', snippet: 'A vector database stores embeddings…', score: 0.87 },
  { title: 'LLM grounding', snippet: 'Grounding reduces hallucinations by…', score: 0.81 },
]

const STEPS = [
  { stage: 'idle',     message: 'Retrieval-Augmented Generation (RAG)',     detail: 'RAG solves two LLM limitations — hallucination and knowledge cutoffs — by fetching relevant documents at query time and injecting them into the prompt. The model answers from retrieved facts, not just memory.' },
  { stage: 'query',    message: 'Step 1 — User asks a question',            detail: 'A user submits a natural-language question. The RAG pipeline takes over from here — the LLM is not called yet.' },
  { stage: 'embed',    message: 'Step 2 — Embed the query',                 detail: 'The query is passed through an embedding model (the same one used to embed the document corpus). This produces a dense vector that captures the semantic meaning of the question.' },
  { stage: 'search',   message: 'Step 3 — Nearest-neighbour search',        detail: 'The query vector is compared against millions of stored document chunk vectors using approximate nearest-neighbour search (HNSW or IVF). This takes milliseconds, even at scale.' },
  { stage: 'retrieve', message: 'Step 4 — Top-k chunks retrieved',          detail: 'The top-k most similar document chunks are fetched from the vector database. Similarity is measured by cosine distance. These are the most relevant pieces of your knowledge base.' },
  { stage: 'augment',  message: 'Step 5 — Inject chunks into the prompt',   detail: 'The retrieved chunks are prepended to the user\'s question, forming an augmented prompt. The LLM is instructed to answer using only the provided context.' },
  { stage: 'generate', message: 'Step 6 — LLM generates a grounded answer', detail: 'The LLM generates an answer based on the retrieved context, not just its training data. Hallucinations drop significantly because the model is explicitly told what facts to use.' },
]

const STAGE_ORDER = ['idle', 'query', 'embed', 'search', 'retrieve', 'augment', 'generate']

function stageAt(stage, target) {
  return STAGE_ORDER.indexOf(stage) >= STAGE_ORDER.indexOf(target)
}

function PipelineArrow({ active }) {
  return (
    <motion.div animate={{ opacity: active ? 1 : 0.15 }} transition={{ duration: 0.3 }}
      className="flex justify-center py-0.5">
      <svg width="12" height="14" viewBox="0 0 12 14" fill="none">
        <line x1="6" y1="0" x2="6" y2="10" stroke={active ? '#3b82f6' : '#334155'} strokeWidth="1.5"/>
        <path d="M2 8 L6 13 L10 8" stroke={active ? '#3b82f6' : '#334155'} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    </motion.div>
  )
}

function PipelineBox({ label, sublabel, active, color, children }) {
  return (
    <motion.div
      animate={{
        borderColor: active ? color + '66' : 'rgba(255,255,255,0.08)',
        backgroundColor: active ? color + '10' : 'rgba(255,255,255,0.02)',
        boxShadow: active ? `0 0 20px -6px ${color}66` : 'none',
      }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border px-4 py-3 space-y-1"
    >
      <div className="flex items-center gap-2">
        <motion.div animate={{ backgroundColor: active ? color : '#1e293b' }} transition={{ duration: 0.3 }}
          className="w-1.5 h-1.5 rounded-full shrink-0" />
        <motion.p className="text-xs font-semibold" animate={{ color: active ? color : '#475569' }} transition={{ duration: 0.3 }}>
          {label}
        </motion.p>
      </div>
      {sublabel && <p className="text-[10px] text-slate-600 pl-3.5">{sublabel}</p>}
      {children}
    </motion.div>
  )
}

function DocChip({ doc, visible, delay }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }} animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -8 }}
      transition={{ duration: 0.25, delay }}
      className="flex items-center gap-2 rounded-lg border border-teal-500/25 bg-teal-500/8 px-2.5 py-1.5"
    >
      <div className="shrink-0 w-6 h-6 rounded bg-teal-500/15 border border-teal-500/30 flex items-center justify-center">
        <span className="text-[9px] font-bold text-teal-400">{Math.round(doc.score * 100)}</span>
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-semibold text-teal-300 truncate">{doc.title}</p>
        <p className="text-[9px] text-slate-600 truncate">{doc.snippet}</p>
      </div>
    </motion.div>
  )
}

export default function RAGAnimation() {
  const steps  = useMemo(() => STEPS, [])
  const runner = useTtsRunner(steps, (s) => `${s.message}. ${s.detail}`)
  const { step } = runner
  const s = step.stage

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-white/10 p-4 space-y-1"
        style={{ background: '#060d1a', backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.04) 1px,transparent 1px)', backgroundSize: '20px 20px' }}>

        {/* Query box */}
        <PipelineBox label="User Query" sublabel={stageAt(s, 'query') ? '"How does RAG work?"' : undefined} active={stageAt(s, 'query')} color="#3b82f6">
          {stageAt(s, 'query') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pl-3.5">
              <span className="text-[10px] font-mono text-blue-300 bg-blue-500/10 border border-blue-500/20 rounded px-1.5 py-0.5">
                "How does RAG work?"
              </span>
            </motion.div>
          )}
        </PipelineBox>

        <PipelineArrow active={stageAt(s, 'embed')} />

        {/* Embed */}
        <PipelineBox label="Embedding Model" sublabel="query → dense vector" active={stageAt(s, 'embed')} color="#8b5cf6">
          {stageAt(s, 'embed') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="pl-3.5 flex gap-0.5 items-end h-5">
              {[0.8, 0.3, 0.9, 0.5, 0.7, 0.2, 0.6, 0.4, 0.85, 0.35].map((h, i) => (
                <motion.div key={i} className="w-1.5 rounded-sm bg-violet-400/70"
                  initial={{ height: 0 }} animate={{ height: `${h * 100}%` }}
                  transition={{ delay: i * 0.05 }} />
              ))}
              <span className="text-[9px] text-slate-600 ml-1.5 self-center">1536-dim vector</span>
            </motion.div>
          )}
        </PipelineBox>

        <PipelineArrow active={stageAt(s, 'search')} />

        {/* Vector DB search */}
        <PipelineBox label="Vector Database" sublabel="ANN similarity search" active={stageAt(s, 'search')} color="#6366f1">
          {stageAt(s, 'search') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="pl-3.5 flex items-center gap-1.5">
              {[...Array(5)].map((_, i) => (
                <motion.div key={i} className="w-5 h-5 rounded border flex items-center justify-center text-[8px] font-mono"
                  animate={{
                    borderColor: i < 3 ? '#6366f1aa' : '#ffffff15',
                    backgroundColor: i < 3 ? '#6366f120' : '#ffffff05',
                    color: i < 3 ? '#a5b4fc' : '#334155',
                  }}
                  transition={{ delay: i * 0.06 }}>
                  {i < 3 ? '●' : '○'}
                </motion.div>
              ))}
              <span className="text-[9px] text-slate-600">top-3 matches</span>
            </motion.div>
          )}
        </PipelineBox>

        <PipelineArrow active={stageAt(s, 'retrieve')} />

        {/* Retrieved docs */}
        <PipelineBox label="Retrieved Chunks" sublabel={stageAt(s, 'retrieve') ? `${DOCS.length} document chunks` : 'top-k relevant passages'} active={stageAt(s, 'retrieve')} color="#14b8a6">
          {stageAt(s, 'retrieve') && (
            <div className="pl-1 mt-1 space-y-1">
              {DOCS.map((doc, i) => (
                <DocChip key={doc.title} doc={doc} visible={stageAt(s, 'retrieve')} delay={i * 0.1} />
              ))}
            </div>
          )}
        </PipelineBox>

        <PipelineArrow active={stageAt(s, 'augment')} />

        {/* Augmented prompt */}
        <PipelineBox label="Augmented Prompt" sublabel="context + original question → LLM" active={stageAt(s, 'augment')} color="#f97316" />

        <PipelineArrow active={stageAt(s, 'generate')} />

        {/* LLM Output */}
        <PipelineBox label="LLM Answer" active={stageAt(s, 'generate')} color="#10b981">
          {stageAt(s, 'generate') && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="pl-3.5 rounded-lg border border-emerald-500/20 bg-emerald-500/8 p-2 mt-1">
              <p className="text-[10px] text-emerald-300 leading-relaxed">
                "RAG works by embedding your query, searching a vector database for relevant documents, and injecting those documents into the LLM prompt as context…"
              </p>
              <p className="text-[9px] text-slate-600 mt-1">Grounded in retrieved sources — not hallucinated.</p>
            </motion.div>
          )}
        </PipelineBox>

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
