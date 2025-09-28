export function buildAdvice(payload = {}) {
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
