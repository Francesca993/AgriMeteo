import { buildAdvice } from '../../backend/build-advice.js';

const ROUTE_METHODS = ['POST', 'OPTIONS'];

async function readRequestBody(req) {
  const chunks = [];
  for await (const chunk of req) {
    chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function applyCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
}

export default async function handler(req, res) {
  applyCors(res);

  if (!ROUTE_METHODS.includes(req.method)) {
    res.statusCode = 405;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    let payload = req.body;

    if (Buffer.isBuffer(payload)) {
      payload = payload.toString('utf8');
    }

    if (typeof payload === 'string') {
      payload = payload.trim() ? JSON.parse(payload) : {};
    }

    if (!payload || (typeof payload === 'object' && !Array.isArray(payload) && Object.keys(payload).length === 0)) {
      const raw = await readRequestBody(req);
      payload = raw.trim() ? JSON.parse(raw) : {};
    }

    if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
      throw new SyntaxError('Invalid payload');
    }

    const advice = buildAdvice(payload);
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(advice));
  } catch (error) {
    res.statusCode = 400;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: error instanceof SyntaxError ? 'Invalid JSON body' : 'Unable to process request' }));
  }
}
