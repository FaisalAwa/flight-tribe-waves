import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './styles/globals.css'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
// NOTE: lenis v1.x has no CSS file to import — no 'lenis/dist/lenis.css' needed

gsap.registerPlugin(ScrollTrigger)

// This is a scroll-driven narrative — always open at the top on load/refresh
// so pinned/scrubbed sections measure from a known origin.
if ('scrollRestoration' in history) history.scrollRestoration = 'manual'

// Anton is a condensed display font (display=swap) — the swap changes heading
// block heights, so re-measure ScrollTrigger positions once fonts settle.
if (document.fonts?.ready) document.fonts.ready.then(() => ScrollTrigger.refresh())

// ── Smooth scroll / ScrollTrigger sync ────────────────────────────────
// Lenis owns smooth scroll on DESKTOP only. On touch devices (pointer: coarse)
// Lenis' rAF loop fights the mobile compositor and makes pinned scrubs jitter,
// so we skip it there and let native scroll drive ScrollTrigger directly (via a
// passive listener). Either way, every ScrollTrigger pin/scrub tracks correctly
// on phone, tablet, and desktop alike.
const isTouch = window.matchMedia('(pointer: coarse)').matches
if (!isTouch) {
  const lenis = new Lenis()
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => { lenis.raf(time * 1000) })
  gsap.ticker.lagSmoothing(0)
} else {
  window.addEventListener('scroll', () => ScrollTrigger.update(), { passive: true })
}

// Re-measure after a debounced resize — rotation, breakpoint change, and iOS
// address-bar show/hide all shift pinned-section geometry.
let resizeTimer: number
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer)
  resizeTimer = window.setTimeout(() => ScrollTrigger.refresh(), 160)
})

// StrictMode intentionally OFF — it double-fires effects and breaks GSAP
// ScrollTrigger pins (project hard convention). Do not re-enable.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>
)
