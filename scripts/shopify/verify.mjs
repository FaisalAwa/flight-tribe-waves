/* ═══════════════════════════════════════════════════════════════
   VERIFY — Shopify ⇄ CSV
   Reads every product back out of Shopify and diffs it field by field
   against the audit CSV: title, price, tags, type, vendor, status, and the
   image set (count, order, and pixel dimensions against the source files).
   Exits non-zero on any mismatch, so it can gate a deploy.
   ═══════════════════════════════════════════════════════════════ */

import { loadCatalogue } from './catalogue.mjs'
import { Admin } from './client.mjs'

const READ = `query read($q: String!) {
  products(first: 1, query: $q) {
    nodes {
      id handle title status productType vendor tags publishedAt onlineStoreUrl
      variants(first: 5) { nodes { id price sku availableForSale inventoryPolicy } }
      media(first: 50) { nodes { id alt status
        ... on MediaImage { image { url width height } } } }
    }
  }
}`

/** Pixel dimensions of a remote PNG/JPEG, read from the header bytes only. */
async function sourceDimensions(url) {
  const res = await fetch(url, { headers: { Range: 'bytes=0-65535' } })
  const buf = Buffer.from(await res.arrayBuffer())
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

console.log(`\nVerifying ${catalogue.length} products against the CSV\n`)

for (const p of catalogue) {
  const data = await admin.gql(READ, { q: `handle:${p.slug}` })
  const sp = data.products.nodes.find((n) => n.handle === p.slug)
  const fail = (msg) => problems.push(`${p.slug}: ${msg}`)

  if (!sp) { fail('not found in Shopify'); console.log(`  ✗ ${p.slug} — missing`); continue }

  if (sp.title !== p.name) fail(`title "${sp.title}" ≠ CSV "${p.name}"`)
  if (sp.productType !== p.categoryLabel) fail(`type "${sp.productType}" ≠ CSV "${p.categoryLabel}"`)
  if (sp.status !== 'ACTIVE') fail(`status is ${sp.status}, expected ACTIVE`)
  for (const t of [p.tag, p.categoryLabel]) {
    if (!sp.tags.includes(t)) fail(`missing tag "${t}" (has: ${sp.tags.join(', ')})`)
  }

  const variants = sp.variants.nodes
  if (variants.length !== 1) fail(`${variants.length} variants, expected 1`)
  const price = Number(variants[0]?.price)
  if (price !== p.priceUSD) fail(`price $${price} ≠ CSV $${p.priceUSD}`)

  const media = sp.media.nodes
  if (media.length !== p.images.length) {
    fail(`${media.length} images, CSV lists ${p.images.length}`)
  }
  for (const [i, im] of p.images.entries()) {
    const m = media[i]
    if (!m) { fail(`image slot ${i + 1} (${im.file}) is empty`); continue }
    if (m.alt !== im.file) fail(`image ${i + 1} is "${m.alt}", CSV says "${im.file}"`)
    if (m.status !== 'READY') fail(`image ${im.file} status ${m.status}`)
    if (!m.image?.url) { fail(`image ${im.file} has no CDN url`); continue }
    const src = await sourceDimensions(im.url)
    if (src && (src.w !== m.image.width || src.h !== m.image.height)) {
      fail(`image ${im.file} is ${m.image.width}×${m.image.height} on Shopify but ${src.w}×${src.h} at source`)
    }
  }

  if (!sp.publishedAt) unpublished++

  const ok = !problems.some((x) => x.startsWith(`${p.slug}:`))
  console.log(
    `  ${ok ? '✓' : '✗'} ${p.slug.padEnd(26)} $${String(p.priceUSD).padEnd(5)} ` +
    `${String(media.length)} img  ${sp.publishedAt ? 'published' : 'NOT PUBLISHED'}`,
  )
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
console.log(`All ${catalogue.length} products match the CSV exactly.`)
process.exit(unpublished ? 2 : 0)
