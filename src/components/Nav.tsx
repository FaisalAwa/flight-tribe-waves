import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { useCart } from '@/context/CartContext'
import { Globe, EyeSigil, Hallmark } from './Sigil'
import { currentYearRoman } from '@/lib/year'

/* ═══════════════════════════════════════════════════════════════
   NAV — hairline top bar + full-screen INDEX overlay.
   Commerce is never buried: BAG(n) is always in the bar AND the overlay,
   and category routes are reachable directly. The overlay springs in (GSAP),
   the eye-vesica marker lerps to the active line, and it's a proper modal
   dialog: focus moves in, is trapped, background is inert, focus returns on
   close. Keyboard gets the same active-line highlight as the mouse.
   ═══════════════════════════════════════════════════════════════ */

interface IndexItem { label: string; to: string; thumb: string }

const INDEX: IndexItem[] = [
  { label: 'Jewelry',     to: '/shop/jewelry',     thumb: '/assets/products/winged-heart-01.png' },
  { label: 'Accessories', to: '/shop/accessories', thumb: '/assets/products/dice-01-cut.png' },
  { label: 'Clothing',    to: '/shop/clothing',    thumb: '/assets/products/peace-pipe.png' },
  { label: 'Tribe',       to: '/tribe',            thumb: '/assets/products/bench-eagle.png' },
  { label: 'Contact',     to: '/contact',          thumb: '/assets/products/ft-eagle.png' },
]

