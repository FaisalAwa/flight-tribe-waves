import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

/* ═══════════════════════════════════════════════════════════════
   SCROLL PROGRESS — slim hairline fixed to the top of the viewport,
   filled left→right in the active gem. This bar is mounted in App.tsx
   as a sibling of <main>, so it sits OUTSIDE every page's own
   [data-gem] wrapper — CSS custom-property inheritance never reaches
   it from there. Instead it mirrors the routed page's data-gem onto
   its own root explicitly (see the pathname effect below).
   Driven by a ScrollTrigger spanning the whole document so it reads
   correctly under Lenis (desktop) or native scroll (touch/coarse
   pointer) — both funnel through ScrollTrigger.update (see main.tsx).
   Perf law: only ever animate transform (scaleX), never width.
   ═══════════════════════════════════════════════════════════════ */
export function ScrollProgress() {
  const barRef = useRef<HTMLSpanElement>(null)
  const [gem, setGem] = useState<string | null>(null)
  const { pathname } = useLocation()

  useEffect(() => {
    // rAF: let the new route's content paint before reading its data-gem.
    const id = requestAnimationFrame(() => {
      const el = document.querySelector<HTMLElement>('main [data-gem]')
      setGem(el?.getAttribute('data-gem') ?? null)
    })
    return () => cancelAnimationFrame(id)
  }, [pathname])

  useLayoutEffect(() => {
    const bar = barRef.current
    if (!bar) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    const ctx = gsap.context(() => {
      gsap.set(bar, { scaleX: 0 })
      const setScale = gsap.quickTo(bar, 'scaleX', {
        duration: reduce ? 0 : 0.25,
        ease: 'none',
        overwrite: true,
      })

      ScrollTrigger.create({
        trigger: document.documentElement,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => setScale(self.progress),
      })
    })

    return () => ctx.revert()
  }, [])

  return (
    <div
      className="scroll-progress"
      data-gem={gem ?? undefined}
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 2,
        zIndex: 91, // above .topbar (90), below .index-overlay (95) / .toast (120)
        pointerEvents: 'none',
      }}
    >
      <span
        ref={barRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          background: 'var(--c-gem)',
          transformOrigin: 'left center',
          willChange: 'transform',
        }}
      />
    </div>
  )
}
