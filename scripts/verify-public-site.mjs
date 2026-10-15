import { readFileSync, readdirSync } from 'node:fs'

const publicContent = readFileSync(new URL('../src/lib/public-content.ts', import.meta.url), 'utf8')
const form = readFileSync(new URL('../src/pages/richiesta/index.astro', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')
const astroConfig = readFileSync(new URL('../astro.config.mjs', import.meta.url), 'utf8')
const baseLayout = readFileSync(new URL('../src/layouts/BaseLayout.astro', import.meta.url), 'utf8')
const webManifest = JSON.parse(readFileSync(new URL('../public/site.webmanifest', import.meta.url), 'utf8'))
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
assert((baseLayout.match(/<link\s+rel="icon"/g) ?? []).length === 1, 'Deve esserci una sola dichiarazione rel="icon".')
assert(/rel="icon" href=\{brandIcon\}/.test(baseLayout) && /rel="apple-touch-icon" href=\{brandIcon\}/.test(baseLayout), 'Le icone browser e Apple devono usare il PNG ufficiale.')
assert(/logo-lulab\.png\?v=20261015/.test(baseLayout) && /image = sitePath\('\/brand\/logo-lulab\.png\?v=20261015'\)/.test(baseLayout), 'Icona e Open Graph predefinita devono usare il PNG versionato.')
assert(webManifest.icons.length === 1 && webManifest.icons[0].src === 'brand/logo-lulab.png?v=20261015' && webManifest.icons[0].sizes === '1024x1024', 'Il manifest deve usare il PNG ufficiale e le dimensioni reali.')
assert(pageFiles.every((path) => {
  const page = readFileSync(new URL(`../src/pages/${path}`, import.meta.url), 'utf8')
  return page.includes('BaseLayout') && !/<link\s+rel=["'](?:icon|apple-touch-icon)/.test(page)
}), 'Tutte le pagine devono usare BaseLayout per i metadati condivisi.')

console.log('Query pubbliche senza prezzi o fonti operative: OK')
console.log('Contenuti e immagini filtrati per pubblicazione: OK')
console.log('Richieste instradate alla Edge Function: OK')
console.log('Rigenerazione automatica pianificata: OK')
console.log('Base path GitHub Pages /lulabworks/: OK')
console.log('Icone, manifest e Open Graph condividono il PNG ufficiale: OK')
console.log('Tutte le pagine usano BaseLayout senza favicon duplicate: OK')
