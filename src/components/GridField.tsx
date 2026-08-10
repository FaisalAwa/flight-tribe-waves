import { useEffect, useRef, useState } from 'react'

/* ═══════════════════════════════════════════════════════════════
   GRID FIELD — ambient "jeweller's measuring grid" backdrop for the PLP
   (Shop.tsx). Adapted from lightswind's interactive-grid-background.tsx:
   a canvas-drawn hairline grid where cells near the cursor glow briefly in
   the active gem, drifting to a random cell on its own once the pointer's
   been idle — recoloured to --c-line/--c-gem (never the library's default
   rainbow) and reusing the exact "snap cursor to a grid cell, trail N
   cells, fade the tail" technique, hand-ported rather than imported so it
   shares ChromeField's resolveTokenColor + IntersectionObserver-pause +
   ResizeObserver conventions instead of pulling in a second animation
   pattern for the same page.

   Gated hard: canvas + rAF loop only on desktop fine-pointer with no
   reduced-motion preference. Everywhere else (touch, coarse pointer,
   reduced-motion) it's just the static CSS hairline grid — same --c-line
   rules already used across the site — so there is zero animation cost on
   catalogue-heavy pages for anyone who didn't opt into the effect.

   Render as the first child of a `position: relative` ancestor. Uses
   z-index -1 (not 0) because — unlike ChromeField, whose hero siblings are
   ALL explicitly positioned with their own z-index — Shop.tsx's header and
   grid are plain in-flow content; CSS paints non-positioned in-flow
   descendants before z-index:0 positioned ones, so a positive/0 z-index
   here would float the grid ABOVE the copy. -1 guarantees it stays behind.
   ═══════════════════════════════════════════════════════════════ */

const CELL = 64
const TRAIL = 5
const IDLE_MS = 2200

function resolveColor(varName: string, scope: HTMLElement): [number, number, number] {
  const probe = document.createElement('span')
  probe.style.position = 'absolute'
  probe.style.visibility = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.color = `var(${varName})`
  scope.appendChild(probe)
  const rgb = getComputedStyle(probe).color
  scope.removeChild(probe)
  const m = rgb.match(/[\d.]+/g)
  if (!m || m.length < 3) return [124, 76, 196]
  return [Number(m[0]), Number(m[1]), Number(m[2])]
}

export function GridField() {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  // Decided once, synchronously, at mount — not via setState inside the
  // effect body (avoids react-hooks/set-state-in-effect; the canvas layer
  // doesn't need to hot-swap across a live breakpoint the way ChromeField's
  // hero background does, so a mount-time decision is the right trade-off
  // here).
  const [active] = useState(() => {
    if (typeof window === 'undefined') return false
    const fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    return fine && !reduce
  })

  useEffect(() => {
    if (!active) return // static CSS grid stands in (see JSX background)
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const [gr, gg, gb] = resolveColor('--c-gem', wrap)

    let w = 0, h = 0, cols = 1, rows = 1
    const trail: { x: number; y: number }[] = []
    let lastMove = Date.now()
    let idleTarget = { x: 0, y: 0 }
    let idlePos = { x: 0, y: 0 }

    const resize = () => {
      const r = wrap.getBoundingClientRect()
      w = canvas.width = Math.max(1, Math.round(r.width))
      h = canvas.height = Math.max(1, Math.round(r.height))
      cols = Math.max(1, Math.floor(w / CELL))
      rows = Math.max(1, Math.floor(h / CELL))
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(wrap)

    const onMove = (e: PointerEvent) => {
      const r = wrap.getBoundingClientRect()
      const x = e.clientX - r.left
      const y = e.clientY - r.top
      if (x < 0 || y < 0 || x > r.width || y > r.height) return
      lastMove = Date.now()
      const cx = Math.floor(x / CELL)
      const cy = Math.floor(y / CELL)
      const last = trail[0]
      if (!last || last.x !== cx || last.y !== cy) {
        trail.unshift({ x: cx, y: cy })
        if (trail.length > TRAIL) trail.pop()
      }
    }
    window.addEventListener('pointermove', onMove, { passive: true })

    idleTarget = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }
    idlePos = { ...idleTarget }

    let destroyed = false
    let paused = false
    let raf = 0
    const io = new IntersectionObserver(([entry]) => { paused = !entry.isIntersecting }, { threshold: 0.01 })
    io.observe(wrap)

    const draw = () => {
      if (destroyed) return
      if (!paused) {
        ctx.clearRect(0, 0, w, h)
        if (Date.now() - lastMove > IDLE_MS) {
          const dx = idleTarget.x - idlePos.x
          const dy = idleTarget.y - idlePos.y
          if (Math.abs(dx) < 0.02 && Math.abs(dy) < 0.02) {
            idleTarget = { x: Math.floor(Math.random() * cols), y: Math.floor(Math.random() * rows) }
          } else {
            idlePos = { x: idlePos.x + dx * 0.04, y: idlePos.y + dy * 0.04 }
          }
          const rx = Math.round(idlePos.x)
          const ry = Math.round(idlePos.y)
          const last = trail[0]
          if (!last || last.x !== rx || last.y !== ry) {
            trail.unshift({ x: rx, y: ry })
            if (trail.length > TRAIL) trail.pop()
          }
        }
        trail.forEach((cell, i) => {
          const alpha = (1 - i / (TRAIL + 1)) * 0.16
          ctx.fillStyle = `rgba(${gr},${gg},${gb},${alpha})`
          ctx.shadowColor = `rgba(${gr},${gg},${gb},${alpha})`
          ctx.shadowBlur = 22
          ctx.fillRect(cell.x * CELL, cell.y * CELL, CELL, CELL)
        })
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      destroyed = true
      cancelAnimationFrame(raf)
      window.removeEventListener('pointermove', onMove)
      ro.disconnect()
      io.disconnect()
    }
  }, [active])

  return (
    <div
      ref={wrapRef} aria-hidden="true"
      style={{
        position: 'absolute', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none',
        backgroundImage:
          'linear-gradient(to right, var(--c-line) 1px, transparent 1px),' +
          'linear-gradient(to bottom, var(--c-line) 1px, transparent 1px)',
        backgroundSize: `${CELL}px ${CELL}px`,
        maskImage: 'radial-gradient(120% 70% at 50% 0%, black 35%, transparent 90%)',
        WebkitMaskImage: 'radial-gradient(120% 70% at 50% 0%, black 35%, transparent 90%)',
      }}
    >
      {active && <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />}
    </div>
  )
}
