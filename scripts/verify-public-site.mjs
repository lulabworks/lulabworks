import { readFileSync, readdirSync } from 'node:fs'
import { createHash } from 'node:crypto'

const publicContent = readFileSync(new URL('../src/lib/public-content.ts', import.meta.url), 'utf8')
const form = readFileSync(new URL('../src/pages/richiesta/index.astro', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')
const astroConfig = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8')
const baseLayout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8')
const manifestPath = baseLayout.match(/sitePath\('([^']+\.webmanifest)'\)/)?.[1]
const pageFiles = readdirSync(new URL('../src/pages', import.meta.url), { recursive: true }).filter((path) => path.endsWith('.astro'))

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

assert(!/public_price/.test(publicContent), 'Il sito pubblico non deve leggere public_price.')
assert(!/show_price/.test(publicContent), 'Il sito pubblico non deve leggere show_price.')
assert(!/site_collection_item_sources|site_portfolio_project_sources|customers|jobs|recovered_items/.test(publicContent), 'Il sito pubblico non deve interrogare fonti operative.')
assert(/publication_status: 'eq\.pubblicato'/.test(publicContent), 'Le query devono filtrare i contenuti pubblicati.')
assert(/storage_bucket: 'eq\.site-public'/.test(publicContent), 'Le query devono leggere soltanto immagini pubbliche.')
assert(/functions\/v1\/submit-inquiry/.test(form), 'Il modulo deve passare dalla Edge Function.')
assert(/name="website"/.test(form) && /form_started_at/.test(form), 'Mancano le protezioni antispam di base.')
assert(/schedule:/.test(workflow) && /cron:/.test(workflow), 'Manca la rigenerazione automatica pianificata.')
assert(/base: '\/lulabworks'/.test(astroConfig) && /sitePath/.test(publicContent), 'Manca il base path GitHub Pages del repository pubblico.')
assert((baseLayout.match(/<link\s+rel="icon"/g) ?? []).length === 3, 'Devono esserci tre favicon distinte da 16, 32 e 48 px.')
assert(/rel="icon" href=\{brandIcon\}/.test(baseLayout) && /rel="apple-touch-icon" href=\{appleTouchIcon\}/.test(baseLayout), 'Mancano le icone browser e Apple condivise.')
const original = readFileSync(new URL('../public/brand/logo-lulab.png', import.meta.url))
const originalHash = createHash('sha256').update(original).digest('hex')
assert(originalHash === 'a0ea8c0457f26a26aa8b68b6711bbda32047de22a72856284ecb2a49653108e4', 'Il logo deve essere esattamente il PNG originale autorizzato.')
const version = originalHash.slice(0, 12)
const siteUrl = new URL('https://lulabworks.github.io/lulabworks/')
function publicFile(url) {
  assert(url.pathname.startsWith(siteUrl.pathname), `Asset fuori dal base path: ${url.pathname}`)
  return readFileSync(new URL(`../public/${url.pathname.slice(siteUrl.pathname.length)}`, import.meta.url))
}
function verifyPng(url, size) {
  const png = publicFile(url)
  assert(png.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])), `Asset non PNG: ${url.pathname}`)
  assert(png.readUInt32BE(16) === size && png.readUInt32BE(20) === size, `Dimensioni PNG errate: ${url.pathname}`)
  assert(url.href.includes(version), `URL del marchio non versionato: ${url.pathname}`)
}
for (const [name, size] of [['brandLogo', 4167], ['brandIcon16', 16], ['brandIcon', 32], ['brandIcon48', 48], ['appleTouchIcon', 180]]) {
  const path = baseLayout.match(new RegExp(`const ${name} = sitePath\\('([^']+)'\\)`))?.[1]
  assert(path, `Manca il percorso condiviso ${name}.`)
  verifyPng(new URL(`.${path}`, siteUrl), size)
}
assert(/image = brandLogo/.test(baseLayout) && (baseLayout.match(/src=\{brandLogo\}/g) ?? []).length === 2, 'Header, footer e Open Graph devono condividere il logo originale.')
assert(manifestPath?.includes(version), 'Anche il manifest deve avere un nuovo URL versionato.')
const manifestUrl = new URL(`.${manifestPath}`, siteUrl)
const webManifest = JSON.parse(publicFile(manifestUrl).toString('utf8'))
assert(new URL(webManifest.scope, manifestUrl).pathname === siteUrl.pathname && new URL(webManifest.start_url, manifestUrl).pathname === siteUrl.pathname, 'Scope o start_url del manifest fuori dal base path.')
assert(webManifest.icons.length === 2, 'Mancano le icone del manifest da 192 e 512 px.')
for (const size of [192, 512]) {
  const icon = webManifest.icons.find((icon) => icon.sizes === `${size}x${size}`)
  assert(icon?.type === 'image/png', `Manca l’icona PNG del manifest da ${size} px.`)
  verifyPng(new URL(icon.src, manifestUrl), size)
}
assert(pageFiles.every((path) => {
  const page = readFileSync(new URL(`../src/pages/${path}`, import.meta.url), 'utf8')
  return page.includes('BaseLayout') && !/<link\s+rel=["'](?:icon|apple-touch-icon)/.test(page)
}), 'Tutte le pagine devono usare BaseLayout per i metadati condivisi.')

console.log('Query pubbliche senza prezzi o fonti operative: OK')
console.log('Contenuti e immagini filtrati per pubblicazione: OK')
console.log('Richieste instradate alla Edge Function: OK')
console.log('Rigenerazione automatica pianificata: OK')
console.log('Base path GitHub Pages /lulabworks/: OK')
console.log('PNG originale, dimensioni e percorsi versionati delle icone: OK')
console.log('Tutte le pagine usano BaseLayout senza favicon duplicate: OK')
