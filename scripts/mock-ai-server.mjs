/*
Come usarlo
Crea .env.local con VITE_AI_API_URL=http://127.0.0.1:8787/api/ai/agronomist-advice.
Avvia il server mock: npm run mock:ai.
In un’altra shell esegui npm run dev e apri la pagina: il blocco “Parere agronomico AI” mostrerà la risposta mock senza più l’errore “Servizio AI non disponibile”.
Quando avrai un endpoint reale, aggiorna VITE_AI_API_URL di conseguenza; il frontend continuerà a funzionare con la stessa logica.
*/
import { createServer } from 'node:http';
import { buildAdvice } from '../backend/build-advice.js';

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
