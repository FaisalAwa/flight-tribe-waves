import { Globe, Hallmark, MagneticBtn } from '@/components'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100svh', display: 'grid', placeItems: 'center', color: 'var(--c-bone)' }} data-gem="ruby">
      <div style={{ textAlign: 'center' }}>
        <Globe size={64} weight={1.2} />
        <h1 className="display" style={{ fontSize: 'var(--t-hero)', margin: '16px 0' }}>404</h1>
        <Hallmark className="eyebrow gem">Off the map</Hallmark>
        <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 380, margin: '18px auto 0' }}>
          This corner of the vault was never cast.
        </p>
        <div style={{ marginTop: 28 }}><MagneticBtn to="/" className="btn btn--gem">Back to the bench</MagneticBtn></div>
      </div>
    </div>
  )
}
