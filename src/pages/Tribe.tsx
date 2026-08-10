import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
import { Hallmark, EyeSigil, Globe, DemoBadge, MagneticBtn, ChromeField } from '@/components'
import { currentYearRoman } from '@/lib/year'

/* ═══════════════════════════════════════════════════════════════
   TRIBE — the story (vault-grade rebuild, critique-approved blueprint).
   Broken 12-col grid, left-locked type, right-edge image bleeds, vertical
   gutter captions. NO centered symmetry, NO dividers. One gem (amethyst) held
   back for 5 beats, released once. Earth-worship = respect for MATERIAL, stated
   secularly — no religious iconography/copy (client hard rule). Copy DRAFT·DEMO.
   ═══════════════════════════════════════════════════════════════ */
export default function Tribe() {
  const root = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      // generic left-lock reveals
      gsap.utils.toArray<HTMLElement>('.t-reveal').forEach((el) => {
        gsap.from(el, {
          y: reduce ? 0 : 40, opacity: reduce ? 1 : 0, duration: reduce ? 0.01 : 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 84%' },
        })
      })

      // C.2 — the two marks draw/assemble on enter (once), staying apart
      gsap.from('.mark-draw', {
        opacity: 0, scale: 0.6, rotate: -12, duration: reduce ? 0.01 : 0.8, ease: 'back.out(2)', stagger: 0.15,
        scrollTrigger: { trigger: '.beat-marks', start: 'top 70%', once: true },
      })

      // C.3 — hallmark ledger figures stamp in like a die striking metal
      gsap.from('.stamp', {
        scale: reduce ? 1 : 1.35, rotate: reduce ? 0 : 3, opacity: 0, duration: reduce ? 0.01 : 0.5, ease: 'power4.out', stagger: 0.14,
        scrollTrigger: { trigger: '.beat-ledger', start: 'top 78%' },
      })

      // C.1 — THE BENCH pinned process reveal. Runs at EVERY width now (phone,
      // tablet, desktop) so mobile gets the identical pinned scrub, not a
      // static fallback. Reduced-motion is the only opt-out.
      const mm = gsap.matchMedia(root)
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({
          scrollTrigger: { trigger: '.beat-bench', start: 'top top', end: '+=120%', pin: true, scrub: 0.6, invalidateOnRefresh: true },
        })
        tl.fromTo('.bench-sweep', { xPercent: -130 }, { xPercent: 130, ease: 'none' }, 0)
          .from('.bench-line', { y: 16, opacity: 0, stagger: 0.3, ease: 'power2.out' }, 0.1)
          .fromTo('.bench-img', { scale: 1.06 }, { scale: 1, ease: 'none' }, 0)
      })
      mm.add('(prefers-reduced-motion: reduce)', () => {
        gsap.from('.bench-line', { opacity: 0, y: 10, stagger: 0.12, scrollTrigger: { trigger: '.beat-bench', start: 'top 75%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root} data-gem="amethyst" style={{ color: 'var(--c-bone)', overflowX: 'clip' }}>

      {/* ── BEAT 1 · COLD OPEN ─────────────────────────────────── */}
      <section style={{ position: 'relative', minHeight: '92svh', overflow: 'hidden', background: 'var(--c-pit)', display: 'flex', alignItems: 'center' }}>
        {/* same ambient liquid-chrome backdrop as the Home hero — the addendum
            calls for this behind Hero AND Tribe/About specifically. */}
        <ChromeField />
        <img
          src="/assets/products/ft-eagle.png" alt="" aria-hidden
          style={{ position: 'absolute', right: '-6vw', top: '-10%', width: 'min(58vw, 720px)', opacity: 0.1, filter: 'grayscale(1) contrast(1.1)', pointerEvents: 'none', mixBlendMode: 'screen' }}
        />
        <div style={{ position: 'absolute', top: 'calc(60px + var(--s-sm))', left: 'var(--gutter)', display: 'flex', alignItems: 'center', gap: 12, color: 'var(--c-chrome)' }}>
          <Globe size={34} />
          <Hallmark className="eyebrow">The Tribe — Field Notes · <DemoBadge label="DRAFT" /></Hallmark>
        </div>
        <h1 className="display" style={{ position: 'relative', zIndex: 2, fontSize: 'clamp(72px, 20vw, 320px)', lineHeight: 0.86, letterSpacing: '-0.02em', marginLeft: 'calc(var(--gutter) - 0.06em)' }}>
          Flight<br />Tribe
        </h1>
        <span className="vcap" style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%) rotate(180deg)' }}>Est. on Earth · {currentYearRoman()}</span>
      </section>

      {/* ── BEAT 2 · THESIS ────────────────────────────────────── */}
      <section className="wrap" style={{ paddingTop: 'var(--s-lg)', paddingBottom: 'var(--s-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--gutter)', alignItems: 'end' }}>
          <div className="t-reveal" style={{ gridColumn: '1 / span 8' }}>
            <Hallmark className="eyebrow gem">01 — The thesis</Hallmark>
            <p className="display" style={{ fontSize: 'var(--t-h2)', lineHeight: 1.02, textTransform: 'none', margin: '18px 0 20px' }}>
              Flight Tribe is a bench, a torch, and a mark.
            </p>
            <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 620, fontSize: 'clamp(15px,1.4vw,18px)', lineHeight: 1.8 }}>
              We cut from solid sterling and finish by hand — no moulds pulled by the thousand. The metal is honest; the stamp proves it.
            </p>
            <div style={{ marginTop: 22 }}><Hallmark>.925 · Made on Earth · {currentYearRoman()}</Hallmark></div>
          </div>
          <span className="vcap" style={{ gridColumn: '11 / span 2', justifySelf: 'end' }}>No church · Only craft</span>
        </div>
      </section>

      {/* ── BEAT 3 · THE BENCH (pinned) ────────────────────────── */}
      <section className="beat-bench" style={{ position: 'relative', minHeight: '100svh', display: 'grid', alignItems: 'center', background: 'var(--c-void)', overflow: 'hidden' }}>
        <div className="frame bench-frame" style={{ position: 'absolute', inset: 0, borderRadius: 0, border: 'none' }}>
          <img className="frame__img bench-img" src="/assets/products/bench-eagle.png" alt="Flight Tribe pieces on the jeweller's bench" style={{ objectPosition: 'center 40%', filter: 'grayscale(0.35) contrast(1.1) brightness(0.68)' }} loading="lazy" />
          <span className="bench-sweep" style={{ position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none', background: 'linear-gradient(105deg, transparent 44%, color-mix(in srgb, var(--c-chrome) 26%, transparent) 50%, transparent 56%)' }} />
          <span style={{ position: 'absolute', inset: 0, zIndex: 1, background: 'linear-gradient(90deg, var(--c-pit) 6%, transparent 55%)' }} />
        </div>
        <div className="wrap" style={{ position: 'relative', zIndex: 3 }}>
          <Hallmark className="eyebrow gem">02 — The bench</Hallmark>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
            {['Cut from solid', 'Finished by hand', 'Struck, not stamped'].map((l) => (
              <h2 key={l} className="bench-line display" style={{ fontSize: 'clamp(34px,6vw,88px)', lineHeight: 1 }}>{l}</h2>
            ))}
          </div>
          <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 460, marginTop: 22 }}>One bench. One torch. Every edge carries a hand.</p>
        </div>
        <span style={{ position: 'absolute', bottom: 'var(--s-md)', right: 'var(--gutter)', zIndex: 3, color: 'var(--c-chrome)' }}><EyeSigil size={26} title="" /></span>
      </section>

      {/* ── BEAT 4 · THE TWO MARKS ─────────────────────────────── */}
      <section className="wrap beat-marks" style={{ paddingTop: 'var(--s-lg)', paddingBottom: 'var(--s-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--gutter)', alignItems: 'center' }}>
          <div style={{ gridColumn: '1 / span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, color: 'var(--c-chrome)' }}>
            <span className="mark-draw"><Globe size={92} weight={1.1} title="" /></span>
            <span className="vcap">The ground we stand on</span>
          </div>
          <div className="t-reveal" style={{ gridColumn: '4 / span 6' }}>
            <Hallmark className="eyebrow gem">03 — Two marks, no church</Hallmark>
            <p className="display" style={{ fontSize: 'clamp(26px,3.4vw,52px)', lineHeight: 1.05, textTransform: 'none', margin: '16px 0' }}>
              The globe is the ground. The eye is the tribe watching its own.
            </p>
            <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 520, lineHeight: 1.8 }}>
              Earth-worship here means respect for material — silver, stone, fire, and the hand. Two secular marks, struck into the metal. Nothing borrowed, nothing sacred.
            </p>
          </div>
          <div style={{ gridColumn: '11 / span 2', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
            <span className="mark-draw gem"><EyeSigil size={92} weight={1.1} gem="var(--c-gem)" title="" /></span>
            <span className="vcap">The tribe watching its own</span>
          </div>
        </div>
      </section>

      {/* ── BEAT 5 · HALLMARK LEDGER (descending stair, no row) ─── */}
      <section className="wrap beat-ledger" style={{ position: 'relative', paddingTop: 'var(--s-md)', paddingBottom: 'var(--s-lg)', overflow: 'hidden' }}>
        <Hallmark className="eyebrow gem">04 — The metal</Hallmark>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: '10px', marginTop: 24 }}>
          {[['.925', 'Solid sterling, never plated', 1], ['USA', 'Cast + finished by hand', 4], [currentYearRoman(), 'Struck into every edge', 7]].map(([k, v, col]) => (
            <div key={k as string} className="stamp" style={{ gridColumn: `${col} / span 6` }}>
              <p className="display" style={{ fontSize: 'clamp(40px,7vw,110px)', lineHeight: 0.9, color: 'var(--c-gem-text)' }}>{k}</p>
              <Hallmark as="p">{v}</Hallmark>
            </div>
          ))}
        </div>
        {/* real stamps on real metal, bleeding into the right gutter */}
        <div className="frame frame--cut" style={{ position: 'absolute', right: '-3vw', top: '18%', width: 'min(26vw,300px)', aspectRatio: '1', borderRadius: 2, opacity: 0.9 }}>
          <img className="frame__img frame__img--cut" src="/assets/products/dice-eye-cut.png" alt="Eye sigil struck into a sterling die" loading="lazy" />
        </div>
      </section>

      {/* ── BEAT 6 · ONE GEM, ONE HEAT ─────────────────────────── */}
      <section style={{ position: 'relative', background: 'var(--c-void)', overflow: 'hidden' }}>
        <div className="wrap" style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--gutter)', alignItems: 'center', paddingTop: 'var(--s-lg)', paddingBottom: 'var(--s-lg)' }}>
          <div className="t-reveal" style={{ gridColumn: '1 / span 4' }}>
            <Hallmark className="eyebrow gem">05 — One gem</Hallmark>
            <p className="display" style={{ fontSize: 'var(--t-h2)', lineHeight: 1.02, textTransform: 'none', margin: '16px 0 18px' }}>Silver stays cold so the stone can burn.</p>
            <Hallmark as="p">Amethyst · one stone · set by hand</Hallmark>
          </div>
          <div className="frame frame--cut bleed-right" style={{ gridColumn: '7 / span 6', aspectRatio: '4 / 3', borderRadius: 2 }}>
            <img className="frame__img frame__img--cut" src="/assets/products/winged-heart-01-cut.png" alt="Winged heart pendant, amethyst set by hand" loading="lazy" />
            <span className="frame__gemwash" style={{ opacity: 0.9 }} />
          </div>
        </div>
      </section>

      {/* ── EARTH BAND · the bandana, made on earth (real product footage) ── */}
      <section style={{ position: 'relative', height: 'min(80svh, 640px)', overflow: 'hidden', background: 'var(--c-pit)' }}>
        <video
          className="earth-vid" src="/assets/bandana-meadow.mp4" poster="/assets/bandana-meadow-poster.jpg"
          autoPlay muted loop playsInline aria-hidden
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', filter: 'grayscale(0.55) contrast(1.05) brightness(0.8)' }}
        />
        <span style={{ position: 'absolute', inset: 0, background: 'linear-gradient(0deg, var(--c-pit) 8%, transparent 60%)' }} />
        <div className="wrap" style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', paddingBottom: 'var(--s-md)' }}>
          <Hallmark className="eyebrow">06 — Made on earth · <DemoBadge label="DEMO" /></Hallmark>
          <h2 className="display" style={{ fontSize: 'clamp(40px,7vw,120px)', lineHeight: 0.92, marginTop: 10 }}>Hand-drawn,<br />hand-made.</h2>
        </div>
      </section>

      {/* ── BEAT 7 · DEFIANCE ──────────────────────────────────── */}
      <section className="wrap" style={{ paddingTop: 'var(--s-lg)', paddingBottom: 'var(--s-lg)', overflow: 'hidden' }}>
        <div className="t-reveal">
          <Hallmark className="eyebrow gem">07 — The creed</Hallmark>
          <h2 className="display" style={{ fontSize: 'clamp(52px,11vw,180px)', lineHeight: 0.92, letterSpacing: '-0.02em', whiteSpace: 'nowrap', marginTop: 16 }}>
            Flag, not a faith.
          </h2>
          <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 560, marginTop: 20, lineHeight: 1.8 }}>
            No meaning borrowed from anyone's church. We don't do symbols we can't forge. Wear the mark because it's yours.
          </p>
        </div>
      </section>

      {/* ── BEAT 8 · CLOSE ─────────────────────────────────────── */}
      <section className="wrap" style={{ paddingBottom: 'var(--s-lg)' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--gutter)', alignItems: 'center' }}>
          <div className="t-reveal" style={{ gridColumn: '1 / span 7', display: 'flex', alignItems: 'center', gap: 20 }}>
            <EyeSigil size={30} className="gem" gem="var(--c-gem)" title="Flight Tribe" />
            <MagneticBtn to="/shop" className="btn btn--gem">Enter the vault</MagneticBtn>
          </div>
          <span className="vcap" style={{ gridColumn: '11 / span 2', justifySelf: 'end' }}>.925 · DM to reserve · {currentYearRoman()}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 'var(--s-md)', color: 'var(--c-chrome)' }}><Globe size={44} weight={1} title="" /></div>
      </section>
    </div>
  )
}
