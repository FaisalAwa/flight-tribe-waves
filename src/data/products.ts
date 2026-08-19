/* ═══════════════════════════════════════════════════════════════
   CATALOGUE — FLIGHT TRIBE
   GENERATED FILE — do not edit by hand.
     source : flighttribeusa.myshopify.com (Shopify, Admin API 2026-07)
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

export interface ProductVariant {
  /** gid://shopify/ProductVariant/… — what checkout actually buys */
  id: string
  /** the option value, e.g. '.925 Silver' or '24k Gold' */
  label: string
  priceUSD: number
  availableForSale: boolean
}

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
  /** what the buy options are called ("Material") — absent on one-option pieces */
  optionName?: string
  /** real Shopify variants, base first. Empty when the piece has only one. */
  variants: ProductVariant[]
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
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/tree-of-life-01.png?v=1787080104',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/tree-of-life-01.png?v=1787080104',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/tree-of-life-02.png?v=1787080104',
    ],
    dimensions: '23/32 inch H 22/32 W',
    description: 'Crafted from solid 24k gold, the Flight Tribe Tree of Life Pendant is inspired by one of humanity\'s oldest and most enduring symbols. Across civilizations, the Tree of Life has been revered as the bridge between earth and sky, the seen and the unseen, the roots of the past and the paths yet to be traveled. Precision crafted and polished to a radiant finish, each pendant is a timeless artifact created for those drawn to mystery, legacy, and the pursuit of something greater.',
    variants: [],
    variantId: 'gid://shopify/ProductVariant/47919022145667',
    productId: 'gid://shopify/Product/9234060312707',
    availableForSale: true,
  },
  {
    id: 'arrowhead-pendant', slug: 'arrowhead-pendant', name: 'Heavy Solid Silver Arrowhead Pendant',
    category: 'jewelry', gem: 'amethyst', priceUSD: 500,
    tag: 'Hand-forged',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/arrowhead-01.png?v=1787080103',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/arrowhead-01.png?v=1787080103',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/arrowhead-02.png?v=1787080103',
    ],
    dimensions: 'H 3 31/32 inch  L 1 1/8 inch    W 1/8 inch',
    description: 'Crafted from solid .925 sterling silver, the Flight Tribe Heavy Arrowhead Pendant is forged as a symbol of instinct, direction, and the courage to move forward. Since ancient times, the arrowhead has represented the hunter, the protector, and the traveler those who trusted their path when none existed. Precision crafted with a substantial weight and mirror-polished finish, each pendant is a timeless artifact for those who carve their own course and never look back.',
    optionName: 'Material',
    variants: [
      { id: 'gid://shopify/ProductVariant/47919021752451', label: '.925 Silver', priceUSD: 500, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919021785219', label: '18k Gold', priceUSD: 11111, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919021817987', label: '22k Gold', priceUSD: 14300, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919021850755', label: '24k Gold', priceUSD: 15000, availableForSale: true },
    ],
    variantId: 'gid://shopify/ProductVariant/47919021752451',
    productId: 'gid://shopify/Product/9234060247171',
    availableForSale: true,
  },
  {
    id: 'pilot-pin', slug: 'pilot-pin', name: 'Flight Tribe Pilot Pin',
    category: 'jewelry', gem: 'amethyst', priceUSD: 500,
    tag: 'Wings',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/pilot-pin-01.png?v=1787080100',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/pilot-pin-01.png?v=1787080100',
    ],
    description: 'Crafted from solid .925 sterling silver, the Flight Tribe Eagle Pilot Pin is inspired by the eagle an enduring guardian of the skies and a messenger between earth and the heavens in many cultural traditions. Worn as a symbol of vision, freedom, and fearless ascent, it honors those who trust their instincts and follow the call beyond the horizon. Precision crafted and mirror polished, each pin is a modern talisman for those born to fly their own path.',
    variants: [],
    variantId: 'gid://shopify/ProductVariant/47919021457539',
    productId: 'gid://shopify/Product/9234060181635',
    availableForSale: true,
  },
  {
    id: 'winged-heart-pendant', slug: 'winged-heart-pendant', name: 'Winged Heart Pendant',
    category: 'jewelry', gem: 'amethyst', priceUSD: 2500,
    tag: 'Signature',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/heart-01.png?v=1787080100',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/heart-01.png?v=1787080100',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/heart-02.png?v=1787080100',
    ],
    description: 'Crafted from solid .925 sterling silver, the Flight Tribe Winged Heart Pendant features a brilliant center gemstone embraced by soaring wings. A symbol of love in motion, it represents hearts that refuse to be grounded love that crosses oceans, survives distance, and rises above every obstacle. Precision-crafted and mirror polished, each pendant is a modern talisman for kindred spirits, fearless hearts, and those who believe the greatest journey is the one shared with another. Available with premium lab-grown or natural gemstones upon request.',
    variants: [],
    variantId: 'gid://shopify/ProductVariant/47919021162627',
    productId: 'gid://shopify/Product/9234060116099',
    availableForSale: true,
  },
  {
    id: 'liberty-250th-dice', slug: 'liberty-250th-dice', name: 'Flight Tribe 250th Liberty Gemstone Artifact Dice',
    category: 'accessories', gem: 'ruby', priceUSD: 2500,
    tag: 'Limited · 250th',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/liberty-dice-01.png?v=1787080097',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/liberty-dice-01.png?v=1787080097',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/liberty-dice-02.png?v=1787080097',
    ],
    dimensions: '7/16 inch HxW',
    description: 'Crafted from solid .925 sterling silver, the Flight Tribe Liberty 250™ Artifact Dice feature hand-set with lab red rubies, lab white diamonds, and lab blue sapphires to honor the colors of the American flag and celebrate 250 years of American independence. Precision crafted and mirror polished, each collectible is a timeless symbol of freedom, craftsmanship, and adventure. Available with premium lab grown gemstones or natural gemstones upon request.',
    optionName: 'Material',
    variants: [
      { id: 'gid://shopify/ProductVariant/47919020769411', label: '.925 Silver and gemstones', priceUSD: 2500, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020802179', label: '18k Gold', priceUSD: 10000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020834947', label: '22k Gold', priceUSD: 12000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020867715', label: '24k Gold', priceUSD: 14000, availableForSale: true },
    ],
    variantId: 'gid://shopify/ProductVariant/47919020769411',
    productId: 'gid://shopify/Product/9234060050563',
    availableForSale: true,
  },
  {
    id: 'ruby-relic-dice', slug: 'ruby-relic-dice', name: 'Flight Tribe Ruby Relic Dice',
    category: 'accessories', gem: 'ruby', priceUSD: 2000,
    tag: 'Icon · hero product',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/ruby-dice-01.png?v=1787080096',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/ruby-dice-01.png?v=1787080096',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/ruby-dice-02.png?v=1787080096',
    ],
    dimensions: '7/16 inch HxW',
    description: 'Crafted from solid .925 sterling silver, the Flight Tribe Red Ruby Relic Dice Collection is hand-set with vibrant lab grown red rubies, long revered as gemstones of passion, courage, vitality, and protection. Throughout history, rubies have been treasured by kings, warriors, and travelers as symbols of strength and fearless ambition. Precision crafted and mirror polished, each collectible is a timeless statement of luxury, craftsmanship, and individuality. Available with premium lab grown rubies as standard, or natural rubies upon request.',
    optionName: 'Material',
    variants: [
      { id: 'gid://shopify/ProductVariant/47919020376195', label: '.925 Silver and gemstones', priceUSD: 2000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020408963', label: '18k Gold', priceUSD: 10000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020441731', label: '22k Gold', priceUSD: 12000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020474499', label: '24k Gold', priceUSD: 14000, availableForSale: true },
    ],
    variantId: 'gid://shopify/ProductVariant/47919020376195',
    productId: 'gid://shopify/Product/9234059985027',
    availableForSale: true,
  },
  {
    id: 'iceman-sapphire-dice', slug: 'iceman-sapphire-dice', name: 'IceMan US Mined Montana Blue Sapphire Artifact Dice',
    category: 'accessories', gem: 'ruby', priceUSD: 6000,
    tag: 'Rare',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/bundle-01-new.png?v=1787080093',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/bundle-01-new.png?v=1787080093',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/bundle-02-new.png?v=1787080094',
    ],
    dimensions: '7/16 inch HxW',
    description: 'Crafted from solid .925 sterling silver, the Flight Tribe IceMan U.S. Mined Montana Blue Sapphire Artifact Dice Collection is hand-set with authentic Montana blue sapphires, responsibly sourced from the rugged landscapes of Big Sky Country. Forged beneath endless skies and shaped by the untamed American West, these rare sapphires embody clarity, resilience, freedom, and the courage to forge your own path. Their naturally shifting shades of blue reflect the mountain lakes and open skies that inspired generations of explorers and aviators. Precision crafted and mirror polished, each collectible is a timeless expression of luxury, heritage, and the Flight Tribe spirit of adventure.',
    optionName: 'Material',
    variants: [
      { id: 'gid://shopify/ProductVariant/47919019982979', label: '.925 Silver and gemstones', priceUSD: 6000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020015747', label: '18k Gold', priceUSD: 10000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020048515', label: '22k Gold', priceUSD: 12000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919020081283', label: '24k Gold', priceUSD: 14000, availableForSale: true },
    ],
    variantId: 'gid://shopify/ProductVariant/47919019982979',
    productId: 'gid://shopify/Product/9234059919491',
    availableForSale: true,
  },
  {
    id: 'artifact-dice-collection', slug: 'artifact-dice-collection', name: 'The Flight Tribe Artifact Dice Collection',
    category: 'accessories', gem: 'ruby', priceUSD: 9250,
    tag: 'Collector Set',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/bundle-01_20371868-1eed-473e-b522-e9c7d50380ba.png?v=1787080093',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/bundle-01_20371868-1eed-473e-b522-e9c7d50380ba.png?v=1787080093',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/bundle-02_3d398916-6d7b-4294-92e5-d7d3bef480c5.png?v=1787080093',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/dice-cash-color.jpg?v=1787128225',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/dice-cash-bw.jpg?v=1787128225',
    ],
    dimensions: '7/16 inch HxW',
    description: 'The Flight Tribe Artifact Dice Collection\n\nThe Flight Tribe Artifact Dice Collection brings together three signature relics, each forged from solid .925 sterling silver and inspired by a different path of the journey. From the patriotic spirit of the Liberty 250™ Gemstone Artifact Dice, to the legendary power of the Ruby Relic Dice, and the untamed frontier captured in the IceMan U.S. Mined Montana Blue Sapphire Artifact Dice, every piece is crafted as a modern heirloom.\n\nAcross cultures, dice have symbolized fate, destiny, and the unknown reminders that every journey begins with a single choice. Hand-finished and created in limited numbers, each Artifact Die is more than a collectible; it is a talisman for those who trust instinct, embrace adventure, and forge their own path.',
    variants: [],
    variantId: 'gid://shopify/ProductVariant/47919019688067',
    productId: 'gid://shopify/Product/9234059853955',
    availableForSale: true,
  },
  {
    id: 'paperweight-pipe', slug: 'paperweight-pipe', name: 'Solid Silver Paper Weight Pipe',
    category: 'accessories', gem: 'ruby', priceUSD: 2500,
    tag: 'Hand-hammered',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/pipe-01.png?v=1787080092',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/pipe-01.png?v=1787080092',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/pipe-02.png?v=1787080091',
    ],
    dimensions: 'H 1 6/32 inch L 3 1/2 inch W 1/2 inch',
    description: 'Crafted from solid .925 sterling silver, the Flight Tribe Heavy Paperweight Pipe is inspired by ancient ceremonies where smoke carried prayers, intentions, and stories into the unseen. Precision machined with a substantial weight and mirror-polished finish, each piece is a modern relic created for those who walk their own path and honor the spirit of the journey.',
    optionName: 'Material',
    variants: [
      { id: 'gid://shopify/ProductVariant/47919019196547', label: '.925 Silver', priceUSD: 2500, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919019229315', label: '22k Gold', priceUSD: 18000, availableForSale: true },
      { id: 'gid://shopify/ProductVariant/47919019262083', label: '24k Gold', priceUSD: 20000, availableForSale: true },
    ],
    variantId: 'gid://shopify/ProductVariant/47919019196547',
    productId: 'gid://shopify/Product/9234059755651',
    availableForSale: true,
  },
  {
    id: 'hemp-bandana', slug: 'hemp-bandana', name: 'Flight Tribe 100% Hemp Bandana',
    category: 'clothing', gem: 'emerald', priceUSD: 888,
    tag: 'Bulk order only',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/hemp-01.png?v=1787080089',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/hemp-01.png?v=1787080089',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/hemp-02.png?v=1787080088',
    ],
    dimensions: '22 inches × 22 inches',
    description: 'Constructed from 100% premium Hemp fabric in Qingdao, China, at a GOTS-certified facility, delivering a clean, sustainable finish with a distinctly luxurious feel.',
    variants: [],
    variantId: 'gid://shopify/ProductVariant/47919018901635',
    productId: 'gid://shopify/Product/9234059690115',
    availableForSale: true,
  },
  {
    id: 'silk-bandana', slug: 'silk-bandana', name: 'Flight Tribe 100% Mulberry Silk Bandana',
    category: 'clothing', gem: 'emerald', priceUSD: 88,
    tag: 'Bulk order only',
    focal: 'center center',
    image: 'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/silk-01.jpg?v=1787080087',
    gallery: [
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/silk-01.jpg?v=1787080087',
      'https://cdn.shopify.com/s/files/1/0710/0049/0115/files/silk-02.png?v=1787080087',
    ],
    dimensions: '22 inches × 22 inches',
    description: 'Crafted from 100% premium Mulberry silk satin, expertly woven in China, this piece offers an exceptionally smooth feel, natural breathability, and a luminous finish. Renowned as the finest silk in the world, Mulberry silk is prized for its remarkable softness, durability, and timeless elegance, delivering luxury that feels as extraordinary as it looks.',
    variants: [],
    variantId: 'gid://shopify/ProductVariant/47919018868867',
    productId: 'gid://shopify/Product/9234059657347',
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
