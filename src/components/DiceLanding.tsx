import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { Hallmark } from './Sigil'
import type { Product } from '@/data/products'

/* ═══════════════════════════════════════════════════════════════
   THE LANDING — signature scroll reveal, replacing "The Eye Opens"
   outright (2026-07-05). The operator rejected EyeReveal twice — once a
   rendering-bug pass, once a narrative-copy pass — and still didn't want
   it. Both passes fixed the MECHANISM (a giant EyeSigil vesica irising
   open via clip-path) without questioning whether that mechanism should
   exist at all. Research before building a third pass instead:

   1. metabole.studio's scrollytelling guide: real scrollytelling needs
      "a beginning, a tension, a reveal, a resolution" where "remove the
      scroll and the story collapses." EyeReveal failed this — the eye
      motif had no causal link to the scroll act itself; scrolling just
      ran a clip-path timer on an icon. The mechanism was decorative, not
      load-bearing.
   2. Lovable's scroll-pattern guide: effects read as intentional when
      matched to content purpose, gimmicky when they exist "purely for
      visual spectacle" independent of what's being shown.
   3. Awwwards' scroll-driven product work (Unique Jewelry's Three.js
      scroll-controlled ring, Parmigiani's "Kalpa" scroll-triggered watch
      construction) all share one trait: scroll drives a REAL object
      through a REAL physical process (assembly, rotation, construction)
      using the object's own photography/geometry — never an abstract
      brand-mark standing in for the product.

   The fix: make the scroll do the one thing this exact moment in the
   page can uniquely justify — finish the sentence the hero just started.
   ChromeField's hero backdrop (see its header) now shows the real Flight
   Tribe Dice tumbling through the dark. They never land in that loop (it
   has to seamlessly repeat). This section IS them landing: the same
   pair, still settling out of the throw, coming to rest and turning their
   engraved faces — the ruby pips, the eye-sigil + crossed-arrows, the
   USA/2026 hallmark — into the light, before the page hands off into the
   product grid immediately below. Remove the scroll and there's nothing
   left to see: the dice stay mid-tumble forever. That's the "narrative
   necessity" test EyeReveal failed.

   Alternatives considered and rejected — see report for the full writeup:
   - An exploded/disassembled-cube "construction" reveal (echoing the
     Parmigiani watch-construction technique): rejected, no 3D model of
     the die exists, only photography, so per-face separation would need
     new fake geometry rather than the real product.
   - A horizontal "roll" filmstrip continuing the tumble sideways:
     rejected, the site has no other horizontal-scroll surface, and
     introducing one directly under the hero risks disorientation instead
     of continuity, plus it duplicates the PLP grid's own job.
   - A true Apple-style canvas frame-scrub (this repo's own
     scripts/extract-frames.mjs pattern, per CLAUDE.md, exists for
     exactly this): the most premium option technically, but there is no
     frame-extraction pipeline wired up in THIS project yet, and standing
     one up from zero (ffmpeg pipeline + new canvas component + dozens of
     generated frames to verify individually) is a bigger, riskier build
     than this pass calls for. Flagged as a real v2 upgrade path once
     dice-specific source footage exists (it now does — see
     public/assets/hero-atmosphere.mp4) rather than attempted here.

   Mechanism: real product photography (the dice-eye-cut.png gallery shot
   already used elsewhere in Home.tsx), not an icon — so there is no
   fine-linework-sliced-by-clip-path risk (the bug hit twice on EyeSigil).
   Only transform/opacity animate (T8); no filter/blur is ever tweened.

   A first pass here also tried a blurred "trailing motion echo" ghost
   duplicate of the dice image, scaling/translating away as the pair
   settles. Cut after scrubbing the scene at 0/25/50/75/100% progress (the
   exact check this file's own header warns future edits to do): the
   source cutout PNG has a lot of transparent padding around the actual
   dice, and blowing that up + blurring it produced an unrecognizable
   diagonal smear rather than a legible "echo" at every progress point in
   between, not just the start/end — the same class of bug as the
   EyeSigil clip-path issue, just on a different asset. Rather than keep
   tuning an effect built on a source image that isn't suited to it, it
   was removed outright; the settle/sheen/glow/shadow beats below carry
   the scene on their own without it.

   useLayoutEffect + gsap.matchMedia + ctx.revert(), mirroring the
   Vitrine pin in Home.tsx exactly: desktop pins + scrubs, mobile/
   reduced-motion plays once on scroll-into-view.
   ═══════════════════════════════════════════════════════════════ */

