import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { Globe } from './Sigil'
import { Hallmark } from './Sigil'
import { currentYearRoman } from '@/lib/year'

/* "Struck" loader — globe stroke-draws + rotates, FLIGHT slams up, one gem
   ignites. ~1.2s, once per session. Reduced-motion → instant fade. */
export function Loader() {
  const [done, setDone] = useState(() => {
    try { return sessionStorage.getItem('ft-struck') === '1' } catch { return false }
  })
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (done) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const finish = () => {
      try { sessionStorage.setItem('ft-struck', '1') } catch { /* ignore */ }
      setDone(true)
    }
    if (reduce) { const t = setTimeout(finish, 500); return () => clearTimeout(t) }

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ onComplete: finish, defaults: { ease: 'power4.out' } })
      tl.fromTo('.struck__globe', { rotate: -20, opacity: 0, scale: 0.85 }, { rotate: 0, opacity: 1, scale: 1, duration: 0.7 })
        .fromTo('.struck__word', { yPercent: 120, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6 }, '-=0.3')
        .fromTo('.struck__gem', { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' }, '-=0.15')
        // chrome-sheen sweep across the wordmark, timed to land with the gem
        // ignite — the same hover-language streak used on .btn/.frame, here
        // played once as part of the "Struck" beat instead of on hover.
        .fromTo('.struck__sheen', { xPercent: -140, opacity: 1 }, { xPercent: 140, opacity: 1, duration: 0.55, ease: 'power2.out' }, '-=0.3')
        .to('.struck__mark', { opacity: 1, duration: 0.3 }, '-=0.2')
        .to(root.current, { opacity: 0, duration: 0.45, delay: 0.25, ease: 'power2.inOut' })
    }, root)
    return () => ctx.revert()
  }, [done])

  if (done) return null

  return (
    <div
      ref={root}
      style={{
        position: 'fixed', inset: 0, zIndex: 200, background: 'var(--c-pit)',
        display: 'grid', placeItems: 'center', gap: 0,
      }}
    >
      <div style={{ display: 'grid', placeItems: 'center', gap: 22 }}>
        <div className="struck__globe" style={{ color: 'var(--c-chrome)', position: 'relative' }}>
          <Globe size={64} weight={1.2} />
          <span className="struck__gem" style={{
            position: 'absolute', inset: 0, margin: 'auto', width: 8, height: 8, borderRadius: '50%',
            background: 'var(--gem-amethyst)', boxShadow: '0 0 16px var(--gem-amethyst)',
          }} />
        </div>
        <div style={{ overflow: 'hidden', position: 'relative' }}>
          <h1 className="struck__word display" style={{ fontSize: 'clamp(48px,10vw,120px)', color: 'var(--c-bone)' }}>
            Flight
          </h1>
          <span
            className="struck__sheen" aria-hidden="true"
            style={{
              position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0,
              background: 'linear-gradient(105deg, transparent 42%, rgba(255,255,255,0.6) 50%, transparent 58%)',
              mixBlendMode: 'overlay',
            }}
          />
        </div>
        <Hallmark className="struck__mark" as="p">.925 · Made on Earth · {currentYearRoman()}</Hallmark>
      </div>
    </div>
  )
}
