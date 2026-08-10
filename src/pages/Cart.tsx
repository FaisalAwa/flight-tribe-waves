import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import { Minus, Plus, Trash } from '@phosphor-icons/react'
import { Hallmark, EyeSigil, Globe, DemoBadge, MagneticBtn } from '@/components'
import { useCart } from '@/context/CartContext'
import { formatPrice } from '@/lib/format'
import { currentYearRoman } from '@/lib/year'

/* Animated subtotal — adapted from lightswind's count-up.tsx: the figure
   tweens from its previous value to the new one whenever qty/items change,
   instead of snapping. Direct DOM textContent write via a GSAP-driven
   proxy object (no re-render per frame); respects reduced-motion by
   jumping straight to the final value. */
function SubtotalFigure({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null)
  const prev = useRef(value)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) { el.textContent = formatPrice(value); prev.current = value; return }
    const obj = { v: prev.current }
    const tween = gsap.to(obj, {
      v: value, duration: 0.5, ease: 'power2.out',
      onUpdate: () => { el.textContent = formatPrice(obj.v) },
    })
    prev.current = value
    return () => { tween.kill() }
  }, [value])

  return <span ref={ref}>{formatPrice(value)}</span>
}

/* Cart — dark stamped-receipt. Standard line-items + qty steppers + subtotal
   + prominent CHECKOUT (honest: stubbed until Shopify) + DM TO RESERVE fallback.
   Both are clearly live. Commerce seam stays intact (see lib/shopify.ts). */
export default function Cart() {
  const { items, subtotalUSD, count, shopifyEnabled, setQty, remove, clear, checkout } = useCart()
  const [busy, setBusy] = useState(false)

  const onCheckout = async () => {
    setBusy(true)
    const url = await checkout()
    setBusy(false)
    if (url) { window.location.href = url; return }
    // fallback handled inline below (DM to reserve) — nothing else to do
  }

  const reserveText = encodeURIComponent(
    `FLIGHT TRIBE — reserve request:\n${items.map((i) => `• ${i.qty}× ${i.name} — ${formatPrice(i.priceUSD * i.qty)}`).join('\n')}\nSubtotal ~ ${formatPrice(subtotalUSD)}`,
  )
  const reserveSubject = encodeURIComponent('Flight Tribe — reserve request')

  if (count === 0) {
    return (
      <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', paddingTop: 60 }}>
        <div style={{ textAlign: 'center', color: 'var(--c-bone)' }}>
          <Globe size={54} weight={1.2} />
          <h1 className="display" style={{ fontSize: 'var(--t-h2)', margin: '22px 0 12px' }}>The bag is empty</h1>
          <p className="body" style={{ color: 'var(--c-muted)', marginBottom: 28 }}>Nothing struck yet.</p>
          <MagneticBtn to="/shop" className="btn btn--gem">Enter the vault</MagneticBtn>
        </div>
      </div>
    )
  }

  return (
    <div data-gem="ruby" style={{ paddingTop: 'calc(60px + var(--s-md))', minHeight: '100svh' }}>
      <div className="wrap stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(28px,4vw,64px)', alignItems: 'start' }}>
        {/* RECEIPT */}
        <div style={{ gridColumn: 'span 8' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22 }}>
            <h1 className="display" style={{ fontSize: 'var(--t-h1)', color: 'var(--c-bone)' }}>Bag</h1>
            <Hallmark className="eyebrow">Flight Tribe · Receipt · {count} pcs</Hallmark>
          </div>

          <div className="receipt">
            {items.map((it) => (
              <div className="receipt__row" key={it.id}>
                <img className="receipt__thumb" src={it.image} alt={it.name} />
                <div style={{ color: 'var(--c-bone)' }}>
                  <Link to={`/product/${it.slug}`} className="card__name" style={{ fontSize: 20 }}>{it.name}</Link>
                  <p className="card__spec" style={{ marginTop: 6 }}>{it.spec} {it.isDemo && <DemoBadge />}</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 12 }}>
                    <div className="qtybox">
                      <button onClick={() => setQty(it.id, it.qty - 1)} disabled={it.qty <= 1} aria-label={`Decrease quantity, ${it.name}`}>
                        <Minus size={14} weight="light" aria-hidden />
                      </button>
                      <span aria-live="off">{it.qty}</span>
                      <button onClick={() => setQty(it.id, it.qty + 1)} aria-label={`Increase quantity, ${it.name}`}>
                        <Plus size={14} weight="light" aria-hidden />
                      </button>
                    </div>
                    <button
                      className="topbar__link" style={{ gap: 6 }} onClick={() => remove(it.id)}
                      aria-label={`Remove ${it.name} from bag`}
                    >
                      <Trash size={14} weight="light" aria-hidden /> Remove
                    </button>
                  </div>
                </div>
                <Hallmark className="card__price" as="span">{formatPrice(it.priceUSD * it.qty)}</Hallmark>
              </div>
            ))}
          </div>

          <button className="topbar__link" onClick={clear} style={{ marginTop: 18 }}>Clear bag</button>
        </div>

        {/* SUMMARY */}
        <aside style={{ gridColumn: '9 / span 4', position: 'sticky', top: 'calc(60px + var(--s-sm))', color: 'var(--c-bone)' }}>
          <div className="receipt" style={{ padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <Hallmark>Subtotal</Hallmark>
              <span className="display" style={{ fontSize: 28 }}><SubtotalFigure value={subtotalUSD} /></span>
            </div>
            {/* When Shopify is live, card checkout is the loud primary action.
                While it's stubbed, we do NOT render a dead "Checkout" that
                silently no-ops — the live path (reserve by DM/email) becomes
                the primary gem button, so the loudest control is the one that
                actually works. Seam untouched (checkout()/SHOPIFY_ENABLED). */}
            {shopifyEnabled ? (
              <>
                <p className="card__spec" style={{ marginTop: 10 }}>Shipping + tax at checkout · <DemoBadge label="EST" /></p>
                <button className="btn btn--gem btn--block" style={{ marginTop: 22 }} onClick={onCheckout} disabled={busy}>
                  {busy ? 'Opening…' : 'Checkout'}
                </button>
              </>
            ) : (
              <>
                <p className="card__spec" style={{ marginTop: 10 }}>Hand-held reservation · no card charged yet</p>
                <a className="btn btn--gem btn--block" style={{ marginTop: 22 }} href={`https://wa.me/?text=${reserveText}`} target="_blank" rel="noopener noreferrer">
                  Reserve by DM →
                </a>
                <a className="btn btn--block" style={{ marginTop: 12 }} href={`mailto:hello@flighttribe.co?subject=${reserveSubject}&body=${reserveText}`}>
                  Reserve by email →
                </a>
                <p className="body" style={{ color: 'var(--c-muted)', fontSize: 13, margin: '14px 0 0', lineHeight: 1.6 }}>
                  Card checkout switches on the moment Shopify's wired in. Until then we hold your piece by hand — nothing's charged until you confirm.
                </p>
              </>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center', marginTop: 20, color: 'var(--c-muted)' }}>
              <EyeSigil size={18} /> <Hallmark>.925 · USA · {currentYearRoman()}</Hallmark>
            </div>
          </div>
          <Link to="/shop" className="linkline" style={{ display: 'inline-block', marginTop: 18 }}>← Back to the bench</Link>
        </aside>
      </div>
      <div className="wrap" style={{ padding: 'var(--s-lg) 0' }} />
    </div>
  )
}
