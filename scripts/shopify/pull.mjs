/* ═══════════════════════════════════════════════════════════════
   PULL — Shopify ➜ src/data/products.ts
   Regenerates the storefront catalogue from live Shopify data, so Shopify is
   the single source of truth. Re-run it after any edit in Shopify admin
   (price, title, images, description) and the site follows.

   Only fields Shopify actually holds are written. Nothing is invented: a
   product with no description in Shopify gets no description on the site.
   ═══════════════════════════════════════════════════════════════ */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { REPO_ROOT } from './catalogue.mjs'
import { Admin } from './client.mjs'

const OUT = resolve(REPO_ROOT, 'src/data/products.ts')

/* The accent gem is a design token per category (the vault rule: one gem per
   screen), not a claim about the piece. */
const CATEGORY = {
  Jewelry: {
    id: 'jewelry', label: 'Jewelry', gem: 'amethyst',
    blurb: 'Hand-cast pendants, pins and the winged heart — the pieces the tribe is known by.',
  },
  Accessories: {
    id: 'accessories', label: 'Accessories', gem: 'ruby',
    blurb: 'Artifact dice and solid silver objects — stamped, gem-set, pocket weight.',
  },
  Clothing: {
    id: 'clothing', label: 'Clothing', gem: 'emerald',
    blurb: 'Hemp and mulberry silk bandanas, woven to order.',
  },
}

const ALL = `query all($cursor: String) {
  products(first: 50, after: $cursor, sortKey: CREATED_AT) {
    pageInfo { hasNextPage endCursor }
    nodes {
      id handle title status productType tags descriptionHtml description
      variants(first: 1) { nodes { id price availableForSale } }
      media(first: 50) { nodes { alt status
        ... on MediaImage { image { url width height } } } }
      metafields(first: 25, namespace: "flight_tribe") { nodes { key value } }
    }
  }
}`

