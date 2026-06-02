import { useState, useCallback } from 'react'

export function useSpeech() {
  const [enabled, setEnabled] = useState(false)

  const speak = useCallback((text, rate = 1.0, onEnd) => {
    if (!enabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    u.onerror = () => {}  // suppress browser console errors on cancel
    if (onEnd) u.onend = onEnd
    window.speechSynthesis.speak(u)
  }, [enabled])

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) window.speechSynthesis?.cancel()
      return !prev
    })
  }, [])

  return { enabled, speak, cancel, toggle }
}
