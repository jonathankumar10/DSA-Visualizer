import { useMemo, useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buildBFSSteps, DEFAULT_CITY } from './steps'
import { useStepRunner } from '../../../hooks/useStepRunner'
import StepControls from '../../../components/ui/StepControls'

function parseEdgeList(input) {
  const parts = input.split(',').map((s) => s.trim()).filter(Boolean)
  if (!parts.length) return { error: 'Enter at least one edge.' }
  const edges = [], nodeSet = new Set()
  for (const part of parts) {
    const m = part.match(/^([A-Za-z0-9]+)\s*[-–→>]+\s*([A-Za-z0-9]+)$/)
    if (!m) return { error: `Invalid edge "${part}" — use A-B format.` }
    if (m[1] === m[2]) return { error: `Self-loops not allowed: "${part}".` }
    edges.push({ from: m[1], to: m[2] })
    nodeSet.add(m[1]); nodeSet.add(m[2])
  }
  return { edges, nodeIds: [...nodeSet] }
}

function computeLayout(nodeIds, edges, startId, W = 600, H = 460) {
  const adj = {}
  nodeIds.forEach((id) => (adj[id] = []))
  edges.forEach(({ from, to }) => { adj[from]?.push(to); adj[to]?.push(from) })

  const levels = {}, visited = new Set([startId]), q = [startId]
  levels[startId] = 0
  while (q.length) {
    const cur = q.shift()
    for (const nb of adj[cur] ?? []) {
      if (!visited.has(nb)) { visited.add(nb); levels[nb] = levels[cur] + 1; q.push(nb) }
    }
  }
  nodeIds.forEach((id) => { if (levels[id] === undefined) levels[id] = 0 })

  const byLevel = {}
  nodeIds.forEach((id) => { const l = levels[id]; (byLevel[l] = byLevel[l] ?? []).push(id) })
  const maxLevel = Math.max(0, ...Object.values(levels))

  const positions = {}
  Object.entries(byLevel).forEach(([l, ids]) => {
    const y = maxLevel === 0 ? H / 2 : (parseInt(l) / maxLevel) * (H - 120) + 70
    ids.forEach((id, i) => {
      positions[id] = { id, label: id, x: ((i + 1) / (ids.length + 1)) * W, y }
    })
  })
  return positions
}

const DEFAULT_EDGE_STR = 'A-B, A-C, B-D, B-E, C-F, C-G, E-H, F-H'
const DEFAULT_START    = 'A'

function Car() {
  return (
    <g>
      <ellipse cx={1} cy={4} rx={17} ry={9} fill="rgba(0,0,0,0.45)" />
      <path d="M 13 -5 L 42 -16 L 42 16 L 13 5 Z" fill="rgba(254,249,195,0.1)" />
      <rect x={-14} y={-9} width={28} height={18} rx={4} fill="#fbbf24" />
      <rect x={-5}  y={-9} width={14} height={18} rx={3} fill="#f59e0b" />
      <rect x={6}   y={-6} width={7}  height={12} rx={2}
        fill="rgba(186,230,253,0.92)" stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} />
      <rect x={-12} y={-6} width={5}  height={12} rx={2} fill="rgba(186,230,253,0.55)" />
      <rect x={-16} y={-12} width={8} height={6} rx={2} fill="#0f172a" />
      <rect x={8}   y={-12} width={8} height={6} rx={2} fill="#0f172a" />
      <rect x={-16} y={6}   width={8} height={6} rx={2} fill="#0f172a" />
      <rect x={8}   y={6}   width={8} height={6} rx={2} fill="#0f172a" />
      <ellipse cx={14}  cy={-5} rx={3}   ry={2}   fill="#fef9c3" />
      <ellipse cx={14}  cy={5}  rx={3}   ry={2}   fill="#fef9c3" />
      <ellipse cx={-14} cy={-5} rx={2.5} ry={1.8} fill="#fca5a5" />
      <ellipse cx={-14} cy={5}  rx={2.5} ry={1.8} fill="#fca5a5" />
    </g>
  )
}

