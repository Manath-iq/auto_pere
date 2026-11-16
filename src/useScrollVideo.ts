import { useCallback, useEffect, useRef, type RefObject } from 'react'
import { hero } from './config'

// Keep only the latest requested frame while the decoder is busy.
// Uses fastSeek() on Safari iOS for smooth scrubbing.
export function useScrollVideo(ref: RefObject<HTMLVideoElement | null>, enabled: boolean) {
  const target = useRef(0)
  const schedule = useRef<() => void>(() => {})
  useEffect(() => {
    const video = ref.current
    if (!video || !enabled) return
    let raf = 0
    const hasFastSeek = typeof (video as any).fastSeek === 'function'
    const seek = () => {
      raf = 0
      if (video.error || video.readyState < 2 || !Number.isFinite(video.duration)) return
      // On iOS fastSeek, don't gate on video.seeking — Safari keeps seeking=true too long
      if (!hasFastSeek && video.seeking) return
      const last = Math.max(0, Math.round(video.duration * hero.fps) - 1)
      const time = Math.round(target.current * last) / hero.fps
      const threshold = hasFastSeek ? 1 / hero.fps : 0.5 / hero.fps
      if (Math.abs(video.currentTime - time) >= threshold) {
        try {
          if (hasFastSeek) {
            (video as any).fastSeek(time)
          } else {
            video.currentTime = time
          }
        } catch {
          video.currentTime = time
        }
      }
    }
    // On iOS, fastSeek is non-blocking — no need to wait for 'seeked'
    const events = hasFastSeek
      ? ['loadedmetadata', 'loadeddata', 'canplay']
      : ['loadedmetadata', 'loadeddata', 'canplay', 'seeked']
    const queue = () => { if (!raf) raf = requestAnimationFrame(seek) }
    schedule.current = queue
    events.forEach(event => video.addEventListener(event, queue))
    // Kick-start loading on iOS where preload="auto" is ignored
    if (video.readyState < 1) video.load()
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
