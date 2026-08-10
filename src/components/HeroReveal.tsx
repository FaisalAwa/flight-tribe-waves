import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { Hallmark } from './Sigil'
import { SplitText } from './SplitText'
import type { Product } from '@/data/products'
import { formatPrice } from '@/lib/format'

/* ═══════════════════════════════════════════════════════════════
   HERO — "ROLL WITH THE TRIBE".

   Full-bleed hero-dice-roll.mp4 behind the fold. As of 2026-08-04 this is
   NOT an AI-generated video — every prior generation attempt (three
   pre-Higgsfield + one Higgsfield seedance_2_0) fabricated a face mid-
   tumble, the same failure class every time (see DiceCube.tsx header).
   Instead this file is a deterministic frame-by-frame capture of the
   DiceCube component itself (six verified, correctly-photographed die
   faces, real CSS 3D geometry): the GSAP timeline was scrubbed frame by
   frame via `tl.time(t)` and screenshotted at each step, then muxed to
   mp4 — so it has the same structural correctness guarantee as DiceCube
   (no frame, ever, can show two faces with the same pip count) while
   still being a real full-bleed video asset. Same toss-in/bounce/settle
   motion, same void/ruby-ember environment, same brand colors as before.

   The <video> element renders unconditionally — prefers-reduced-motion
   never swaps it for the DiceCube component (that component still exists
   in the codebase, unused here, in case it's wanted elsewhere later).
   Reduced motion just stops the video on its poster frame instead of
   autoplaying/looping it.

   Centred over it: the FLIGHT / TRIBE wordmark, the animated catchphrase
   "ROLL WITH THE TRIBE" (SplitText), and one understated shoppable line to
   the dice PDP (the piece in the film IS the object — no competing "Shop
   Now" button; the persistent Nav "Shop" link carries the catalogue route).

   Motion is transform/opacity only (T8). Intro timeline on mount; a NON-
   pinned scroll-scrub parallaxes the dice stage + lifts the overlay as the
   hero exits — the same scrub runs at every width (mobile/tablet parity),
   no pin. useLayoutEffect + gsap.context + ctx.revert() cleanup.
   ═══════════════════════════════════════════════════════════════ */

interface HeroRevealProps {
  /** the Flight Tribe Dice record — drives the object-as-CTA link + price */
  dice: Product
}

export function HeroReveal({ dice }: HeroRevealProps) {
  const root = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLDivElement>(null)
  const wordRef = useRef<HTMLHeadingElement>(null)
  const ctaRef = useRef<HTMLAnchorElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  const reduce =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      if (reduce) return

      // ── intro — the overlay rises as the toss lands ──────────────
      gsap.timeline({ defaults: { ease: 'power3.out' } })
        .from(eyebrowRef.current, { y: 18, opacity: 0, duration: 0.7 }, 0.1)
        .from(wordRef.current, { y: 44, opacity: 0, duration: 1.0 }, 0.18)
        // the catchphrase animates its own chars (SplitText, delay 0.55)
        .from(ctaRef.current, { y: 16, opacity: 0, duration: 0.7 }, 0.95)
        .from(cueRef.current, { opacity: 0, duration: 0.8 }, 1.05)

      // ── exit scrub — SAME at every width (no pin) ────────────────
      // dice stage parallax-zooms; the centred overlay lifts + fades as you
      // scroll into the StampReader below.
      const st = {
        trigger: '.hero-video', start: 'top top', end: 'bottom top', scrub: true,
      } as const
      gsap.to(videoRef.current, { scale: 1.16, ease: 'none', scrollTrigger: st })
      gsap.to(contentRef.current, { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: st })
    }, root)

    return () => ctx.revert()
  }, [reduce])

  return (
    <div ref={root}>
      <section className="hero-video" data-gem="ruby">
        {/* full-bleed dice-roll video, always — reduced motion just stops it on the
           poster frame instead of autoplaying/looping, it never swaps to DiceCube */}
        <video
          ref={videoRef}
          className="hero-video__media"
          src="/assets/hero-dice-roll.mp4"
          poster="/assets/hero-dice-roll.jpg"
          muted
          loop={!reduce}
          playsInline
          autoPlay={!reduce}
          aria-hidden="true"
        />
        {/* legibility scrim — vignette + top/bottom fade, keeps the void cold */}
        <span className="hero-video__scrim" aria-hidden="true" />

        {/* centred overlay */}
        <div ref={contentRef} className="hero-video__content">
          <div ref={eyebrowRef}>
            <Hallmark className="gem">The Dice · .925 Sterling</Hallmark>
          </div>

          <h1 ref={wordRef} className="hero-video__word display">Flight<br />Tribe</h1>

          {reduce ? (
            <p className="hero-video__tagline display">Roll with the Tribe</p>
          ) : (
            <SplitText
              text="Roll with the Tribe"
              tag="p"
              className="hero-video__tagline display"
              scrollTrigger={false}
              delay={0.55}
              stagger={0.03}
            />
          )}

          {/* the piece in the film IS the object — one quiet shoppable line */}
          <Link
            ref={ctaRef}
            to={`/product/${dice.slug}`}
            className="hero-video__cta linkline"
            aria-label={`${dice.name} — view piece, ${formatPrice(dice.priceUSD)}`}
          >
            View the piece — {formatPrice(dice.priceUSD)} →
          </Link>
        </div>

        {/* scroll cue */}
        <div ref={cueRef} className="hero-video__cue">
          <Hallmark>Scroll · read the stamp</Hallmark>
          <span className="hero-video__cueline" aria-hidden="true" />
        </div>
      </section>
    </div>
  )
}
