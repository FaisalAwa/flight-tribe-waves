import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { CaretDown } from '@phosphor-icons/react'
import { categories } from '@/data/products'
import { Globe } from './Sigil'

/* ═══════════════════════════════════════════════════════════════
   NAV — hairline top bar. Three links only: SHOP (a bold, experimental
   mega-style dropdown straight onto the live catalogue categories),
   OUR STORY, CONTACT US. Every category is its own route (/shop/:id),
   so the dropdown is a direct door to each vitrine, not a detour.
   ═══════════════════════════════════════════════════════════════ */

export function Nav() {
  const [shopOpen, setShopOpen] = useState(false)
  const loc = useLocation()

  const navRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const openShop = () => { window.clearTimeout(closeTimer.current); setShopOpen(true) }
  const scheduleClose = () => { closeTimer.current = setTimeout(() => setShopOpen(false), 140) }
  const closeShop = () => { window.clearTimeout(closeTimer.current); setShopOpen(false) }

  // close on route change
  useEffect(() => { setShopOpen(false) }, [loc.pathname])

  // Esc closes + returns focus; click/tap outside closes
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
    </header>
  )
}
