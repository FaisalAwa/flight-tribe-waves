/* ═══════════════════════════════════════════════════════════════
   VERIFY — Shopify ⇄ CSV
   Reads every product back out of Shopify and diffs it field by field
   against the master sheet: title, description, price, SKU, cost, taxable,
   weight, stock, tags, type, vendor, status, collection, the `flight_tribe.*`
   metafields, and the image set (count, order, and pixel dimensions against
   the source files). Exits non-zero on any mismatch, so it can gate a deploy.
   ═══════════════════════════════════════════════════════════════ */

import { readFileSync } from 'node:fs'
import { loadCatalogue, descriptionHtml } from './catalogue.mjs'
import { Admin } from './client.mjs'

const READ = `query read($q: String!) {
  products(first: 1, query: $q) {
    nodes {
      id handle title status productType vendor tags publishedAt onlineStoreUrl
      description descriptionHtml
      options { id name optionValues { id name } }
      variants(first: 30) { nodes { id title price sku taxable availableForSale inventoryPolicy
        inventoryQuantity selectedOptions { name value }
        inventoryItem { id tracked unitCost { amount }
                        measurement { weight { value unit } } } } }
      media(first: 50) { nodes { id alt status
        ... on MediaImage { image { url width height } } } }
      collections(first: 20) { nodes { title } }
      metafields(first: 25, namespace: "flight_tribe") { nodes { key value } }
    }
  }
}`

/** Whitespace-insensitive comparison: Shopify normalises line breaks and runs
 *  of spaces when it stores the HTML, so compare the words, not the padding. */
const norm = (s) => String(s ?? '')
  .replace(/ /g, ' ')
  .split(/\n/)
  .map((l) => l.replace(/\s+/g, ' ').trim())
  .filter(Boolean)
  .join('\n')
  .trim()

/** Pixel dimensions of the source PNG/JPEG, read from the header bytes only.
 *  Prefers the copy in this checkout: a photo swapped in since the last deploy
 *  is not at its website URL yet, and the site answers unknown paths with
 *  index.html, which would read as "dimensions unknown" and skip the check. */
async function sourceDimensions(im) {
  const buf = im.localPath
    ? readFileSync(im.localPath).subarray(0, 65536)
    : Buffer.from(await (await fetch(im.url, { headers: { Range: 'bytes=0-65535' } })).arrayBuffer())
  if (buf[0] === 0x89 && buf[1] === 0x50) {
    return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) }
  }
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    let o = 2
    while (o < buf.length - 9) {
      if (buf[o] !== 0xff) { o++; continue }
      const marker = buf[o + 1]
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
        return { h: buf.readUInt16BE(o + 5), w: buf.readUInt16BE(o + 7) }
      }
      o += 2 + buf.readUInt16BE(o + 2)
    }
  }
  return null
}

const admin = await Admin.connect()
const catalogue = loadCatalogue()
const problems = []
let unpublished = 0

console.log(`\nVerifying ${catalogue.length} products against the master sheet\n`)

