import { useState, useRef, useEffect, useCallback } from 'react'

const MIN_ZOOM = 0.5
const MAX_ZOOM = 4

export function useZoomPan(VW, VH) {
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const svgRef = useRef(null)
  const dragRef = useRef(null)
  const wasDragged = useRef(false)
  const stateRef = useRef({ zoom: 1, pan: { x: 0, y: 0 } })

  // Mirror state into ref so event handlers always read the latest values
  useEffect(() => {
    stateRef.current = { zoom, pan }
  }, [zoom, pan])

  // Non-passive wheel listener (passive: false required for preventDefault)
  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const onWheel = (e) => {
      e.preventDefault()
      const { zoom, pan } = stateRef.current
      const rect = svg.getBoundingClientRect()
      const mx = (e.clientX - rect.left) / rect.width
      const my = (e.clientY - rect.top) / rect.height
      // viewBox coordinate under the cursor
      const focalX = pan.x + mx * (VW / zoom)
      const focalY = pan.y + my * (VH / zoom)
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom * factor))
      setZoom(newZoom)
      setPan({ x: focalX - mx * (VW / newZoom), y: focalY - my * (VH / newZoom) })
    }
    svg.addEventListener('wheel', onWheel, { passive: false })
    return () => svg.removeEventListener('wheel', onWheel)
  }, [VW, VH])

  // Document-level drag handlers — active only while a drag is in progress
  useEffect(() => {
    if (!dragging) return
    const onMove = (e) => {
      if (!dragRef.current || !svgRef.current) return
      const dx = e.clientX - dragRef.current.clientX
      const dy = e.clientY - dragRef.current.clientY
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
        if (!wasDragged.current) setIsPanning(true)
        wasDragged.current = true
      }
      if (!wasDragged.current) return
      const { zoom } = stateRef.current
      const rect = svgRef.current.getBoundingClientRect()
      setPan({
        x: dragRef.current.panX - dx * ((VW / zoom) / rect.width),
        y: dragRef.current.panY - dy * ((VH / zoom) / rect.height),
      })
    }
    const onUp = () => {
      dragRef.current = null
      setDragging(false)
      setIsPanning(false)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
  }, [dragging, VW, VH])

  const onMouseDown = useCallback((e) => {
    const { pan } = stateRef.current
    dragRef.current = { clientX: e.clientX, clientY: e.clientY, panX: pan.x, panY: pan.y }
    wasDragged.current = false
    setDragging(true)
  }, [])

  // Capture-phase click handler: suppresses node clicks that follow a drag
  const onClickCapture = useCallback((e) => {
    if (wasDragged.current) e.stopPropagation()
  }, [])

  const zoomToCenter = useCallback((newZoom) => {
    const { zoom, pan } = stateRef.current
    const clamped = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, newZoom))
    const focalX = pan.x + VW / zoom / 2
    const focalY = pan.y + VH / zoom / 2
    setZoom(clamped)
    setPan({ x: focalX - VW / clamped / 2, y: focalY - VH / clamped / 2 })
  }, [VW, VH])

  const zoomIn  = useCallback(() => zoomToCenter(stateRef.current.zoom * 1.3), [zoomToCenter])
  const zoomOut = useCallback(() => zoomToCenter(stateRef.current.zoom / 1.3), [zoomToCenter])
  const reset   = useCallback(() => { setZoom(1); setPan({ x: 0, y: 0 }) }, [])

  return {
    svgRef,
    zoom,
    pan,
    dragging,
    isPanning,
    viewBox: `${pan.x} ${pan.y} ${VW / zoom} ${VH / zoom}`,
    onMouseDown,
    onClickCapture,
    zoomIn,
    zoomOut,
    reset,
  }
}
