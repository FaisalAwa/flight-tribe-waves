import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, useMotionValue, useSpring } from 'framer-motion'

interface MagneticBtnProps {
  children: React.ReactNode
  /** Internal SPA route — renders a react-router <Link> (no full reload). */
  to?: string
  /** External URL — renders a plain <a>. */
  href?: string
  onClick?: () => void
  className?: string
  /** Radius (px) the pull activates within. Default 80 — lightswind's
   *  magnetic-button.tsx default, kept so the "activation zone" reads the
   *  same as the library's own reference feel. */
  radius?: number
}

/**
 * Framer Motion magnetic button. Used on secondary/exploratory CTAs (never
 * the transactional ones — Add to Bag / Checkout stay conventional per
 * DIRECTION.md: "edge = typography + the eye-stamp confirm, not layout
 * gymnastics"). Spring: stiffness 150, damping 15 — do not change these
 * values (locked in the original build).
 *
 * Inner-glow pulse on hover is new — adapted from lightswind's
 * magnetic-button.tsx (which fades in a soft white radial behind the label
 * on hover); recoloured here to the active gem instead of a flat white so it
 * reads as "this button is live," not a generic UI-kit glow.
 */
export function MagneticBtn({ children, to, href, onClick, className, radius = 80 }: MagneticBtnProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)
  const x = useMotionValue(0)
  const y = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 150, damping: 15 })
  const springY = useSpring(y, { stiffness: 150, damping: 15 })

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = ref.current!.getBoundingClientRect()
    const dx = e.clientX - rect.left - rect.width / 2
    const dy = e.clientY - rect.top - rect.height / 2
    if (Math.hypot(dx, dy) > radius) return
    x.set(dx * 0.35)
    y.set(dy * 0.35)
    setHovered(true)
  }
  const handleMouseLeave = () => {
    x.set(0)
    y.set(0)
    setHovered(false)
  }

  const inner = (
    <motion.div
      style={{ x: springX, y: springY, position: 'relative', display: 'inline-block' }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97, y: 2 }}
    >
      <motion.span
        aria-hidden
        animate={{ opacity: hovered ? 0.5 : 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: 'absolute', inset: '-8px', zIndex: -1, borderRadius: 'inherit', pointerEvents: 'none',
          background: 'radial-gradient(circle, color-mix(in srgb, var(--c-gem) 55%, transparent) 0%, transparent 72%)',
          filter: 'blur(10px)',
        }}
      />
      {to ? (
        <Link to={to} onClick={onClick} className={className}>{children}</Link>
      ) : href ? (
        <a href={href} onClick={onClick} className={className} target={href.startsWith('http') ? '_blank' : undefined} rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}>{children}</a>
      ) : (
        <button onClick={onClick} className={className}>{children}</button>
      )}
    </motion.div>
  )

  return (
    <div ref={ref} onMouseMove={handleMouseMove} onMouseLeave={handleMouseLeave} style={{ display: 'inline-block' }}>
      {inner}
    </div>
  )
}
