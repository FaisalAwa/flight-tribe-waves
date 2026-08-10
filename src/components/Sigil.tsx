/* ═══════════════════════════════════════════════════════════════
   THE TWO-MARK SIGIL SYSTEM — Flight Tribe
   Identity is load-bearing, not decoration (critique-approved).
   Both marks are drawn from the client's real work:
     • Globe/eagle seal — the FT winged-eagle-over-globe stamped on the metal.
     • EyeSigil — the eye-in-vesica + crossed arrows engraved on the dice.
   Both render in currentColor so they stay strictly B&W / silver; the only
   colour they ever carry is a single gem accent passed explicitly.
   Line art recreated as clean vectors (FT-P03: swap for client's flat logo).
   ═══════════════════════════════════════════════════════════════ */

interface MarkProps {
  size?: number
  className?: string
  /** stroke width in viewBox units */
  weight?: number
  title?: string
}

/** The FT eagle-globe house seal — loader, home button, footer, favicon.
    Pass title="" to render decoratively (aria-hidden) when adjacent text already
    conveys the brand (a11y audit #11). */
export function Globe({ size = 28, className, weight = 1.4, title = 'Flight Tribe' }: MarkProps) {
  const deco = title === ''
  return (
    <svg
      width={size} height={size} viewBox="0 0 48 48" fill="none"
      className={className} {...(deco ? { 'aria-hidden': true } : { role: 'img', 'aria-label': title })}
      stroke="currentColor" strokeWidth={weight} strokeLinecap="round" strokeLinejoin="round"
    >
      {/* globe */}
      <circle cx="24" cy="26" r="15" />
      <ellipse cx="24" cy="26" rx="6.2" ry="15" />
      <path d="M9.4 21h29.2M9.4 31h29.2M11 26h26" />
      {/* eagle — spread wings + body arcing over the globe */}
      <path d="M24 20.5c-1.6-2.2-1.8-4.8-1.8-4.8s.9 1.2 1.8 1.7c.9-.5 1.8-1.7 1.8-1.7s-.2 2.6-1.8 4.8Z"
        fill="currentColor" stroke="none" />
      <path d="M22.4 18.6C18.2 15 12 15.2 8 17.8c3.8-.2 6.2.6 8.6 2.2M25.6 18.6C29.8 15 36 15.2 40 17.8c-3.8-.2-6.2.6-8.6 2.2" />
      {/* F · T flanking the seal */}
      <path d="M15 34.5v4M15 34.5h2.4M15 36.4h1.8" />
      <path d="M31 34.5h3M32.5 34.5v4" />
    </svg>
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

/** Visible marker on any DEMO / synthetic content (prices, generated media). */
export function DemoBadge({ label = 'DEMO' }: { label?: string }) {
  return (
    <span
      title="Placeholder value — see PLACEHOLDERS.md"
      style={{
        display: 'inline-block',
        fontFamily: 'var(--f-hall)',
        fontSize: '9px',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: 'var(--c-void)',
        background: 'var(--c-chrome)',
        padding: '2px 6px',
        borderRadius: '2px',
        verticalAlign: 'middle',
      }}
    >
      {label}
    </span>
  )
}
