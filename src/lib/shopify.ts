/* ═══════════════════════════════════════════════════════════════
   SHOPIFY HEADLESS SEAM — FLIGHT TRIBE
   commerce_model = shopify-headless. The catalogue in src/data/products.ts is
   generated from this store (scripts/shopify/pull.mjs), and checkout hands
   the cart to Shopify's own hosted checkout via the Storefront API.

   Env (.env locally, Project Settings → Environment Variables on Vercel):
     VITE_SHOPIFY_DOMAIN=flighttribeusa.myshopify.com
     VITE_SHOPIFY_STOREFRONT_TOKEN=…
     VITE_SHOPIFY_API_VERSION=2026-07        (optional, defaults below)

   The Storefront token is a public credential — it ships in the client bundle
   by design and only grants read access to *published* products.
   ═══════════════════════════════════════════════════════════════ */

const DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN as string | undefined
const TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string | undefined
const API_VERSION = (import.meta.env.VITE_SHOPIFY_API_VERSION as string | undefined) ?? '2026-07'

/** True once real Shopify credentials are present. Drives the checkout UI. */
export const SHOPIFY_ENABLED = Boolean(DOMAIN && TOKEN)

export interface CheckoutLine {
  /** gid://shopify/ProductVariant/… — set from the generated catalogue. */
  variantId?: string
  quantity: number
  title: string
}

const CART_CREATE = `mutation cartCreate($lines: [CartLineInput!]!) {
  cartCreate(input: { lines: $lines }) {
    cart { checkoutUrl }
    userErrors { field message }
  }
}`

async function storefront<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN as string,
    },
    body: JSON.stringify({ query, variables }),
  })
  if (!res.ok) throw new Error(`Shopify Storefront API returned ${res.status}`)
  const json = await res.json()
  if (json.errors?.length) throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '))
  return json.data as T
}

/**
 * Create a Shopify cart for the given lines and return its hosted checkout URL.
 * Returns null when the store isn't linked or no line carries a variant id, so
 * the Cart page falls back to DM-to-reserve rather than dead-ending the buyer.
 */
export async function startCheckout(lines: CheckoutLine[]): Promise<string | null> {
  if (!SHOPIFY_ENABLED) return null

  const buyable = lines
    .filter((l) => l.variantId && l.quantity > 0)
    .map((l) => ({ merchandiseId: l.variantId as string, quantity: l.quantity }))

  // A line without a variant id can't be bought; sending a partial cart would
  // quietly drop it at checkout, so fall back instead of under-charging.
  if (!buyable.length || buyable.length !== lines.length) return null

  try {
    const data = await storefront<{
      cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] }
    }>(CART_CREATE, { lines: buyable })

    const { cart, userErrors } = data.cartCreate
    if (userErrors?.length) {
      console.error('[shopify] cartCreate:', userErrors.map((e) => e.message).join('; '))
      return null
    }
    return cart?.checkoutUrl ?? null
  } catch (err) {
    console.error('[shopify] checkout failed:', err)
    return null
  }
}
