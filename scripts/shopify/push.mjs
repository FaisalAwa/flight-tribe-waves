/* ═══════════════════════════════════════════════════════════════
   PUSH — CSV ➜ Shopify
   Upserts every product in the audit CSV into Shopify by handle, sets the
   price, tags, product type and vendor, and attaches each image straight
   from its public Website Path URL (Shopify fetches and re-hosts it, so the
   original file is preserved bit-for-bit — no local copy, no re-encode).

   Idempotent: re-running matches products by handle and images by alt text,
   so nothing is duplicated. Run with --dry to preview without writing.
   ═══════════════════════════════════════════════════════════════ */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadCatalogue, REPO_ROOT } from './catalogue.mjs'
import { Admin, assertNoUserErrors } from './client.mjs'

const DRY = process.argv.includes('--dry')
const VENDOR = 'Flight Tribe'
const MANIFEST = resolve(REPO_ROOT, 'scripts/shopify/shopify-manifest.json')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const money = (n) => n.toFixed(2)

/* ─── queries ─────────────────────────────────────────────────── */

const SHOP = `{
  shop { name myshopifyDomain currencyCode
         primaryDomain { url } }
}`

const FIND = `query find($q: String!) {
  products(first: 1, query: $q) {
    nodes {
      id handle title status
      variants(first: 1) { nodes { id } }
      media(first: 50) { nodes { id alt status
        ... on MediaImage { image { url width height } } } }
    }
  }
}`

const READ = `query read($id: ID!) {
  product(id: $id) {
    id handle title status productType vendor tags onlineStoreUrl
    variants(first: 1) { nodes { id price sku availableForSale } }
    media(first: 50) { nodes { id alt status
      ... on MediaImage { image { url width height } } } }
  }
}`

/* ─── mutations (arg name differs by API version; resolved at runtime) ── */

async function resolveArgNames(admin) {
  const data = await admin.gql(`{
    __schema { mutationType { fields { name args { name } } } }
  }`)
  const fields = new Map(data.__schema.mutationType.fields.map((f) => [f.name, f.args.map((a) => a.name)]))
  const pick = (mutation, preferred, fallback) => {
    const args = fields.get(mutation)
    if (!args) throw new Error(`This store's Admin API has no "${mutation}" mutation`)
    if (args.includes(preferred)) return preferred
    if (args.includes(fallback)) return fallback
    throw new Error(`${mutation}: expected a "${preferred}" or "${fallback}" argument, got ${args.join(', ')}`)
  }
  return {
    create: pick('productCreate', 'product', 'input'),
    update: pick('productUpdate', 'product', 'input'),
  }
}

/* ─── steps ───────────────────────────────────────────────────── */

async function upsertProduct(admin, argNames, p) {
  const found = await admin.gql(FIND, { q: `handle:${p.slug}` })
  const existing = found.products.nodes.find((n) => n.handle === p.slug) ?? null

  const attrs = {
    title: p.name,
    handle: p.slug,
    productType: p.categoryLabel,
    vendor: VENDOR,
    tags: [p.tag, p.categoryLabel],
    status: 'ACTIVE',
  }

  if (DRY) {
    console.log(`  ${existing ? 'update' : 'create'}  ${p.slug}`)
    return { id: existing?.id ?? null, existing }
  }

  if (existing) {
    const r = await admin.gql(
      `mutation upd($${argNames.update}: ProductUpdateInput!) {
         productUpdate(${argNames.update}: $${argNames.update}) {
           product { id } userErrors { field message } } }`,
      { [argNames.update]: { id: existing.id, ...attrs } },
    )
    assertNoUserErrors(`productUpdate(${p.slug})`, r.productUpdate)
    return { id: existing.id, existing }
  }

  const r = await admin.gql(
    `mutation crt($${argNames.create}: ProductCreateInput!) {
       productCreate(${argNames.create}: $${argNames.create}) {
         product { id variants(first: 1) { nodes { id } } } userErrors { field message } } }`,
    { [argNames.create]: attrs },
  )
  assertNoUserErrors(`productCreate(${p.slug})`, r.productCreate)
  return { id: r.productCreate.product.id, existing: null }
}