interface DiceLandingProps {
  /** the real Flight Tribe Dice product record (Home.tsx already resolves
   *  this once as `vitrine` for the pinned Vitrine section below — reused
   *  here rather than re-querying the catalogue) */
  dice: Product
  /** verbatim eyebrow of the section that follows — echoed as a closing
   *  cue so the reveal reads as a transition INTO it, not a random beat */
  nextLabel?: string
}

export function DiceLanding({ dice, nextLabel = 'The Bench · Current' }: DiceLandingProps) {
  const root = useRef<HTMLDivElement>(null)
  const mainRef = useRef<HTMLDivElement>(null)
  const shadowRef = useRef<HTMLDivElement>(null)
  const sheenRef = useRef<HTMLSpanElement>(null)
  const glowRef = useRef<HTMLDivElement>(null)
  const copyRef = useRef<HTMLDivElement>(null)
  const cueRef = useRef<HTMLDivElement>(null)

  const landedSrc = dice.gallery?.[1] ?? dice.image

  useLayoutEffect(() => {
    const main = mainRef.current
    if (!main) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // synchronous initial state — no flash of the "landed" pose before the
    // scrub/timeline takes over
    gsap.set(main, { rotateZ: -9, y: -46, scale: 0.93, opacity: 0.82 })
    gsap.set(shadowRef.current, { scaleX: 0.4, opacity: 0 })
    gsap.set(sheenRef.current, { xPercent: -130 })
    gsap.set(glowRef.current, { opacity: 0, scale: 0.85 })
    gsap.set(copyRef.current, { opacity: 0, y: 16 })
    gsap.set(cueRef.current, { opacity: 0, y: 10 })

    const ctx = gsap.context(() => {
      const mm = gsap.matchMedia(root)

      mm.add('(min-width: 901px) and (prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: {
            trigger: '.dice-landing', start: 'top top', end: '+=120%', pin: true, scrub: 0.5,
          },
        })
        tl.fromTo(main, { rotateZ: -9, y: -46, scale: 0.93, opacity: 0.82 },
          { rotateZ: 0, y: 0, scale: 1, opacity: 1, ease: 'none' }, 0)
          .fromTo(shadowRef.current, { scaleX: 0.4, opacity: 0 },
            { scaleX: 1, opacity: 0.85, ease: 'none' }, 0.05)
          .fromTo(copyRef.current, { opacity: 0, y: 16 }, { opacity: 1, y: 0, ease: 'none' }, 0.16)
          .fromTo(sheenRef.current, { xPercent: -130 }, { xPercent: 130, ease: 'none' }, 0.3)
          .fromTo(glowRef.current, { opacity: 0, scale: 0.85 }, { opacity: 0.65, scale: 1.1, ease: 'none' }, 0.42)
          .fromTo('.dice-landing__spec', { opacity: 0, y: 14 }, { opacity: 1, y: 0, stagger: 0.12, ease: 'none' }, 0.5)
          .to(copyRef.current, { opacity: 0, y: -14, ease: 'none' }, 0.78)
          .fromTo(cueRef.current, { opacity: 0, y: 10 }, { opacity: 1, y: 0, ease: 'none' }, 0.85)
      })

      mm.add('(max-width: 900px), (prefers-reduced-motion: reduce)', () => {
        const d = reduce ? 0.01 : 1
        gsap.timeline({ scrollTrigger: { trigger: '.dice-landing', start: 'top 75%' } })
          .fromTo(main, { rotateZ: -9, y: -30, scale: 0.94, opacity: 0.85 },
            { rotateZ: 0, y: 0, scale: 1, opacity: 1, duration: d, ease: 'power2.out' }, 0)
          .fromTo(shadowRef.current, { scaleX: 0.4, opacity: 0 },
            { scaleX: 1, opacity: 0.85, duration: d, ease: 'power2.out' }, reduce ? 0 : 0.1)
          .fromTo(copyRef.current, { opacity: 0, y: 16 },
            { opacity: 1, y: 0, duration: d, ease: 'power2.out' }, reduce ? 0 : 0.15)
          .fromTo(glowRef.current, { opacity: 0, scale: 0.85 },
            { opacity: reduce ? 0 : 0.65, scale: 1.1, duration: d, ease: 'power2.out' }, reduce ? 0 : 0.3)
          .fromTo('.dice-landing__spec', { opacity: 0, y: 14 },
            { opacity: 1, y: 0, stagger: reduce ? 0 : 0.1, duration: d, ease: 'power2.out' }, reduce ? 0 : 0.4)
          .fromTo(cueRef.current, { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: d, ease: 'power2.out' }, reduce ? 0 : 0.7)
      })
    }, root)

    return () => ctx.revert()
  }, [])

  return (
    <div ref={root}>
      <section className="dice-landing" data-gem="ruby" style={{ background: 'var(--c-void)' }}>
        {/* left-locked context — ties this beat explicitly to the hero's own
            throw (ChromeField's backdrop), matching the site's left-lock
            type / no-centered-everything rule (hero tagline block, above). */}
        <div ref={copyRef} className="dice-landing__copy">
          <Hallmark className="gem">Thrown above · landed here</Hallmark>
          <p className="body" style={{ fontSize: 'var(--t-sub)', color: 'var(--c-muted)', lineHeight: 1.45, marginTop: 10, maxWidth: 380 }}>
            The same {dice.name.toLowerCase()} from the bench above, coming to rest — solid .925,
            every pip a set ruby, faces struck with the eye sigil and crossed arrows.
          </p>
        </div>

        <div className="dice-landing__stage">
          <div ref={mainRef} className="dice-landing__main">
            <img className="dice-landing__img" src={landedSrc} alt={dice.name} loading="lazy" decoding="async" />
            <div ref={glowRef} className="dice-landing__glow" aria-hidden="true" />
          </div>

          {/* sheen lives as a STAGE-level sibling, not a child of .dice-
              landing__main — main gets a GSAP transform (rotateZ/scale/y) to
              settle the dice, and any transformed ancestor opens a new
              stacking context that traps mix-blend-mode against just that
              ancestor's own (empty) backdrop instead of the section's real
              void-black background. Caught by scrubbing this scene at
              multiple progress points: the sheen rendered as an opaque grey
              bar that never disappeared over the cutout's transparent
              padding until it was moved out here. */}
          <span ref={sheenRef} className="dice-landing__sheen" aria-hidden="true" />

          <div ref={shadowRef} className="dice-landing__shadow" aria-hidden="true" />
        </div>

        {/* hallmark spec stamps — drawn from the real product record (not
            hardcoded copy), stamped in as the dice come to rest. */}
        <div className="dice-landing__specs">
          {dice.hallmark.map((h) => (
            <div className="dice-landing__spec" key={h}>
              <span className="dice-landing__dot" aria-hidden="true" />
              <Hallmark>{h}</Hallmark>
            </div>
          ))}
        </div>

        {/* closing cue — verbatim-echoes the next section's own eyebrow, so
            scrolling past this pinned scene reads as arriving at something
            already named, not cutting to something unrelated. General
            connective-tissue technique kept from the old EyeReveal pass —
            it isn't eye-specific, it's just good sequencing. */}
        <div ref={cueRef} className="dice-landing__cue">
          <Hallmark>↓ Scroll into</Hallmark>
          <Hallmark className="gem">{nextLabel}</Hallmark>
        </div>
      </section>
    </div>
  )
}
