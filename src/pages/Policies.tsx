import { Hallmark, EyeSigil, GridField } from '@/components'
import { currentYearRoman } from '@/lib/year'

/* Shop policies — the client's own copy, verbatim from
   Flight_Tribe_Jewelry_Shop_Policies.docx (Drive → Policies). Plain reading
   order, no accordion: this is the page a buyer lands on mid-checkout, so
   it stays scannable rather than clever. */

const SECTIONS: { title: string; body: string[] }[] = [
  {
    title: '1. Shipping Policy',
    body: [
      'At Flight Tribe Jewelry Shop, we carefully package every piece to ensure it arrives safely and beautifully.',
      'Orders are processed within 1–3 business days when in stock. Shipping times vary depending on location and selected shipping method. Customers are responsible for providing accurate shipping information. Flight Tribe Jewelry Shop is not responsible for delays caused by carriers, weather, holidays, or incorrect addresses. Tracking information will be provided when available. Signature confirmation may be required for high-value orders.',
    ],
  },
  {
    title: '2. Return & Exchange Policy',
    body: [
      'We want you to love your Flight Tribe jewelry. Eligible items may be returned or exchanged.',
      'Return requirements: returns must be requested within 30 days of delivery. Items must be unworn, unused, undamaged, in original packaging, and include proof of purchase.',
      'Non-returnable items: personalized or engraved jewelry, custom-made pieces, altered or resized items, clearance or sale items, and earrings or hygiene-restricted items unless defective.',
      "Return shipping costs are the customer's responsibility unless the item arrived damaged or incorrect.",
    ],
  },
  {
    title: '3. Damaged or Incorrect Orders',
    body: [
      'If your item arrives damaged or you receive the wrong item: contact us within 7 days of delivery, and include photos of the item and packaging. We will review the issue and provide a replacement or solution.',
    ],
  },
  {
    title: '4. Jewelry Care Policy',
    body: [
      'To keep your Flight Tribe jewelry looking its best: remove jewelry before swimming, showering, exercising, or applying lotions/perfumes; store pieces in a dry place; avoid harsh chemicals; and clean jewelry gently with a soft cloth.',
      'Damage caused by improper care, accidents, or normal wear is not covered.',
    ],
  },
  {
    title: '5. Product Information Policy',
    body: [
      'Each jewelry piece is described as accurately as possible. Please note: colors may vary slightly depending on screen settings, handmade items may have small variations, and measurements should be reviewed before purchase.',
    ],
  },
  {
    title: '6. Payment Policy',
    body: [
      'We accept available payment methods shown at checkout. Orders are processed after payment confirmation. Fraudulent or unauthorized transactions may be canceled. Flight Tribe Jewelry Shop reserves the right to refuse or cancel orders when necessary.',
    ],
  },
  {
    title: '7. Privacy Policy',
    body: [
      'Your privacy matters to us. We may collect: name, shipping address, email, order details, and payment information processed through secure payment providers.',
      'Customer information is used to process orders, provide support, and improve shopping experiences. We do not sell customer information.',
    ],
  },
  {
    title: '8. Cancellation Policy',
    body: [
      'Orders may be canceled within 12 hours of purchase if processing has not started. Once an order has shipped, it cannot be canceled and must follow the return policy.',
    ],
  },
  {
    title: '9. Warranty Policy',
    body: [
      'Flight Tribe Jewelry Shop guarantees products are free from manufacturing defects upon arrival. This does not cover scratches, tarnishing from exposure, accidental damage, lost items, or improper care.',
    ],
  },
  {
    title: '10. Contact Policy',
    body: [
      'For questions, returns, or support, please contact Flight Tribe Jewelry Shop at Flightxtribe@gmail.com.',
    ],
  },
]

export default function Policies() {
  return (
    <div data-gem="topaz" style={{ position: 'relative', paddingTop: 'calc(60px + var(--s-lg))', minHeight: '100svh', color: 'var(--c-bone)' }}>
      <GridField />
      <div className="wrap" style={{ position: 'relative' }}>
        <header style={{ maxWidth: 620, marginBottom: 'var(--s-lg)' }}>
          <EyeSigil size={44} className="gem" />
          <h1 className="display" style={{ fontSize: 'var(--t-h1)', margin: '18px 0 14px' }}>Shop<br />Policies</h1>
          <p className="body" style={{ color: 'var(--c-muted)' }}>
            Shipping, returns, care, and privacy — everything you need before or after you buy.
          </p>
        </header>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--s-md)', maxWidth: 720, paddingBottom: 'var(--s-lg)' }}>
          {SECTIONS.map((s) => (
            <section key={s.title} style={{ borderTop: '1px solid var(--c-line)', paddingTop: 'var(--s-sm)' }}>
              <Hallmark className="eyebrow gem">{s.title}</Hallmark>
              {s.body.map((p, i) => (
                <p key={i} className="body" style={{ color: 'var(--c-muted)', lineHeight: 1.8, marginTop: i === 0 ? 12 : 10 }}>{p}</p>
              ))}
            </section>
          ))}
          <Hallmark as="p">.925 · Made on Earth · {currentYearRoman()}</Hallmark>
        </div>
      </div>
    </div>
  )
}
