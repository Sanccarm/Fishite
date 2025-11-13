import React, { createContext, useCallback, useContext, useRef, useState } from 'react'

type AudioControls = {
  start: () => Promise<void> | void
  stop: () => void
  change: (src: string, opts?: { autoplay?: boolean }) => Promise<void> | void
  setVolume: (v: number) => void
  isPlaying: boolean
  src: string | null
}

const AudioContext = createContext<AudioControls | undefined>(undefined)

export const AudioProvider: React.FC<{
  children: React.ReactNode
  defaultSrc?: string | null
}> = ({ children, defaultSrc = null }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [src, setSrc] = useState<string | null>(defaultSrc)
  const [isPlaying, setIsPlaying] = useState(false)

  // Initialize audio element lazily
  if (typeof window !== 'undefined' && !audioRef.current) {
    audioRef.current = new Audio()
    audioRef.current.loop = true
    if (defaultSrc) audioRef.current.src = defaultSrc
  }

  const start = useCallback(async () => {
    const audio = audioRef.current
    if (!audio) return
    try {
      await audio.play()
      setIsPlaying(true)
    } catch (e) {
      // play may reject if not triggered by user gesture
    }
  }, [])

  const stop = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.pause()
    audio.currentTime = 0
    setIsPlaying(false)
  }, [])

  const change = useCallback(async (newSrc: string, opts?: { autoplay?: boolean }) => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = newSrc
    audio.load()
    setSrc(newSrc)
    if (opts?.autoplay ?? true) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch (e) {
        setIsPlaying(false)
      }
    } else {
      setIsPlaying(false)
    }
  }, [])

  const setVolume = useCallback((v: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = Math.max(0, Math.min(1, v))
  }, [])

  const value: AudioControls = {
    start,
    stop,
    change,
    setVolume,
    isPlaying,
    src,
  }

  return <AudioContext.Provider value={value}>{children}</AudioContext.Provider>
}

export const useAudio = () => {
  const ctx = useContext(AudioContext)
  if (!ctx) throw new Error('useAudio must be used within an AudioProvider')
  return ctx
}

export default AudioProvider
