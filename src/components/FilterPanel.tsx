import { useEffect, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import gsap from 'gsap'
import { X } from '@phosphor-icons/react'
import { Hallmark } from './Sigil'
import type { CategoryId, Gem } from '@/data/products'

/* Slide-in filter panel — PLP "minimal filters (category, gem)" per
   DIRECTION.md. Mirrors Nav.tsx's INDEX overlay technique: gsap.context()
   + clipPath spring-in (power4.out), staggered items (power3.out),
   prefers-reduced-motion → instant, ctx.revert() cleanup, focus trap +
   Escape-to-close, solid --c-pit panel with a hairline border (no glass). */

interface CategoryOption { id: CategoryId; label: string }

interface FilterPanelProps {
  open: boolean
  onClose: () => void
  toggleRef: React.RefObject<HTMLButtonElement | null>
  categoryOptions: CategoryOption[]
  activeCats: Set<CategoryId>
  onToggleCategory: (id: CategoryId) => void
  gemOptions: Gem[]
  activeGems: Set<Gem>
  onToggleGem: (g: Gem) => void
  onClearAll: () => void
  activeCount: number
}

export function FilterPanel({
  open, onClose, toggleRef, categoryOptions, activeCats, onToggleCategory,
  gemOptions, activeGems, onToggleGem, onClearAll, activeCount,
}: FilterPanelProps) {
  const drawerRef = useRef<HTMLDivElement>(null)

  // focus trap + Escape-to-close + scroll lock + background inert, matching Nav's INDEX overlay
  useEffect(() => {
    if (!open) return
    const firstFocusable = drawerRef.current?.querySelector<HTMLElement>('button, a[href], input')
    firstFocusable?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return }
      if (e.key !== 'Tab') return
      const nodes = drawerRef.current?.querySelectorAll<HTMLElement>('button, a[href], input')
      if (!nodes || nodes.length === 0) return
      const list = Array.from(nodes)
      const first = list[0]
      const last = list[list.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    // The drawer is portaled to document.body (below), so it's a true DOM
    // sibling of <main> — safe to mark main/footer inert without inerting
    // the panel itself.
    const siblings = Array.from(document.querySelectorAll('main, footer'))
    siblings.forEach((el) => { el.setAttribute('aria-hidden', 'true'); (el as HTMLElement & { inert: boolean }).inert = true })
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      siblings.forEach((el) => { el.removeAttribute('aria-hidden'); (el as HTMLElement & { inert: boolean }).inert = false })
      toggleRef.current?.focus()
    }
  }, [open, onClose, toggleRef])

  // GSAP spring-in — clipPath slide from the right + staggered filter groups
  useLayoutEffect(() => {
    if (!open) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const ctx = gsap.context(() => {
      if (reduce) {
        gsap.set(drawerRef.current, { clipPath: 'inset(0 0 0 0%)' })
        gsap.set('.ft-filter-item', { opacity: 1, x: 0 })
        return
      }
      gsap.fromTo(drawerRef.current, { clipPath: 'inset(0 0 0 100%)' }, { clipPath: 'inset(0 0 0 0%)', duration: 0.5, ease: 'power4.out' })
      gsap.fromTo('.ft-filter-item', { x: 24, opacity: 0 }, { x: 0, opacity: 1, duration: 0.5, stagger: 0.07, ease: 'power3.out', delay: 0.12 })
    }, drawerRef)
    return () => ctx.revert()
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="ft-filterpanel-root" role="presentation">
      <style>{`
        .ft-filterpanel-root { position: fixed; inset: 0; z-index: 96; }
        .ft-filterpanel-backdrop { position: absolute; inset: 0; background: color-mix(in srgb, var(--c-void) 55%, transparent); }
        .ft-filterpanel-drawer {
          position: absolute; top: 0; right: 0; bottom: 0; width: min(400px, 92vw);
          background: var(--c-pit); border-left: 1px solid var(--c-line);
          display: flex; flex-direction: column; gap: var(--s-sm);
          padding: 28px var(--gutter) 32px; overflow-y: auto;
        }
        .ft-filterpanel-head { display: flex; align-items: center; justify-content: space-between; }
        .ft-filterpanel-close {
          display: inline-flex; align-items: center; justify-content: center;
          width: 44px; height: 44px; margin-right: -12px; color: var(--c-chrome);
          transition: color 0.2s var(--ease-ui);
        }
        .ft-filterpanel-close:hover, .ft-filterpanel-close:focus-visible { color: var(--c-gem); }
        .ft-filter-group { display: flex; flex-direction: column; gap: 14px; color: var(--c-bone); }
        .ft-filter-chips { display: flex; flex-wrap: wrap; gap: 10px; }
        .ft-filter-chip {
          display: inline-flex; align-items: center; gap: 8px; min-height: 44px;
          padding: 8px 16px; border: 1px solid var(--c-line); color: var(--c-bone); opacity: 0.75;
          font-family: var(--f-hall); font-size: var(--t-label); letter-spacing: 0.16em; text-transform: uppercase;
          background: transparent; transition: opacity 0.2s var(--ease-ui), border-color 0.2s var(--ease-ui), color 0.2s var(--ease-ui);
        }
        .ft-filter-chip:hover { opacity: 1; }
        .ft-filter-chip[data-active='true'] { opacity: 1; border-color: var(--c-gem); color: var(--c-gem-text); }
        .ft-filter-chip-dot { width: 8px; height: 8px; border-radius: 50%; display: inline-block; }
        @media (max-width: 720px) { .ft-filterpanel-drawer { width: 100%; } }
      `}</style>

      <div className="ft-filterpanel-backdrop" onClick={onClose} />

      <div ref={drawerRef} className="ft-filterpanel-drawer" role="dialog" aria-modal="true" aria-label="Filter products">
        <div className="ft-filterpanel-head ft-filter-item">
          <Hallmark className="eyebrow">Filter{activeCount > 0 ? ` · ${activeCount}` : ''}</Hallmark>
          <button className="ft-filterpanel-close" onClick={onClose} aria-label="Close filters">
            <X size={18} weight="light" />
          </button>
        </div>

        {categoryOptions.length > 1 && (
          <div className="ft-filter-group ft-filter-item">
            <Hallmark as="p">Category</Hallmark>
            <div className="ft-filter-chips">
              {categoryOptions.map((c) => (
                <button
                  key={c.id} type="button" className="ft-filter-chip"
                  data-active={activeCats.has(c.id)} aria-pressed={activeCats.has(c.id)}
                  onClick={() => onToggleCategory(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {gemOptions.length > 1 && (
          <div className="ft-filter-group ft-filter-item">
            <Hallmark as="p">Gem</Hallmark>
            <div className="ft-filter-chips">
              {gemOptions.map((g) => (
                <button
                  key={g} type="button" className="ft-filter-chip"
                  data-active={activeGems.has(g)} aria-pressed={activeGems.has(g)}
                  onClick={() => onToggleGem(g)}
                >
                  <span className="ft-filter-chip-dot" style={{ background: `var(--gem-${g})` }} aria-hidden />
                  {g}
                </button>
              ))}
            </div>
          </div>
        )}

        <button className="btn ft-filter-item" style={{ marginTop: 'auto' }} onClick={onClearAll} disabled={activeCount === 0}>
          Clear filters
        </button>
      </div>
    </div>,
    document.body,
  )
}
