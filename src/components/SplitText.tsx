import { useLayoutEffect, useRef } from 'react'
import gsap from 'gsap'
// ScrollTrigger registered globally in main.tsx — no local import needed

interface SplitTextProps {
  text: string
  className?: string
  /** HTML element to render. Default: 'h1' */
  tag?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span'
  /** Stagger delay between chars. Default: 0.025 */
  stagger?: number
  /** Entry animation delay in seconds. Default: 0 */
  delay?: number
  /** Animate on scroll entry (true) or immediately on mount (false). Default: true */
  scrollTrigger?: boolean
}

/**
 * GSAP char-split headline. Used on every hero headline per the design constitution.
 * Rule: Hero headlines MUST use SplitText. Static text above the fold is not acceptable.
 */
export function SplitText({
  text,
  className,
  tag = 'h1',
  stagger = 0.025,
  delay = 0,
  scrollTrigger = true,
}: SplitTextProps) {
  const ref = useRef<HTMLElement>(null)

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return

    // Split into individual char spans
    const chars = text.split('').map(c => {
      const span = document.createElement('span')
      span.textContent = c === ' ' ? ' ' : c
      span.style.display = 'inline-block'
      span.style.overflow = 'hidden'
      return span
    })
    el.innerHTML = ''
    chars.forEach(c => el.appendChild(c))

    const ctx = gsap.context(() => {
      gsap.from(chars, {
        y: '110%',
        opacity: 0,
        rotateX: -40,
        stagger,
        duration: 0.9,
        delay,
        ease: 'power3.out',
        ...(scrollTrigger
          ? { scrollTrigger: { trigger: el, start: 'top 85%' } }
          : {}),
      })
    }, el)

    return () => ctx.revert()
  }, [text, stagger, delay, scrollTrigger])

  const Tag = tag as keyof React.JSX.IntrinsicElements
  return (
    // @ts-expect-error — dynamic tag ref typing
    <Tag ref={ref} className={className}>
      {text}
    </Tag>
  )
}
