import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
// ScrollTrigger registered globally in main.tsx — no local import needed

interface ScrollRevealProps {
  children: React.ReactNode
  className?: string
  /** Y offset to animate from. Default: 40 */
  y?: number
  /** Delay in seconds. Default: 0 */
  delay?: number
  /** Animation duration. Default: 0.8 */
  duration?: number
  /** ScrollTrigger start. Default: 'top 85%' */
  start?: string
}

/**
 * GSAP scroll-reveal wrapper for body content sections.
 * Fades + rises from y offset on scroll entry. Clean up guaranteed.
 */
export function ScrollReveal({
  children,
  className,
  y = 40,
  delay = 0,
  duration = 0.8,
  start = 'top 85%',
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(ref.current, {
        y,
        opacity: 0,
        duration,
        delay,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: ref.current,
          start,
        },
      })
    }, ref)
    return () => ctx.revert()
  }, [y, delay, duration, start])

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  )
}
