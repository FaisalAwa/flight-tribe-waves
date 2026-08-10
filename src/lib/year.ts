/* Live-year helpers — brand chrome (footer, nav, loader, taglines, the
   scroll "read the stamp" section) shows the CURRENT year and rolls over
   automatically every January. Deliberately NOT used for product-engraving
   data in src/data/products.ts: that records the real die's stamped mint
   year (.925 · USA · 2026) and must stay fixed. */

export const currentYear = (): number => new Date().getFullYear()

const ROMAN: readonly [number, string][] = [
  [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'], [100, 'C'],
  [90, 'XC'], [50, 'L'], [40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I'],
]

/** Classic subtractive Roman numeral (e.g. 2026 → "MMXXVI"). */
export function toRoman(n: number): string {
  let out = ''
  for (const [value, symbol] of ROMAN) {
    while (n >= value) {
      out += symbol
      n -= value
    }
  }
  return out
}

export const currentYearRoman = (): string => toRoman(currentYear())
