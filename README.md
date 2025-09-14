# Modello PRD – Sito Web

**Titolo del progetto:** AGRIMETEO
**Data di creazione del documento:** 13/09/2025
**Autore / Responsabile:** Montini Francesca

---

## 1) Informazioni generali

Piattaforma web “map‑first” per visualizzare dati meteo contestuali ad un’area agricola e calcolare indici utili all’operatività (es. sprayability e rischio malattia v0). Primo obiettivo: **prototipo rapido da portfolio** ma già **utile**.

---

## 2) Obiettivi del sito

**Scopo principale**
Lanciare una **Web App** che, partendo da una **mappa interattiva**, consente di selezionare un’area (campo/coordinate) e mostrare **dati meteo essenziali** (oggi/48h) con un **calcolo automatico**:

* **Indice di Sprayability v0** (fattibilità del trattamento) basato su vento, pioggia prevista, temperatura e UR.
* **Indice di Favorabilità Peronospora v0 (opzionale)** per vigneto.

**Contesto & problema**
Gli agricoltori hanno bisogno di una vista unica e affidabile su meteo (pioggia, umidità, vento…), condizioni del campo e stato colturale per decidere se/come/quando trattare una coltura in una specifica zona. Oggi i dati sono frammentati tra sensori, app meteo e taccuini, con decisioni poco tracciabili.

**Obiettivo del prodotto**

* Raccogliere dati meteo (osservato + forecast) per coordinate.
* Visualizzare metriche chiave e grafici rapidi.
* Eseguire un **calcolo** (sprayability + rischio v0) con **spiegazioni**.
* Consentire la **condivisione**/export di un “snapshot” dell’area.

**North Star Metric**: aree/coordinate analizzate con almeno 1 indice calcolato.
**Metriche di successo**: # snapshot condivisi, % utenti che tornano entro 7 giorni, % finestre “Buone” usate per pianificare, NPS.

---

## 3) Target utenti

**Utenti principali**

* **Piccole/medie aziende agricole**: controllare meteo e scegliere finestre operative.
* **Consorzi/cooperative**: consultazione rapida per comunicazioni areali.
* **Agronomi/contoterzisti**: validare condizioni meteo e supportare decisioni.

**User stories (estratto)**

* Come **agricoltore**, voglio selezionare un punto sulla mappa e vedere **oggi‑domani** la **finestra ottimale** per trattare.
* Come **agronomo**, voglio capire **perché** l’indice è Alto/Basso (fattori: vento, pioggia, UR…).
* Come **responsabile**, voglio **esportare** un PDF/PNG della vista per archivio o condivisione.

### 3.5) Ambito (Scope)

**Portfolio MVP (Map Snapshot)**

1. **Mappa interattiva** (OSM/MapLibre): ricerca indirizzo/Comune, GPS, click su mappa, disegno **cerchio o poligono semplice** (buffer \~100–500 m).
2. **Dati meteo** per area selezionata: condizioni attuali + **forecast 48h** (step orario).
3. **Indice Sprayability v0** → valutazione **Buona / Discreta / Scarsa** per le prossime 24–48h con **finestre** orarie.
4. **Indice Peronospora v0 (opzionale)** se l’utente indica **coltura = vite**.
5. **Explain v0**: top fattori che determinano l’esito (es. vento medio, pioggia prevista, UR).
6. **Snapshot & share**: export **PNG/PDF** della schermata (mappa + pannello dati) con link condivisibile (slug pubblico read‑only).
7. **Pagina Info/Privacy** con note GDPR, attribution mappe e fonti meteo.

**Fase Next (facoltativa, post‑portfolio)**: storico 7–30 giorni, salvataggio aree, account e preferenze, notifiche email.

---

## 4) Funzionalità richieste

**Pagine principali**

* **/ (Home)**: pitch breve + CTA “Apri mappa”.
* **/map** *(core)*: mappa a schermo intero con pannello laterale “Area → Meteo → Indici → Finestre → Export”.
* **/about**: chi siamo, contatti, attribution, privacy & cookie.
* **/s/{slug}**: pagina pubblica di **snapshot condiviso** (solo lettura).

**Funzionalità extra (MVP)**

* Ricerca indirizzi (geocoding) e **geolocalizzazione** utente.
* Disegno area semplice (cerchio raggio selezionabile).
* **Export PNG/PDF** con QR/link allo snapshot.
* Dark mode.

**Navigazione / Menu**
Header minimale: **Mappa** · **About** · **Dark/Light**. Footer con attribution OSM, link Privacy.

---

## 5) Requisiti tecnici

**Stack scelto**

* **Frontend:** **React + Tailwind CSS** (Next.js consigliato per routing/SSR, ma possibile anche Vite). Librerie: **MapLibre GL** o **Leaflet** per la mappa; **Recharts** per grafici semplici.
* **Backend (Python):** **FastAPI** (+ `httpx` per chiamate esterne, `pydantic` per schemi). Caching: `redis` (opzionale) o cache in‑memory con TTL.
* **API interne:** `/api/weather` (proxy provider → normalizza variabili), `/api/compute/sprayability` (calcolo indici), `/api/geocode` (proxy geocoding se necessario).
* **PWA:** installabile, cache tile base (stale‑while‑revalidate).
* **Sicurezza:** chiavi provider solo lato server; CORS aperto al dominio web.

