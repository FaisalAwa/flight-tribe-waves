/* ═══════════════════════════════════════════════════════════════
   PUSH — CSV ➜ Shopify
   Upserts every product in the master sheet into Shopify by handle and
   writes back every column Shopify has a real home for:

     title · handle · product type · vendor · tags (editorial tag, category,
     gender) · description · price · SKU · cost per item · taxable · shipping
     weight · stock count · collection membership · images

   Columns Shopify has no native field for — the dimensions, the material
   line, and the free-form "Variants / Variant Values" upgrade quotes — are
   written VERBATIM to `flight_tribe.*` metafields (definitions created on
   first run so the client can edit them in admin). They are deliberately not
   turned into real Shopify variants: the sheet's upgrade prices are stated
   inconsistently, and inventing option names/prices from them would put
   wrong numbers in front of buyers.

   Idempotent: re-running matches products by handle and images by alt text,
   so nothing is duplicated. Run with --dry to preview without writing.
   ═══════════════════════════════════════════════════════════════ */

import { writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { loadCatalogue, descriptionHtml, REPO_ROOT } from './catalogue.mjs'
import { Admin, assertNoUserErrors } from './client.mjs'

const DRY = process.argv.includes('--dry')
const VENDOR = 'Flight Tribe'
const MANIFEST = resolve(REPO_ROOT, 'scripts/shopify/shopify-manifest.json')
const NS = 'flight_tribe'

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
    id handle title status productType vendor tags onlineStoreUrl description
    options { id name position optionValues { id name hasVariants } }
    variants(first: 30) { nodes { id title price sku taxable availableForSale
      selectedOptions { name value }
      inventoryItem { id tracked unitCost { amount }
                      measurement { weight { value unit } } } } }
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

/** Tags: the editorial tag, the category, and the sheet's Gender column.
 *  Gender is a real merchandising facet in the sheet and Shopify has no
 *  dedicated field for it, so it rides along as a tag. */
const tagsFor = (p) => [p.tag, p.categoryLabel, p.gender].filter(Boolean)

async function upsertProduct(admin, argNames, p) {
  const found = await admin.gql(FIND, { q: `handle:${p.slug}` })
  const existing = found.products.nodes.find((n) => n.handle === p.slug) ?? null

  const attrs = {
    title: p.name,
    handle: p.slug,
    productType: p.categoryLabel,
    vendor: VENDOR,
    tags: tagsFor(p),
    status: 'ACTIVE',
    descriptionHtml: descriptionHtml(p.description),
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

/** What the base (as-photographed) variant carries: everything the sheet
 *  states about the physical piece. Stock is tracked only for rows that give a
 *  number; the rest keep Shopify's untracked default rather than an invented 0. */
function baseVariantInput(p) {
  const inventoryItem = {
    tracked: p.inventoryQty !== null,
    requiresShipping: true,
    sku: p.sku || p.slug,
  }
  if (p.costUSD !== null) inventoryItem.cost = money(p.costUSD)
  if (p.weight) inventoryItem.measurement = { weight: { value: p.weight.value, unit: p.weight.unit } }
  return {
    price: money(p.priceUSD),
    taxable: p.taxable,
    // Stock counts are informational here: CONTINUE keeps every piece
    // orderable (they are made to order) while still showing the real
    // number the sheet records.
    inventoryPolicy: 'CONTINUE',
    inventoryItem,
  }
}

/** A gold-upgrade variant carries only what the sheet actually states about
 *  it: its price and its SKU. No cost, no weight — those are the silver
 *  piece's numbers and would be wrong for a gold one. */
function upgradeVariantInput(p, v) {
  return {
    price: money(v.priceUSD),
    taxable: p.taxable,
    inventoryPolicy: 'CONTINUE',
    inventoryItem: { tracked: false, requiresShipping: true, sku: v.sku || `${p.slug}-${v.label}` },
  }
}

const VARIANT_FIELDS = `productVariants { id title price sku taxable
  selectedOptions { name value }
  inventoryItem { id tracked unitCost { amount }
                  measurement { weight { value unit } } } }`

/** Single-variant piece: just write the sheet's numbers onto the one variant. */
async function setSingleVariant(admin, productId, p) {
  if (DRY) return null
  const cur = await admin.gql(READ, { id: productId })
  const variant = cur.product.variants.nodes[0]
  if (!variant) throw new Error(`${p.slug}: product has no variant to price`)

  const r = await admin.gql(
    `mutation price($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
       productVariantsBulkUpdate(productId: $productId, variants: $variants) {
         ${VARIANT_FIELDS} userErrors { field message } } }`,
    { productId, variants: [{ id: variant.id, ...baseVariantInput(p) }] },
  )
  assertNoUserErrors(`variant(${p.slug})`, r.productVariantsBulkUpdate)
  return r.productVariantsBulkUpdate.productVariants[0]
}

/**
 * Multi-variant piece: turn Shopify's implicit "Title / Default Title" option
 * into the sheet's real buy options and reconcile the variant list to it.
 *
 * The existing variant is RENAMED into the base option value rather than
 * deleted and recreated, so its id — the id already sitting in customers'
 * carts and in src/data/products.ts — survives the change.
 */
async function setVariantSet(admin, productId, p) {
  if (DRY) return null
  const cur = await admin.gql(READ, { id: productId })
  const prod = cur.product
  const wanted = p.variants
  const baseLabel = wanted[0].label

  if (prod.options.length !== 1) {
    throw new Error(
      `${p.slug}: product has ${prod.options.length} options in Shopify (${prod.options.map((o) => o.name).join(', ')}); ` +
      `the sheet describes exactly one. Refusing to guess which to keep.`,
    )
  }
  const opt = prod.options[0]

  // ── 1. the option itself: name + the full value list ────────────
  const have = new Map(opt.optionValues.map((v) => [v.name, v.id]))
  const missing = wanted.map((v) => v.label).filter((label) => !have.has(label))
  // Shopify's placeholder value becomes the base material; anything else the
  // sheet no longer lists is left alone here and removed with its variant below.
  const placeholder = opt.optionValues.find((v) => v.name === 'Default Title')
  const rename = !have.has(baseLabel) && placeholder ? placeholder : null

  if (opt.name !== p.optionName || rename || missing.length) {
    const vars = {
      productId,
      option: { id: opt.id, name: p.optionName },
      optionValuesToAdd: missing
        .filter((label) => !(rename && label === baseLabel))
        .map((name) => ({ name })),
      optionValuesToUpdate: rename ? [{ id: rename.id, name: baseLabel }] : [],
    }
    const r = await admin.gql(
      `mutation opt($productId: ID!, $option: OptionUpdateInput!,
                    $optionValuesToAdd: [OptionValueCreateInput!],
                    $optionValuesToUpdate: [OptionValueUpdateInput!]) {
         productOptionUpdate(productId: $productId, option: $option,
                             optionValuesToAdd: $optionValuesToAdd,
                             optionValuesToUpdate: $optionValuesToUpdate,
                             variantStrategy: LEAVE_AS_IS) {
           userErrors { field message code } } }`,
      vars,
    )
    assertNoUserErrors(`option(${p.slug})`, r.productOptionUpdate)
  }

  // ── 2. variants: update the ones that exist, create the rest ────
  const after = await admin.gql(READ, { id: productId })
  const byValue = new Map(
    after.product.variants.nodes.map((v) => [v.selectedOptions[0]?.value, v]),
  )

  const updates = []
  const creates = []
  for (const v of wanted) {
    const input = v.base ? baseVariantInput(p) : upgradeVariantInput(p, v)
    const existing = byValue.get(v.label)
    if (existing) updates.push({ id: existing.id, ...input })
    else creates.push({ optionValues: [{ optionName: p.optionName, name: v.label }], ...input })
  }

  if (updates.length) {
    const r = await admin.gql(
      `mutation upd($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
         productVariantsBulkUpdate(productId: $productId, variants: $variants) {
           ${VARIANT_FIELDS} userErrors { field message } } }`,
      { productId, variants: updates },
    )
    assertNoUserErrors(`variants(${p.slug})`, r.productVariantsBulkUpdate)
  }
  if (creates.length) {
    const r = await admin.gql(
      `mutation crt($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
         productVariantsBulkCreate(productId: $productId, variants: $variants, strategy: DEFAULT) {
           ${VARIANT_FIELDS} userErrors { field message } } }`,
      { productId, variants: creates },
    )
    assertNoUserErrors(`variants(${p.slug})`, r.productVariantsBulkCreate)
  }

  // ── 3. anything Shopify still carries that the sheet dropped ────
  const keep = new Set(wanted.map((v) => v.label))
  const stale = [...byValue.entries()]
    .filter(([value]) => value && !keep.has(value))
    .map(([, v]) => v.id)
  if (stale.length) {
    const r = await admin.gql(
      `mutation del($productId: ID!, $variantsIds: [ID!]!) {
         productVariantsBulkDelete(productId: $productId, variantsIds: $variantsIds) {
           userErrors { field message } } }`,
      { productId, variantsIds: stale },
    )
    assertNoUserErrors(`variantsDelete(${p.slug})`, r.productVariantsBulkDelete)
  }

  const final = await admin.gql(READ, { id: productId })
  return final.product.variants.nodes.find((v) => v.selectedOptions[0]?.value === baseLabel)
    ?? final.product.variants.nodes[0]
}

/** Write the sheet's buy options onto the product, however many there are. */
const setVariant = (admin, productId, p) =>
  (p.variants.length ? setVariantSet : setSingleVariant)(admin, productId, p)

/** Set the on-hand count for rows whose Inventory column is a number. */
async function setStock(admin, locationId, variant, p) {
  if (DRY || p.inventoryQty === null || !locationId) return false
  const inventoryItemId = variant?.inventoryItem?.id
  if (!inventoryItemId) return false

  // 2026-07 requires the caller to state what it believes the current count
  // is, so read the live level first rather than blind-writing over it.
  const lvl = await admin.gql(
    `query lvl($id: ID!, $loc: ID!) {
       inventoryItem(id: $id) {
         inventoryLevel(locationId: $loc) { quantities(names: ["available"]) { name quantity } } } }`,
    { id: inventoryItemId, loc: locationId },
  )
  const level = lvl.inventoryItem?.inventoryLevel
  const current = level?.quantities?.find((q) => q.name === 'available')?.quantity ?? null

  // Not stocked at this location yet — activating it is what creates the level.
  if (!level) {
    const r = await admin.gql(
      `mutation act($inventoryItemId: ID!, $locationId: ID!, $available: Int) {
         inventoryActivate(inventoryItemId: $inventoryItemId, locationId: $locationId, available: $available) {
           userErrors { field message } } }`,
      { inventoryItemId, locationId, available: p.inventoryQty },
    )
    assertNoUserErrors(`stock(${p.slug})`, r.inventoryActivate)
    return true
  }

  if (current === p.inventoryQty) return true

  // 2026-07 makes @idempotent mandatory here. The key is derived from what the
  // write actually is (piece + location + target count), so a re-run of an
  // unchanged sheet is the same operation rather than a second stock movement.
  const key = `ft-stock-${p.slug}-${locationId.split('/').pop()}-${p.inventoryQty}`
  const r = await admin.gql(
    `mutation stock($input: InventorySetQuantitiesInput!) {
       inventorySetQuantities(input: $input) @idempotent(key: ${JSON.stringify(key)}) {
         userErrors { field message } } }`,
    {
      input: {
        name: 'available',
        reason: 'correction',
        quantities: [{ inventoryItemId, locationId, quantity: p.inventoryQty, changeFromQuantity: current ?? 0 }],
      },
    },
  )
  assertNoUserErrors(`stock(${p.slug})`, r.inventorySetQuantities)
  return true
}

/** The sheet columns Shopify has no field for, stored verbatim. */
function metafieldsFor(p) {
  const out = []
  const add = (key, type, value) => { if (value) out.push({ namespace: NS, key, type, value }) }
  add('material', 'single_line_text_field', p.material)
  add('dimensions', 'single_line_text_field', p.dimensions)
  add('upgrade_options', 'single_line_text_field', p.upgradeOptions)
  add('upgrade_pricing', 'multi_line_text_field', p.upgradePricing)
  add('inventory_note', 'single_line_text_field', p.inventoryNote)
  return out
}

const DEFINITIONS = [
  ['material', 'Material & weight', 'single_line_text_field', 'The metal/fabric and struck weight, exactly as the master sheet records it.'],
  ['dimensions', 'Dimensions', 'single_line_text_field', 'Height/length/width, exactly as the master sheet records it.'],
  ['upgrade_options', 'Upgrade options', 'single_line_text_field', 'Made-to-order upgrades offered on this piece (24k/22k/18k gold, gemstones).'],
  ['upgrade_pricing', 'Upgrade pricing', 'multi_line_text_field', 'Quoted upgrade prices from the master sheet — stated as written, confirm before publishing to buyers.'],
  ['inventory_note', 'Inventory note', 'single_line_text_field', 'Stock status when the sheet gives words instead of a number (e.g. "on bench").'],
]

/** Create the metafield definitions once so the fields are editable in admin.
 *  An already-existing definition is not an error. */
async function ensureDefinitions(admin) {
  if (DRY) return
  for (const [key, name, type, description] of DEFINITIONS) {
    const r = await admin.gql(
      `mutation def($definition: MetafieldDefinitionInput!) {
         metafieldDefinitionCreate(definition: $definition) {
           createdDefinition { id } userErrors { field message code } } }`,
      { definition: { namespace: NS, key, name, description, type, ownerType: 'PRODUCT' } },
    ).catch((e) => ({ _err: e }))
    if (r._err) { console.log(`  ! metafield definition ${key}: ${r._err.message.split('\n')[0]}`); continue }
    const errs = (r.metafieldDefinitionCreate?.userErrors ?? []).filter((e) => e.code !== 'TAKEN')
    if (errs.length) console.log(`  ! metafield definition ${key}: ${errs.map((e) => e.message).join(', ')}`)
  }
}

async function setMetafields(admin, productId, p) {
  const fields = metafieldsFor(p)
  if (DRY || !fields.length) return fields.length
  const r = await admin.gql(
    `mutation mf($metafields: [MetafieldsSetInput!]!) {
       metafieldsSet(metafields: $metafields) {
         metafields { key } userErrors { field message } } }`,
    { metafields: fields.map((f) => ({ ...f, ownerId: productId })) },
  )
  assertNoUserErrors(`metafields(${p.slug})`, r.metafieldsSet)
  return fields.length
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

/** The sheet's Collection column → a real manual Shopify collection. */
async function syncCollections(admin, catalogue, idBySlug) {
  if (DRY) return []
  const wanted = [...new Set(catalogue.map((p) => p.collection).filter(Boolean))]
  const done = []
  for (const title of wanted) {
    const found = await admin.gql(
      `query col($q: String!) { collections(first: 5, query: $q) { nodes { id title } } }`,
      { q: `title:'${title.replace(/'/g, "\\'")}'` },
    )
    let id = found.collections.nodes.find((c) => c.title === title)?.id ?? null
    if (!id) {
      const r = await admin.gql(
        `mutation mk($input: CollectionInput!) {
           collectionCreate(input: $input) { collection { id } userErrors { field message } } }`,
        { input: { title } },
      )
      assertNoUserErrors(`collectionCreate(${title})`, r.collectionCreate)
      id = r.collectionCreate.collection.id
    }
    const productIds = catalogue.filter((p) => p.collection === title).map((p) => idBySlug.get(p.slug)).filter(Boolean)
    const r = await admin.gql(
      `mutation add($id: ID!, $productIds: [ID!]!) {
         collectionAddProducts(id: $id, productIds: $productIds) {
           userErrors { field message } } }`,
      { id, productIds },
    )
    assertNoUserErrors(`collectionAddProducts(${title})`, r.collectionAddProducts)
    done.push({ title, id, count: productIds.length })
  }
  return done
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
await ensureDefinitions(admin)

// Stock counts need somewhere to live; the shop's first active location is
// where a single-location store keeps everything.
let locationId = null
if (!DRY) {
  try {
    // `id` only — reading a location's `name` needs the read_locations scope,
    // which this app does not have, and the id is all inventorySetQuantities wants.
    const loc = await admin.gql(`{ locations(first: 1) { nodes { id } } }`)
    locationId = loc.locations.nodes[0]?.id ?? null
  } catch (e) {
    console.log(`  ! could not read locations (${e.message.split('\n')[0]}) — stock counts will be skipped\n`)
  }
}

const manifest = []
const idBySlug = new Map()

for (const p of catalogue) {
  console.log(`▸ ${p.name}`)
  const { id, existing } = await upsertProduct(admin, argNames, p)
  if (DRY) {
    console.log(`      $${p.priceUSD} · ${p.tag} · ${p.images.length} image(s) · ` +
      `${p.description.length}-char description · SKU ${p.sku} · ${metafieldsFor(p).length} metafield(s)`)
    if (p.variants.length) {
      console.log(`      ${p.optionName}: ${p.variants.map((v) => `${v.label} $${v.priceUSD}`).join(' | ')}`)
    }
    if (p.unpricedKarats.length) {
      console.log(`      ! ${p.unpricedKarats.map((k) => `${k}k`).join(', ')} offered in the sheet with no price — no variant made`)
    }
    console.log()
    continue
  }
  idBySlug.set(p.slug, id)

  console.log(`  ${existing ? 'updated' : 'created'}  ${id}`)
  const variant = await setVariant(admin, id, p)
  const stocked = await setStock(admin, locationId, variant, p)
  console.log(`  variant  $${variant.price} · SKU ${variant.sku} · ` +
    `cost ${variant.inventoryItem?.unitCost?.amount ?? '—'} · ` +
    `weight ${variant.inventoryItem?.measurement?.weight
      ? `${variant.inventoryItem.measurement.weight.value} ${variant.inventoryItem.measurement.weight.unit}` : '—'} · ` +
    `stock ${stocked ? p.inventoryQty : (p.inventoryNote || 'untracked')}`)
  const mfCount = await setMetafields(admin, id, p)
  await syncMedia(admin, id, p)
  await orderMedia(admin, id, p)

  const final = await admin.gql(READ, { id })
  const prod = final.product
  if (p.variants.length) {
    console.log(`  options  ${prod.options[0].name}: ` +
      prod.variants.nodes.map((v) => `${v.selectedOptions[0]?.value} $${v.price}`).join(' | '))
  }
  if (p.unpricedKarats.length) {
    console.log(`  !        ${p.unpricedKarats.map((k) => `${k}k`).join(', ')} offered in the sheet with no price — no variant made`)
  }
  console.log(`  copy     ${prod.description.trim().length} chars · ${mfCount} metafield(s)`)
  console.log(`  images   ${prod.media.nodes.length} ready`)

  manifest.push({
    slug: p.slug,
    name: p.name,
    sku: p.sku,
    category: p.category,
    categoryLabel: p.categoryLabel,
    tag: p.tag,
    gender: p.gender,
    collection: p.collection,
    priceUSD: p.priceUSD,
    costUSD: p.costUSD,
    inventoryQty: p.inventoryQty,
    inventoryNote: p.inventoryNote,
    descriptionChars: prod.description.trim().length,
    productId: prod.id,
    variantId: variant.id,
    optionName: p.variants.length ? prod.options[0].name : null,
    variants: prod.variants.nodes.map((v) => ({
      id: v.id,
      label: v.selectedOptions[0]?.value ?? v.title,
      priceUSD: Number(v.price),
      sku: v.sku,
    })),
    unpricedKarats: p.unpricedKarats,
    images: p.images.map((im) => {
      const m = prod.media.nodes.find((n) => n.alt === im.file)
      return { file: im.file, source: im.url, cdn: m?.image?.url ?? null,
               width: m?.image?.width ?? null, height: m?.image?.height ?? null }
    }),
  })
  console.log()
}

if (!DRY) {
  const cols = await syncCollections(admin, catalogue, idBySlug)
  for (const c of cols) console.log(`Collection "${c.title}" — ${c.count} products`)

  const pubs = await publishEverywhere(admin, manifest.map((m) => m.productId))
  if (pubs.length) console.log(`Published to: ${pubs.map((p) => p.name).join(', ')}\n`)

  writeFileSync(MANIFEST, JSON.stringify({
    shop: shop.myshopifyDomain,
    apiVersion: admin.version,
    products: manifest,
  }, null, 2) + '\n')
  console.log(`Manifest → ${MANIFEST}`)

  const missingCdn = manifest.flatMap((m) => m.images.filter((i) => !i.cdn).map((i) => `${m.slug}/${i.file}`))
  const missingCopy = manifest.filter((m) => !m.descriptionChars).map((m) => m.slug)
  if (missingCopy.length) {
    console.log(`\n! ${missingCopy.length} product(s) still have no description: ${missingCopy.join(', ')}`)
    process.exitCode = 1
  }
  if (missingCdn.length) {
    console.log(`\n! ${missingCdn.length} image(s) have no CDN url yet: ${missingCdn.join(', ')}`)
    process.exitCode = 1
  }
  if (!missingCdn.length && !missingCopy.length) {
    console.log(`\n✓ ${manifest.length} products, ${manifest.reduce((n, m) => n + m.images.length, 0)} images, ` +
      `${manifest.length} descriptions live.`)
  }
}
