import React, { Suspense, useState, useCallback, useMemo } from 'react'
import { useParams, Link, Navigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ALGORITHMS, DIFFICULTY_COLOR } from '../constants/algorithmRegistry'
import CodePanel from '../components/ui/CodePanel'

// Vite resolves this glob at build time — no manual imports ever needed.
// To add a new visualizer: drop Visualizer.jsx in its algorithm folder. Done.
const VISUALIZERS = import.meta.glob('../content/algorithms/*/Visualizer.jsx')

export default function AlgorithmPage() {
  const { id } = useParams()
  const algo = ALGORITHMS.find((a) => a.id === id)

  const [currentStep, setCurrentStep] = useState(null)
  const [treeOrder,   setTreeOrder]   = useState('inorder')

  const handleStep  = useCallback((s) => setCurrentStep(s), [])
  const handleOrder = useCallback((o) => setTreeOrder(o),   [])

  if (!algo) return <Navigate to="/algorithms" replace />

  // tree-traversal keeps its code panel tab in sync with the order selector
  const syncedApproachId = algo.id === 'tree-traversal' ? treeOrder : undefined

  const VisualizerComponent = useMemo(() => {
    const loader = VISUALIZERS[`../content/algorithms/${id}/Visualizer.jsx`]
    return loader ? React.lazy(loader) : null
  }, [id])

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-slate-500">
        <Link to="/" className="hover:text-slate-300 transition-colors">Home</Link>
        <span>/</span>
        <Link to="/algorithms" className="hover:text-slate-300 transition-colors">Algorithms</Link>
        <span>/</span>
        <span className="text-slate-300">{algo.title}</span>
      </nav>

      {/* Title + badges */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h1 className="text-2xl font-bold text-white">{algo.title}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${DIFFICULTY_COLOR[algo.difficulty]}`}>
            {algo.difficulty}
          </span>
          <span className="rounded-md bg-violet-500/15 px-3 py-1 text-xs text-violet-300">
            {algo.pattern}
          </span>
          {algo.problemUrl && (
            <a
              href={algo.problemUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400 hover:text-white hover:border-white/25 hover:bg-white/10 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              {algo.problemLabel}
            </a>
          )}
        </div>
      </div>

      {/* Problem statement + metaphor bridge */}
      <div className="space-y-3">
        {/* Problem statement */}
        {algo.description && (
          <div className="rounded-xl border border-white/10 bg-white/[0.02] px-5 py-4 space-y-1.5">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Problem</p>
            <p className="text-sm text-slate-300 leading-relaxed">{algo.description}</p>
          </div>
        )}

        {/* Metaphor bridge */}
        {algo.metaphor && (
          <div className="flex gap-3 rounded-xl border border-violet-500/20 bg-violet-500/[0.05] px-5 py-4">
            <div className="mt-0.5 w-0.5 shrink-0 self-stretch rounded-full bg-violet-500/50" />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-violet-400">
                How we visualize it
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{algo.metaphor}</p>
            </div>
          </div>
        )}
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr] gap-5 items-start">
        {/* Left — Visualizer */}
        <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
          <Suspense fallback={
            <div className="py-20 text-center text-slate-500 text-sm">Loading visualizer…</div>
          }>
            {VisualizerComponent
              ? <VisualizerComponent onStepChange={handleStep} onOrderChange={handleOrder} />
              : <p className="text-slate-500 text-center py-10">Visualizer coming soon.</p>
            }
          </Suspense>
        </div>

        {/* Right — Code */}
        {algo.solution && (
          <div className="lg:sticky lg:top-20">
            <CodePanel
              solution={algo.solution}
              step={currentStep}
              syncedApproachId={syncedApproachId}
            />
          </div>
        )}
      </div>
    </motion.div>
  )
}
