import { useRef } from 'react'
import { useGSAP } from '@gsap/react'
import gsap from 'gsap'
import { hero } from './config'
import './performance-statement.css'

const passes = [
  { color: 'black', overtake: { start: .30, end: .54, gap: .09 } },
  { color: 'graphite', overtake: { start: .47, end: .71, gap: .105 } },
  { color: 'red', overtake: null },
] as const

export default function PerformanceStatement({ reduced }: { reduced: boolean }) {
  const section = useRef<HTMLElement>(null)
  useGSAP(() => {
    const host = section.current
    if (!host || reduced) return
    const stage = host.querySelector<HTMLElement>('.performance-stage')!
    const track = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: host,
        pin: stage,
        start: 'top top',
        end: () => '+=' + stage.clientHeight * 2.35,
        scrub: true,
        invalidateOnRefresh: true,
      },
    })
    track.fromTo('.performance-floor', {opacity: 0}, {opacity: 1, duration: .15}, 0)
    track.fromTo('.performance-copy', { opacity: 0 }, {
      opacity: 1, duration: .15, ease: 'sine.inOut',
    }, 0)
    const lead = stage.querySelector<HTMLElement>('.car-red')!
    // All lanes share the same travel. Each side car closes its own gap,
    // passes the red hood, then settles back to the convoy's speed.
    track.fromTo('.performance-car', {y: () => stage.clientHeight + 1}, {
      y: () => -lead.offsetHeight - 1,
      duration: .83,
    }, .15)
    for (const {color, overtake} of passes) {
      if (!overtake) continue
      const gap = () => stage.clientHeight * overtake.gap
      track.fromTo('.car-' + color + ' img', {y: gap}, {
        y: () => -gap(),
        ease: 'sine.inOut',
        duration: overtake.end - overtake.start,
      }, overtake.start)
    }
    // Reframe the second reading beneath the tail while the heading is occluded.
    track.to('.performance-copy', {opacity: 0, duration: .04}, .48)
    track.set('.performance-copy', {y: () => stage.clientHeight * .29}, .54)
    track.to('.performance-copy', {opacity: 1, duration: .10}, .62)
    track.fromTo('.performance-copy p', {opacity: 0}, {opacity: 1, duration: .09}, .72)
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
          <img width={1024} height={1536} src={import.meta.env.BASE_URL + 'media/statement/' + color + '.png'} decoding="async" alt=""/>
        </picture>
      ))}
    </div>
  </section>
}