function Road({ from, to, nodeMap, step }) {
  const a = nodeMap[from], b = nodeMap[to]
  if (!a || !b) return null

  const len = Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2)
  const bothVisited   = step.visited?.has(from) && step.visited?.has(to)
  const isDiscovering =
    (step.current === from && step.enqueuing === to) ||
    (step.current === to   && step.enqueuing === from)

  return (
    <g>
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke="#080e1a" strokeWidth={16} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke="#1a2535" strokeWidth={11} strokeLinecap="round" />
      <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
        stroke="rgba(255,255,255,0.09)" strokeWidth={1.5}
        strokeDasharray="10 10" strokeLinecap="round" />

      {bothVisited && (
        <motion.line key="trav"
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="#10b981" strokeWidth={4} strokeLinecap="round"
          strokeDasharray={len}
          initial={{ strokeDashoffset: len }}
          animate={{ strokeDashoffset: 0 }}
          transition={{ duration: 0.55, ease: 'easeInOut' }}
        />
      )}
      {isDiscovering && (
        <motion.line
          x1={a.x} y1={a.y} x2={b.x} y2={b.y}
          stroke="#a78bfa" strokeWidth={5} strokeLinecap="round"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.65, repeat: Infinity }}
        />
      )}
    </g>
  )
}

