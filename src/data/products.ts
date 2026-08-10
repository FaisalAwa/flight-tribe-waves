/* ═══════════════════════════════════════════════════════════════
   CATALOGUE — FLIGHT TRIBE
   Images are REAL client product photography (Media/Product Images →
   /assets/products/*). They are raw iPhone captures — some still carry
   phone UI or a red-felt bench ground; each product's `focal` frames the
   piece inside the vitrine card. FT-P06: crop + cutout + recomposite on the
   void ground + gem-only saturation before launch (see PLACEHOLDERS.md).

   PLACEHOLDER FT-P02: prices + specs are GENERATED indicative values —
   `isDemo: true` drives the in-UI DEMO marker. The $1,000 medallion price is
   anchored to the client's own storefront screenshot; the rest are house
   estimates. Swap for the client's real price list before launch.
   ═══════════════════════════════════════════════════════════════ */

export type CategoryId = 'jewelry' | 'accessories' | 'clothing'
export type Gem = 'amethyst' | 'ruby' | 'emerald' | 'topaz'

export interface Category {
  id: CategoryId
  label: string
  blurb: string
  /** the single saturated accent for this category (vault rule: one gem/screen) */
  gem: Gem
  /** false = drop not yet cut; category renders a "coming" state, no cards. */
  live: boolean
}

export const categories: Category[] = [
  {
    id: 'jewelry', label: 'Jewelry', gem: 'amethyst', live: true,
    blurb: 'Hand-cast sterling — winged hearts, the eagle seal, skulls. One stone, set hot.',
  },
  {
    id: 'accessories', label: 'Accessories', gem: 'ruby', live: true,
    blurb: 'The dice, the pipe — solid .925 objects, stamped and gem-set. Pocket weight, not trinkets.',
  },
  {
    id: 'clothing', label: 'Clothing', gem: 'emerald', live: false,
    blurb: 'Cut-and-sew, bandanas, stickers. Next off the bench — not yet cast.',
  },
]

export const categoryById = (id: string): Category | undefined =>
  categories.find((c) => c.id === id)

export interface Product {
  id: string
  slug: string
  name: string
  category: CategoryId
  /** short descriptor under the name */
  spec: string
  gem: Gem
  metal: string
  /** indicative starting price, USD — DEMO */
  priceUSD: number
  image: string
  /** object-position for the card/hero crop (hides phone UI / off-centres) */
  focal: string
  /** true = bg-removed cutout that composites onto the brushed-void ground (contain, not cover) */
  cut?: boolean
  gallery?: string[]
  tag?: string
  /** ring/variant sizes — only set on pieces where size is load-bearing.
   *  DEMO ranges until the client confirms what they actually cast. */
  sizes?: string[]
  popular: boolean
  isDemo: boolean
  /** hallmark spec block on the PDP */
  hallmark: string[]
  description: string
}

export const products: Product[] = [
  /* ─── JEWELRY (amethyst) ─────────────────────────────────────── */
  {
    id: 'j-heart', slug: 'winged-heart-pendant', name: 'Winged Heart',
    category: 'jewelry', spec: 'Sterling · amethyst · rolo chain', gem: 'amethyst',
    metal: '.925 Sterling Silver', priceUSD: 680,
    image: '/assets/products/winged-heart-01.png', focal: 'center 42%',
    gallery: [
      '/assets/products/winged-heart-01.png',
      '/assets/products/winged-heart-02.png',
      '/assets/products/winged-heart-03.png',
      '/assets/products/winged-heart-04.png',
    ],
    tag: 'Signature', popular: true, isDemo: true,
    hallmark: ['.925 STERLING', 'HAND-CAST', 'USA', 'AMETHYST'],
    description:
      'A polished sterling heart flanked by full spread wings, crowned with a single bezel-set amethyst. Hung on a hand-finished rolo chain. Cast, filed and set by hand — the piece the tribe is known by.',
  },
  {
    id: 'j-eagle', slug: 'ft-eagle-medallion', name: 'FT Eagle Seal',
    category: 'jewelry', spec: 'Sterling · the house seal', gem: 'amethyst',
    metal: '.925 Sterling Silver', priceUSD: 1000,
    image: '/assets/products/ft-eagle.png', focal: 'center 48%',
    gallery: [
      '/assets/products/ft-eagle.png',
      '/assets/products/bench-eagle.png',
    ],
    tag: 'The Seal', popular: true, isDemo: true,
    hallmark: ['.925 STERLING', 'HAND-CAST', 'USA', 'MMXXVI'],
    description:
      'The Flight Tribe seal in solid sterling — the eagle mid-flight over the globe, F and T on the wings. The mark that stamps every piece, cast as an object you can wear.',
  },
  {
    id: 'j-skull', slug: 'skull-ring', name: 'Skull Ring',
    category: 'jewelry', spec: 'Sterling · carved band', gem: 'amethyst',
    metal: '.925 Sterling Silver', priceUSD: 540,
    image: '/assets/products/skull-ring.png', focal: 'center 46%',
    gallery: ['/assets/products/skull-ring.png'],
    sizes: ['7', '8', '9', '10', '11', '12'],
    tag: 'Hand-carved', popular: false, isDemo: true,
    hallmark: ['.925 STERLING', 'HAND-CARVED', 'USA'],
    description:
      'A heavy sterling skull worked into a full band — carved wax, cast solid, hand-finished. Shown on the board because it plays like a piece on the field.',
  },

  /* ─── ACCESSORIES (ruby) ─────────────────────────────────────── */
  {
    id: 'a-dice', slug: 'flight-tribe-dice', name: 'Flight Tribe Dice',
    category: 'accessories', spec: 'Pair · solid .925 · ruby-set pips', gem: 'ruby',
    metal: '.925 Sterling Silver', priceUSD: 1200,
    image: '/assets/products/dice-01-cut.png', focal: 'center center', cut: true,
    gallery: [
      '/assets/products/dice-01-cut.png',
      '/assets/products/dice-eye-cut.png',
    ],
    tag: 'Icon', popular: true, isDemo: true,
    hallmark: ['.925 STERLING', 'RUBY-SET', 'USA', '2026'],
    description:
      'A matched pair of solid sterling dice — every pip a set ruby, faces engraved with the eye sigil, crossed arrows and the FLIGHT · TRIBE stamp, edges struck .925 · USA · 2026. The object the whole language is drawn from.',
  },
  {
    id: 'a-pipe', slug: 'sterling-peace-pipe', name: 'Peace Pipe',
    category: 'accessories', spec: 'Hand-hammered solid sterling', gem: 'ruby',
    metal: '.925 Sterling Silver', priceUSD: 460,
    image: '/assets/products/peace-pipe.png', focal: 'center 52%',
    gallery: ['/assets/products/peace-pipe.png'],
    tag: 'Hand-hammered', popular: false, isDemo: true,
    hallmark: ['.925 STERLING', 'HAND-HAMMERED', 'USA'],
    description:
      'A pure-silver peace pipe, planished by hand so every hammer mark stays in the metal. Weighty, ceremonial, made to be kept. A secular object — carried, not worshipped.',
  },
]

export const productBySlug = (slug: string): Product | undefined =>
  products.find((p) => p.slug === slug)

export const productsByCategory = (id: CategoryId): Product[] =>
  products.filter((p) => p.category === id)

export const popularProducts = (): Product[] => products.filter((p) => p.popular)

/** the hero object for THE BENCH */
export const heroProduct = (): Product => products[0]
