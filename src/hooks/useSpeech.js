import { useState, useEffect, useCallback } from 'react'

export function useSpeech() {
  const [enabled, setEnabled] = useState(false)
  const [voices, setVoices]   = useState([])
  const [selectedVoice, setSelectedVoiceState] = useState(null)

  // Load English voices — must use onvoiceschanged because getVoices() is async
  useEffect(() => {
    if (!window.speechSynthesis) return
    const load = () => {
      const all = window.speechSynthesis.getVoices()
      setVoices(all.filter(v => v.lang.startsWith('en')))
    }
    load()
    window.speechSynthesis.onvoiceschanged = load
    return () => { window.speechSynthesis.onvoiceschanged = null }
  }, [])

  // Restore saved voice once the voice list is available — adjusted during
  // render (guarded by state) instead of an effect, since it only needs to run once.
  const [restoredVoice, setRestoredVoice] = useState(false)
  if (!restoredVoice && voices.length) {
    setRestoredVoice(true)
    const saved = localStorage.getItem('tts-voice-uri')
    if (saved) {
      const match = voices.find(v => v.voiceURI === saved)
      if (match) setSelectedVoiceState(match)
    }
  }

  const setVoice = useCallback((voice) => {
    setSelectedVoiceState(voice)
    if (voice) localStorage.setItem('tts-voice-uri', voice.voiceURI)
    else localStorage.removeItem('tts-voice-uri')
  }, [])

  const speak = useCallback((text, rate = 1.0, onEnd) => {
    if (!enabled || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const u = new SpeechSynthesisUtterance(text)
    u.rate = rate
    if (selectedVoice) u.voice = selectedVoice
    u.onerror = () => {}
    if (onEnd) u.onend = onEnd
    window.speechSynthesis.speak(u)
  }, [enabled, selectedVoice])

  const cancel = useCallback(() => {
    window.speechSynthesis?.cancel()
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      if (prev) window.speechSynthesis?.cancel()
      return !prev
    })
  }, [])

  return { enabled, speak, cancel, toggle, voices, selectedVoice, setVoice }
}
