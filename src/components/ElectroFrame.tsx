import { useId, useLayoutEffect, useRef } from 'react'

/* ═══════════════════════════════════════════════════════════════
   ELECTRO FRAME — adapted from lightswind's electro-border.tsx (SVG
   feTurbulence + feDisplacementMap tracing a "live current" along an
   element's border) — recoloured to --c-chrome/--c-gem only (the
   library default is a cyan/neon `#00fffc`, which is exactly the AI-SLOP
   BANLIST's "neon glow" line; here it's silver at rest, gem on the reveal
   beat) and reserved for ONE hero image at a time (PDP gallery, Vitrine)
   rather than every ProductCard in a grid — running an SVG filter's
   <animate> per card would cost real frame time multiplied across a
   whole PLP; a single instance on a PDP page is negligible.

   Visibility is CSS-hover-gated (opacity 0 -> 1), matching the same
   hover language as .frame::after / .card .frame::before elsewhere —
   this is the "liquid-metal ripple on card borders" signature interaction
   from DIRECTION.md's addendum, turned up to its most dramatic form for
   the single biggest product shot on the site. Reduced-motion: renders a
   plain static chrome ring, no filter, no <animate>.
   ═══════════════════════════════════════════════════════════════ */

export function ElectroFrame({
  children, className, active = true,
}: { children: React.ReactNode; className?: string; active?: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const id = useId().replace(/[:]/g, '')
  const filterId = `electro-${id}`
  const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

  useLayoutEffect(() => {
    if (reduce || !active) return
    const svg = svgRef.current
    const root = rootRef.current
    if (!svg || !root) return

    const sync = () => {
      const { width, height } = root.getBoundingClientRect()
      svg.querySelectorAll<SVGAnimateElement>('feOffset > animate[attributeName="dx"]').forEach((a, i) => {
        a.setAttribute('values', i % 2 === 0 ? `${width};0` : `0;-${width}`)
      })
      svg.querySelectorAll<SVGAnimateElement>('feOffset > animate[attributeName="dy"]').forEach((a, i) => {
        a.setAttribute('values', i % 2 === 0 ? `${height};0` : `0;-${height}`)
      })
      requestAnimationFrame(() => {
        svg.querySelectorAll<SVGAnimateElement & { beginElement?: () => void }>('animate').forEach((a) => a.beginElement?.())
      })
    }
    sync()
    const ro = new ResizeObserver(sync)
    ro.observe(root)
    return () => ro.disconnect()
  }, [reduce, active])

  return (
    <div ref={rootRef} className={`electro-frame${className ? ` ${className}` : ''}`} style={{ position: 'relative', isolation: 'isolate' }}>
      {!reduce && active && (
        <svg ref={svgRef} className="electro-frame__svg" aria-hidden focusable="false">
          <defs>
            <filter id={filterId} x="-200%" y="-200%" width="500%" height="500%">
              <feTurbulence type="turbulence" baseFrequency="0.02" numOctaves={8} result="turb1" seed={1} />
              <feOffset in="turb1" dx={0} dy={0} result="offset1">
                <animate attributeName="dy" values="600;0" dur="7s" repeatCount="indefinite" />
              </feOffset>
              <feTurbulence type="turbulence" baseFrequency="0.03" numOctaves={8} result="turb2" seed={2} />
              <feOffset in="turb2" dx={0} dy={0} result="offset2">
                <animate attributeName="dx" values="0;-600" dur="7s" repeatCount="indefinite" />
              </feOffset>
              <feBlend in="offset1" in2="offset2" mode="lighten" result="mix" />
              <feDisplacementMap in="SourceGraphic" in2="mix" scale={18} xChannelSelector="R" yChannelSelector="G" />
            </filter>
          </defs>
        </svg>
      )}
      <div className="electro-frame__ring" aria-hidden style={!reduce && active ? { filter: `url(#${filterId})` } : undefined} />
      <div className="electro-frame__content">{children}</div>
    </div>
  )
}
