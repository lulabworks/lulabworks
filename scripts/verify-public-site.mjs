import { readFileSync } from 'node:fs'

const publicContent = readFileSync(new URL('../src/lib/public-content.ts', import.meta.url), 'utf8')
const form = readFileSync(new URL('../src/pages/richiesta/index.astro', import.meta.url), 'utf8')
const workflow = readFileSync(new URL('../.github/workflows/deploy-pages.yml', import.meta.url), 'utf8')

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

console.log('Query pubbliche senza prezzi o fonti operative: OK')
console.log('Contenuti e immagini filtrati per pubblicazione: OK')
console.log('Richieste instradate alla Edge Function: OK')
console.log('Rigenerazione automatica pianificata: OK')
