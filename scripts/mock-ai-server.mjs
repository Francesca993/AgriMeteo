/*
Come usarlo
Crea .env.local con VITE_AI_API_URL=http://127.0.0.1:8787/api/ai/agronomist-advice.
Avvia il server mock: npm run mock:ai.
In un’altra shell esegui npm run dev e apri la pagina: il blocco “Parere agronomico AI” mostrerà la risposta mock senza più l’errore “Servizio AI non disponibile”.
Quando avrai un endpoint reale, aggiorna VITE_AI_API_URL di conseguenza; il frontend continuerà a funzionare con la stessa logica.
*/
import { createServer } from 'node:http';

const PORT = Number(process.env.AI_SERVER_PORT ?? 8787);
const HOST = process.env.AI_SERVER_HOST ?? '127.0.0.1';
const ROUTE = '/api/ai/agronomist-advice';

function collectRequestBody(req) {
  return new Promise((resolve) => {
    let data = '';
    req.on('data', (chunk) => {
      data += chunk;
    });
    req.on('end', () => {
      resolve(data);
    });
  });
}

function buildAdvice(payload) {
  const cropLabel = payload?.crop?.label ?? 'coltura selezionata';
  const productLabel = payload?.product?.label ?? 'prodotto scelto';
  const status = payload?.current?.status ?? 'n/d';
  const score = payload?.current?.score != null ? ` (indice ${payload.current.score}%)` : '';

  const headline = 'Parere agronomico AI (mock)';
  const summary = `Mock server: per ${cropLabel.toLowerCase()} con intervento ${productLabel.toLowerCase()} le condizioni sono ${status.toLowerCase()}${score}.`;

  const baseRecommendation = payload?.windows?.[0]
    ? `Programma il trattamento tra ${payload.windows[0].time} (${payload.windows[0].status}, conf. ${payload.windows[0].confidence}%).`
    : 'Nessuna finestra rilevata: considera di ricalibrare le soglie o rimandare.';

  const factorNotes = (payload?.factors ?? [])
    .filter((factor) => factor?.status && factor.status !== 'good')
    .map((factor) => `${factor.name}: ${factor.value} — ${factor.threshold}.`);

  const recommendations = [baseRecommendation, 'Verifica compatibilità fitosanitaria con il tecnico di fiducia.'];
  const cautions = factorNotes.length > 0
    ? factorNotes
    : ['Condizioni generali stabili. Mantieni il monitoraggio meteo prima dell’intervento.'];

  const productSuggestion = `Suggerimento mock: ${productLabel} con protocollo standard.`;

  return {
    headline,
    summary,
    productSuggestion,
    recommendedActions: recommendations,
    cautions,
  };
}

const server = createServer(async (req, res) => {
  if (req.url !== ROUTE) {
    res.writeHead(404, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
    res.end(JSON.stringify({ error: 'Not found' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let rawBody = '';
  try {
    rawBody = await collectRequestBody(req);
  } catch (error) {
    res.writeHead(500, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ error: 'Unable to read request body' }));
    return;
  }

  let payload;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch (error) {
    res.writeHead(400, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });
    res.end(JSON.stringify({ error: 'Invalid JSON body' }));
    return;
  }

  const advice = buildAdvice(payload);
  res.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  });
  res.end(JSON.stringify(advice));
});

server.listen(PORT, HOST, () => {
  console.log(`Mock AI advice server listening on http://${HOST}:${PORT}${ROUTE}`);
});
