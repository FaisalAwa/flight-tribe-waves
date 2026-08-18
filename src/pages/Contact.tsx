import { useState, type FormEvent } from 'react'
import { PaperPlaneTilt } from '@phosphor-icons/react'
import { Hallmark, EyeSigil, GridField } from '@/components'
import { currentYearRoman } from '@/lib/year'

const REASONS = ['General Enquiry', 'Custom Commission', 'Stockist Enquiry', 'Reserve a Piece'] as const

interface FormState {
  name: string
  email: string
  reason: (typeof REASONS)[number]
  message: string
}

const EMPTY: FormState = { name: '', email: '', reason: REASONS[0], message: '' }
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/* Contact form — no backend on this storefront, so submission opens the
   visitor's own mail client with everything pre-filled (same pattern the
   Shop page already uses for waitlist capture), landing straight in
   Flightxtribe@gmail.com. Zero config, zero third-party form service. */
export default function Contact() {
  const [form, setForm] = useState<FormState>(EMPTY)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [sent, setSent] = useState(false)

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Tell us your name.'
    if (!form.email.trim()) next.email = 'An email so we can write back.'
    else if (!EMAIL_RE.test(form.email.trim())) next.email = 'That email doesn’t look right.'
    if (!form.message.trim()) next.message = 'Say what you need — commission, stockist, reservation, anything.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) { setSent(false); return }
    const subject = `${form.reason} — ${form.name}`
    const body = `${form.message}\n\n—\n${form.name}\n${form.email}`
    const mailto = `mailto:Flightxtribe@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
    window.location.href = mailto
    setSent(true)
    setForm(EMPTY)
  }

  return (
    <div data-gem="topaz" style={{ position: 'relative', paddingTop: 'calc(60px + var(--s-lg))', minHeight: '100svh', color: 'var(--c-bone)' }}>
      <GridField />
      <div className="wrap stack">
        <header style={{ maxWidth: 640, marginBottom: 'var(--s-md)' }}>
          <EyeSigil size={48} className="gem" />
          <h1 className="display" style={{ fontSize: 'var(--t-h1)', margin: '18px 0 16px' }}>Reach<br />the tribe</h1>
          <p className="body" style={{ color: 'var(--c-muted)', maxWidth: 460 }}>
            Custom commissions, reservations, and stockist enquiries. We answer from the bench, not a call center.
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'clamp(28px,5vw,80px)' }}>
          <form className="contact-form" style={{ gridColumn: 'span 7' }} onSubmit={handleSubmit} noValidate>
            <div className="field">
              <label htmlFor="cf-name"><Hallmark className="eyebrow">Name</Hallmark></label>
              <input
                id="cf-name" type="text" autoComplete="name" value={form.name}
                onChange={(e) => update('name', e.target.value)}
                aria-invalid={!!errors.name} aria-describedby={errors.name ? 'cf-name-err' : undefined}
              />
              {errors.name && <span id="cf-name-err" className="field__error">{errors.name}</span>}
            </div>

            <div className="field">
              <label htmlFor="cf-email"><Hallmark className="eyebrow">Email</Hallmark></label>
              <input
                id="cf-email" type="email" autoComplete="email" value={form.email}
                onChange={(e) => update('email', e.target.value)}
                aria-invalid={!!errors.email} aria-describedby={errors.email ? 'cf-email-err' : undefined}
              />
              {errors.email && <span id="cf-email-err" className="field__error">{errors.email}</span>}
            </div>

            <div className="field">
              <label htmlFor="cf-reason"><Hallmark className="eyebrow">Reason</Hallmark></label>
              <select id="cf-reason" value={form.reason} onChange={(e) => update('reason', e.target.value as FormState['reason'])}>
                {REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div className="field">
              <label htmlFor="cf-message"><Hallmark className="eyebrow">Message</Hallmark></label>
              <textarea
                id="cf-message" rows={6} value={form.message}
                onChange={(e) => update('message', e.target.value)}
                aria-invalid={!!errors.message} aria-describedby={errors.message ? 'cf-message-err' : undefined}
              />
              {errors.message && <span id="cf-message-err" className="field__error">{errors.message}</span>}
            </div>

            <button type="submit" className="btn btn--gem" style={{ marginTop: 'var(--s-xs)' }}>
              <PaperPlaneTilt size={16} weight="light" /> Send Message
            </button>

            {sent && (
              <p role="status" className="body" style={{ color: 'var(--c-gem-text)', marginTop: 16 }}>
                Your mail app should be open with everything filled in — hit send and it lands straight in the bench inbox.
              </p>
            )}
          </form>

          <div style={{ gridColumn: '8 / span 5', display: 'flex', flexDirection: 'column', gap: 'var(--s-sm)' }}>
            {[
              ['Email', 'Flightxtribe@gmail.com', 'mailto:Flightxtribe@gmail.com'],
              ['Instagram', '@Flight__Tribe', 'https://www.instagram.com/Flight__Tribe/'],
              ['Studio', 'By appointment · USA'],
              ['Reserve', 'DM any piece from the bag'],
            ].map(([k, v, href]) => (
              <div key={k} className="contact-row" style={{ borderBottom: '1px solid var(--c-line)', paddingBottom: 16 }}>
                <Hallmark className="eyebrow">{k}</Hallmark>
                {href ? (
                  <a
                    className="display" href={href}
                    target={href.startsWith('http') ? '_blank' : undefined}
                    rel={href.startsWith('http') ? 'noopener noreferrer' : undefined}
                    style={{ fontSize: 'var(--t-h3)', marginTop: 8, display: 'block', color: 'inherit', textDecoration: 'none' }}
                  >
                    {v}
                  </a>
                ) : (
                  <p className="display" style={{ fontSize: 'var(--t-h3)', marginTop: 8 }}>{v}</p>
                )}
              </div>
            ))}
            <Hallmark as="p">.925 · Made on Earth · {currentYearRoman()}</Hallmark>
          </div>
        </div>
      </div>
      <div className="wrap" style={{ padding: 'var(--s-lg) 0' }} />
    </div>
  )
}
