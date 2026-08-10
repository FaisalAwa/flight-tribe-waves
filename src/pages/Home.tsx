import { useLayoutEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { ProductCard, Hallmark, EyeSigil, HeroReveal, StampReader } from '@/components'
import { popularProducts, productBySlug } from '@/data/products'

/* Home — one continuous dice gesture up top (HeroReveal: glamour → engraved
   evidence), then the merchandise. The old ChromeField dice-tumble wallpaper,
   the DiceLanding settle and the pinned Vitrine "The Dice" all showed the dice
   in the first two screens and were cut for that redundancy — the hero now
   carries the dice moment once, and the signature scroll section (chosen
   separately) follows. */
export default function Home() {
  const root = useRef<HTMLDivElement>(null)
  const featured = popularProducts()
  // Hero object — the Ruby Relic Dice, which the product audit marks as the
  // piece the homepage hero video/CTA links to. Undefined-safe if it's ever
  // unpublished in Shopify.
  const dice = productBySlug('ruby-relic-dice')

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el) => {
        gsap.from(el, {
          y: reduce ? 0 : 40, opacity: reduce ? 1 : 0, duration: reduce ? 0.01 : 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 82%' },
        })
      })
    }, root)
    return () => ctx.revert()
  }, [])

  return (
    <div ref={root}>
      {/* ─── HERO — Glamour → Evidence ───────────────────────────── */}
      {dice && <HeroReveal dice={dice} />}

      {/* ─── SIGNATURE SCROLL — Reading the Stamp ────────────────── */}
      {dice && <StampReader dice={dice} nextLabel="The Bench · Current" />}

      {/* ─── FEATURED DROPS ─────────────────────────────────────── */}
      <section className="section wrap">
        <div className="reveal" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 20, marginBottom: 'var(--s-md)' }}>
          <div>
            <Hallmark className="eyebrow">The Bench · Current</Hallmark>
            <h2 className="display" style={{ fontSize: 'var(--t-h1)', marginTop: 12, color: 'var(--c-bone)' }}>Struck<br />by hand</h2>
          </div>
          <Link to="/shop" className="linkline">The whole bench →</Link>
        </div>

        <div className="plp-grid">
          {featured.map((p, i) => {
            const spans = ['span 7', 'span 5', 'span 5', 'span 7']
            const offset = i === 1 ? { marginTop: 'var(--s-md)' } : undefined
            return (
              <div className="reveal" key={p.id} style={{ gridColumn: spans[i % spans.length], ...offset }}>
                <ProductCard product={p} ratio={i % 2 === 0 ? '4 / 5' : '1 / 1'} />
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── TRIBE TEASER — left-locked, not centered ───────────── */}
      <section className="section wrap reveal" style={{ color: 'var(--c-bone)' }}>
        <div style={{ maxWidth: 940 }}>
          <EyeSigil size={40} className="gem" title="Flight Tribe" />
          <h2 className="display" style={{ fontSize: 'var(--t-h2)', margin: '20px 0' }}>
            Not a brand.<br />A tribe with a bench,<br />a torch, and a mark.
          </h2>
          <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 560, marginBottom: 28 }}>
            Earth-worship as craft, not creed — everything hand-cast in sterling, struck with the seal, set with one stone.
          </p>
          <Link to="/tribe" className="linkline">Read the story →</Link>
        </div>
      </section>
    </div>
  )
}
