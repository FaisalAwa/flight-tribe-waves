import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { EyeSigil } from './Sigil'

/* ═══════════════════════════════════════════════════════════════
   EYE COMPANION — "the tribe is watching," site-wide.

   Generalises the INDEX overlay's `.index-eye` (a single eye-vesica
   that lerps to the hovered nav line) into ONE shared marker that locks
   onto whatever interactive element the cursor is over — every button,
   link, and [data-eye] target across the site, with no per-component
   JSX changes (a single delegated document listener does it).

   Deliberate guardrails (DIRECTION.md: "no custom cursor eating taps on
   mobile"; AI-SLOP-BANLIST: "custom cursor as whole personality"):
   - It is NOT a cursor replacement. The native cursor stays; this is an
     accent that only appears WHILE over an interactive element and hides
     otherwise, anchored just off the element's edge (not under the click).
   - Mouse + fine-pointer ONLY. Bails entirely on coarse/touch pointers and
     under reduced-motion — so keyboard focus (focus-visible outline) and
     touch tapping are completely unaffected.
   - aria-hidden + pointer-events:none — invisible to AT, never intercepts a
     tap/click.
   - Gem-aware: reads the hovered element's own resolved --c-gem (per
     [data-gem] route/section) so the pupil is the ONE saturated colour of
     that screen, honouring the one-gem-per-screen rule. Chrome elsewhere.
   - Suppressed inside `.index-overlay`, which keeps its own dedicated
     big-list eye (Nav.tsx) — no double eye.

   Mounted once in App.tsx, above <main>.
   ═══════════════════════════════════════════════════════════════ */

const INTERACTIVE = 'a[href], button:not([disabled]), [role="button"], [data-eye]'

export function EyeCompanion() {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return // touch / reduced-motion → no companion at all

    const xTo = gsap.quickTo(el, 'x', { duration: 0.3, ease: 'power3.out' })
    const yTo = gsap.quickTo(el, 'y', { duration: 0.3, ease: 'power3.out' })
    gsap.set(el, { xPercent: -50, yPercent: -50, opacity: 0, scale: 0.55 })

    let current: Element | null = null
    let shown = false

    const show = () => {
      if (shown) return
      shown = true
      gsap.to(el, { opacity: 1, scale: 1, duration: 0.28, ease: 'back.out(2)', overwrite: 'auto' })
    }
    const hide = () => {
      if (!shown) return
      shown = false
      current = null
      gsap.to(el, { opacity: 0, scale: 0.55, duration: 0.22, ease: 'power2.in', overwrite: 'auto' })
    }

    /** Anchor the eye just off the element's right-centre (flips left if the
     *  element hugs the right edge), with a small magnet toward the cursor so
     *  it feels alive rather than stuck. */
    const place = (t: Element, e?: PointerEvent) => {
      const r = t.getBoundingClientRect()
      const nearRight = r.right + 40 > window.innerWidth
      let x = nearRight ? r.left - 6 : r.right + 6
      let y = r.top + r.height / 2
      if (e) {
        x += gsap.utils.clamp(-10, 10, (e.clientX - x) * 0.08)
        y += gsap.utils.clamp(-10, 10, (e.clientY - y) * 0.12)
      }
      x = gsap.utils.clamp(16, window.innerWidth - 16, x)
      xTo(x)
      yTo(y)
    }

    const onOver = (e: PointerEvent) => {
      if (e.pointerType && e.pointerType !== 'mouse') return
      const t = (e.target as Element | null)?.closest?.(INTERACTIVE) ?? null
      if (!t || t.closest('.index-overlay')) { if (!t) hide(); return }
      if (t !== current) {
        current = t
        const gem = getComputedStyle(t).getPropertyValue('--c-gem').trim()
        el.style.setProperty('--eye-gem', gem || 'var(--c-gem)')
      }
      place(t, e)
      show()
    }

    const onMove = (e: PointerEvent) => {
      if (!current) return
      // left the tracked element without a fresh `over`? (e.g. gap between items)
      if (!(e.target as Element | null)?.closest?.(INTERACTIVE)) { hide(); return }
      place(current, e)
    }

    const onOut = (e: PointerEvent) => {
      const to = (e.relatedTarget as Element | null)?.closest?.(INTERACTIVE) ?? null
      if (!to || to.closest('.index-overlay')) hide()
    }

    const onWinLeave = () => hide()

    document.addEventListener('pointerover', onOver, { passive: true })
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('pointerout', onOut, { passive: true })
    window.addEventListener('blur', onWinLeave)

    return () => {
      document.removeEventListener('pointerover', onOver)
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerout', onOut)
      window.removeEventListener('blur', onWinLeave)
      gsap.killTweensOf(el)
    }
  }, [])

  return (
    <span ref={ref} className="eye-companion" aria-hidden="true">
      <EyeSigil size={24} weight={1.3} gem="var(--eye-gem, var(--c-gem))" title="" />
    </span>
  )
}
