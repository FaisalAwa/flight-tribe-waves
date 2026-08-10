import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { Hallmark, EyeSigil } from './Sigil'
import type { Product } from '@/data/products'
import { currentYear } from '@/lib/year'

/* ═══════════════════════════════════════════════════════════════
   SIGNATURE SCROLL — "READING THE STAMP" (operator-approved 2026-07-05,
   dice-only path). Replaces the DiceLanding settle.

   Narrative-necessity test (metabole.studio / NNGroup, via research):
   scroll must be a diegetic verb — "remove the scroll and the story
   collapses." Here the verb is READING. The dice's engraved hallmark
   (FLIGHT · TRIBE · [eye] · .925 · USA · 2026) is laid out wider than the
   viewport; pinning the section and scrubbing scroll drags the line left
   past a fixed centre read-line, so the visitor literally reads the stamp
   glyph-by-glyph — each token brightening as it enters the centre and a
   raking key-light sweeping the engraved metal behind it. Stop scrolling
   and you stop reading mid-word: the scroll IS the read. It also continues
   the hero (Glamour → Evidence pushes INTO the engraving; this reads ACROSS
   it) and doubles down on the brand's actual pitch — "hallmarked, struck
   into the metal, not a label."

   Mechanics mirror the proven pins (HeroReveal / Vitrine): useLayoutEffect
   + gsap.matchMedia + ctx.revert(); desktop pins + scrubs the horizontal
   read, mobile/reduced-motion drop the pin and show the full stamp static
   (wrapped, fully legible — no horizontal scroll-jack on touch). Only
   transform/opacity animate (T8).
   ═══════════════════════════════════════════════════════════════ */

const BG_SRC = '/assets/products/dice-01.jpg'

/** the stamp, in reading order. The eye sigil sits mid-line as its own mark. */
type Tok = { t: string } | { eye: true } | { dot: true }
const STAMP: Tok[] = [
  { t: 'FLIGHT' }, { dot: true }, { t: 'TRIBE' }, { eye: true },
  { t: '.925' }, { dot: true }, { t: 'USA' }, { dot: true }, { t: String(currentYear()) },
]

interface StampReaderProps {
  dice: Product
  /** verbatim eyebrow of the next section — echoed as the closing cue */
  nextLabel?: string
}

export function StampReader({ dice, nextLabel = 'The Bench · Current' }: StampReaderProps) {
  const root = useRef<HTMLDivElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const sweepRef = useRef<HTMLSpanElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    gsap.set(copyRef.current, { opacity: 0, y: 16 })
    gsap.set(cueRef.current, { opacity: 0, y: 10 })

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(root)

      // The horizontal "read the stamp" scrub now runs at EVERY width — phone,
      // tablet, desktop — so mobile gets the identical pinned read, not a
      // static fallback. Reduced-motion is the only opt-out (static wrapped
      // stamp below). The matching site.css layout switch is keyed the same way
      // (@media prefers-reduced-motion: reduce), not on a max-width breakpoint.
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const track = trackRef.current!
        // total horizontal travel = everything past the first framed glyph.
        // recomputed inside matchMedia so a rotate/resize refresh re-measures.
        const travel = () => Math.max(0, track.scrollWidth - window.innerWidth)

        // One normalised timeline (total duration = 1) with EXPLICIT durations,
        // so the horizontal read fills the whole scrub instead of finishing in
        // the first ~third and leaving a long dead tail parked on the last
        // glyph. The pin is also shorter (was +=200%) and the "scroll into" cue
        // lands early — while .925 · USA · <year> are still reading — so the
        // hand-off into the next section never feels long or laggy.
        const tl = gsap.timeline({
          defaults: { ease: 'none' },
          scrollTrigger: {
            trigger: '.stampread', start: 'top top', end: '+=120%', pin: true, scrub: 0.35,
            invalidateOnRefresh: true,
          },
        })
        tl.fromTo(track, { x: 0 }, { x: () => -travel(), duration: 1 }, 0)
          .fromTo(sweepRef.current, { xPercent: -130 }, { xPercent: 130, duration: 1 }, 0)
          .fromTo(copyRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: 0.12 }, 0.04)
          .to(copyRef.current, { opacity: 0, y: -14, duration: 0.16 }, 0.56)
          .fromTo(cueRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.18 }, 0.6)
      })

      // Reduced-motion only: no pin, no horizontal jack — the full stamp is
      // shown wrapped + static (fully legible), gently faded in.
      mm.add('(prefers-reduced-motion: reduce)', () => {
        const reduce = true
        const d = reduce ? 0.01 : 0.9
        gsap.timeline({ scrollTrigger: { trigger: '.stampread', start: 'top 72%' } })
          .fromTo(copyRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: d, ease: 'power2.out' }, 0)
          .fromTo('.stampread__tok, .stampread__eye', { opacity: 0, y: 12 }, { opacity: 1, y: 0, stagger: reduce ? 0 : 0.06, duration: d, ease: 'power2.out' }, reduce ? 0 : 0.1)
          .fromTo(cueRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: d, ease: 'power2.out' }, reduce ? 0 : 0.5)
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={root}>
      <section className="stampread" data-gem="ruby" aria-label={`Reading the hallmark on the ${dice.name}`}>
        {/* the engraved metal behind the reading line */}
        <div className="stampread__bg" aria-hidden="true">
          <img src={BG_SRC} alt="" className="stampread__bgimg" />
        </div>

        <div className="stampread__viewport">
          <div ref={trackRef} className="stampread__track">
            {STAMP.map((tok, i) =>
              'eye' in tok ? (
                <span className="stampread__eye" key={i}><EyeSigil size={92} weight={1.1} gem="var(--c-gem)" title="" /></span>
              ) : 'dot' in tok ? (
                <span className="stampread__dot" key={i} aria-hidden="true">·</span>
              ) : (
                <span className="stampread__tok display" key={i}>{tok.t}</span>
              ),
            )}
          </div>

          {/* centre-bright mask — whatever's at the read-line is the brightest,
              side glyphs fall toward the void (the "currently reading" focus) */}
          <span className="stampread__mask" aria-hidden="true" />
          {/* raking key-light sweeping the metal, scrubbed by the timeline */}
          <span ref={sweepRef} className="stampread__sweep" aria-hidden="true" />
          {/* fixed read-line marker at centre */}
          <span className="stampread__readline" aria-hidden="true" />
        </div>

        <div ref={copyRef} className="stampread__copy">
          <Hallmark className="gem">Read the stamp</Hallmark>
          <p className="body stampread__copybody">
            Every piece is hallmarked — struck into the metal, not printed on a label. Scroll it through:
            the eye, the year, the country, the standard.
          </p>
        </div>

        <div ref={cueRef} className="stampread__cue">
          <Hallmark>↓ Scroll into</Hallmark>
          <Hallmark className="gem">{nextLabel}</Hallmark>
        </div>
      </section>
    </div>
  )
}
