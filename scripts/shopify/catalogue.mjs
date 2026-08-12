/* ═══════════════════════════════════════════════════════════════
   CATALOGUE SOURCE OF TRUTH
   Parses products/Flight_Tribe_Master_Product_Sheet - Master Catalog.csv
   into the canonical product model used by push.mjs and verify.mjs.

   Nothing here is invented. Every field below maps 1:1 to a CSV column, and
   anything the sheet states ambiguously is carried through VERBATIM as text
   rather than being guessed into a structured Shopify field:

     • "Variants / Variant Values" are free-form upgrade quotes
       ("24k -$15,000, -  22k,$14,300 …") with inconsistent separators and a
       price that is sometimes missing its $ — turning those into real
       Shopify variants would mean inventing option names and prices, so
       they are stored as metafield text for the client to confirm.
     • "Inventory" is numeric on most rows but reads "on bench" on one and is
       blank on another; numbers become real stock counts, the rest becomes a
       note.
     • "Product Weight" mixes a shipping weight with the material
       ("35.24 gram  .925 Silver and gemstones") — the leading number+unit is
       parsed as the weight, the whole string is kept as the material line.

   Rows that disagree with themselves (site price vs catalog price, image
   count vs listed images) abort the run rather than silently picking one.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '../..')
const CSV_PATH = resolve(
  REPO_ROOT,
  'products/Flight_Tribe_Master_Product_Sheet - Master Catalog.csv',
)

/** RFC-4180 CSV: quoted fields, embedded commas/newlines, "" escapes. */
function parseCsv(text) {
  const rows = []
  let row = []
  let field = ''
  let quoted = false
  let i = 0
  const src = text.replace(/^﻿/, '')

  while (i < src.length) {
    const c = src[i]
    if (quoted) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i += 2; continue }
        quoted = false; i++; continue
      }
      field += c; i++; continue
    }
    if (c === '"') { quoted = true; i++; continue }
    if (c === ',') { row.push(field); field = ''; i++; continue }
    if (c === '\r') { i++; continue }
    if (c === '\n') { row.push(field); rows.push(row); row = []; field = ''; i++; continue }
    field += c; i++
  }
  if (field !== '' || row.length) { row.push(field); rows.push(row) }
  return rows.filter((r) => r.some((v) => v.trim() !== ''))
}

const CATEGORY_ID = { Jewelry: 'jewelry', Accessories: 'accessories', Clothing: 'clothing' }

/** "1,800" / "$1,800" / "$9,250 " → 9250. Returns null for an empty cell. */
function money(raw) {
  const s = String(raw).replace(/[$,\s]/g, '')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) ? n : NaN
}

/** Shopify weight units the sheet actually uses. */
const WEIGHT_UNIT = {
  g: 'GRAMS', gram: 'GRAMS', grams: 'GRAMS',
  kg: 'KILOGRAMS',
  oz: 'OUNCES',
  lb: 'POUNDS', lbs: 'POUNDS',
}

/** "6.39grams 24k Gold" → { value: 6.39, unit: 'GRAMS' }; "on bench" → null. */
function parseWeight(raw) {
  const m = /^\s*([\d.]+)\s*(grams?|kg|g|lbs?|oz)\b/i.exec(raw)
  if (!m) return null
  const value = Number(m[1])
  const unit = WEIGHT_UNIT[m[2].toLowerCase()]
  if (!Number.isFinite(value) || value <= 0 || !unit) return null
  return { value, unit }
}

/** "na" / "Na" / "" all mean "this column is empty on this row". */
const meaningful = (s) => {
  const t = String(s).trim()
  return /^(na|n\/a|none)$/i.test(t) ? '' : t
}

/**
 * @returns {{sku:string,slug:string,name:string,category:string,categoryLabel:string,
 *            priceUSD:number,costUSD:number|null,tag:string,gender:string,
 *            collection:string,inventoryQty:number|null,inventoryNote:string,
 *            taxable:boolean,weight:{value:number,unit:string}|null,material:string,
 *            dimensions:string,upgradeOptions:string,upgradePricing:string,
 *            description:string,images:{file:string,url:string}[],notes:string[]}[]}
 */
