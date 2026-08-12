/* ═══════════════════════════════════════════════════════════════
   THE TWO-MARK SIGIL SYSTEM — Flight Tribe
     • Globe — the client's real flat logo (globe + "FT" monogram), supplied
       as a raster PNG in the Drive "Logo files" folder. Pre-inverted to
       white-on-transparent (public/assets/brand/flight-tribe-logo-white.png)
       since the source file is black ink cut for a light background and the
       site is dark-themed throughout; the black original ships alongside it
       (flight-tribe-logo.png) for any future light-surface use (print, etc).
     • EyeSigil — the eye-in-vesica + crossed arrows engraved on the dice,
       recreated as a vector since it's a physical engraving, not a logo file.
   ═══════════════════════════════════════════════════════════════ */

interface MarkProps {
  size?: number
  className?: string
  /** stroke width in viewBox units — EyeSigil (vector) only */
  weight?: number
  title?: string
}

/** The FT house logo — loader, home button, footer, favicon.
    Pass title="" to render decoratively (aria-hidden) when adjacent text already
    conveys the brand (a11y audit #11). */
export function Globe({ size = 28, className, title = 'Flight Tribe' }: MarkProps) {
  const deco = title === ''
  return (
    <img
      src="/assets/brand/flight-tribe-logo-white.png"
      width={size} height={size}
      className={className}
      draggable={false}
      style={{ display: 'inline-block', objectFit: 'contain' }}
      alt={deco ? '' : title}
      {...(deco ? { 'aria-hidden': true } : {})}
    />
  )
}

/** Eye-in-vesica + crossed arrows — INDEX cursor mark, Ignite stamp, seals. */
export function EyeSigil({ size = 28, className, weight = 1.4, title = 'Flight Tribe eye', gem }: MarkProps & { gem?: string }) {
  const deco = title === ''
  return (
    <svg
      width={size} height={size} viewBox="0 0 48 48" fill="none"
      className={className} {...(deco ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title })}
      stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round"
    >
      {/* crossed arrows behind */}
      <path d="M8 8 40 40M40 8 8 40" opacity="0.5" />
      <path d="M8 8l0 5M8 8l5 0M40 40l0-5M40 40l-5 0M40 8l-5 0M40 8l0 5M8 40l5 0M8 40l0-5" opacity="0.5" />
      {/* vesica (almond) */}
      <path d="M6 24C13 15 35 15 42 24 35 33 13 33 6 24Z" />
      {/* iris + pupil (the only place a gem colour may land) */}
      <circle cx="24" cy="24" r="5.4" />
      <circle cx="24" cy="24" r="2.2" fill={gem ?? 'currentColor'} stroke="none" />
    </svg>
  )
}

/** Tracked uppercase micro-label — .925 / prices / spec labels. */
export function Hallmark({
  children, className, as: Tag = 'span',
}: { children: React.ReactNode; className?: string; as?: 'span' | 'div' | 'p' }) {
  return (
    <Tag
      className={className}
      style={{
        fontFamily: 'var(--f-hall)',
        fontSize: 'var(--t-label)',
        letterSpacing: 'var(--hall-track)',
        textTransform: 'uppercase',
        lineHeight: 1.4,
      }}
    >
      {children}
    </Tag>
  )
}
