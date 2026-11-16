import { useRef, useState, type ReactNode } from 'react'
import gsap from 'gsap'
import { useGSAP } from '@gsap/react'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './closing.css'

gsap.registerPlugin(ScrollTrigger, useGSAP)

type Destination = 'contact' | 'catalog'
const destinations: Record<Destination, string> = {
  contact: '',
  catalog: '',
}
const socials = [
  { name: 'Telegram', href: '' },
  { name: 'MAX', href: '' },
  { name: 'VK', href: '' },
]
const demoCopy = {
  contact: ['Обсудить авто', 'Это демонстрационная версия сайта. Канал связи для подбора автомобиля пока не подключён.'],
  catalog: ['Каталог', 'В демоверсии можно посмотреть автомобили в сцене BMW. Каталог предложений пока не опубликован.'],
}

function LinkArrow({ up = false }: { up?: boolean }) {
  return <svg className={up ? 'up-arrow' : 'link-arrow'} aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.4">
    <path d={up ? 'M12 20V4m-7 7 7-7 7 7' : 'M5 19 19 5M6 5h13v13'}/>
  </svg>
}

function DestinationLink({ to, open, children, className }: {
  to: Destination; open: (to: Destination) => void; children: ReactNode; className?: string
}) {
  const href = destinations[to]
  return href ? <a className={className} href={href}>{children}</a>
    : <button type="button" className={className} aria-haspopup="dialog" onClick={() => open(to)}>{children}</button>
}

function SiteFooter({ open }: { open: (to: Destination) => void }) {
  return <footer className="site-footer">
    <div className="footer-grid">
      <div className="footer-brand"><div>AUTO<span>/</span>SELECT</div><p>АВТОМОБИЛИ С ХАРАКТЕРОМ.</p></div>
      <nav className="footer-list" aria-label="Навигация в футере">
        <a href="#home">Главная</a><DestinationLink to="catalog" open={open}>Каталог</DestinationLink><a href="#contacts">Контакты</a>
      </nav>
      <ul className="footer-list footer-social" aria-label="Социальные сети">{socials.map(({name, href}) =>
        <li key={name}>{href ? <a href={href}>{name}</a> : <span>{name}</span>}</li>)}</ul>
    </div>
    <div className="footer-bottom"><small>© 2026 AUTO/SELECT</small><a href="#home">Наверх <LinkArrow up/></a></div>
  </footer>
}

export default function ClosingSection() {
  const root = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDialogElement>(null)
  const [destination, setDestination] = useState<Destination>('contact')
  function open(to: Destination) {
    setDestination(to)
    dialog.current?.showModal()
  }

  useGSAP(() => {
    const media = gsap.matchMedia()
    media.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.timeline({scrollTrigger: {trigger: '.contact-kicker', start: 'top 94%', once: true}, defaults: {ease: 'power3.out'}})
        .from('.contact-line span', {yPercent: 108, duration: .9, stagger: .11}, 0)
        .from('.contact-description', {opacity: 0, y: 8, duration: .55}, .34)
        .from('.contact-actions', {opacity: 0, y: 6, duration: .5}, .52)
    }, root)
    return () => media.revert()
  }, {scope: root})

  return <div className="closing" ref={root}>
    <section id="contacts" aria-labelledby="contact-title" className="contact-section">
      <p className="contact-kicker">ЕСТЬ АВТОМОБИЛЬ НА ПРИМЕТЕ?</p>
      <h2 id="contact-title"><span className="contact-line"><span>ТВОЯ СЛЕДУЮЩАЯ</span></span>{' '}
        <span className="contact-line"><span>МАШИНА ЖДЁТ.</span></span></h2>
      <div className="contact-details"><p className="contact-description">Расскажи, что ищешь. Мы поможем найти автомобиль с характером.</p>
        <div className="contact-actions">
          <DestinationLink to="contact" open={open} className="closing-button solid">ОБСУДИТЬ АВТО <LinkArrow/></DestinationLink>
          <DestinationLink to="catalog" open={open} className="closing-button quiet-button">СМОТРЕТЬ КАТАЛОГ</DestinationLink>
        </div>
      </div>
    </section>
    <SiteFooter open={open}/>
    <dialog ref={dialog} className="contact-dialog" aria-labelledby="demo-title" aria-describedby="demo-message">
      <h2 id="demo-title">{demoCopy[destination][0]}</h2><p id="demo-message">{demoCopy[destination][1]}</p>
      <div className="demo-actions">{destination === 'catalog' && <a href="#character" onClick={() => dialog.current?.close()}>К сцене BMW <LinkArrow/></a>}
        <form method="dialog"><button className="closing-button quiet-button">Закрыть</button></form></div>
    </dialog>
  </div>
}
