/* ═══════════════════════════════════════════════════════════════
   CATALOGUE — FLIGHT TRIBE
   GENERATED FILE — do not edit by hand.
     source : flightribe-aphxmxgd.myshopify.com (Shopify, Admin API 2026-07)
     rebuild: node scripts/shopify/pull.mjs

   Every value below is read straight out of Shopify, which was itself loaded
   from products/Flight-Tribe-Product-Image-Audit … .csv. Prices are the real
   list prices; images are the Shopify CDN originals. Fields Shopify has no
   value for (description, spec) are simply absent — the UI hides them rather
   than showing invented copy.
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
  {
    id: 'jewelry', label: 'Jewelry', gem: 'amethyst', live: true,
    blurb: 'Hand-cast pendants, pins and the winged heart — the pieces the tribe is known by.',
  },
  {
    id: 'accessories', label: 'Accessories', gem: 'ruby', live: true,
    blurb: 'Artifact dice and solid silver objects — stamped, gem-set, pocket weight.',
  },
  {
    id: 'clothing', label: 'Clothing', gem: 'emerald', live: true,
    blurb: 'Hemp and mulberry silk bandanas, woven to order.',
  },
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
  /** written in Shopify admin; absent until the client fills it in */
  description?: string
  /** short descriptor under the name — absent unless Shopify has one */
  spec?: string
  /** hallmark spec block on the PDP — absent unless Shopify has one */
  hallmark?: string[]
  sizes?: string[]
  /** gid://shopify/ProductVariant/… — what checkout actually buys */
  variantId: string
  productId: string
  availableForSale: boolean
}