**Hosting e dominio**

* **Frontend:** Vercel (o Netlify). Dominio provvisorio `agrimeteo.app`.
* **Backend Python:** Fly.io / Render / Railway / Cloud Run (scelta in base ai costi).
* **CDN:** attiva su frontend; backend con caching applicativo.

**Integrazioni esterne (solo fonti gratuite / free‑tier)**

* **Meteo (consigliato):** **Open‑Meteo** (senza chiave) per *current + hourly forecast* (48–168h). Variabili: `temperature_2m, relative_humidity_2m, precipitation, wind_speed_10m, wind_gusts_10m, wind_direction_10m`.
* **Meteo (alternativa):** **MET Norway – Locationforecast 2.0** (gratis, **richiede User‑Agent** identificativo).
* **Meteo (opzione extra):** **OpenWeather** – One Call 3.0 (**1.000 chiamate/giorno gratuite**) o API “Current/Forecast” (free plan **60 req/min; 1M/mese**).
* **Geocoding/Reverse:** **Open‑Meteo Geocoding** (senza chiave) **oppure** **Nominatim** (rispettare usage policy OSM, evitare carichi elevati; in produzione preferire provider dedicato).
* **Map tiles:** **MapTiler** (free tier con API key) compatibile con **MapLibre**/**Leaflet**. *Nota:* NON usare i tile OSM ufficiali per traffico di produzione.

### 5.5) Dati & fonti

* **Meteo minimo**: `timestamp, lat, lon, temp_c, rh_pct, rain_mm, wind_ms, wind_gust_ms?, wind_dir_deg`.
* **Geospaziale**: poligono o cerchio (GeoJSON), centroid.
* **Qualità**: `qc_source` (provider usato), `qc_flags` (es. dati mancanti/outlier), fallback automatico a seconda fonte.

---

## 6) Design & User Experience

**Linee guida grafiche**

* Look & feel pulito, **verde petrolio + sabbia**; tipografia **Inter**; card con angoli 2xl; icone Lucide.
* **Mobile‑first**; mappa full‑screen; pannello a **cassetto** (drawer) scorrevole.

**Siti di riferimento**

* windy.com (chiarezza layer meteo), agrometeo regionali, Mapbox Studio (pulizia UI mappe).

**Requisiti di accessibilità**

* **WCAG 2.2 AA**: contrasto ≥ 4.5:1, focus visibile, **tastiera** completa.
* Alternative testuali per icone; etichette ARIA su mappa e controlli; **lingua IT/EN**.

### 6.5) AI/Modellazione (MVP v0)

**Indice Sprayability v0**

* **Input** (ora corrente + prossime 48h): `wind_ms`, `gust_ms` (opz.), `rain_next6h_mm`, `temp_c`, `rh_%`.
* **Regole**:

  * **Buona** se *tutte* vere: `wind_ms ≤ 4`, `gust_ms ≤ 6` (se disponibile), `rain_next6h_mm ≤ 0.2`, `8°C ≤ temp_c ≤ 30°C`, `30% ≤ rh ≤ 90%`.
  * **Discreta** se non Buona ma: `wind_ms ≤ 6` e `rain_next6h_mm ≤ 0.5`.
  * **Scarsa** altrimenti.
* **Output**: per ciascuna ora → badge **Buona/Discreta/Scarsa**; calcolo **finestre** (consecutive ≥2h).
* **Explain**: elenco fattori bloccanti (es. “vento 7.2 m/s”).

**Indice Favorabilità Peronospora v0 (solo Vite)**

* **Trigger Alto**: nelle **ultime 48h** `rain_mm ≥ 10` **e** `Tmedia > 11°C` **e** nelle **ultime 24h** `rh_hours_over_85 ≥ 8`.
* **Medio**: se `rh_hours_over_85 ≥ 6` **o** `rain_mm ≥ 5` con `Tmedia > 10°C`.
* **Basso**: altrimenti.
* **Nota**: bagnatura fogliare stimata da RH/T se non disponibile. **Supporto decisionale**, non prescrittivo.

**Valutazione**

* Test “back‑of‑the‑envelope” su 2–3 località; controllo soglie con feedback agronomico.
* Metriche interne: % ore classificate; copertura dati; coerenza con condizioni reali riferite dagli utenti pilota.

**Human‑in‑the‑loop**

* Pulsante “Ha senso?” → feedback **Sì/No** + motivo (opzionale) per calibrare soglie future.

**Sicurezza**

* Banner “Le indicazioni sono informative; attenersi sempre a etichette e norme locali”.

---

## 7) UX / Flussi chiave

**Onboarding**: entra → Home → “Apri mappa” → consenti geolocalizzazione (opz.).

**Mappa (core)**

1. Seleziona area: **tap lungo** (cerchio 250 m) o **disegna**; oppure cerca indirizzo.
2. Pannello laterale → **Meteo 48h** (grafico pioggia/vento/T).
3. Sezione **Indici** → lista ore con badge **Sprayability**; se coltura = Vite → mostra **Peronospora v0**.
4. **Finestre consigliate** (intervalli orari).
5. **Export** → PNG/PDF + link pubblico `/s/{slug}`.

**Accessibilità**: scorciatoie tastiera (O: zoom out, I: zoom in), tab order chiaro; annunci ARIA per cambi stato.

---

## 8) Metriche di successo

* **Adozione**: # sessioni/map loads, # aree selezionate, tempo medio in mappa.
* **Valore**: # export/snapshot, % utenti che consultano le **finestre**.
* **Qualità**: % risposte “Ha senso? Sì”, tasso errori API, latenza panel < 1.5s.

---

## 9) Vincoli & Timeline – Budget previsto

* **Vincoli**: uso di una sola fonte meteo; limiti rate API free; attributi OSM obbligatori.
* **Timeline** (indicativa, 2–3 settimane):

  * Settimana 1: setup stack, mappa, geocoding, UI base.
  * Settimana 2: integrazione meteo, calcolo sprayability, export snapshot.
  * Settimana 3 (facoltativa): rischio peronospora v0, dark mode, pagina share.
* **Budget**: hosting low‑cost (Vercel free/pro), eventuale chiave meteo (10–50€/mese) e Map tiles (0–30€/mese) in base a traffico.

---

## 10) Requisiti funzionali (MVP)

* **RF1**: Vista mappa con ricerca, geolocate e disegno cerchio/poligono semplice.
* **RF2**: Chiamata meteo per coordinate + forecast 48h (orario).
* **RF3**: Calcolo **Indice Sprayability v0** e **finestre**.
* **RF4**: (Opz.) Calcolo **Peronospora v0** se coltura = Vite.
* **RF5**: Pannello Explain (fattori principali, blocchi).
* **RF6**: **Export PNG/PDF** e **link snapshot** pubblico.
* **RF7**: Pagina About/Privacy, attribution, cookie banner semplice.

## 11) Requisiti non funzionali

* **Prestazioni**: TTFB < 2s; aggiornamento pannello < 1.5s; bundle < 300 kB (LCP < 2.5s).
* **Affidabilità**: graceful fallback se API fail; retry 1x; messaggi chiari.
* **Scalabilità**: 100 richieste/min senza degrado su tier free.
* **Sicurezza**: chiavi API lato server; HTTPS obbligatorio.
* **Privacy**: nessun dato personale obbligatorio; IP e coordinate usate solo per la sessione salvo esplicito salvataggio snapshot.

## 12) Architettura (alto livello)

* **Frontend** Next.js (SSR/SSG + client components per mappa).
* **API** /api/weather (proxy verso provider), /api/snapshot (crea slug + salva JSON statico).
* **Storage**: file JSON per snapshot (object storage) o DB leggero (Supabase/SQLite).
* **Mappe**: MapLibre + tiles OSM/MapTiler.
* **Analytics**: Umami/Vercel.

## 13) Schema dati (minimo)

* **AreaSelection**: `id, geojson, centroid {lat, lon}, radius_m (se cerchio), created_at`.
* **WeatherSnapshot**: `id, area_id, provider, fetched_at, hourly[{ts, temp_c, rh, wind_ms, rain_mm, gust_ms?}]`.
* **ComputationResult**: `id, area_id, sprayability[{ts, label}], windows[{start,end,label}], peronospora_v0{level, factors[]?}`.
* **Share**: `slug, area_id, snapshot_id, expires_at?`.

## 14) Policy & avvertenze

* Le indicazioni sono **informative**. Fare sempre riferimento a **etichette** dei prodotti e **normativa locale**.
* Mostrare avvertenze di sicurezza (DPI, PHI/REI **non** calcolati in MVP).
* Tracciare il **consenso** per eventuale salvataggio di coordinate/snapshot.

## 15) KPI & analitiche

* Aree analizzate/utente, % utenti con ≥1 export, % rating “Ha senso? Sì”, errori 5xx API, LCP.

## 16) Rischi & mitigazioni

* **Dati meteo incompleti** → fallback a seconda fonte o messaggio “copertura bassa”.
* **Falsi positivi/negativi indici** → etichetta “v0 sperimentale”, raccolta feedback.
* **Limiti API** → caching a 10–15 min per area, throttle.
* **Connettività scarsa** → cache lato client di ultimo pannello (non sensibile).

## 17) Roadmap sintetica

* **v0.1**: mappa + meteo + sprayability + export PNG.
* **v0.2**: snapshot pubblico + PDF + dark mode.
* **v0.3**: peronospora v0 + storico 7 giorni (facolt.).

## 18) Criteri di accettazione (MVP)

* Da **/map**, selezionando un punto in Italia, si vede **forecast 48h** e **Indice Sprayability** per ogni ora.
* Viene mostrata **almeno una finestra** (se condizioni rispettate) nelle prossime 24–48h.
* Il pannello Explain elenca **≥1 fattore bloccante** quando l’indice è “Scarsa”.
* L’utente può generare un **PNG** con mappa+pannello e un **link pubblico** `/s/{slug}`.
