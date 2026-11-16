import { useEffect, useRef, useState, useSyncExternalStore, type RefObject } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { useGSAP } from '@gsap/react'
import { hero } from './config'
import { useScrollVideo } from './useScrollVideo'
import './style.css'
import PerformanceStatement from './PerformanceStatement'

gsap.registerPlugin(ScrollTrigger, useGSAP)
ScrollTrigger.config({ ignoreMobileResize: true })
const motion = matchMedia('(prefers-reduced-motion: reduce)')
// Detect low-power / mobile devices to skip expensive GPU filters
const isMobile = /iPhone|iPad|iPod|Android/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
)
const subscribe = (fn: () => void) => {
  motion.addEventListener('change', fn)
  return () => motion.removeEventListener('change', fn)
}
function Wordmark() {
  return <span className="wordmark">{hero.brand.join(' / ')}</span>
}
function Arrow({ down = false }: { down?: boolean }) {
  return <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" style={{transform: down ? 'rotate(90deg)' : undefined}}><path d="M4 12h15m-6-6 6 6-6 6" fill="none" stroke="currentColor" strokeWidth="1.3"/></svg>
}
function Action({ final = false }: { final?: boolean }) {
  return <a className="action" href={'#' + hero.anchor}><span>{final ? hero.finalAction : hero.action}</span><Arrow/></a>
}
function IntroPreloader() {
  return <div className="intro" aria-hidden="true"><Wordmark/></div>
}
// Pick source once at mount — <source media="..."> is unreliable on iOS Safari
const isMobileViewport = () =>
  typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

