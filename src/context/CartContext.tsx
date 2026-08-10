import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react'
import type { ReactNode } from 'react'
import { startCheckout, SHOPIFY_ENABLED } from '@/lib/shopify'

/* ═══════════════════════════════════════════════════════════════
   CART — FLIGHT TRIBE  ·  commerce_model = shopify-headless
   A real cart (add / setQty / remove / clear / subtotal / checkout),
   persisted to localStorage. `checkout()` hands off to Shopify once the
   store is linked (see lib/shopify.ts); until then it returns null and the
   Cart page offers a DM-to-reserve fallback.
   ═══════════════════════════════════════════════════════════════ */

export interface CartItem {
  id: string
  slug: string
  name: string
  spec: string
  image: string
  priceUSD: number
  qty: number
  isDemo: boolean
  /** the active gem accent for this piece — drives the Ignite stamp colour */
  gem?: string
  /** Shopify variant id — populated at connect-shopify time. */
  variantId?: string
}

interface CartCtx {
  items: CartItem[]
  count: number
  subtotalUSD: number
  shopifyEnabled: boolean
  /** the id most recently added — drives the Ignite (eye-stamp) animation */
  lastAdded: string | null
  add: (item: Omit<CartItem, 'qty'>) => void
  setQty: (id: string, qty: number) => void
  remove: (id: string) => void
  clear: () => void
  has: (id: string) => boolean
  /** Shopify checkout URL when linked, else null (fallback to DM/reserve). */
  checkout: () => Promise<string | null>
}

const Ctx = createContext<CartCtx | null>(null)
const KEY = 'ft-cart'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch { return [] }
  })
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [announce, setAnnounce] = useState('')  // aria-live status

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(items)) } catch { /* ignore quota */ }
  }, [items])

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3200)
    return () => clearTimeout(t)
  }, [toast])

  const add = useCallback((item: Omit<CartItem, 'qty'>) => {
    setItems((prev) => {
      const found = prev.find((p) => p.id === item.id)
      if (found) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + 1 } : p))
      return [...prev, { ...item, qty: 1 }]
    })
    setLastAdded(item.id)
    setToast(item.name)
    setAnnounce(`${item.name} added to bag`)
    window.setTimeout(() => setLastAdded((cur) => (cur === item.id ? null : cur)), 900)
  }, [])

  const setQty = useCallback((id: string, qty: number) =>
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, qty: Math.max(1, qty) } : p))), [])
  const remove = useCallback((id: string) =>
    setItems((prev) => {
      const gone = prev.find((p) => p.id === id)
      if (gone) setAnnounce(`${gone.name} removed from bag`)
      return prev.filter((p) => p.id !== id)
    }), [])
  const clear = useCallback(() => setItems([]), [])
  const has = useCallback((id: string) => items.some((p) => p.id === id), [items])

  const checkout = useCallback(
    () => startCheckout(items.map((i) => ({ variantId: i.variantId, quantity: i.qty, title: i.name }))),
    [items],
  )

  const value = useMemo<CartCtx>(() => ({
    items,
    count: items.reduce((n, i) => n + i.qty, 0),
    subtotalUSD: items.reduce((n, i) => n + i.priceUSD * i.qty, 0),
    shopifyEnabled: SHOPIFY_ENABLED,
    lastAdded,
    add, setQty, remove, clear, has, checkout,
  }), [items, lastAdded, add, setQty, remove, clear, has, checkout])

  return (
    <Ctx.Provider value={value}>
      {children}
      {/* screen-reader status (WCAG 4.1.3) */}
      <div aria-live="polite" role="status" style={{
        position: 'absolute', width: 1, height: 1, padding: 0, margin: -1,
        overflow: 'hidden', clip: 'rect(0 0 0 0)', whiteSpace: 'nowrap', border: 0,
      }}>{announce}</div>
      {/* visible confirmation */}
      {toast && (
        <div className="toast" role="status">
          <span>Struck. <strong style={{ color: 'var(--c-gem-text)' }}>{toast}</strong> joins the bag.</span>
          <a href="/cart">View bag →</a>
        </div>
      )}
    </Ctx.Provider>
  )
}

export function useCart(): CartCtx {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