export const products: Product[] = [
  {
    id: 'tree-of-life-pendant', slug: 'tree-of-life-pendant', name: '24k Gold Tree of Life Pendant',
    category: 'jewelry', gem: 'amethyst', priceUSD: 1800,
    tag: '24K Gold',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/tree-of-life-01.png?v=1786380215',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/tree-of-life-01.png?v=1786380215',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/tree-of-life-02.png?v=1786380215',
    ],
    variantId: 'gid://shopify/ProductVariant/47177114124342',
    productId: 'gid://shopify/Product/9136282075190',
    availableForSale: true,
  },
  {
    id: 'arrowhead-pendant', slug: 'arrowhead-pendant', name: 'Heavy Solid Silver Arrowhead Pendant',
    category: 'jewelry', gem: 'amethyst', priceUSD: 500,
    tag: 'Hand-forged',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/arrowhead-01.png?v=1786380223',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/arrowhead-01.png?v=1786380223',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/arrowhead-02.png?v=1786380223',
    ],
    variantId: 'gid://shopify/ProductVariant/47177116090422',
    productId: 'gid://shopify/Product/9136282140726',
    availableForSale: true,
  },
  {
    id: 'pilot-pin', slug: 'pilot-pin', name: 'Flight Tribe Pilot Pin',
    category: 'jewelry', gem: 'amethyst', priceUSD: 500,
    tag: 'Wings',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/pilot-pin-01.png?v=1786380230',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/pilot-pin-01.png?v=1786380230',
    ],
    variantId: 'gid://shopify/ProductVariant/47177116155958',
    productId: 'gid://shopify/Product/9136282206262',
    availableForSale: true,
  },
  {
    id: 'winged-heart-pendant', slug: 'winged-heart-pendant', name: 'Winged Heart Pendant',
    category: 'jewelry', gem: 'amethyst', priceUSD: 2500,
    tag: 'Signature',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/heart-01.png?v=1786380237',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/heart-01.png?v=1786380237',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/heart-02.png?v=1786380237',
    ],
    variantId: 'gid://shopify/ProductVariant/47177116778550',
    productId: 'gid://shopify/Product/9136282271798',
    availableForSale: true,
  },
  {
    id: 'liberty-250th-dice', slug: 'liberty-250th-dice', name: 'Flight Tribe 250th Liberty Gemstone Artifact Dice',
    category: 'accessories', gem: 'ruby', priceUSD: 2500,
    tag: 'Limited · 250th',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/liberty-dice-01.png?v=1786380245',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/liberty-dice-01.png?v=1786380245',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/liberty-dice-02.png?v=1786380245',
    ],
    variantId: 'gid://shopify/ProductVariant/47177116811318',
    productId: 'gid://shopify/Product/9136282304566',
    availableForSale: true,
  },
  {
    id: 'ruby-relic-dice', slug: 'ruby-relic-dice', name: 'Flight Tribe Ruby Relic Dice',
    category: 'accessories', gem: 'ruby', priceUSD: 2000,
    tag: 'Icon · hero product',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/ruby-dice-01.png?v=1786380252',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/ruby-dice-01.png?v=1786380252',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/ruby-dice-02.png?v=1786380251',
    ],
    variantId: 'gid://shopify/ProductVariant/47177116844086',
    productId: 'gid://shopify/Product/9136282337334',
    availableForSale: true,
  },
  {
    id: 'iceman-sapphire-dice', slug: 'iceman-sapphire-dice', name: 'IceMan US Mined Montana Blue Sapphire Artifact Dice',
    category: 'accessories', gem: 'ruby', priceUSD: 6000,
    tag: 'Rare',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/bundle-01.png?v=1786380259',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/bundle-01.png?v=1786380259',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/bundle-02.png?v=1786380258',
    ],
    variantId: 'gid://shopify/ProductVariant/47177116942390',
    productId: 'gid://shopify/Product/9136282435638',
    availableForSale: true,
  },
  {
    id: 'artifact-dice-collection', slug: 'artifact-dice-collection', name: 'The Flight Tribe Artifact Dice Collection',
    category: 'accessories', gem: 'ruby', priceUSD: 9250,
    tag: 'Collector Set',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/bundle-01_20371868-1eed-473e-b522-e9c7d50380ba.png?v=1786380267',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/bundle-01_20371868-1eed-473e-b522-e9c7d50380ba.png?v=1786380267',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/bundle-02_3d398916-6d7b-4294-92e5-d7d3bef480c5.png?v=1786380267',
    ],
    variantId: 'gid://shopify/ProductVariant/47177117007926',
    productId: 'gid://shopify/Product/9136282501174',
    availableForSale: true,
  },
  {
    id: 'paperweight-pipe', slug: 'paperweight-pipe', name: 'Solid Silver Paper Weight Pipe',
    category: 'accessories', gem: 'ruby', priceUSD: 2500,
    tag: 'Hand-hammered',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/pipe-01.png?v=1786380276',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/pipe-01.png?v=1786380276',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/pipe-02.png?v=1786380276',
    ],
    variantId: 'gid://shopify/ProductVariant/47177117106230',
    productId: 'gid://shopify/Product/9136282566710',
    availableForSale: true,
  },
  {
    id: 'hemp-bandana', slug: 'hemp-bandana', name: 'Flight Tribe 100% Hemp Bandana',
    category: 'clothing', gem: 'emerald', priceUSD: 888,
    tag: 'Bulk order only',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/hemp-01.png?v=1786380284',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/hemp-01.png?v=1786380284',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/hemp-02.png?v=1786380284',
    ],
    variantId: 'gid://shopify/ProductVariant/47177117138998',
    productId: 'gid://shopify/Product/9136282599478',
    availableForSale: true,
  },
  {
    id: 'silk-bandana', slug: 'silk-bandana', name: 'Flight Tribe 100% Mulberry Silk Bandana',
    category: 'clothing', gem: 'emerald', priceUSD: 88,
    tag: 'Bulk order only',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/silk-01.jpg?v=1786380291',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/silk-01.jpg?v=1786380291',
      'https://cdn.shopify.com/s/files/1/0769/1576/9398/files/silk-02.png?v=1786380291',
    ],
    variantId: 'gid://shopify/ProductVariant/47177117237302',
    productId: 'gid://shopify/Product/9136282697782',
    availableForSale: true,
  },
]

export const productBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug)

export const productsByCategory = (id: CategoryId): Product[] =>
  products.filter((p) => p.category === id)

/** The Bench · Current — the first four pieces in Shopify's catalogue order. */
export const popularProducts = (): Product[] => products.slice(0, 4)

/** the hero object for THE BENCH */
export const heroProduct = (): Product => products[0]
