import { Link } from 'react-router-dom'
import { InstagramLogo } from '@phosphor-icons/react'
import { EyeSigil, Hallmark } from './Sigil'
import { currentYear, currentYearRoman } from '@/lib/year'

/* Footer — eye mark, hallmark language, live contact details.
   The old globe seal was dropped (client rejected the globe motif) for a
   ruby-ember glow + a giant ghosted dice motif bleeding off the edge. */
export function Footer() {
  const year = currentYear()
  return (
    <footer
      style={{
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--c-pit)',
        borderTop: '1px solid var(--c-line)',
      }}
    >
      {/* Ruby-ember glow — deep bottom-left smoulder + faint haze behind the
          wordmark. Low intensity, consistent with the site-wide bloom. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          pointerEvents: 'none',
          background:
            'radial-gradient(60% 80% at 8% 118%, var(--ember-glow) 0%, transparent 58%),' +
            'radial-gradient(38% 52% at 2% 4%, var(--ember-haze) 0%, transparent 62%)',
        }}
      />
      {/* Giant ghosted dice — the brand's product, desaturated and near-invisible,
          bleeding off the bottom-right edge. Decorative only; footer text stays
          fully legible (AA) above it. */}
      <img
        src="/assets/products/dice-macro.png"
        alt=""
        aria-hidden="true"
        draggable={false}
        style={{
          position: 'absolute',
          right: '-7%',
          bottom: '-20%',
          width: 'min(560px, 58vw)',
          maxWidth: 'none',
          zIndex: 0,
          pointerEvents: 'none',
          userSelect: 'none',
          opacity: 0.08,
          filter: 'grayscale(1) contrast(1.05) brightness(1.15)',
        }}
      />

      <div
        className="wrap"
        style={{
          position: 'relative',
          zIndex: 1,
          paddingTop: 'var(--s-lg)',
          paddingBottom: 'var(--s-md)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, color: 'var(--c-bone)' }}>
          <EyeSigil size={40} weight={1.2} title="" />
          <h2 className="display" style={{ fontSize: 'var(--t-h2)' }}>Flight&nbsp;Tribe</h2>
        </div>

        <style>{`
          /* column headings sit heavier than the links under them */
          .footer__colhead { font-weight: 700; color: var(--c-bone); }
          .footer__mail { color: inherit; text-decoration: none; transition: color 0.2s var(--ease-ui); }
          .footer__mail:hover, .footer__mail:focus-visible { color: var(--c-gem); }
          .footer__built { display: flex; justify-content: center; margin-top: var(--s-sm); color: var(--c-muted); }
          .footer__built a { color: var(--c-bone); font-weight: 700; text-decoration: none; transition: color 0.2s var(--ease-ui); }
          .footer__built a:hover, .footer__built a:focus-visible { color: var(--c-gem); }
        `}</style>

        <div
          style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: 'var(--s-sm)', marginTop: 'var(--s-md)', color: 'var(--c-bone)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Hallmark className="eyebrow footer__colhead">The Vault</Hallmark>
            <Link className="topbar__link" to="/shop/jewelry">Jewelry</Link>
            <Link className="topbar__link" to="/shop/accessories">Accessories</Link>
            <Link className="topbar__link" to="/shop/clothing">Clothing</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Hallmark className="eyebrow footer__colhead">The Tribe</Hallmark>
            <Link className="topbar__link" to="/tribe">The Story</Link>
            <Link className="topbar__link" to="/contact">Contact</Link>
            <Link className="topbar__link" to="/cart">Bag</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Hallmark className="eyebrow footer__colhead">Send Word</Hallmark>
            <Hallmark as="p">
              <a className="footer__mail" href="mailto:Flightxtribe@gmail.com">Flightxtribe@gmail.com</a>
            </Hallmark>
            <Hallmark as="p">
              <a
                className="footer__mail"
                href="https://www.instagram.com/Flight__Tribe/"
                target="_blank" rel="noopener noreferrer"
              >
                @Flight__Tribe
              </a>
            </Hallmark>
            <div style={{ display: 'flex', alignItems: 'center', gap: 2, marginLeft: -10, marginTop: 2 }}>
              <style>{`
                .footer__social { display: inline-flex; align-items: center; justify-content: center; width: 44px; height: 44px; color: var(--c-chrome); transition: color 0.2s var(--ease-ui); }
                .footer__social:hover, .footer__social:focus-visible { color: var(--c-gem); }
              `}</style>
              <a
                href="https://www.instagram.com/Flight__Tribe/"
                target="_blank" rel="noopener noreferrer"
                className="footer__social"
                aria-label="Flight Tribe on Instagram — @Flight__Tribe"
              >
                <InstagramLogo size={20} weight="light" />
              </a>
            </div>
            <Hallmark as="p" >Made on Earth · USA</Hallmark>
          </div>
        </div>

        {/* Hallmark marquee band — adapted from lightswind's
            text-scroll-marquee.tsx/sliding-logo-marquee.tsx family (an
            infinite CSS translateX loop of duplicated content), restyled as
            a single tracked hallmark line instead of a logo strip so it
            reads as the metal's own stamped edge repeating, not a ticker.
            Pure CSS — no JS, no rAF — and paused outright under
            reduced-motion (the content is fully legible either way since
            it's duplicated end-to-end). */}
        <div className="footer-marquee" style={{ marginTop: 'var(--s-lg)' }} aria-hidden="true">
          <div className="footer-marquee__track">
            {Array.from({ length: 2 }).map((_, i) => (
              <span className="footer-marquee__set" key={i}>
                {Array.from({ length: 6 }).map((_, j) => (
                  <span key={j} className="footer-marquee__item">
                    <Hallmark>.925 · Made on Earth · {currentYearRoman()}</Hallmark>
                    <EyeSigil size={16} title="" />
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>

        <div
          style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap',
            gap: 20, marginTop: 'var(--s-sm)', paddingTop: 'var(--s-sm)', borderTop: '1px solid var(--c-line)',
            color: 'var(--c-muted)',
          }}
        >
          <Hallmark>© {year} Flight Tribe · .925 · {currentYearRoman()}</Hallmark>
          <EyeSigil size={22} />
          <Hallmark>All silver hand-cast in the USA — no two struck alike</Hallmark>
        </div>

        {/* build credit */}
        <div className="footer__built">
          <Hallmark>
            Built by{' '}
            <a href="https://wavesmvmnt.com" target="_blank" rel="noopener noreferrer">Waves</a>
          </Hallmark>
        </div>
      </div>
    </footer>
  )
}
