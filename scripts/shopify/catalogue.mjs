/* ═══════════════════════════════════════════════════════════════
   CATALOGUE SOURCE OF TRUTH
   Parses products/Flight-Tribe-Product-Image-Audit … .csv into the
   canonical product model used by push.mjs and generate-frontend.mjs.

   Nothing here is invented. Every field below maps 1:1 to a CSV column;
   rows that disagree with each other about a product abort the run rather
   than silently picking a winner.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { dirname, resolve } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))
export const REPO_ROOT = resolve(HERE, '../..')
const CSV_PATH = resolve(
  REPO_ROOT,
  'products/Flight-Tribe-Product-Image-Audit (1) - Product-Image Map.csv',
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

/**
 * @returns {{slug:string,name:string,category:string,categoryLabel:string,
 *            priceUSD:number,tag:string,images:{file:string,url:string}[],
 *            notes:string[]}[]}
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
    category: col('Category'),
    name: col('Product Name'),
    slug: col('Slug (/product/...)'),
    price: col('Price'),
    tag: col('Tag'),
    imageFile: col('Image File'),
    url: col('Website Path'),
    notes: col('Notes'),
  }

  /** @type {Map<string, any>} */
  const bySlug = new Map()

  body.forEach((r, n) => {
    const line = n + 2 // 1-indexed, +1 for the header
    const slug = r[C.slug].trim()
    const name = r[C.name].trim()
    const categoryLabel = r[C.category].trim()
    const priceRaw = r[C.price].trim()
    const tag = r[C.tag].trim()
    const file = r[C.imageFile].trim()
    const url = r[C.url].trim()
    const note = r[C.notes].trim()

    if (!slug) throw new Error(`CSV line ${line}: empty slug`)
    const category = CATEGORY_ID[categoryLabel]
    if (!category) throw new Error(`CSV line ${line}: unknown Category "${categoryLabel}"`)
    const priceUSD = Number(priceRaw)
    if (!Number.isFinite(priceUSD) || priceUSD <= 0) {
      throw new Error(`CSV line ${line}: bad Price "${priceRaw}"`)
    }
    if (!/^https:\/\//.test(url)) throw new Error(`CSV line ${line}: bad Website Path "${url}"`)

    const existing = bySlug.get(slug)
    if (!existing) {
      bySlug.set(slug, {
        slug, name, category, categoryLabel, priceUSD, tag,
        images: [{ file, url }],
        notes: note ? [note] : [],
      })
      return
    }
    // Accuracy guard: every row for a slug must agree on the product-level fields.
    for (const [field, a, b] of [
      ['Product Name', existing.name, name],
      ['Category', existing.categoryLabel, categoryLabel],
      ['Price', String(existing.priceUSD), String(priceUSD)],
      ['Tag', existing.tag, tag],
    ]) {
      if (a !== b) {
        throw new Error(
          `CSV line ${line}: conflicting ${field} for slug "${slug}" — "${a}" vs "${b}". ` +
          `Fix the sheet; refusing to guess.`,
        )
      }
    }
    if (existing.images.some((im) => im.url === url)) {
      throw new Error(`CSV line ${line}: duplicate image ${file} on "${slug}"`)
    }
    existing.images.push({ file, url })
    if (note) existing.notes.push(note)
  })

  return [...bySlug.values()]
}

/** Category order + copy for the storefront. Labels come from the CSV. */
export const CATEGORY_ORDER = ['jewelry', 'accessories', 'clothing']

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href
if (isMain) {
  const cat = loadCatalogue()
  console.log(`${cat.length} products, ${cat.reduce((n, p) => n + p.images.length, 0)} images\n`)
  for (const p of cat) {
    console.log(`  ${p.categoryLabel.padEnd(12)} ${p.name}`)
    console.log(`  ${''.padEnd(12)} $${p.priceUSD}  ·  ${p.tag}  ·  /${p.slug}`)
    for (const im of p.images) console.log(`  ${''.padEnd(12)}   ${im.file}`)
    console.log()
  }
}
