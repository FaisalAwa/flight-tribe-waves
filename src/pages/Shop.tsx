import { useLayoutEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { FunnelSimple } from '@phosphor-icons/react'
import { ProductCard, Hallmark, EyeSigil, GridField, MagneticBtn } from '@/components'
import { FilterPanel } from '@/components/FilterPanel'
import { categories, categoryById, products, productsByCategory } from '@/data/products'
import type { CategoryId, Gem } from '@/data/products'

/* PLP — broken vitrine grid. Experimental placement, conventional mechanics
   (price/name/tap target always present; no scroll-jack on browsing pages). */
export default function Shop() {
  const { category } = useParams()
  const root = useRef<HTMLDivElement>(null)
  const filterToggleRef = useRef<HTMLButtonElement>(null)
  const cat = category ? categoryById(category) : undefined
  const list = cat ? productsByCategory(cat.id) : products
  const gem = cat?.gem ?? 'amethyst'

  // Minimal filters (category, gem) — slide-in panel, only dimensions that
  // actually exist on Product. Reset whenever the route's category changes
  // (adjusted during render, not in an effect — avoids a redundant render pass).
  const [filterOpen, setFilterOpen] = useState(false)
  const [activeCats, setActiveCats] = useState<Set<CategoryId>>(new Set())
  const [activeGems, setActiveGems] = useState<Set<Gem>>(new Set())
  const [filterCategory, setFilterCategory] = useState(category)
  if (category !== filterCategory) {
    setFilterCategory(category)
    setActiveCats(new Set())
    setActiveGems(new Set())
  }

  const categoryOptions = Array.from(new Set(list.map((p) => p.category)))
    .map((id) => ({ id, label: categoryById(id)?.label ?? id }))
  const gemOptions = Array.from(new Set(list.map((p) => p.gem)))
  // Every category route is fixed to one gem (vault rule: one gem per category),
  // so within a single category there's usually nothing left to filter — only
  // show the toggle when at least one dimension actually has >1 option.
  const hasFilterableOptions = categoryOptions.length > 1 || gemOptions.length > 1

  const filtered = list.filter((p) =>
    (activeCats.size === 0 || activeCats.has(p.category)) &&
    (activeGems.size === 0 || activeGems.has(p.gem)),
  )

  const toggleCategory = (id: CategoryId) => setActiveCats((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id); else next.add(id)
    return next
  })
  const toggleGem = (g: Gem) => setActiveGems((prev) => {
    const next = new Set(prev)
    if (next.has(g)) next.delete(g); else next.add(g)
    return next
  })
  const clearFilters = () => { setActiveCats(new Set()); setActiveGems(new Set()) }
  const activeCount = activeCats.size + activeGems.size

  useLayoutEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.reveal').forEach((el, i) => {
        gsap.from(el, { y: reduce ? 0 : 40, opacity: reduce ? 1 : 0, duration: reduce ? 0.01 : 0.8, ease: 'power3.out', delay: reduce ? 0 : (i % 3) * 0.06,
          scrollTrigger: { trigger: el, start: 'top 88%' } })
      })
    }, root)
    return () => ctx.revert()
  }, [category, activeCats, activeGems])

  return (
    <div ref={root} data-gem={gem} style={{ position: 'relative', paddingTop: 'calc(60px + var(--s-md))', minHeight: '100svh' }}>
      <GridField />
      <header className="wrap" style={{ marginBottom: 'var(--s-md)' }}>
        <Hallmark className="eyebrow">
          {cat ? `Index · ${cat.label}` : 'Index · All pieces'}
          {(!cat || cat.live) && ` · ${filtered.length} ${filtered.length === 1 ? 'piece' : 'pieces'}`}
        </Hallmark>
        <h1 className="display" style={{ fontSize: 'var(--t-h1)', color: 'var(--c-bone)', margin: '14px 0 16px' }}>
          {cat ? cat.label : 'The Vault'}
        </h1>
        <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 560 }}>{cat?.blurb ?? 'Everything on the bench — sterling, struck, one stone at a time.'}</p>

        {/* category rail + filter toggle */}
        <nav style={{ display: 'flex', gap: 18, flexWrap: 'wrap', alignItems: 'center', marginTop: 'var(--s-sm)' }}>
          <Link to="/shop" className="linkline" style={{ opacity: cat ? 0.6 : 1 }}>All</Link>
          {categories.map((c) => (
            <Link key={c.id} to={`/shop/${c.id}`} className="linkline" style={{ opacity: cat?.id === c.id ? 1 : 0.6 }}>
              {c.label}
            </Link>
          ))}
          {(!cat || cat.live) && hasFilterableOptions && (
            <button
              ref={filterToggleRef} type="button" className="btn" style={{ padding: '10px 18px', marginLeft: 'auto' }}
              onClick={() => setFilterOpen(true)} aria-haspopup="dialog" aria-expanded={filterOpen}
            >
              <FunnelSimple size={16} weight="light" />
              Filter{activeCount > 0 ? ` · ${activeCount}` : ''}
            </button>
          )}
        </nav>
      </header>

      <div className="wrap">
        {cat && !cat.live ? (
          <div className="reveal" style={{ textAlign: 'center', padding: 'var(--s-lg) 0', color: 'var(--c-bone)' }}>
            <EyeSigil size={44} className="gem" />
            <h2 className="display" style={{ fontSize: 'var(--t-h2)', margin: '20px 0 14px' }}>Next Drop</h2>
            <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 480, margin: '0 auto 28px' }}>
              {cat.blurb}
            </p>
            {/* Honest, deterministic lead capture — a prefilled waitlist email
                rather than routing to the (info-only) contact page. Swap for a
                real newsletter backend once one exists (FT-P07). */}
            <MagneticBtn
              href={`mailto:Flightxtribe@gmail.com?subject=${encodeURIComponent(`Waitlist — ${cat.label}`)}&body=${encodeURIComponent(`Add me to the ${cat.label.toLowerCase()} drop list. Let me know the moment it's cast.`)}`}
              className="btn btn--gem"
            >
              Get word when it's cast
            </MagneticBtn>
          </div>
        ) : filtered.length === 0 ? (
          <div className="reveal" style={{ textAlign: 'center', padding: 'var(--s-lg) 0', color: 'var(--c-muted)' }}>
            <p className="body">Nothing on the bench matches that filter.</p>
            <button className="linkline" style={{ marginTop: 16 }} onClick={clearFilters}>Clear filters</button>
          </div>
        ) : (
          <div className="plp-grid">
            {filtered.map((p, i) => {
              // deliberate off-grid rhythm
              const layout = [
                { col: 'span 6', mt: '0' },
                { col: 'span 4', mt: 'var(--s-lg)' },
                { col: 'span 5', mt: 'var(--s-sm)' },
                { col: 'span 7', mt: '0' },
                { col: 'span 5', mt: 'var(--s-md)' },
              ][i % 5]
              return (
                <div className="reveal" key={p.id} style={{ gridColumn: layout.col, marginTop: layout.mt }}>
                  <ProductCard product={p} ratio={i % 3 === 1 ? '1 / 1' : '4 / 5'} />
                </div>
              )
            })}
          </div>
        )}
      </div>

      <div className="wrap" style={{ padding: 'var(--s-lg) 0' }} />

      <FilterPanel
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        toggleRef={filterToggleRef}
        categoryOptions={categoryOptions}
        activeCats={activeCats}
        onToggleCategory={toggleCategory}
        gemOptions={gemOptions}
        activeGems={activeGems}
        onToggleGem={toggleGem}
        onClearAll={clearFilters}
        activeCount={activeCount}
      />
    </div>
  )
}