for (const p of catalogue) {
  const data = await admin.gql(READ, { q: `handle:${p.slug}` })
  const sp = data.products.nodes.find((n) => n.handle === p.slug)
  const fail = (msg) => problems.push(`${p.slug}: ${msg}`)

  if (!sp) { fail('not found in Shopify'); console.log(`  ✗ ${p.slug} — missing`); continue }

  if (sp.title !== p.name) fail(`title "${sp.title}" ≠ sheet "${p.name}"`)
  if (sp.productType !== p.categoryLabel) fail(`type "${sp.productType}" ≠ sheet "${p.categoryLabel}"`)
  if (sp.status !== 'ACTIVE') fail(`status is ${sp.status}, expected ACTIVE`)
  for (const t of [p.tag, p.categoryLabel, p.gender].filter(Boolean)) {
    if (!sp.tags.includes(t)) fail(`missing tag "${t}" (has: ${sp.tags.join(', ')})`)
  }

  // ── description ────────────────────────────────────────────────
  // Compared as body HTML, not as Shopify's flattened plain text: that way a
  // lost paragraph break is a failure, not something the diff smooths over.
  if (!norm(sp.description)) {
    fail('description is empty in Shopify')
  } else {
    const want = norm(descriptionHtml(p.description))
    const got = norm(sp.descriptionHtml)
    if (want !== got) {
      const at = [...want].findIndex((c, i) => c !== got[i])
      fail(`description differs from the sheet at char ${at}: sheet "…${want.slice(Math.max(0, at - 40), at + 40)}…" ` +
           `vs Shopify "…${got.slice(Math.max(0, at - 40), at + 40)}…"`)
    }
  }

  // ── variants ───────────────────────────────────────────────────
  // A piece with priced gold upgrades carries one variant per option value;
  // everything else stays single-variant. Either way the set must be exactly
  // what the sheet describes — no extra option value, no missing upgrade.
  const variants = sp.variants.nodes
  const wantVariants = p.variants.length
    ? p.variants
    : [{ label: null, priceUSD: p.priceUSD, sku: p.sku || p.slug, base: true }]

  if (variants.length !== wantVariants.length) {
    fail(`${variants.length} variants (${variants.map((x) => x.title).join(', ')}), sheet describes ${wantVariants.length}`)
  }
  if (p.variants.length && sp.options[0]?.name !== p.optionName) {
    fail(`option is named "${sp.options[0]?.name}", expected "${p.optionName}"`)
  }

  const byLabel = new Map(variants.map((x) => [x.selectedOptions[0]?.value ?? x.title, x]))
  for (const want of wantVariants) {
    const got = want.label ? byLabel.get(want.label) : variants[0]
    if (!got) { fail(`no variant for "${want.label}"`); continue }
    if (Number(got.price) !== want.priceUSD) {
      fail(`${want.label ?? 'price'}: $${Number(got.price)} ≠ sheet $${want.priceUSD}`)
    }
    const wantSku = want.sku || (want.base ? p.slug : `${p.slug}-${want.label}`)
    if (got.sku !== wantSku) fail(`${want.label ?? 'SKU'}: SKU "${got.sku}" ≠ sheet "${wantSku}"`)
    if (got.taxable !== p.taxable) fail(`${want.label ?? 'taxable'}: taxable ${got.taxable} ≠ sheet ${p.taxable}`)
  }

  // The physical-piece numbers (cost, weight, stock) belong to the base
  // variant only — a gold upgrade's cost and weight are not in the sheet.
  const v = p.variants.length ? byLabel.get(p.variants[0].label) : variants[0]

  const cost = v?.inventoryItem?.unitCost?.amount
  if (p.costUSD === null) {
    if (cost != null && Number(cost) !== 0) fail(`cost $${cost} is set but the sheet leaves it blank`)
  } else if (Number(cost) !== p.costUSD) {
    fail(`cost $${cost ?? '—'} ≠ sheet $${p.costUSD}`)
  }

  const w = v?.inventoryItem?.measurement?.weight
  if (p.weight) {
    if (!w || Number(w.value) !== p.weight.value || w.unit !== p.weight.unit) {
      fail(`weight ${w ? `${w.value} ${w.unit}` : '—'} ≠ sheet ${p.weight.value} ${p.weight.unit}`)
    }
  }

  if (p.inventoryQty !== null) {
    if (!v?.inventoryItem?.tracked) fail(`stock is untracked but the sheet says ${p.inventoryQty}`)
    else if (v.inventoryQuantity !== p.inventoryQty) {
      fail(`stock ${v.inventoryQuantity} ≠ sheet ${p.inventoryQty}`)
    }
  }

  // ── collection + metafields ────────────────────────────────────
  if (p.collection && !sp.collections.nodes.some((c) => c.title === p.collection)) {
    fail(`not in collection "${p.collection}"`)
  }
  const mf = new Map(sp.metafields.nodes.map((m) => [m.key, m.value]))
  for (const [key, want] of [
    ['material', p.material],
    ['dimensions', p.dimensions],
    ['upgrade_options', p.upgradeOptions],
    ['upgrade_pricing', p.upgradePricing],
    ['inventory_note', p.inventoryNote],
  ]) {
    if (!want) continue
    if (norm(mf.get(key)) !== norm(want)) fail(`metafield ${key} "${mf.get(key) ?? '—'}" ≠ sheet "${want}"`)
  }

  // ── images ─────────────────────────────────────────────────────
  const media = sp.media.nodes
  if (media.length !== p.images.length) {
    fail(`${media.length} images, sheet lists ${p.images.length}`)
  }
  for (const [i, im] of p.images.entries()) {
    const m = media[i]
    if (!m) { fail(`image slot ${i + 1} (${im.file}) is empty`); continue }
    if (m.alt !== im.file) fail(`image ${i + 1} is "${m.alt}", sheet says "${im.file}"`)
    if (m.status !== 'READY') fail(`image ${im.file} status ${m.status}`)
    if (!m.image?.url) { fail(`image ${im.file} has no CDN url`); continue }
    const src = await sourceDimensions(im)
    if (src && (src.w !== m.image.width || src.h !== m.image.height)) {
      fail(`image ${im.file} is ${m.image.width}×${m.image.height} on Shopify but ${src.w}×${src.h} at source`)
    }
  }

  if (!sp.publishedAt) unpublished++

  const ok = !problems.some((x) => x.startsWith(`${p.slug}:`))
  console.log(
    `  ${ok ? '✓' : '✗'} ${p.slug.padEnd(26)} $${String(p.priceUSD).padEnd(5)} ` +
    `${String(media.length)} img  ${String(norm(sp.description).length).padStart(4)} chars copy  ` +
    `${String(variants.length)} var  ${sp.publishedAt ? 'published' : 'NOT PUBLISHED'}`,
  )
  if (p.unpricedKarats.length) {
    console.log(`      ! ${p.unpricedKarats.map((k) => `${k}k`).join(', ')} offered in the sheet with no price — no variant`)
  }
}

console.log()
if (unpublished) {
  console.log(`! ${unpublished}/${catalogue.length} products are not published to any sales channel.`)
  console.log(`  The Storefront API cannot see unpublished products, so the site will show nothing.\n`)
}
if (problems.length) {
  console.log(`${problems.length} problem(s):`)
  for (const x of problems) console.log(`  • ${x}`)
  process.exit(1)
}
console.log(`All ${catalogue.length} products match the master sheet exactly.`)
process.exit(unpublished ? 2 : 0)
