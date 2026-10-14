# Sito pubblico LuLab

Sito statico Astro pubblicato con GitHub Pages. Collezione e Progetti vengono letti da Supabase durante la build: soltanto contenuti con stato `pubblicato` e immagini nel bucket `site-public` entrano nelle pagine generate.

## Configurazione locale

```sh
cp .env.example .env.local
pnpm install
pnpm dev
```

Variabili necessarie:

- `PUBLIC_SUPABASE_URL`
- `PUBLIC_SUPABASE_PUBLISHABLE_KEY`

La publishable key è usata esclusivamente con le policy RLS anonime. Non usare mai chiavi `service_role` o secret key nel sito o nei repository secrets della build.

## Pubblicazione

Il workflow `.github/workflows/deploy-pages.yml` esegue check, test e build e pubblica `dist` su GitHub Pages. Oltre ai push e agli avvii manuali, una build pianificata ogni cinque minuti recepisce pubblicazioni e ritiri effettuati da LuLab Desk.

Il modulo richieste invia dati e allegati alla Edge Function Supabase `submit-inquiry`: nessun inserimento anonimo diretto è consentito dalle tabelle o dallo Storage.
