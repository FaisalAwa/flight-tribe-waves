import { Hallmark, EyeSigil, DemoBadge, GridField } from '@/components'
import { currentYearRoman } from '@/lib/year'

/* CONTACT — FT-P07 BLOCKER: real address / phone / email / socials NOT in the
   brief. Every field below is a placeholder and marked; confirm before launch. */
export default function Contact() {
  return (
    <div data-gem="topaz" style={{ position: 'relative', paddingTop: 'calc(60px + var(--s-lg))', minHeight: '100svh', color: 'var(--c-bone)' }}>
      <GridField />
      <div className="wrap stack" style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'clamp(28px,5vw,80px)' }}>
        <header style={{ gridColumn: 'span 6' }}>
          <EyeSigil size={48} className="gem" />
          <h1 className="display" style={{ fontSize: 'var(--t-h1)', margin: '18px 0 16px' }}>Reach<br />the tribe</h1>
          <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 460 }}>
            Custom commissions, reservations, and stockist enquiries. We answer from the bench, not a call center.
          </p>
          <p style={{ marginTop: 20 }}><Hallmark className="eyebrow gem">Details pending client <DemoBadge label="TBC" /></Hallmark></p>
        </header>

        <div style={{ gridColumn: '7 / span 6', display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
          {[
            ['Email', 'hello@flighttribe.co'],
            ['Instagram', '@flighttribe'],
            ['Studio', 'By appointment · USA'],
            ['Reserve', 'DM any piece from the bag'],
          ].map(([k, v]) => (
            <div key={k} className="contact-row" style={{ borderBottom: '1px solid var(--c-line)', paddingBottom: 16 }}>
              <Hallmark className="eyebrow">{k} <DemoBadge label="TBC" /></Hallmark>
              <p className="display" style={{ fontSize: 'var(--t-h3)', marginTop: 8 }}>{v}</p>
            </div>
          ))}
          <Hallmark as="p" >.925 · Made on Earth · {currentYearRoman()}</Hallmark>
        </div>
      </div>
      <div className="wrap" style={{ padding: 'var(--s-lg) 0' }} />
    </div>
  )
}