const esc = (s) => String(s)
  .replace(/\\/g, '\\\\')
  .replace(/'/g, "\\'")
  .replace(/\r/g, '')
  .replace(/\n/g, '\\n')
const lit = (s) => `'${esc(s)}'`

/** Shopify's plain `description` flattens paragraphs into one run of text, so
 *  recover them from the body HTML — the copy reads as it was written. */
const textFromHtml = (html) => String(html ?? '')
  .replace(/<br\s*\/?>/gi, '\n')
  .replace(/<\/p>\s*<p[^>]*>/gi, '\n\n')
  .replace(/<[^>]*>/g, '')
  .replace(/&nbsp;/g, ' ')
  .replace(/&quot;/g, '"')
  .replace(/&#39;/g, "'")
  .replace(/&lt;/g, '<')
  .replace(/&gt;/g, '>')
  .replace(/&amp;/g, '&')
  .split('\n')
  .map((l) => l.replace(/[ \t]+/g, ' ').trim())
  .join('\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim()

const admin = await Admin.connect()

const nodes = []
let cursor = null
do {
  const d = await admin.gql(ALL, { cursor })
  nodes.push(...d.products.nodes)
  cursor = d.products.pageInfo.hasNextPage ? d.products.pageInfo.endCursor : null
} while (cursor)

const live = nodes.filter((n) => n.status === 'ACTIVE')
console.log(`Pulled ${live.length} active products from ${admin.domain}`)

const items = live.map((n) => {
  const cat = CATEGORY[n.productType]
  if (!cat) throw new Error(`${n.handle}: product type "${n.productType}" has no category mapping`)
  const variant = n.variants.nodes[0]
  if (!variant) throw new Error(`${n.handle}: no variant`)
  const images = n.media.nodes.filter((m) => m.image?.url).map((m) => m.image.url)
  if (!images.length) throw new Error(`${n.handle}: no images`)
  const mf = new Map(n.metafields.nodes.map((m) => [m.key, (m.value || '').trim()]))
  // The tags are: the editorial tag, the category, and the gender facet. The
  // storefront shows only the editorial one, so drop the two known others.
  const gender = mf.get('gender') || ''
  const tag = n.tags.find((t) => t !== cat.label && t !== gender && !/^(unisex|men|mens|women|womens)$/i.test(t))
  return {
    id: n.handle,
    slug: n.handle,
    name: n.title,
    category: cat.id,
    gem: cat.gem,
    priceUSD: Number(variant.price),
    image: images[0],
    gallery: images,
    tag,
    variantId: variant.id,
    productId: n.id,
    availableForSale: variant.availableForSale,
    description: textFromHtml(n.descriptionHtml) || undefined,
    // flight_tribe.material is deliberately NOT surfaced as the storefront
    // `spec` line: in the master sheet that column mixes the material with
    // shipping weight and production status ("on bench", "1lb"), so rendering
    // it under the product name would put internal notes in front of buyers.
    // It stays a Shopify metafield for the client to edit; dimensions, which
    // are clean measurements on every row, do reach the PDP.
    dimensions: mf.get('dimensions') || undefined,
  }
})

const usedCategories = [...new Set(items.map((i) => i.category))]

const body = `/* ═══════════════════════════════════════════════════════════════
   CATALOGUE — FLIGHT TRIBE
   GENERATED FILE — do not edit by hand.
     source : ${admin.domain} (Shopify, Admin API ${admin.version})
     rebuild: node scripts/shopify/pull.mjs

   Every value below is read straight out of Shopify, which was itself loaded
   from products/Flight_Tribe_Master_Product_Sheet - Master Catalog.csv.
   Prices are the real list prices; the copy is the client's own product
   description; images are the Shopify CDN originals. Fields Shopify has no
   value for are simply absent — the UI hides them rather than showing
   invented copy.
   ═══════════════════════════════════════════════════════════════ */

export type CategoryId = 'jewelry' | 'accessories' | 'clothing'
export type Gem = 'amethyst' | 'ruby' | 'emerald' | 'topaz'

export interface Category {
  id: CategoryId
  label: string
  blurb: string
  /** the single saturated accent for this category (vault rule: one gem/screen) */
  gem: Gem
  /** false = nothing in this category is live in Shopify yet */
  live: boolean
}

export const categories: Category[] = [
${Object.values(CATEGORY).map((c) => `  {
    id: '${c.id}', label: ${lit(c.label)}, gem: '${c.gem}', live: ${usedCategories.includes(c.id)},
    blurb: ${lit(c.blurb)},
  },`).join('\n')}
]

export const categoryById = (id: string): Category | undefined =>
  categories.find((c) => c.id === id)

export interface Product {
  id: string
  slug: string
  name: string
  category: CategoryId
  gem: Gem
  /** real list price, USD — the Shopify variant price */
  priceUSD: number
  /** Shopify CDN url of the primary shot */
  image: string
  gallery: string[]
  /** object-position for the card/hero crop */
  focal: string
  tag?: string
  /** the client's product copy, straight from Shopify; blank line = paragraph */
  description?: string
  /** short descriptor under the name — flight_tribe.material in Shopify */
  spec?: string
  /** measured size — flight_tribe.dimensions in Shopify */
  dimensions?: string
  /** hallmark spec block on the PDP — absent unless Shopify has one */
  hallmark?: string[]
  sizes?: string[]
  /** gid://shopify/ProductVariant/… — what checkout actually buys */
  variantId: string
  productId: string
  availableForSale: boolean
}

export const products: Product[] = [
${items.map((p) => `  {
    id: ${lit(p.id)}, slug: ${lit(p.slug)}, name: ${lit(p.name)},
    category: '${p.category}', gem: '${p.gem}', priceUSD: ${p.priceUSD},
    ${p.tag ? `tag: ${lit(p.tag)},\n    ` : ''}focal: 'center center',
    image: ${lit(p.image)},
    gallery: [
${p.gallery.map((g) => `      ${lit(g)},`).join('\n')}
    ],${p.dimensions ? `\n    dimensions: ${lit(p.dimensions)},` : ''}${p.description ? `\n    description: ${lit(p.description)},` : ''}
    variantId: ${lit(p.variantId)},
    productId: ${lit(p.productId)},
    availableForSale: ${p.availableForSale},
  },`).join('\n')}
]

export const productBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug)

export const productsByCategory = (id: CategoryId): Product[] =>
  products.filter((p) => p.category === id)

/** The Bench · Current — the first four pieces in Shopify's catalogue order. */
export const popularProducts = (): Product[] => products.slice(0, 4)

/** the hero object for THE BENCH */
export const heroProduct = (): Product => products[0]
`

writeFileSync(OUT, body)
console.log(`Wrote ${OUT}`)
console.log(`  ${items.length} products · ${items.reduce((n, p) => n + p.gallery.length, 0)} images · categories live: ${usedCategories.join(', ')}`)
const noDesc = items.filter((p) => !p.description)
if (noDesc.length) {
  console.log(`\n  ${noDesc.length} product(s) have no description in Shopify — the PDP omits that block.`)
  console.log(`  Add copy in Shopify admin, then re-run this script.`)
}
