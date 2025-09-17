# AgriMeteo

AgriMeteo è una web app in React che combina dati meteorologici orari e logiche agronomiche di base per aiutare aziende agricole e tecnici a pianificare i trattamenti. Il progetto nasce come prototipo "portfolio friendly", ma tutte le funzionalità presenti sono pienamente operative in locale.

## Funzionalità principali

- **Home di presentazione** (`/`) con panoramica dell'app e call-to-action verso le sezioni chiave.
- **Mappa interattiva** (`/map`)
  - ricerca e salvataggio dell'area selezionata (coordinate in `localStorage`);
  - visualizzazione condizioni meteo correnti; elenco sprayability su 24h; finestre consigliate con stato (Buona/Discreta).
- **Dati meteo di precisione** (`/dati-meteo`)
  - richiesta a [Open-Meteo](https://open-meteo.com/) per current, variabili extra e forecast 48h;
  - dashboard con valori attuali, parametri avanzati, indici derivati e grafici Recharts (12h/48h);
  - card “Finestre operative” e blocco “Parere agronomico AI” che si collegano a un endpoint configurabile (`VITE_AI_API_URL`).
- **Indici Sprayability** (`/indici-sprayability`)
  - calcolo in tempo reale dell’indice (Buona/Discreta/Scarsa) utilizzando soglie personalizzabili per coltura, prodotto e sensibilità al vento;
  - fattori di spiegazione, finestre operative 24–48h e sezione “Parere agronomico AI” (usa la stessa API configurabile, con fallback locale).
- **Analisi condizioni** (`/analisi-condizioni`)
  - viste approfondite su metriche ambientali, fattori critici, modelli predittivi e finestra operativa successiva;
  - card “Avvisi e Raccomandazioni” generata dinamicamente dai dati previsionali.
- **Pagina About** con contatti e note sul progetto.

## Stack

- **Vite + React 18 + TypeScript**
- **Tailwind CSS** per lo styling
- **Lucide Icons, Radix UI, shadcn/ui** per componenti
- **Leaflet** per la mappa
- **Recharts** per grafici
- **React Query** per la gestione base delle query (placeholder per estensioni future)

## Prerequisiti

- Node.js 18+
- npm (>= 9)

## Setup rapido

1. Installazione dipendenze

   ```bash
   npm install
   ```

2. Configura l’endpoint AI (facoltativo ma consigliato):

   ```bash
   cp .env.local .env.local.bak  # se esiste già
   echo "VITE_AI_API_URL=http://127.0.0.1:8787/api/ai/agronomist-advice" > .env.local
   ```

   È incluso un server mock che fornisce risposte agronomiche simulate:

   ```bash
   npm run mock:ai
   ```

   Verrà avviato su `http://127.0.0.1:8787/api/ai/agronomist-advice`.

3. Avvia la web app in sviluppo (in una nuova shell):

   ```bash
   npm run dev
   ```

4. Apri [`http://localhost:5173`](http://localhost:5173) e naviga tra le pagine.

## Uso e note

- Seleziona una località dalla pagina **Map**: le coordinate vengono salvate e riutilizzate nelle sezioni “Dati meteo”, “Indici Sprayability” e “Analisi condizioni”.
- Tutti i calcoli mettono in coda la chiamata a Open-Meteo; se nessuna area è selezionata, le pagine mostrano messaggi informativi e fallback grafici.
- L’integrazione AI è opzionale: senza endpoint valido viene mostrato il testo di fallback generato localmente.
- Per sperimentare personalizzazioni, usa i menu a tendina nella pagina **Indici Sprayability** (coltura, prodotto, sensibilità vento, ore minime finestra). Le preferenze sono salvate in `localStorage`.

## Script disponibili

| Comando             | Descrizione                                             |
|--------------------|---------------------------------------------------------|
| `npm run dev`      | Avvia il server di sviluppo Vite                         |
| `npm run build`    | Esegue la build di produzione                            |
| `npm run preview`  | Serve la build prodotta da `npm run build`               |
| `npm run lint`     | Esegue ESLint (alcuni file esterni hanno warning noti)   |
| `npm run mock:ai`  | Avvia il server mock per il parere agronomico AI         |

## Stato attuale

- Funzioni confermate: mappa interattiva, fetch Open-Meteo, calcolo sprayability, card analisi con finestre operative, integrazione mock AI.
- Funzioni **non** presenti: esportazione snapshot, autenticazione, indice peronospora, salvataggio aree su backend, PWA.

## Roadmap breve

- Migliorare la gestione degli errori API e mostrare fallback più ricchi.
- Integrare nuove colture/prodotti e soglie avanzate.
- Aggiungere storage lato server per snapshot e preferenze condivisibili.
- Estendere il servizio AI con un backend reale (OpenAI/Anthropic o modello custom).

## Licenza

Questo progetto è distribuito per fini didattici/portfolio. Verifica le licenze delle API esterne (Open-Meteo, tile provider) prima di un uso in produzione.