function HeroVideo({ video, enabled, fail }: { video: RefObject<HTMLVideoElement | null>, enabled: boolean, fail: () => void }) {
  const src = useRef(isMobileViewport() ? hero.media + 'mobile.mp4' : hero.media + 'desktop.mp4')
  return <div className="media" aria-hidden="true"><div className="film">
    <img className="poster" src={hero.media + 'first.webp'} alt="" />
    {enabled && <video ref={video} muted playsInline preload="auto" poster={hero.media + 'first.webp'}
      onError={event => { if (event.target === event.currentTarget) fail() }}>
      <source src={src.current} type="video/mp4" onError={fail}/>
    </video>}
  </div></div>
}
function TitleLines({ lines }: { lines: string[] }) {
  return lines.map((line, row) => (
    <span className="title-line" aria-hidden="true" key={row}>
      {Array.from(line).map((letter, index) => (
        <span className="letter" key={index}>{letter}</span>
      ))}
    </span>
  ))
}
function HeroTypography() {
  return <div className="opening">
    <header><span className="enter"><Wordmark/></span><a className="nav enter" href={'#' + hero.anchor}>{hero.nav}<Arrow/></a></header>
    <div className="headline"><h1 aria-label={hero.title.join(' ')}><TitleLines lines={hero.title}/></h1></div>
    <div className="foot"><p className="enter">{hero.subtitle}</p><span className="scroll enter">{hero.scroll}</span><div className="enter"><Action/></div></div>
  </div>
}
function FinalHeroStatement() {
  return <section className="statement" aria-label={hero.finalTitle.join(' ')}>
    <div><h2 aria-label={hero.finalTitle.join(' ')}><TitleLines lines={hero.finalTitle}/></h2>
    <p>{hero.finalCopy}</p><div className="final-action"><Action final/></div></div>
  </section>
}
function shouldShowIntro() {
  try { return !motion.matches && !location.hash && !sessionStorage.getItem('noir-intro') } catch { return !motion.matches }
}
export default function HeroExperience() {
  const root = useRef<HTMLElement>(null)
  const video = useRef<HTMLVideoElement>(null)
  const reduced = useSyncExternalStore(subscribe, () => motion.matches)
  const [failed, setFailed] = useState(false)
  const [intro, setIntro] = useState(shouldShowIntro)
  const enabled = !reduced && !failed
  const seek = useScrollVideo(video, enabled)

  useEffect(() => {
    if (!enabled) return
    const timer = window.setTimeout(() => { if ((video.current?.readyState ?? 0) < 2) setFailed(true) }, 9000)
    return () => clearTimeout(timer)
  }, [enabled])

  useGSAP(() => {
    if (!intro || reduced) return
    const prev = document.documentElement.style.overflow
    document.documentElement.style.overflow = 'hidden'
    let active = true
    const logo = gsap.timeline().fromTo('.intro .wordmark', {opacity: 0, filter:'blur(4px)'}, {opacity:1, filter:'blur(0px)', duration:.48}, .12)
      .to('.intro .wordmark', {opacity:0, duration:.34}, .95)
    const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))
    const poster = root.current!.querySelector('img')!
    Promise.all([delay(1300), Promise.race([poster.decode().catch(() => {}), delay(1800)])]).then(() => {
      if (!active) return
      logo.to('.intro', {opacity:0, duration:.65, ease:'sine.inOut', onComplete: () => {
        try { sessionStorage.setItem('noir-intro', '1') } catch { /* private storage */ }
        setIntro(false)
      }})
    })
    return () => { active = false; document.documentElement.style.overflow = prev }
  }, {scope:root, dependencies:[intro, reduced], revertOnUpdate:true})

  useGSAP(() => {
    if (intro && !reduced) { gsap.set('.enter, .headline .title-line', {autoAlpha:0}); return }
    if (reduced) return
    gsap.from('.headline .title-line', {
      opacity: 0, yPercent: 15, filter: 'blur(5px)',
      duration: .8, stagger: .12, ease: 'power3.out', clearProps: 'filter,transform,opacity',
    })
    gsap.from('.enter', {autoAlpha:0, y:5, duration:.6, stagger:.055, ease:'power2.out'})
  }, {scope:root, dependencies:[intro, reduced], revertOnUpdate:true})

  useGSAP(() => {
    if (!enabled) return
    const opening = root.current!.querySelector<HTMLElement>('.opening')!
    const statement = root.current!.querySelector<HTMLElement>('.statement')!
    const camera = {progress:0}
    // On mobile use a higher scrub value to reduce paint frequency
    const scrub = isMobile ? 0.45 : 0.16
    const tl = gsap.timeline({defaults:{ease:'none'},scrollTrigger:{
      trigger:root.current, start:'top top', end:() => '+=' + Math.round(root.current!.offsetHeight * 3.25),
      refreshPriority:1, pin:true, scrub, invalidateOnRefresh:true, anticipatePin:1,
    },onUpdate:() => {
      opening.inert = tl.progress() >= .24
      statement.inert = tl.progress() < .91
    }})
    statement.inert = true
    // Let the right edge lift first. The second line trails like a second breath.
    const openingRows = opening.querySelectorAll('.title-line')
    // Skip blur on mobile GPU — transform + opacity alone look great and are composited
    const exitBlur = isMobile ? 'blur(0px)' : 'blur(7px)'
    openingRows.forEach((row, index) => {
      tl.fromTo(row.children, {opacity: 1, yPercent: 0, xPercent: 0, rotation: 0, filter: 'blur(0px)'}, {
        opacity: 0, yPercent: -54, xPercent: 26, rotation: 4, filter: exitBlur,
        duration: .071, stagger: {amount: .056, from: 'end'}, ease: 'power2.in',
      }, .082 + index * .021)
    })
    const entranceBlur = isMobile ? 'blur(0px)' : 'blur(6px)'
    tl.to('.opening header, .opening .foot',{autoAlpha:0,y:-5,duration:.08},.12)
      .set(opening,{autoAlpha:0},.24)
      .to(camera,{progress:1,duration:.58,onUpdate:()=>seek(camera.progress)},.20)
      .to('.black',{opacity:1,duration:.15},.755)
      .fromTo(statement,{autoAlpha:0},{autoAlpha:1,duration:.055},.865)
      .from('.statement .letter',{
        opacity:0, yPercent:28, filter:entranceBlur, stagger:{amount:.054},
        duration:.05, ease:'power2.out',
      },.86)
      .from('.statement p, .final-action',{opacity:0,y:7,stagger:.015,duration:.044,ease:'power2.out'},.923)
      .to({}, {duration:.03},.97)
    return () => { opening.inert = false; statement.inert = false }
  }, {scope:root, dependencies:[enabled], revertOnUpdate:true})
  return <><main ref={root} className={enabled ? 'scene' : 'scene static'}>
    <HeroVideo video={video} enabled={enabled} fail={() => setFailed(true)}/>
    <HeroTypography/><div className="black"/><FinalHeroStatement/>
    {intro && !reduced && <IntroPreloader/>}
  </main><PerformanceStatement reduced={reduced}/></>
}
