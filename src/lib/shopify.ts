/* ═══════════════════════════════════════════════════════════════
   SHOPIFY HEADLESS SEAM — FLIGHT TRIBE
   commerce_model = shopify-headless. The storefront + cart are real;
   CHECKOUT is stubbed until the client's Shopify store is linked
   (same seam proven on SJ Jewellers + Legacy Ice).

   To go live (the `connect-shopify` step, after design sign-off):
     1. Add env vars (.env / Vercel project):
          VITE_SHOPIFY_DOMAIN=your-store.myshopify.com
          VITE_SHOPIFY_STOREFRONT_TOKEN=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
     2. Map each product in src/data/products.ts to its Shopify variant id
        (add a `variantId`), or replace the demo catalogue with a
        Storefront-API fetch.
     3. `startCheckout()` then creates a real Shopify cart and returns its
        checkoutUrl — no other UI change is needed.
   Until then SHOPIFY_ENABLED is false and the Cart offers a DM-to-reserve
   (WhatsApp / IG) fallback.
   ═══════════════════════════════════════════════════════════════ */

const DOMAIN = import.meta.env.VITE_SHOPIFY_DOMAIN as string | undefined
const TOKEN = import.meta.env.VITE_SHOPIFY_STOREFRONT_TOKEN as string | undefined

/** True once real Shopify credentials are present. Drives the checkout UI. */
export const SHOPIFY_ENABLED = Boolean(DOMAIN && TOKEN)

export interface CheckoutLine {
  /** Shopify variant id, e.g. gid://shopify/ProductVariant/123 — added at link time. */
  variantId?: string
  quantity: number
  title: string
}

/**
 * Create a Shopify checkout for the given lines and return its checkout URL.
 * STUB until SHOPIFY_ENABLED — returns null so the Cart falls back to DM/reserve.
 * When live, replace the body with a Storefront API `cartCreate` mutation
 * (POST https://{DOMAIN}/api/2024-10/graphql.json, header
 * X-Shopify-Storefront-Access-Token: {TOKEN}) and return cart.checkoutUrl.
 */
export async function startCheckout(_lines: CheckoutLine[]): Promise<string | null> {
  if (!SHOPIFY_ENABLED) return null
  // TODO(connect-shopify): implement Storefront API cartCreate → return checkoutUrl.
  return null
}
