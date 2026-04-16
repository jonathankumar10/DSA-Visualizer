import { useState, useCallback, useRef, useEffect } from 'react'

/**
 * Drives step-by-step playback for any algorithm visualizer.
 * Returns controls and the current step object.
 */
export function useStepRunner(steps) {
  const [index, setIndex] = useState(0)
  const [playing, setPlaying] = useState(false)
  const intervalRef = useRef(null)

  const stop = useCallback(() => {
    setPlaying(false)
    clearInterval(intervalRef.current)
  }, [])

  const reset = useCallback(() => {
    stop()
    setIndex(0)
  }, [stop])

  const next = useCallback(() => {
    setIndex((i) => {
      if (i >= steps.length - 1) { stop(); return i }
      return i + 1
    })
  }, [steps.length, stop])

  const prev = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1))
  }, [])

  const play = useCallback(() => {
    if (index >= steps.length - 1) setIndex(0)
    setPlaying(true)
  }, [index, steps.length])

  useEffect(() => {
    if (playing) {
      intervalRef.current = setInterval(() => {
        setIndex((i) => {
          if (i >= steps.length - 1) {
            setPlaying(false)
            clearInterval(intervalRef.current)
            return i
          }
          return i + 1
        })
      }, 900)
    }
    return () => clearInterval(intervalRef.current)
  }, [playing, steps.length])

  return {
    step: steps[index] ?? steps[0],
    index,
    total: steps.length,
    playing,
    play,
    stop,
    next,
    prev,
    reset,
    setIndex,
  }
}