export function loadCatalogue() {
  const rows = parseCsv(readFileSync(CSV_PATH, 'utf8'))
  const [header, ...body] = rows
  const col = (name) => {
    const idx = header.findIndex((h) => h.trim() === name)
    if (idx === -1) throw new Error(`CSV is missing the "${name}" column`)
    return idx
  }
  const C = {
    sku: col('Product SKU'),
    name: col('Product Name'),
    category: col('Category'),
    slug: col('Slug (/product/...)'),
    priceSite: col('Price (Site, INR/num)'),
    priceCatalog: col('Price (Catalog, as listed)'),
    cost: col('Cost (Optional)'),
    tag: col('Tag'),
    gender: col('Gender'),
    collection: col('Collection'),
    inventory: col('Inventory'),
    taxable: col('Taxable?'),
    weight: col('Product Weight'),
    height: col('Product Height'),
    variants: col('Variants (If Any Exist)'),
    variantValues: col('Variant Values (If Variants Exist)'),
    description: col('Product Description'),
    imageCount: col('Image Count'),
    img1File: col('Image 1 File'),
    img1Url: col('Image 1 Website URL'),
    img2File: col('Image 2 File'),
    img2Url: col('Image 2 Website URL'),
    notes: col('Notes / Flags'),
  }

  const seen = new Set()

  return body.map((r, n) => {
    const line = n + 2 // 1-indexed, +1 for the header
    const at = (i) => (r[i] ?? '').trim()

    const slug = at(C.slug)
    const name = at(C.name)
    const categoryLabel = at(C.category)
    if (!slug) throw new Error(`CSV line ${line}: empty slug`)
    if (seen.has(slug)) throw new Error(`CSV line ${line}: duplicate slug "${slug}"`)
    seen.add(slug)
    if (!name) throw new Error(`CSV line ${line}: empty Product Name`)

    const category = CATEGORY_ID[categoryLabel]
    if (!category) throw new Error(`CSV line ${line}: unknown Category "${categoryLabel}"`)

    // Accuracy guard: the sheet carries the price twice — they must agree.
    const priceUSD = money(at(C.priceSite))
    const priceCatalog = money(at(C.priceCatalog))
    if (!Number.isFinite(priceUSD) || priceUSD <= 0) {
      throw new Error(`CSV line ${line}: bad price "${at(C.priceSite)}"`)
    }
    if (priceCatalog !== null && priceCatalog !== priceUSD) {
      throw new Error(
        `CSV line ${line} (${slug}): "Price (Site)" ${priceUSD} disagrees with ` +
        `"Price (Catalog, as listed)" ${priceCatalog}. Fix the sheet; refusing to guess.`,
      )
    }

    const costUSD = money(at(C.cost))
    if (Number.isNaN(costUSD)) throw new Error(`CSV line ${line}: bad Cost "${at(C.cost)}"`)

    const inventoryRaw = at(C.inventory)
    const inventoryQty = /^\d+$/.test(inventoryRaw) ? Number(inventoryRaw) : null
    const inventoryNote = inventoryQty === null ? inventoryRaw : ''

    const weightRaw = at(C.weight)
    const taxableRaw = at(C.taxable)

    const images = []
    for (const [f, u] of [[C.img1File, C.img1Url], [C.img2File, C.img2Url]]) {
      const file = at(f)
      const url = at(u)
      if (!file && !url) continue
      if (!file || !url) throw new Error(`CSV line ${line}: image row has a file or URL but not both`)
      if (!/^https:\/\//.test(url)) throw new Error(`CSV line ${line}: bad image URL "${url}"`)
      if (images.some((im) => im.url === url)) throw new Error(`CSV line ${line}: duplicate image ${file}`)
      images.push({ file, url })
    }
    if (!images.length) throw new Error(`CSV line ${line}: no images`)

    // Accuracy guard: the sheet's own Image Count must match what it lists.
    const declared = Number(at(C.imageCount))
    if (Number.isFinite(declared) && declared !== images.length) {
      throw new Error(
        `CSV line ${line} (${slug}): Image Count says ${declared} but ${images.length} image(s) are listed.`,
      )
    }

    const note = at(C.notes)

    return {
      sku: at(C.sku),
      slug,
      name,
      category,
      categoryLabel,
      priceUSD,
      costUSD,
      tag: at(C.tag),
      // "unisex" / "Unisex" appear on different rows — same value, one casing.
      gender: at(C.gender).replace(/^./, (c) => c.toUpperCase()),
      collection: at(C.collection),
      inventoryQty,
      inventoryNote,
      // The sheet writes "yes"/"Yes"; a blank cell is not a "no", so these
      // pieces keep Shopify's default (taxable) rather than being un-taxed.
      taxable: taxableRaw === '' ? true : /^y(es)?$/i.test(taxableRaw),
      taxableStated: taxableRaw !== '',
      weight: parseWeight(weightRaw),
      material: weightRaw,
      dimensions: at(C.height),
      upgradeOptions: meaningful(at(C.variants)),
      upgradePricing: meaningful(at(C.variantValues)),
      description: at(C.description),
      images,
      notes: note ? [note] : [],
    }
  })
}

const escapeHtml = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** The sheet's copy verbatim as Shopify body HTML: blank lines become
 *  paragraphs, single newlines become <br>. No word is added, removed or
 *  reordered. Shared by push.mjs (writes it) and verify.mjs (diffs it). */
export function descriptionHtml(text) {
  return String(text)
    .split(/\n\s*\n/)
    .map((para) => para.trim())
    .filter(Boolean)
    .map((para) => `<p>${escapeHtml(para).replace(/\n/g, '<br>')}</p>`)
    .join('\n')
}

/** Category order + copy for the storefront. Labels come from the CSV. */
export const CATEGORY_ORDER = ['jewelry', 'accessories', 'clothing']

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const cat = loadCatalogue()
  console.log(`${cat.length} products, ${cat.reduce((n, p) => n + p.images.length, 0)} images\n`)
  for (const p of cat) {
    console.log(`  ${p.categoryLabel.padEnd(12)} ${p.name}`)
    console.log(`  ${''.padEnd(12)} $${p.priceUSD}  ·  ${p.tag}  ·  /${p.slug}  ·  SKU ${p.sku}`)
    console.log(`  ${''.padEnd(12)} cost ${p.costUSD === null ? '—' : '$' + p.costUSD}  ·  ` +
      `${p.gender}  ·  stock ${p.inventoryQty ?? (p.inventoryNote || '—')}  ·  ` +
      `weight ${p.weight ? `${p.weight.value} ${p.weight.unit}` : '—'}  ·  taxable ${p.taxable}`)
    if (p.dimensions) console.log(`  ${''.padEnd(12)} dims ${p.dimensions}`)
    if (p.upgradeOptions) console.log(`  ${''.padEnd(12)} upgrades ${p.upgradeOptions}  →  ${p.upgradePricing}`)
    console.log(`  ${''.padEnd(12)} description ${p.description.length} chars`)
    for (const im of p.images) console.log(`  ${''.padEnd(12)}   ${im.file}`)
    console.log()
  }
  const noDesc = cat.filter((p) => !p.description)
  if (noDesc.length) console.log(`! no description on: ${noDesc.map((p) => p.slug).join(', ')}`)
}
