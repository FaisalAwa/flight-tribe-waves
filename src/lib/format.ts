/* Small formatting helpers. Prices are DEMO / indicative (see PLACEHOLDERS FT-P02).
   Flight Tribe is USA-made (.925 · USA hallmark) → USD. */

/** $1,000 — USD, no trailing .00 for whole amounts. */
export function formatPrice(usd: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(usd)
}

/** "from $1,000" for indicative starting prices. */
export function formatFrom(usd: number): string {
  return `from ${formatPrice(usd)}`
}
