import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { MagnifyingGlassPlus, X } from '@phosphor-icons/react'
import { Hallmark, EyeSigil, ProductCard } from '@/components'
import { ElectroFrame } from '@/components/ElectroFrame'
import { productBySlug, productsByCategory, products } from '@/data/products'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import NotFound from './NotFound'

/* PDP — conventional + generous, tuned for conversion. Big gallery left,
   sticky buy column right (identity → price → hallmark trust panel →
   honest production note → ADD TO BAG → fulfillment microcopy). The long
   description lives BELOW the two-column grid on purpose: it keeps the
   sticky buy column short enough to genuinely stick, and keeps the eye on
   the CTA instead of a wall of body copy competing for attention.
   Edge = typography + the eye-stamp confirm. */

/** "Hand-forged" → the verb in the production note. Driven by the piece's own
    Shopify tag, so the claim is only made for pieces the catalogue actually
    makes it for — anything else gets no production note at all, rather than an
    invented one. */
function craftVerb(tag: string | undefined): string | null {
  if (!tag || !/^hand-/i.test(tag)) return null
  return tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase()
}

export default function Product() {
  const { slug } = useParams()
  const product = slug ? productBySlug(slug) : undefined
  const root = useRef<HTMLDivElement>(null)
  const [shot, setShot] = useState(0)
  const [size, setSize] = useState<string | null>(null)
  const [fired, setFired] = useState(false)
  const [ripple, setRipple] = useState<{ x: number; y: number; key: number } | null>(null)
  const { add, count } = useCart()

  // gallery zoom — small lightbox, fade/scale like the Loader's gem-ignite beat
  const [zoomOpen, setZoomOpen] = useState(false)
  const zoomBtnRef = useRef<HTMLButtonElement>(null)
  const zoomModalRef = useRef<HTMLDivElement>(null)
  const zoomImgRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    if (!product) { setZoomOpen(false); return }
    setShot(0)
    setSize(null)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.from('.pdp__reveal', { y: reduce ? 0 : 32, opacity: reduce ? 1 : 0, duration: reduce ? 0.01 : 0.8, ease: 'power3.out', stagger: reduce ? 0 : 0.08 })
    }, root)
    return () => ctx.revert()
  }, [product])

  /* The price is whatever the Shopify variant costs — there is no karat
     multiplier any more. Every piece in the catalogue is a single Shopify
     variant at one real list price; a metal selector here would have quoted
     figures the store cannot actually charge. */

  // focus trap + Escape-to-close + scroll lock, matching Nav's INDEX overlay
  useEffect(() => {
    if (!zoomOpen) return
    const firstFocusable = zoomModalRef.current?.querySelector<HTMLElement>('button')
    firstFocusable?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { setZoomOpen(false); return }
      if (e.key !== 'Tab') return
      const nodes = zoomModalRef.current?.querySelectorAll<HTMLElement>('button')
      if (!nodes || nodes.length === 0) return
      const list = Array.from(nodes)
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // Modal is portaled to document.body (below) — a true sibling of <main>,
    // so marking main/footer inert doesn't inert the modal itself. This also
    // inerts the mobile sticky buy bar (rendered inside <main>) while open.
    const siblings = Array.from(document.querySelectorAll('main, footer'))
    siblings.forEach((el) => { el.setAttribute('aria-hidden', 'true'); (el as HTMLElement & { inert: boolean }).inert = true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      siblings.forEach((el) => { el.removeAttribute('aria-hidden'); (el as HTMLElement & { inert: boolean }).inert = false })
      zoomBtnRef.current?.focus()
    }
  }, [zoomOpen])

  // fade/scale reveal — same vocabulary as the Ignite stamp / Loader gem beat
  useLayoutEffect(() => {
    if (!zoomOpen) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(zoomModalRef.current, { opacity: 1 })
        gsap.set(zoomImgRef.current, { opacity: 1, scale: 1 })
        return
      }
      gsap.fromTo(zoomModalRef.current, { opacity: 0 }, { opacity: 1, duration: 0.3, ease: 'power2.out' })
      gsap.fromTo(zoomImgRef.current, { opacity: 0, scale: 0.94 }, { opacity: 1, scale: 1, duration: 0.4, ease: 'power3.out' })
    }, zoomModalRef)
    return () => ctx.revert()
  }, [zoomOpen])

  if (!product) return <NotFound />

  const gallery = product.gallery ?? [product.image]

  // Cross-sell: same category first (the direct alternative), then backfill
  // from other live categories so the row never comes up short (e.g. the
  // Peace Pipe only has one accessories sibling). Real catalogue data only —
  // no invented "customers also bought" signal.
  const sameCategory = productsByCategory(product.category).filter((p) => p.id !== product.id)
  const crossCategory = products.filter((p) => p.id !== product.id && p.category !== product.category)
  const related = [...sameCategory, ...crossCategory].slice(0, 3)
  const relatedSpan = related.length >= 3 ? 4 : related.length === 2 ? 6 : 12

  const craft = craftVerb(product.tag)
  const needsSize = !!(product.sizes && product.sizes.length > 0)

  const onAdd = () => {
    if (needsSize && !size) return  // guard: no sizeless made-to-order ring

    // Build unique cart id: product + optional size
    const idParts = [product.id]
    if (size) idParts.push(size)

    const specParts = [product.spec, size ? `Size ${size}` : null].filter(Boolean) as string[]

    add({
      id: idParts.join('-'),
      slug: product.slug, name: product.name,
      spec: specParts.length ? specParts.join(' · ') : undefined,
      image: product.image, priceUSD: product.priceUSD, gem: `var(--gem-${product.gem})`,
      variantId: product.variantId,
    })
    setFired(false)
    requestAnimationFrame(() => setFired(true))
    window.setTimeout(() => setFired(false), 700)
  }

  // ripple-button-inspired click pulse (lightswind ripple-button.tsx) —
  // purely additive polish under the locked Ignite eye-stamp confirmation,
  // never a replacement for it. Pointer-only (mouse/touch); keyboard
  // activation still gets the Ignite seal + BAG(n) roll, unaffected.
  const onAddPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    setRipple({ x: e.clientX - r.left, y: e.clientY - r.top, key: Date.now() })
  }

  return (
    <div ref={root} data-gem={product.gem} className="pdp-page" style={{ paddingTop: 'calc(60px + var(--s-md))', minHeight: '100svh' }}>
      <div className="wrap" style={{ marginBottom: 'var(--s-sm)' }}>
        <Hallmark className="eyebrow">
          <Link to="/shop" className="gem">Index</Link> · <Link to={`/shop/${product.category}`} className="gem">{product.category}</Link> · {product.name}
        </Hallmark>
      </div>

      <div className="wrap stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 'clamp(28px, 5vw, 80px)', alignItems: 'start' }}>
        {/* GALLERY */}
        <div className="pdp__reveal" style={{ gridColumn: 'span 7' }}>
          <style>{`
            .ft-zoom-btn {
              position: absolute; z-index: 6; top: 14px; right: 14px;
              display: inline-flex; align-items: center; justify-content: center;
              width: 44px; height: 44px; color: var(--c-chrome);
              background: color-mix(in srgb, var(--c-void) 55%, transparent);
              border: 1px solid var(--c-line); transition: color 0.2s var(--ease-ui), opacity 0.2s var(--ease-ui);
            }
            .ft-zoom-btn:hover, .ft-zoom-btn:focus-visible { color: var(--c-gem); }
            @media (hover: hover) and (pointer: fine) {
              /* faintly visible at rest so macro-zoom (a key jewelry-buying
                 behaviour) is discoverable, full on frame hover / focus. */
              .ft-zoom-btn { opacity: 0.55; }
              .frame:hover .ft-zoom-btn, .ft-zoom-btn:focus-visible { opacity: 1; }
            }
            .ft-zoom-modal {
              position: fixed; inset: 0; z-index: 150; background: color-mix(in srgb, var(--c-void) 88%, transparent);
              display: grid; place-items: center; padding: var(--gutter);
            }
            .ft-zoom-modal__inner { position: relative; max-width: min(92vw, 900px); max-height: 88vh; }
            .ft-zoom-modal__inner img { width: 100%; height: 100%; max-height: 88vh; object-fit: contain; border: 1px solid var(--c-line); }
            .ft-zoom-modal__close {
              position: absolute; top: -14px; right: -14px; width: 44px; height: 44px;
              display: inline-flex; align-items: center; justify-content: center;
              color: var(--c-void); background: var(--c-bone); border: 1px solid var(--c-line);
              transition: color 0.2s var(--ease-ui), background 0.2s var(--ease-ui);
            }
            .ft-zoom-modal__close:hover, .ft-zoom-modal__close:focus-visible { background: var(--c-gem); color: var(--c-void); }
          `}</style>
          <ElectroFrame>
            <div className={"frame"} style={{ aspectRatio: '1', borderRadius: 2, position: 'relative' }}>
              <img className={"frame__img"} src={gallery[shot]} alt={product.name} style={{ objectPosition: product.focal }} />
              <span className="ignite" data-fire={fired ? 'true' : 'false'}>
                <EyeSigil size={130} weight={1.1} gem={`var(--gem-${product.gem})`} />
              </span>
              <button
                ref={zoomBtnRef} type="button" className="ft-zoom-btn" onClick={() => setZoomOpen(true)}
                aria-label={`Enlarge image of ${product.name}`} aria-haspopup="dialog"
              >
                <MagnifyingGlassPlus size={20} weight="light" />
              </button>
            </div>
          </ElectroFrame>
          {gallery.length > 1 && (
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              {gallery.map((g, i) => (
                <button
                  key={g} onClick={() => setShot(i)} aria-label={`View ${i + 1}`}
                  className={"frame"} style={{ width: 74, height: 74, borderRadius: 2, outline: i === shot ? '1px solid var(--c-gem)' : 'none' }}
                >
                  <img className={"frame__img"} src={g} alt="" style={{ objectPosition: product.focal }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* BUY COLUMN — sticky on desktop; kept short/scannable on purpose so
            the stickiness stays genuine and the CTA reads as the clear next
            action, not one option among equal-weight blocks. */}
        <div
          className="pdp__reveal"
          style={{
            gridColumn: '8 / span 5', position: 'sticky', top: 'calc(60px + var(--s-sm))', color: 'var(--c-bone)',
            display: 'flex', flexDirection: 'column', gap: 'var(--s-xs)',
          }}
        >
          <div>
            {product.tag && <Hallmark className="eyebrow gem">{product.tag}</Hallmark>}
            <h1 className="display" style={{ fontSize: 'clamp(26px, 3.2vw, 46px)', margin: '10px 0 6px' }}>{product.name}</h1>
            {product.spec && <p className="card__spec">{product.spec}</p>}
          </div>

          <p style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span className="display" style={{ fontSize: 'clamp(30px,3.4vw,44px)' }}>{formatPrice(product.priceUSD)}</span>
          </p>

          {/* The karat selector that used to sit here quoted 10/14/18KT prices
              derived from a multiplier, not from the store. Each piece is one
              Shopify variant at one real price, so it was removed rather than
              left showing figures checkout could never honour. */}

          {/* Size — only where size is load-bearing (rings). Add-to-Bag is
              gated until one is chosen so a made-to-order ring can't be
              ordered sizeless (DIRECTION specs a variant selector). */}
          {needsSize && (
            <div className="pdp-sizes">
              <div className="pdp-sizes__head">
                <Hallmark className="pdp-fulfill__label">Ring size</Hallmark>
                {!size && <Hallmark className="gem">Select one</Hallmark>}
              </div>
              <div className="pdp-sizes__row" role="radiogroup" aria-label="Ring size">
                {product.sizes!.map((s) => (
                  <button
                    key={s} type="button" role="radio" aria-checked={size === s}
                    className="pdp-size" data-active={size === s} onClick={() => setSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Honest production note — kept tight to the CTA so price → note →
              button read as one unit (no heavy block between them). */}
          {craft && (
            <p className="pdp-note">
              <EyeSigil size={14} gem="var(--c-gem)" title="" />
              <span>{craft} to order — one piece at a time on our bench. Please allow extra time for handmade work.</span>
            </p>
          )}

          <div>
            <button
              className="btn btn--gem btn--block btn--cta" onClick={onAdd} onPointerDown={onAddPointerDown}
              disabled={needsSize && !size}
            >
              <EyeSigil size={18} gem="var(--c-gem)" /> {needsSize && !size ? 'Select a size' : 'Add to Bag'}
              {ripple && (
                <span
                  key={ripple.key} aria-hidden className="ripple-fx" data-pulse="true"
                  style={{ '--rx': `${ripple.x}px`, '--ry': `${ripple.y}px` } as React.CSSProperties}
                />
              )}
            </button>
            <Link to="/cart" className="linkline" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
              {count > 0 ? `View bag (${count}) →` : 'View bag →'}
            </Link>
          </div>

          {/* Hallmarked authenticity — reinforcement AFTER the CTA (the metal's
              real provenance), lightened so it no longer out-weights price/CTA
              in the column. Rendered only for pieces whose hallmark Shopify
              actually records, so the stamps are never invented. */}
          {product.hallmark && product.hallmark.length > 0 && (
          <div className="pdp-trust">
            <div className="pdp-trust__head">
              <EyeSigil size={20} weight={1.2} gem="var(--c-gem)" title="" />
              <Hallmark as="p">Hallmarked — struck into the metal, not a label</Hallmark>
            </div>
            <div className="pdp-trust__list">
              {product.hallmark.map((h) => (
                <span key={h} className="pdp-trust__item">
                  <span className="pdp-trust__dot" aria-hidden="true" />
                  <Hallmark>{h}</Hallmark>
                </span>
              ))}
            </div>
          </div>
          )}

          {/* Shipping / care / fit — every line a TRUE statement (no invented
              policy, no "TBC" cluster at the point of decision). USA, tracked
              and made-to-order are all real; prices are now the store's own. */}
          <div className="pdp-fulfill">
            <div className="pdp-fulfill__row">
              <Hallmark className="pdp-fulfill__label">Shipping</Hallmark>
              <span className="pdp-fulfill__val">Made to order in our USA workshop, then shipped tracked.</span>
            </div>
            {/* Metal care only on the metal pieces — the bandanas are cloth, and
                the copy used to say "sterling silver" on every product. */}
            {product.category !== 'clothing' && (
              <div className="pdp-fulfill__row">
                <Hallmark className="pdp-fulfill__label">Care</Hallmark>
                <span className="pdp-fulfill__val">Soft cloth only. Chlorine and household chemicals are the enemy; keep them apart.</span>
              </div>
            )}
            {/* the measured size, straight from Shopify — omitted entirely
                for pieces whose dimensions the client hasn't recorded */}
            {product.dimensions && (
              <div className="pdp-fulfill__row">
                <Hallmark className="pdp-fulfill__label">Size</Hallmark>
                <span className="pdp-fulfill__val">{product.dimensions}</span>
              </div>
            )}
            <div className="pdp-fulfill__row">
              <Hallmark className="pdp-fulfill__label">Fit</Hallmark>
              <span className="pdp-fulfill__val">Each piece is made to order — message us with any sizing or fit questions before you buy.</span>
            </div>
          </div>
        </div>
      </div>

      {/* THE PIECE — full-width description, deliberately below the buy
          column so it doesn't compete with price/CTA for the eye. Comes from
          the product's Shopify description; the block is omitted entirely
          until that copy is written, rather than filled with invented text. */}
      {product.description && (
        <div className="wrap pdp__reveal" style={{ marginTop: 'var(--s-md)' }}>
          <Hallmark className="eyebrow">The Piece</Hallmark>
          {/* the copy is written in paragraphs in Shopify — keep them, rather
              than collapsing the whole description into one block of text */}
          {product.description.split('\n\n').map((para, i) => (
            <p
              key={i}
              className="body"
              style={{ color: 'var(--c-muted)', marginTop: 14, lineHeight: 1.7, maxWidth: '62ch' }}
            >
              {para}
            </p>
          ))}
        </div>
      )}

      {/* RELATED */}
      {related.length > 0 && (
        <section className="section wrap">
          <Hallmark className="eyebrow">From the same bench</Hallmark>
          <div className="plp-grid" style={{ marginTop: 'var(--s-sm)' }}>
            {related.map((p) => (
              <div key={p.id} style={{ gridColumn: `span ${relatedSpan}` }}><ProductCard product={p} /></div>
            ))}
          </div>
        </section>
      )}

      {/* Mobile sticky buy bar — on narrow viewports the desktop sticky
          column collapses to static flow (.stack breakpoint), so this is
          what keeps price + Add to Bag genuinely reachable from anywhere on
          the page. Rendered inside <main>, so it's automatically inert'd
          along with the rest of the page while the zoom modal is open. */}
      <div className="pdp-mobilebar">
        <div className="pdp-mobilebar__info">
          <span className="pdp-mobilebar__name">{product.name}</span>
          <span className="pdp-mobilebar__price">{formatPrice(product.priceUSD)}</span>
        </div>
        <button
          className="btn btn--gem pdp-mobilebar__btn" onClick={onAdd} disabled={needsSize && !size}
          aria-label={needsSize && !size ? 'Select a ring size first' : `Add ${product.name} to bag — ${formatPrice(product.priceUSD)}`}
        >
          <EyeSigil size={16} gem="var(--c-gem)" title="" /> {needsSize && !size ? 'Select size' : 'Add to Bag'}
        </button>
      </div>

      {zoomOpen && createPortal(
        <div
          ref={zoomModalRef} className="ft-zoom-modal" role="dialog" aria-modal="true"
          aria-label={`${product.name} — enlarged image`} onClick={() => setZoomOpen(false)}
        >
          <div ref={zoomImgRef} className="ft-zoom-modal__inner" onClick={(e) => e.stopPropagation()}>
            <img src={gallery[shot]} alt={product.name} style={{ objectPosition: product.focal }} />
            <button className="ft-zoom-modal__close" onClick={() => setZoomOpen(false)} aria-label="Close enlarged image">
              <X size={20} weight="light" />
            </button>
          </div>
        </div>,
        document.body,
      )}
    </div>
  )
}
