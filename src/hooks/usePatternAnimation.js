import { useState, useEffect, useRef, useCallback } from 'react'

export function usePatternAnimation(durations) {
  const [phase,     setPhase]     = useState(0)
  const [isPlaying, setIsPlaying] = useState(true)
  const [speed,     setSpeed]     = useState(1)

  const phaseRef = useRef(0)
  const speedRef = useRef(1)

  useEffect(() => { phaseRef.current = phase    }, [phase])
  useEffect(() => { speedRef.current = speed    }, [speed])

  useEffect(() => {
    if (!isPlaying) return
    let tid
    const tick = () => {
      tid = setTimeout(() => {
        const next = (phaseRef.current + 1) % durations.length
        setPhase(next)
        tick()
      }, durations[phaseRef.current] / speedRef.current)
    }
    tick()
    return () => clearTimeout(tid)
  }, [isPlaying]) // eslint-disable-line react-hooks/exhaustive-deps

  const togglePlay = useCallback(() => setIsPlaying((v) => !v), [])

  return { phase, isPlaying, speed, setSpeed, togglePlay }
}