export function Nav() {
  const { count } = useCart()
  const [open, setOpen] = useState(false)
  const [hover, setHover] = useState<string | null>(null)
  const loc = useLocation()

  const toggleRef = useRef<HTMLButtonElement>(null)
  const overlayRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLElement>(null)
  const eyeRef = useRef<HTMLSpanElement>(null)

  const close = () => setOpen(false)

  // close overlay on route change
  useEffect(() => { setOpen(false) }, [loc.pathname])

  // scroll-lock + make the rest of the page inert while open; restore on close
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const siblings = Array.from(document.querySelectorAll('main, footer'))
    siblings.forEach((el) => {
      if (open) { el.setAttribute('aria-hidden', 'true'); (el as HTMLElement & { inert: boolean }).inert = true }
      else { el.removeAttribute('aria-hidden'); (el as HTMLElement & { inert: boolean }).inert = false }
    })
    return () => {
      document.body.style.overflow = ''
      siblings.forEach((el) => { el.removeAttribute('aria-hidden'); (el as HTMLElement & { inert: boolean }).inert = false })
    }
  }, [open])

  // focus in on open, restore to toggle on close; Esc closes; Tab is trapped
  useEffect(() => {
    if (!open) { toggleRef.current?.focus(); return }
    const first = listRef.current?.querySelector<HTMLElement>('a')
    first?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setOpen(false); return }
      if (e.key !== 'Tab') return
      const nodes = overlayRef.current?.querySelectorAll<HTMLElement>('a[href], button')
      if (!nodes || nodes.length === 0) return
      const list = Array.from(nodes)
      const idxFirst = list[0]
      const idxLast = list[list.length - 1]
      if (e.shiftKey && document.activeElement === idxFirst) { e.preventDefault(); idxLast.focus() }
      else if (!e.shiftKey && document.activeElement === idxLast) { e.preventDefault(); idxFirst.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  // GSAP spring-in for the overlay + staggered list. The overlay bursts open
  // as a CIRCLE expanding from the INDEX toggle's own screen position rather
  // than a flat vertical wipe — same technique lightswind's
  // hamburger-menu-overlay.tsx uses (clip-path: circle() anchored at the
  // trigger button), reimplemented here so it stays GSAP-driven (matches
  // every other scroll/overlay effect in this codebase) and keeps our own
  // focus-trap/keyboard/content logic untouched. Radius is sized to the
  // viewport diagonal so the circle always fully covers the screen.
  useLayoutEffect(() => {
    if (!open) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduce) { gsap.set(overlayRef.current, { clipPath: 'none' }); gsap.set('.index-list a', { opacity: 1, y: 0 }); return }
      const rect = toggleRef.current?.getBoundingClientRect()
      const originX = rect ? rect.left + rect.width / 2 : window.innerWidth - 60
      const originY = rect ? rect.top + rect.height / 2 : 30
      const maxRadius = Math.hypot(window.innerWidth, window.innerHeight)
      gsap.fromTo(overlayRef.current,
        { clipPath: `circle(0px at ${originX}px ${originY}px)` },
        { clipPath: `circle(${maxRadius}px at ${originX}px ${originY}px)`, duration: 0.65, ease: 'power4.out' })
      gsap.fromTo('.index-list a', { y: 40, opacity: 0 }, { y: 0, opacity: 0.42, duration: 0.5, stagger: 0.06, ease: 'power3.out', delay: 0.18 })
    }, overlayRef)
    return () => ctx.revert()
  }, [open])

  // lerp the eye-vesica marker to the active line
  const active = hover ?? (open ? INDEX[0].label : null)
  useLayoutEffect(() => {
    if (!open || !active || !listRef.current || !eyeRef.current) return
    const el = listRef.current.querySelector<HTMLElement>(`a[data-label="${active}"]`)
    if (!el) return
    const top = el.offsetTop + el.offsetHeight / 2 - eyeRef.current.offsetHeight / 2
    gsap.to(eyeRef.current, { y: top, duration: 0.4, ease: 'power3.out', overwrite: 'auto' })
  }, [active, open])

  const thumb = INDEX.find((i) => i.label === active)?.thumb

  return (
    <>
      <header className="topbar">
        <Link to="/" className="topbar__home" aria-label="Flight Tribe — home">
          <Globe size={26} />
          <span className="lockup">Flight&nbsp;Tribe</span>
        </Link>

        <nav className="topbar__nav">
          {/* Persistent one-click route to the catalogue from every page —
              the INDEX overlay stays the signature nav, but shouldn't be the
              ONLY door to the shop (DIRECTION sabotage-flag: "INDEX not the
              only route to shop"). */}
          <Link to="/shop" className="topbar__link">Shop</Link>
          <button ref={toggleRef} className="topbar__link" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog">
            {open ? 'Close' : 'Index'}
          </button>
          <Link to="/cart" className="topbar__link bag" aria-label={`Bag, ${count} items`}>
            Bag <span className="bag__n">({count})</span>
          </Link>
        </nav>
      </header>

      {open && (
        <div className="index-overlay" ref={overlayRef} role="dialog" aria-modal="true" aria-label="Index">
          <div className="index-overlay__top">
            <Link to="/" className="topbar__home"><Globe size={24} /><span className="lockup">Flight&nbsp;Tribe</span></Link>
            <button className="topbar__link" onClick={close}>Close</button>
          </div>

          {thumb && <img className="index-thumb" data-show={hover ? 'true' : 'false'} src={thumb} alt="" aria-hidden />}

          <div style={{ position: 'relative' }}>
            <span ref={eyeRef} className="index-eye" data-show={hover ? 'true' : 'false'} aria-hidden><EyeSigil size={26} gem="var(--c-gem)" /></span>
            <nav className="index-list" ref={listRef} onMouseLeave={() => setHover(null)}>
              {INDEX.map((it, i) => (
                <Link
                  key={it.to} to={it.to} data-label={it.label}
                  data-active={active === it.label}
                  onMouseEnter={() => setHover(it.label)}
                  onFocus={() => setHover(it.label)}
                >
                  <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                  {it.label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="index-overlay__foot">
            <Hallmark>.925 · Made on Earth · {currentYearRoman()}</Hallmark>
            <Link to="/cart" className="topbar__link bag">Bag <span className="bag__n">({count})</span></Link>
            <EyeSigil size={22} title="" />
          </div>
        </div>
      )}
    </>
  )
}
