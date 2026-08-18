import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { CaretDown, List, X } from '@phosphor-icons/react'
import { categories } from '@/data/products'
import { Globe } from './Sigil'

/* ═══════════════════════════════════════════════════════════════
   NAV — hairline top bar. Three links only: SHOP (a bold, experimental
   mega-style dropdown straight onto the live catalogue categories),
   OUR STORY, CONTACT US. Every category is its own route (/shop/:id),
   so the dropdown is a direct door to each vitrine, not a detour.

   Below 720px the horizontal row doesn't fit next to the wordmark (it
   was overlapping "FLIGHT TRIBE" on real phones — confirmed via device-
   emulated viewport testing, not just a narrow browser window), so it
   collapses into a hamburger + full-screen menu instead, reusing the
   focus-trap/scroll-lock/inert pattern already proven in FilterPanel.
   ═══════════════════════════════════════════════════════════════ */

export function Nav() {
  const [shopOpen, setShopOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const loc = useLocation()

  const navRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const burgerRef = useRef<HTMLButtonElement>(null)
  const mobilePanelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const openShop = () => { window.clearTimeout(closeTimer.current); setShopOpen(true) }
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setShopOpen(false), 140) }
  const closeShop = () => { window.clearTimeout(closeTimer.current); setShopOpen(false) }

  // close everything on route change
  useEffect(() => { setShopOpen(false); setMobileOpen(false) }, [loc.pathname])

  // Esc closes + returns focus; click/tap outside closes (desktop dropdown)
  useEffect(() => {
    if (!shopOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setShopOpen(false)
      triggerRef.current?.focus()
    }
    const onPointerDown = (e: PointerEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setShopOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [shopOpen])

  // close when focus leaves the whole trigger+panel group (keyboard tabbing out)
  const onGroupBlur = (e: React.FocusEvent) => {
    if (!navRef.current?.contains(e.relatedTarget as Node)) setShopOpen(false)
  }

  // bold, experimental spring-in: a slight skew-and-drop with a staggered
  // type reveal, not a plain fade — matches the site's "struck metal" motion
  useLayoutEffect(() => {
    if (!shopOpen) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(panelRef.current, { opacity: 1, y: 0, skewY: 0 })
        gsap.set('.shop-drop a', { opacity: 1, y: 0 })
        return
      }
      gsap.fromTo(panelRef.current,
        { opacity: 0, y: -18, skewY: -3, transformOrigin: 'top left' },
        { opacity: 1, y: 0, skewY: 0, duration: 0.45, ease: 'power4.out' })
      gsap.fromTo('.shop-drop a', { y: 22, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'power3.out', delay: 0.08 })
    }, panelRef)
    return () => ctx.revert()
  }, [shopOpen])

  // mobile menu: focus trap + Escape-to-close + scroll lock + background
  // inert — same technique as FilterPanel's drawer
  useEffect(() => {
    if (!mobileOpen) return
    const firstFocusable = mobilePanelRef.current?.querySelector<HTMLElement>('button, a[href]')
    firstFocusable?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setMobileOpen(false); return }
      if (e.key !== 'Tab') return
      const nodes = mobilePanelRef.current?.querySelectorAll<HTMLElement>('button, a[href]')
      if (!nodes || nodes.length === 0) return
      const list = Array.from(nodes)
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    const siblings = Array.from(document.querySelectorAll('main, footer'))
    siblings.forEach((el) => { el.setAttribute('aria-hidden', 'true'); (el as HTMLElement & { inert: boolean }).inert = true })
    const burger = burgerRef.current
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      siblings.forEach((el) => { el.removeAttribute('aria-hidden'); (el as HTMLElement & { inert: boolean }).inert = false })
      burger?.focus()
    }
  }, [mobileOpen])

  useLayoutEffect(() => {
    if (!mobileOpen) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(mobilePanelRef.current, { clipPath: 'inset(0 0 0 0%)' })
        gsap.set('.mobile-menu-item', { opacity: 1, y: 0 })
        return
      }
      gsap.fromTo(mobilePanelRef.current, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 0.5, ease: 'power4.out' })
      gsap.fromTo('.mobile-menu-item', { y: 26, opacity: 0 }, { y: 0, opacity: 1, duration: 0.45, stagger: 0.07, ease: 'power3.out', delay: 0.1 })
    }, mobilePanelRef)
    return () => ctx.revert()
  }, [mobileOpen])

  return (
    <header className="topbar">
      <Link to="/" className="topbar__home" aria-label="Flight Tribe — home">
        <Globe size={26} />
        <span className="lockup">Flight&nbsp;Tribe</span>
      </Link>

      <nav className="topbar__nav">
        <div className="shop-nav" ref={navRef} onMouseEnter={openShop} onMouseLeave={scheduleClose} onBlur={onGroupBlur}>
          <button
            ref={triggerRef}
            type="button"
            className="topbar__link shop-nav__trigger"
            aria-haspopup="menu"
            aria-expanded={shopOpen}
            onClick={() => (shopOpen ? closeShop() : openShop())}
          >
            Shop
            <CaretDown size={11} weight="bold" className="shop-nav__caret" data-open={shopOpen} aria-hidden />
          </button>

          {shopOpen && (
            <div className="shop-drop" ref={panelRef} role="menu" aria-label="Shop categories">
              <Link to="/shop" role="menuitem" className="shop-drop__all" onClick={closeShop}>
                All&nbsp;Pieces
              </Link>
              <div className="shop-drop__list">
                {categories.map((c, i) => (
                  <Link key={c.id} to={`/shop/${c.id}`} role="menuitem" data-gem={c.gem} onClick={closeShop}>
                    <span className="idx">{String(i + 1).padStart(2, '0')}</span>
                    {c.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        <Link to="/tribe" className="topbar__link">Our&nbsp;Story</Link>
        <Link to="/contact" className="topbar__link">Contact&nbsp;Us</Link>
      </nav>

      <button
        ref={burgerRef}
        type="button"
        className="topbar__burger"
        aria-haspopup="dialog"
        aria-expanded={mobileOpen}
        aria-label="Open menu"
        onClick={() => setMobileOpen(true)}
      >
        <List size={22} weight="light" />
      </button>

      {mobileOpen && createPortal(
        <div className="mobile-menu-root" role="presentation">
          <div className="mobile-menu-backdrop" onClick={() => setMobileOpen(false)} />
          <div ref={mobilePanelRef} className="mobile-menu-panel" role="dialog" aria-modal="true" aria-label="Site menu">
            <div className="mobile-menu-head mobile-menu-item">
              <Link to="/" className="topbar__home" onClick={() => setMobileOpen(false)} aria-label="Flight Tribe — home">
                <Globe size={24} />
                <span className="lockup">Flight&nbsp;Tribe</span>
              </Link>
              <button className="mobile-menu-close" onClick={() => setMobileOpen(false)} aria-label="Close menu">
                <X size={22} weight="light" />
              </button>
            </div>

            <div className="mobile-menu-list">
              <div className="mobile-menu-item">
                <Link to="/shop" className="mobile-menu-link" onClick={() => setMobileOpen(false)}>
                  <span className="idx">01</span>Shop
                </Link>
                <div className="mobile-menu-sub">
                  {categories.map((c) => (
                    <Link key={c.id} to={`/shop/${c.id}`} data-gem={c.gem} onClick={() => setMobileOpen(false)}>
                      {c.label}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/tribe" className="mobile-menu-link mobile-menu-item" onClick={() => setMobileOpen(false)}>
                <span className="idx">02</span>Our&nbsp;Story
              </Link>
              <Link to="/contact" className="mobile-menu-link mobile-menu-item" onClick={() => setMobileOpen(false)}>
                <span className="idx">03</span>Contact&nbsp;Us
              </Link>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </header>
  )
}
