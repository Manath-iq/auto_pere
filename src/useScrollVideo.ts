import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { hero } from './config'

// Keep only the latest requested frame while the decoder is busy.
export function useScrollVideo(ref: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const target = useRef(0)
  const schedule = useRef<() => void>(() => {})
  useEffect(() => {
    const video = ref.current
    if (!video || !enabled) return
    let raf = 0
    const seek = () => {
      raf = 0
      if (video.error || video.seeking || video.readyState < 2 || !Number.isFinite(video.duration)) return
      const last = Math.max(0, Math.round(video.duration * hero.fps) - 1)
      const time = Math.round(target.current * last) / hero.fps
      if (Math.abs(video.currentTime - time) >= 0.5 / hero.fps) video.currentTime = time
    }
    const queue = () => { if (!raf) raf = requestAnimationFrame(seek) }
    schedule.current = queue
    const events = ['loadedmetadata', 'loadeddata', 'canplay', 'seeked']
    events.forEach(event => video.addEventListener(event, queue))
    queue()
    return () => {
      cancelAnimationFrame(raf)
      schedule.current = () => {}
      events.forEach(event => video.removeEventListener(event, queue))
    }
  }, [enabled, ref])
  return useCallback((progress: number) => {
    target.current = progress
    schedule.current()
  }, [])
}
