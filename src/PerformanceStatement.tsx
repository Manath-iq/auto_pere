import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { hero } from './config'
import './performance-statement.css'

const passes = [
  { color: 'black', overtake: { start: .30, end: .54, gap: .09 } },
  { color: 'graphite', overtake: { start: .47, end: .71, gap: .105 } },
  { color: 'red', overtake: null },
] as const

// Scrub on mobile: higher value = fewer JS ticks per scroll event
const isMobile = /iPhone|iPad|iPod|Android/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
)

export default function PerformanceStatement({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  useGSAP(() => {
    const host = section.current
    if (!host || reduced) return
    const stage = host.querySelector<HTMLElement>('.performance-stage')!
    const cars = stage.querySelectorAll<HTMLElement>('.performance-car')

    // Promote cars to GPU layers before animation starts — prevents first-frame freeze
    gsap.set(cars, { willChange: 'transform' })

    // Merge car + img into single transform by collapsing the overtake offset
    // onto the parent directly — avoids nested composited layers on mobile
    const scrub = isMobile ? 0.5 : true
    const track = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: host,
        pin: stage,
        start: 'top top',
        end: () => '+=' + stage.clientHeight * 2.35,
        scrub,
        invalidateOnRefresh: true,
        onToggle: self => {
          // Drop will-change when section is not visible to free VRAM
          gsap.set(cars, { willChange: self.isActive ? 'transform' : 'auto' })
        },
      },
    })

    track.fromTo('.performance-floor', { opacity: 0 }, { opacity: 1, duration: .15 }, 0)
    track.fromTo('.performance-copy', { opacity: 0 }, { opacity: 1, duration: .15, ease: 'sine.inOut' }, 0)

    const lead = stage.querySelector<HTMLElement>('.car-red')!
    const travelFrom = () => stage.clientHeight + 1
    const travelTo   = () => -lead.offsetHeight - 1

    // Move all cars via parent transform only (no nested img translate)
    track.fromTo('.performance-car', { y: travelFrom }, { y: travelTo, duration: .83 }, .15)

    // Overtake: adjust parent y instead of child img y — single compositor layer
    for (const { color, overtake } of passes) {
      if (!overtake) continue
      const { start, end, gap: gapRatio } = overtake
      const dur = end - start
      const gapPx = () => stage.clientHeight * gapRatio
      // Relative offset baked into the car's own y so img stays at y:0
      track.to('.car-' + color, {
        y: () => {
          const base = gsap.getProperty('.car-' + color, 'y') as number
          return base - gapPx()
        },
        ease: 'sine.inOut',
        duration: dur / 2,
      }, start)
      track.to('.car-' + color, {
        y: () => {
          const base = gsap.getProperty('.car-' + color, 'y') as number
          return base + gapPx()
        },
        ease: 'sine.inOut',
        duration: dur / 2,
      }, start + dur / 2)
    }

    track.to('.performance-copy', { opacity: 0, duration: .04 }, .48)
    track.set('.performance-copy', { y: () => stage.clientHeight * .29 }, .54)
    track.to('.performance-copy', { opacity: 1, duration: .10 }, .62)
    track.fromTo('.performance-copy p', { opacity: 0 }, { opacity: 1, duration: .09 }, .72)
    track.to('.performance-copy', { opacity: 0, duration: .19, ease: 'sine.inOut' }, .81)
    track.to('.performance-floor', { opacity: 0, duration: .14 }, .86)
  }, { scope: section, dependencies: [reduced], revertOnUpdate: true })

  return <section ref={section} id={hero.anchor} tabIndex={-1} className="performance" aria-labelledby="performance-title">
    <div className="performance-stage">
      <div className="performance-floor" aria-hidden="true"/>
      <div className="performance-copy">
        <h2 id="performance-title">НЕ ДЛЯ <span>КАЖДОГО</span></h2>
        <p>Подбираем автомобили с характером — без скучных решений.</p>
      </div>
      {passes.map(({ color }) => (
        <picture className={'performance-car car-' + color} key={color} aria-hidden="true">
          <source type="image/webp" srcSet={import.meta.env.BASE_URL + 'media/statement/' + color + '.webp'}/>
          <img
            width={1024} height={1536}
            src={import.meta.env.BASE_URL + 'media/statement/' + color + '.png'}
            decoding="async"
            loading="lazy"
            alt=""
          />
        </picture>
      ))}
    </div>
  </section>
}
