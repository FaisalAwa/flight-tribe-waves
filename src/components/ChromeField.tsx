import { memo, useEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════
   HERO ATMOSPHERE — the Bench hero's backdrop.

   v1/v2: procedural ogl/WebGL "liquid chrome" fbm shader — killed after
   two retuning passes still read as "flat/plain-black" (the failure was
   the technique, not the parameters: noise math reads as wallpaper, not
   atmosphere).
   v3: a real Higgsfield macro loop of liquid brushed chrome/mercury —
   correct mood, but content with no story of its own, so a synthetic
   per-category --c-gem "glint" overlay had to be painted on top in CSS
   to satisfy the one-gem-per-screen rule.
   v4 (current): the client's REAL product. A Higgsfield seedance_2_0
   generation (image_references = the actual dice-eye-cut.png product
   photo, for identity/likeness) of the Flight Tribe Dice tumbling
   through near-total darkness — solid sterling, ruby-set pips, the
   eye-sigil/crossed-arrows engraving all visible as the raking light
   sweeps past. The "colour" isn't a CSS trick anymore: the ruby flare
   is baked into the footage, so the old aggressive grayscale() grade
   (tuned for the colourless v3 mercury loop) is turned WAY down here —
   crank it back up and the one thing worth seeing (the gem catching
   light) gets crushed along with everything else. See site.css
   .hero-atmosphere__video / __tint for the retuned grade + why the tint
   overlay is now pinned to ruby specifically rather than `--c-gem`.
   Ken-Burns drift (CSS) + pointer parallax (JS, wrapper node only, so it
   never fights the video's own drift transform) carry over unchanged —
   proven, cheap, no rAF/GL render loop on the main thread.

   File/export name kept as ChromeField/ChromeField for import-surface
   stability (Home.tsx, components/index.ts) even though the internal
   technique is video, not a chrome-shader, and now depicts the dice
   specifically rather than abstract chrome — the room this was named
   for (the Bench hero backdrop) is unchanged.
   ═══════════════════════════════════════════════════════════════ */

const REDUCE_QUERY = '(prefers-reduced-motion: reduce)'

export const ChromeField = memo(function ChromeField() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const video = videoRef.current
    if (!wrap || !video) return

    const reduce = window.matchMedia(REDUCE_QUERY).matches

    // Pause off-screen (perf) and respect reduced-motion (freeze on poster
    // frame — never autoplay a motion loop when the OS says don't).
    const io = new IntersectionObserver(
      ([entry]) => {
        if (reduce) return
        if (entry.isIntersecting) video.play().catch(() => {})
        else video.pause()
      },
      { threshold: 0.01 },
    )
    io.observe(wrap)

    if (reduce) {
      video.pause()
      return () => io.disconnect()
    }

    // Pointer parallax — transform only (T8), rAF-throttled, applied to the
    // WRAPPER (the video element itself owns the separate Ken-Burns drift
    // keyframe in CSS, so the two transforms never collide on one node).
    let raf = 0
    let target = { x: 0, y: 0 }
    let current = { x: 0, y: 0 }
    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      target = {
        x: ((e.clientX - r.left) / r.width - 0.5) * 2,
        y: ((e.clientY - r.top) / r.height - 0.5) * 2,
      }
    }
    const tick = () => {
      current.x += (target.x - current.x) * 0.05
      current.y += (target.y - current.y) * 0.05
      wrap.style.transform = `translate3d(${current.x * -10}px, ${current.y * -6}px, 0)`
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    raf = requestAnimationFrame(tick)

    video.play().catch(() => {})

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      io.disconnect()
    }
  }, [])

  return (
    <div ref={wrapRef} className="hero-atmosphere" aria-hidden="true">
      <video
        ref={videoRef}
        className="hero-atmosphere__video"
        src="/assets/hero-atmosphere.mp4"
        poster="/assets/hero-atmosphere-poster.jpg"
        muted
        loop
        playsInline
        preload="auto"
      />
      <div className="hero-atmosphere__tint" />
      <div className="hero-atmosphere__vignette" />
    </div>
  )
})
