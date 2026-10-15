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

Il marchio ufficiale è il PNG originale allegato da LuLab, conservato senza modifiche in `public/brand/logo-lulab.png` (4167×4167 px, SHA-256 `a0ea8c0457f26a26aa8b68b6711bbda32047de22a72856284ecb2a49653108e4`). Header, footer e Open Graph predefinita usano questo file. Le icone da 32, 180, 192 e 512 px sono esclusivamente ridimensionamenti dell'intera immagine, senza ritagli. I nomi delle icone e del manifest includono la versione `a0ea8c0457f2` per invalidare anche le cache persistenti di Safari.

Una preview di produzione è valida soltanto dopo una build riuscita: una build interrotta può lasciare in `dist` vecchie icone e un manifest precedente, senza gli HTML delle pagine.
