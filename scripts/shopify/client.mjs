/* Thin Shopify Admin GraphQL client: version detection, retries, throttling. */

import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { REPO_ROOT } from './catalogue.mjs'

/** Load KEY=VALUE pairs from .env.shopify (gitignored) into process.env. */
export function loadEnv() {
  const p = resolve(REPO_ROOT, '.env.shopify')
  if (existsSync(p)) {
    for (const raw of readFileSync(p, 'utf8').split(/\r?\n/)) {
      const line = raw.trim()
      if (!line || line.startsWith('#')) continue
      const eq = line.indexOf('=')
      if (eq === -1) continue
      const k = line.slice(0, eq).trim()
      const v = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '')
      if (!(k in process.env)) process.env[k] = v
    }
  }
  const domain = (process.env.SHOPIFY_STORE_DOMAIN || '')
    .trim()
    .replace(/^https?:\/\//, '')
    .replace(/\/+$/, '')
  const token = (process.env.SHOPIFY_ADMIN_TOKEN || '').trim()
  if (!domain) throw new Error('SHOPIFY_STORE_DOMAIN is not set (e.g. my-store.myshopify.com)')
  if (!token) throw new Error('SHOPIFY_ADMIN_TOKEN is not set (shpat_… / shpca_…)')
  return { domain, token }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

export class Admin {
  constructor({ domain, token, version }) {
    this.domain = domain
    this.token = token
    this.version = version
  }

  /** Ask the shop which API versions it supports and pick the newest stable one. */
  static async connect() {
    const { domain, token } = loadEnv()
    const probe = new Admin({ domain, token, version: 'unstable' })
    const data = await probe.gql(`{ publicApiVersions { handle supported } }`)
    const stable = data.publicApiVersions
      .filter((v) => v.supported && /^\d{4}-\d{2}$/.test(v.handle))
      .map((v) => v.handle)
      .sort()
    const version = stable[stable.length - 1]
    if (!version) throw new Error('Could not determine a supported Admin API version')
    return new Admin({ domain, token, version })
  }

  get endpoint() {
    return `https://${this.domain}/admin/api/${this.version}/graphql.json`
  }

  async gql(query, variables = {}, { retries = 5 } = {}) {
    let lastErr
    for (let attempt = 0; attempt <= retries; attempt++) {
      let res
      try {
        res = await fetch(this.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Shopify-Access-Token': this.token,
          },
          body: JSON.stringify({ query, variables }),
        })
      } catch (e) {
        lastErr = e
        await sleep(1000 * 2 ** attempt)
        continue
      }

      if (res.status === 429 || res.status >= 500) {
        lastErr = new Error(`HTTP ${res.status} ${res.statusText}`)
        const retryAfter = Number(res.headers.get('Retry-After')) || 2 ** attempt
        await sleep(retryAfter * 1000)
        continue
      }
      if (res.status === 401 || res.status === 403) {
        const body = await res.text()
        throw new Error(
          `HTTP ${res.status} from Shopify — the Admin token was rejected or is missing a scope.\n` +
          `Endpoint: ${this.endpoint}\n${body.slice(0, 400)}`,
        )
      }
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${(await res.text()).slice(0, 600)}`)
      }

      const json = await res.json()
      if (json.errors?.length) {
        const throttled = json.errors.some((e) => e.extensions?.code === 'THROTTLED')
        if (throttled && attempt < retries) { await sleep(2000 * (attempt + 1)); continue }
        throw new Error(`GraphQL error: ${JSON.stringify(json.errors, null, 2)}`)
      }
      // Stay well clear of the leaky-bucket limit on long runs.
      const cost = json.extensions?.cost?.throttleStatus
      if (cost && cost.currentlyAvailable < cost.maximumAvailable * 0.25) await sleep(1000)
      return json.data
    }
    throw lastErr ?? new Error('request failed')
  }
}

/** Throw on any userErrors returned by a mutation. */
export function assertNoUserErrors(label, payload) {
  const errs = payload?.userErrors ?? []
  if (errs.length) {
    throw new Error(`${label} failed:\n${errs.map((e) => `  • ${(e.field || []).join('.')}: ${e.message}`).join('\n')}`)
  }
  return payload
}
