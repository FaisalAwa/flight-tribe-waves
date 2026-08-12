import { useLayoutEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import gsap from 'gsap'
import type { Product } from '@/data/products'
import { formatPrice } from '@/lib/format'
import { useCart } from '@/context/CartContext'
import { EyeSigil, Hallmark } from './Sigil'

/* Vitrine product card. Experimental frame + raking light, conventional
   mechanics: name, price, full-card tap target, and an add-to-bag that fires
   the "Ignite" eye-stamp. `ratio` lets the PLP break the grid on purpose. */
export function ProductCard({ product, ratio = '4 / 5' }: { product: Product; ratio?: string }) {
  const { add } = useCart()
  const [fired, setFired] = useState(false)
  const frameRef = useRef<HTMLAnchorElement>(null)

  // 3D tilt + cursor-tracked specular sheen — desktop/fine-pointer only, off
  // under reduced-motion. Direct GSAP DOM writes (quickTo), no re-renders.
  // Extends the same chrome-sheen language as .frame__gemwash/.frame::after —
  // a soft chrome radial highlight that follows the cursor, not a new effect.
  useLayoutEffect(() => {
    const el = frameRef.current
    if (!el) return
    const fine = window.matchMedia('(pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!fine || reduce) return // touch / RM: stays static, no listeners attached

    const ctx = gsap.context(() => {
      gsap.set(el, { transformPerspective: 800, '--mx': 50, '--my': 50, '--sheen-o': 0 })

      const MAX_TILT = 7 // deg — subtle, restrained (per DIRECTION.md, not gamer-RGB)
      const setRotX = gsap.quickTo(el, 'rotationX', { duration: 0.5, ease: 'power3.out' })
      const setRotY = gsap.quickTo(el, 'rotationY', { duration: 0.5, ease: 'power3.out' })
      const setMx = gsap.quickTo(el, '--mx', { duration: 0.35, ease: 'power3.out' })
      const setMy = gsap.quickTo(el, '--my', { duration: 0.35, ease: 'power3.out' })
      const setSheen = gsap.quickTo(el, '--sheen-o', { duration: 0.3, ease: 'power2.out' })

      const onMove = (e: PointerEvent) => {
        const r = el.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        setRotY(gsap.utils.clamp(-MAX_TILT, MAX_TILT, (px - 0.5) * 2 * MAX_TILT))
        setRotX(gsap.utils.clamp(-MAX_TILT, MAX_TILT, -(py - 0.5) * 2 * MAX_TILT))
        setMx(px * 100)
        setMy(py * 100)
        setSheen(1)
      }
      const onLeave = () => {
        setRotX(0)
        setRotY(0)
        setSheen(0)
      }

      el.addEventListener('pointermove', onMove)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        el.removeEventListener('pointermove', onMove)
        el.removeEventListener('pointerleave', onLeave)
      }
    })
    return () => ctx.revert()
  }, [])

  const onAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    add({
      id: product.id, slug: product.slug, name: product.name, spec: product.spec,
      image: product.image, priceUSD: product.priceUSD, gem: `var(--gem-${product.gem})`,
      variantId: product.variantId,
    })
    // force-restart the ignite keyframe even on rapid repeat clicks
    setFired(false)
    requestAnimationFrame(() => setFired(true))
    window.setTimeout(() => setFired(false), 700)
  }

  return (
    <article className="card" data-gem={product.gem}>
      <Link
        ref={frameRef}
        to={`/product/${product.slug}`} className="frame"
        style={{ aspectRatio: ratio }}
      >
        {product.tag && <span className="card__tag">{product.tag}</span>}
        <img
          className="frame__img" src={product.image} alt={product.name}
          style={{ objectPosition: product.focal }} loading="lazy"
        />
        <span className="frame__gemwash" />
        {/* cursor-tracked specular highlight — same chrome-sheen language as
            .frame::after/.frame__gemwash, just following the pointer. Inert
            (opacity 0) until the pointermove effect above turns it on. */}
        <span
          aria-hidden
          style={{
            position: 'absolute', inset: 0, zIndex: 2, pointerEvents: 'none',
            background:
              'radial-gradient(circle at calc(var(--mx, 50) * 1%) calc(var(--my, 50) * 1%), color-mix(in srgb, var(--c-chrome) 38%, transparent) 0%, transparent 42%)',
            opacity: 'var(--sheen-o, 0)',
          }}
        />
        {/* Ignite — eye-vesica seal stamps over the piece on add */}
        <span className="ignite" data-fire={fired ? 'true' : 'false'}>
          <EyeSigil size={96} weight={1.2} gem={`var(--gem-${product.gem})`} />
        </span>
      </Link>

      <div className="card__meta">
        <div>
          <h3 className="card__name">
            <Link to={`/product/${product.slug}`}>{product.name}</Link>
          </h3>
          {product.spec && <p className="card__spec" style={{ marginTop: 6 }}>{product.spec}</p>}
        </div>
        <p className="card__price">
          {formatPrice(product.priceUSD)}
        </p>
      </div>

      <button className="btn btn--gem" style={{ padding: '12px 18px' }} onClick={onAdd}>
        Add to Bag
        <Hallmark aria-hidden>·</Hallmark>
      </button>
    </article>
  )
}
