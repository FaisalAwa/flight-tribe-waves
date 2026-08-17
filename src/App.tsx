import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { CartProvider } from '@/context/CartContext'
import { Nav, Footer, Loader, ScrollProgress, EyeCompanion } from '@/components'
import Home from './pages/Home'
import Shop from './pages/Shop'
import Product from './pages/Product'
import Cart from './pages/Cart'
import Tribe from './pages/Tribe'
import Contact from './pages/Contact'
import Policies from './pages/Policies'
import NotFound from './pages/NotFound'
import { currentYearRoman } from '@/lib/year'

/** Reset scroll on navigation (Lenis/native), then refresh ScrollTrigger. */
function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
    // let the new page paint, then re-measure pinned/scroll triggers
    const t = setTimeout(() => ScrollTrigger.refresh(), 60)
    return () => clearTimeout(t)
  }, [pathname])
  return null
}

export default function App() {
  // Keep the tab title's hallmark year current (rolls over automatically);
  // index.html ships a yearless fallback for the pre-hydration paint.
  useEffect(() => {
    document.title = `Flight Tribe — .925 · Made on Earth · ${currentYearRoman()}`
  }, [])

  return (
    <CartProvider>
      <Loader />
      <ScrollProgress />
      <span className="grain" aria-hidden />
      <EyeCompanion />
      <ScrollToTop />
      <Nav />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:category" element={<Shop />} />
          <Route path="/product/:slug" element={<Product />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/tribe" element={<Tribe />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/policies" element={<Policies />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </CartProvider>
  )
}