function District({ node, step }) {
  const isCurrent   = step.current   === node.id
  const isEnqueuing = step.enqueuing === node.id
  const isVisited   = step.visited?.has(node.id)
  const isQueued    = step.queue?.includes(node.id)

  const circleFill = isCurrent ? '#92400e' : isVisited ? '#065f46' : '#111827'
  const strokeCol  = isCurrent ? '#fcd34d' : isEnqueuing ? '#c4b5fd'
                   : isVisited ? '#10b981' : '#1f2f45'
  const textCol    = isCurrent || isVisited ? '#fff' : '#4b5563'
  const lblCol     = isCurrent ? '#fde68a' : isVisited ? '#6ee7b7' : '#374151'

  return (
    <g>
      {isCurrent && (
        <motion.circle cx={node.x} cy={node.y} r={28} fill="#fbbf24"
          style={{ filter: 'blur(12px)' }}
          animate={{ opacity: [0.04, 0.55, 0.04] }}
          transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {isEnqueuing && (
        <motion.circle cx={node.x} cy={node.y}
          stroke="#c4b5fd" strokeWidth={2.5} fill="none"
          initial={{ r: 24, opacity: 0.9 }}
          animate={{ r: 52, opacity: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      )}
      {(isCurrent || isEnqueuing) && (
        <motion.circle cx={node.x} cy={node.y} r={30}
          fill="none" stroke={strokeCol} strokeWidth={1.5}
          animate={{ opacity: [0.9, 0.15, 0.9] }}
          transition={{ duration: 1.3, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
      {isQueued && !isVisited && !isCurrent && (
        <circle cx={node.x} cy={node.y} r={27}
          fill="none" stroke="#7c3aed" strokeWidth={1.5} strokeDasharray="5 4" />
      )}
      <motion.circle cx={node.x} cy={node.y} r={24}
        animate={{ fill: circleFill }}
        transition={{ duration: 0.3 }}
        stroke={strokeCol}
        strokeWidth={isCurrent || isEnqueuing ? 2.5 : 1.5}
      />
      <text x={node.x} y={node.y + 5}
        textAnchor="middle" fontSize="13" fontWeight="800"
        fill={textCol} className="select-none pointer-events-none">
        {node.id}
      </text>
      <text x={node.x} y={node.y - 30}
        textAnchor="middle" fontSize="9"
        fill={lblCol} fontWeight={isVisited || isCurrent ? '600' : '400'}
        className="select-none pointer-events-none">
        {node.label}
      </text>
    </g>
  )
}

export default function BFSVisualizer({ onStepChange }) {
  const [nodes,      setNodes]      = useState(DEFAULT_CITY.nodes)
  const [edges,      setEdges]      = useState(DEFAULT_CITY.edges)
  const [start,      setStart]      = useState(DEFAULT_START)
  const [draftEdges, setDraftEdges] = useState(DEFAULT_EDGE_STR)
  const [draftStart, setDraftStart] = useState(DEFAULT_START)
  const [inputError, setInputError] = useState(null)

  const nodeMap = useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  )

  const steps  = useMemo(() => buildBFSSteps(nodes, edges, start), [nodes, edges, start])
  const runner = useStepRunner(steps)
  const { step, reset } = runner

  useEffect(() => { onStepChange?.(step) }, [step, onStepChange])

  const startNode = nodeMap[start] ?? nodes[0]
  const [carPos,   setCarPos]   = useState({ x: startNode?.x ?? 300, y: startNode?.y ?? 60 })
  const [carAngle, setCarAngle] = useState(0)
  const prevIdRef = useRef(start)

  useEffect(() => {
    const sn = nodeMap[start]
    if (sn) { setCarPos({ x: sn.x, y: sn.y }); setCarAngle(0) }
    prevIdRef.current = start
  }, [nodes, start])

  useEffect(() => {
    const targetId = step.current ?? start
    const target   = nodeMap[targetId]
    if (!target) return

    const prevId = prevIdRef.current
    if (prevId !== targetId) {
      const prev = nodeMap[prevId]
      if (prev) {
        const dx = target.x - prev.x, dy = target.y - prev.y
        if (dx !== 0 || dy !== 0) setCarAngle(Math.atan2(dy, dx) * (180 / Math.PI))
      }
      prevIdRef.current = targetId
    }
    setCarPos({ x: target.x, y: target.y })
  }, [step.current])

  function handleApply() {
    const parsed = parseEdgeList(draftEdges)
    if (parsed.error) { setInputError(parsed.error); return }
    const { edges: newEdges, nodeIds } = parsed
    const trimmedStart = draftStart.trim()
    if (!trimmedStart) { setInputError('Start node cannot be empty.'); return }
    if (!nodeIds.includes(trimmedStart)) {
      setInputError(`Start node "${trimmedStart}" not found in edges.`); return
    }
    if (nodeIds.length > 12) { setInputError('Max 12 nodes.'); return }
    const positions = computeLayout(nodeIds, newEdges, trimmedStart)
    setInputError(null)
    setNodes(Object.values(positions))
    setEdges(newEdges)
    setStart(trimmedStart)
    setTimeout(() => reset(), 0)
  }

  function handleReset() {
    setNodes(DEFAULT_CITY.nodes)
    setEdges(DEFAULT_CITY.edges)
    setStart(DEFAULT_START)
    setDraftEdges(DEFAULT_EDGE_STR)
    setDraftStart(DEFAULT_START)
    setInputError(null)
    setTimeout(() => reset(), 0)
  }

  function handleKeyDown(e) { if (e.key === 'Enter') handleApply() }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-white">Breadth-First Search</h2>
        <p className="text-sm text-slate-400">A car explores the city district by district.</p>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 space-y-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Build your own graph</p>
        <div className="flex flex-wrap gap-2 items-start">
          <div className="flex flex-col gap-1 flex-1 min-w-0">
            <label className="text-[11px] text-slate-500">Edges (comma-separated, use A-B format)</label>
            <input value={draftEdges} onChange={(e) => setDraftEdges(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="A-B, A-C, B-D, ..."
              className="rounded-md bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-violet-500 transition-colors w-full" />
          </div>
          <div className="flex flex-col gap-1 w-24">
            <label className="text-[11px] text-slate-500">Start node</label>
            <input value={draftStart} onChange={(e) => setDraftStart(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="A"
              className="rounded-md bg-slate-800 border border-white/10 px-3 py-1.5 text-xs font-mono text-slate-100 outline-none focus:border-violet-500 transition-colors w-full" />
          </div>
          <div className="flex flex-col gap-1 justify-end">
            <label className="text-[11px] text-transparent select-none">Go</label>
            <div className="flex gap-1.5">
              <button onClick={handleApply}
                className="rounded-md bg-violet-600 hover:bg-violet-500 px-4 py-1.5 text-xs font-semibold text-white transition-colors">
                Apply
              </button>
              <button onClick={handleReset}
                className="rounded-md bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 text-xs text-slate-400 hover:text-white transition-colors">
                Reset
              </button>
            </div>
          </div>
        </div>
        {inputError && <p className="text-[11px] text-red-400">{inputError}</p>}
        <p className="text-[11px] text-slate-600">
          Examples —{' '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftEdges('A-B, A-C, B-D, B-E, C-F, C-G, E-H, F-H'); setDraftStart('A'); setInputError(null) }}>
            City map
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftEdges('1-2, 1-3, 2-4, 2-5, 3-6, 4-7'); setDraftStart('1'); setInputError(null) }}>
            Binary tree
          </button>{' · '}
          <button className="text-slate-400 hover:text-white underline underline-offset-2 transition-colors"
            onClick={() => { setDraftEdges('A-B, B-C, C-D, D-E, A-C, B-D'); setDraftStart('A'); setInputError(null) }}>
            Cycle graph
          </button>
        </p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#06090f]">
        <svg viewBox="0 0 600 500" className="w-full" style={{ maxHeight: 400 }}>
          <defs>
            <filter id="car-glow2" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur in="SourceGraphic" stdDeviation="6" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {Array.from({ length: 9  }).map((_, i) => (
            <line key={`h${i}`} x1={0} y1={i * 62} x2={600} y2={i * 62}
              stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
          ))}
          {Array.from({ length: 11 }).map((_, i) => (
            <line key={`v${i}`} x1={i * 62} y1={0} x2={i * 62} y2={500}
              stroke="rgba(255,255,255,0.02)" strokeWidth={1} />
          ))}
          {edges.map(({ from, to }) => (
            <Road key={`${from}-${to}`} from={from} to={to} nodeMap={nodeMap} step={step} />
          ))}
          {nodes.map((node) => (
            <District key={node.id} node={node} step={step} />
          ))}
          <motion.g
            animate={{ x: carPos.x, y: carPos.y }}
            transition={{ duration: 0.65, ease: [0.4, 0, 0.2, 1] }}
            style={{ filter: 'url(#car-glow2)' }}
          >
            <motion.g animate={{ rotate: carAngle }} transition={{ duration: 0.28, ease: 'easeOut' }}>
              <Car />
            </motion.g>
          </motion.g>
        </svg>
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 px-5 py-4">
        <p className="mb-2 text-xs font-medium text-slate-500 uppercase tracking-wide">Queue</p>
        <div className="flex items-center gap-2 min-h-8 flex-wrap">
          {step.queue?.length === 0 ? (
            <span className="text-xs text-slate-600">empty</span>
          ) : (
            step.queue?.map((id, i) => (
              <motion.span key={`${id}-${i}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-md bg-violet-500/20 px-3 py-1 text-sm font-mono text-violet-300">
                {id}
              </motion.span>
            ))
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-4 text-xs text-slate-400">
        <Legend color="#f59e0b" label="Current"     />
        <Legend color="#a78bfa" label="Discovering" />
        <Legend color="#10b981" label="Visited"     />
        <Legend color="#7c3aed" label="In queue"    />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step.message}
          initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
          className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm text-slate-300">
          {step.message}
        </motion.div>
      </AnimatePresence>

      <StepControls runner={runner} />
    </div>
  )
}

function Legend({ color, label }) {
  return (
    <span className="flex items-center gap-1.5">
      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  )
}