async function setPrice(admin, productId, p) {
  if (DRY) return
  const cur = await admin.gql(READ, { id: productId })
  const variant = cur.product.variants.nodes[0]
  if (!variant) throw new Error(`${p.slug}: product has no variant to price`)

  const r = await admin.gql(
    `mutation price($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
       productVariantsBulkUpdate(productId: $productId, variants: $variants) {
         productVariants { id price sku } userErrors { field message } } }`,
    {
      productId,
      variants: [{
        id: variant.id,
        price: money(p.priceUSD),
        inventoryPolicy: 'CONTINUE',
        inventoryItem: { tracked: false, requiresShipping: true, sku: p.slug },
      }],
    },
  )
  assertNoUserErrors(`price(${p.slug})`, r.productVariantsBulkUpdate)
  return r.productVariantsBulkUpdate.productVariants[0]
}

/** Attach images by URL. Alt text = the CSV "Image File" name, which is the
 *  idempotency key: an image whose alt is already on the product is skipped. */
async function syncMedia(admin, productId, p) {
  const cur = await admin.gql(READ, { id: productId })
  const have = new Set(cur.product.media.nodes.map((m) => m.alt).filter(Boolean))
  const missing = p.images.filter((im) => !have.has(im.file))

  if (!missing.length) return cur.product.media.nodes
  if (DRY) {
    missing.forEach((im) => console.log(`      + image ${im.file}`))
    return []
  }

  const r = await admin.gql(
    `mutation media($productId: ID!, $media: [CreateMediaInput!]!) {
       productCreateMedia(productId: $productId, media: $media) {
         media { ... on MediaImage { id alt status } }
         mediaUserErrors { field message } } }`,
    {
      productId,
      media: missing.map((im) => ({
        originalSource: im.url,
        alt: im.file,
        mediaContentType: 'IMAGE',
      })),
    },
  )
  const errs = r.productCreateMedia.mediaUserErrors ?? []
  if (errs.length) {
    throw new Error(`media(${p.slug}) failed:\n${errs.map((e) => `  • ${(e.field || []).join('.')}: ${e.message}`).join('\n')}`)
  }

  // Shopify fetches the URL asynchronously — wait until every file is READY so
  // a FAILED download can never be mistaken for a successful upload.
  for (let attempt = 0; attempt < 40; attempt++) {
    await sleep(1500)
    const check = await admin.gql(READ, { id: productId })
    const nodes = check.product.media.nodes
    const pending = nodes.filter((m) => m.status && m.status !== 'READY' && m.status !== 'FAILED')
    const failed = nodes.filter((m) => m.status === 'FAILED')
    if (failed.length) {
      throw new Error(`${p.slug}: Shopify failed to ingest ${failed.map((m) => m.alt).join(', ')}`)
    }
    if (!pending.length) return nodes
  }
  throw new Error(`${p.slug}: images still processing after 60s`)
}

/** Order the product's media to match the CSV row order. */
async function orderMedia(admin, productId, p) {
  if (DRY) return
  const cur = await admin.gql(READ, { id: productId })
  const byAlt = new Map(cur.product.media.nodes.map((m) => [m.alt, m.id]))
  const wanted = p.images.map((im) => byAlt.get(im.file)).filter(Boolean)
  const current = cur.product.media.nodes.map((m) => m.id)
  if (wanted.length !== current.length) return
  if (wanted.every((id, i) => id === current[i])) return

  const moves = wanted.map((id, i) => ({ id, newPosition: String(i) }))
  const r = await admin.gql(
    `mutation reorder($id: ID!, $moves: [MoveInput!]!) {
       productReorderMedia(id: $id, moves: $moves) {
         userErrors { field message } } }`,
    { id: productId, moves },
  )
  assertNoUserErrors(`reorder(${p.slug})`, r.productReorderMedia)
}

