/* ═══════════════════════════════════════════════════════════════
   PUBLISH — put every product on every sales channel
   Unpublished products are invisible to the Storefront API, so the site can
   read them but checkout cannot buy them. Run this once the custom app has
   the read_publications + write_publications scopes.
   ═══════════════════════════════════════════════════════════════ */

import { loadCatalogue } from './catalogue.mjs'
import { Admin, assertNoUserErrors } from './client.mjs'

const admin = await Admin.connect()

let pubs
try {
  const d = await admin.gql(`{ publications(first: 30) { nodes { id name } } }`)
  pubs = d.publications.nodes
} catch (e) {
  console.error(
    `\nCannot read the store's sales channels — the app is missing the\n` +
    `read_publications scope.\n\n` +
    `  Shopify admin → Settings → Apps and sales channels → Develop apps\n` +
    `    → (your app) → Configuration → Admin API integration → Edit\n` +
    `    → tick read_publications and write_publications → Save\n` +
    `    → Overview tab → Install / Update app\n\n` +
    `Then re-run: node scripts/shopify/publish.mjs\n`,
  )
  console.error(e.message.split('\n').slice(0, 3).join('\n'))
  process.exit(1)
}

console.log(`\nSales channels: ${pubs.map((p) => p.name).join(', ')}\n`)

const catalogue = loadCatalogue()
let failed = 0

for (const p of catalogue) {
  const d = await admin.gql(
    `query($q: String!) { products(first: 1, query: $q) { nodes { id handle publishedAt } } }`,
    { q: `handle:${p.slug}` },
  )
  const prod = d.products.nodes.find((n) => n.handle === p.slug)
  if (!prod) { console.log(`  ✗ ${p.slug} — not in Shopify`); failed++; continue }

  try {
    const r = await admin.gql(
      `mutation pub($id: ID!, $input: [PublicationInput!]!) {
         publishablePublish(id: $id, input: $input) {
           publishable { availablePublicationsCount { count } }
           userErrors { field message } } }`,
      { id: prod.id, input: pubs.map((x) => ({ publicationId: x.id })) },
    )
    assertNoUserErrors(`publish(${p.slug})`, r.publishablePublish)
    console.log(`  ✓ ${p.slug}`)
  } catch (e) {
    console.log(`  ✗ ${p.slug} — ${e.message.split('\n').slice(0, 2).join(' ')}`)
    failed++
  }
}

console.log(failed ? `\n${failed} product(s) failed to publish.` : `\nAll ${catalogue.length} products published.`)
console.log(`Now run: node scripts/shopify/verify.mjs`)
process.exit(failed ? 1 : 0)