/** Publish to every sales channel, so both the Online Store and the
 *  Storefront-API (headless) channel can see the product. */
async function publishEverywhere(admin, productIds) {
  if (DRY) return []
  let pubs
  try {
    const data = await admin.gql(`{ publications(first: 30) { nodes { id name } } }`)
    pubs = data.publications.nodes
  } catch (e) {
    console.log(`  ! could not read sales channels (${e.message.split('\n')[0]})`)
    console.log(`    → publish the products manually in Shopify admin, or grant read_publications.`)
    return []
  }
  for (const id of productIds) {
    try {
      const r = await admin.gql(
        `mutation pub($id: ID!, $input: [PublicationInput!]!) {
           publishablePublish(id: $id, input: $input) { userErrors { field message } } }`,
        { id, input: pubs.map((p) => ({ publicationId: p.id })) },
      )
      assertNoUserErrors('publishablePublish', r.publishablePublish)
    } catch (e) {
      console.log(`  ! publish failed for ${id}: ${e.message.split('\n')[0]}`)
    }
  }
  return pubs
}

/* ─── main ────────────────────────────────────────────────────── */

const admin = await Admin.connect()
const { shop } = await admin.gql(SHOP)

console.log(`\nStore   ${shop.name} (${shop.myshopifyDomain})`)
console.log(`API     ${admin.version}`)
console.log(`Currency ${shop.currencyCode}${DRY ? '\nMode    DRY RUN — nothing will be written' : ''}\n`)

if (shop.currencyCode !== 'USD' && !process.argv.includes('--force-currency')) {
  throw new Error(
    `Store currency is ${shop.currencyCode} but the CSV prices are USD. ` +
    `Set the store to USD, or re-run with --force-currency if the numbers are already correct.`,
  )
}

const catalogue = loadCatalogue()
const argNames = await resolveArgNames(admin)
const manifest = []

for (const p of catalogue) {
  console.log(`▸ ${p.name}`)
  const { id, existing } = await upsertProduct(admin, argNames, p)
  if (DRY) { console.log(`      $${p.priceUSD} · ${p.tag} · ${p.images.length} image(s)\n`); continue }

  console.log(`  ${existing ? 'updated' : 'created'}  ${id}`)
  const variant = await setPrice(admin, id, p)
  console.log(`  price    $${variant.price}`)
  await syncMedia(admin, id, p)
  await orderMedia(admin, id, p)

  const final = await admin.gql(READ, { id })
  const prod = final.product
  console.log(`  images   ${prod.media.nodes.length} ready`)

  manifest.push({
    slug: p.slug,
    name: p.name,
    category: p.category,
    categoryLabel: p.categoryLabel,
    tag: p.tag,
    priceUSD: p.priceUSD,
    productId: prod.id,
    variantId: prod.variants.nodes[0].id,
    images: p.images.map((im) => {
      const m = prod.media.nodes.find((n) => n.alt === im.file)
      return { file: im.file, source: im.url, cdn: m?.image?.url ?? null,
               width: m?.image?.width ?? null, height: m?.image?.height ?? null }
    }),
  })
  console.log()
}

if (!DRY) {
  const pubs = await publishEverywhere(admin, manifest.map((m) => m.productId))
  if (pubs.length) console.log(`Published to: ${pubs.map((p) => p.name).join(', ')}\n`)

  writeFileSync(MANIFEST, JSON.stringify({
    shop: shop.myshopifyDomain,
    apiVersion: admin.version,
    products: manifest,
  }, null, 2) + '\n')
  console.log(`Manifest → ${MANIFEST}`)

  const missingCdn = manifest.flatMap((m) => m.images.filter((i) => !i.cdn).map((i) => `${m.slug}/${i.file}`))
  if (missingCdn.length) {
    console.log(`\n! ${missingCdn.length} image(s) have no CDN url yet: ${missingCdn.join(', ')}`)
    process.exitCode = 1
  } else {
    console.log(`\n✓ ${manifest.length} products, ${manifest.reduce((n, m) => n + m.images.length, 0)} images live.`)
  }
}
