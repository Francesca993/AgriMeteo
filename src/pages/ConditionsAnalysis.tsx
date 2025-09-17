import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  Activity,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Wind,
  Droplets,
  Thermometer,
  Eye,
  Gauge,
  Cloud,
  ArrowRight,
  BarChart3,
  LineChart,
  Calendar,
  Bot,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  PREFS_STORAGE_KEY,
  DEFAULT_THRESHOLDS,
  CROP_PRESETS,
  PRODUCT_PRESETS,
  WIND_SENSITIVITY_PRESETS,
  mergeThresholds,
  thresholdsEqual,
  fetchHourly,
  evaluateHour,
  nearestIndexToNow,
  fmtHHmm,
  WEIGHTS,
  type HourPoint,
  type Thresholds,
  type CropPresetKey,
  type ProductPresetKey,
  type WindSensitivityKey,
  type Category,
} from '@/lib/sprayability';

const INITIAL_THRESHOLDS = mergeThresholds(
  DEFAULT_THRESHOLDS,
  CROP_PRESETS.standard.thresholds,
  PRODUCT_PRESETS.fungicida.adjustments,
  WIND_SENSITIVITY_PRESETS.balanced.overrides,
);

type Trend = 'up' | 'down' | 'stable';
type Impact = 'Positivo' | 'Neutro' | 'Negativo';

type AnalysisMetric = {
  name: string;
  value: number | null;
  trend: Trend;
  description: string;
  icon: LucideIcon;
  color: 'green' | 'blue' | 'purple' | 'orange';
};

type EnvironmentalFactor = {
  factor: string;
  status: string;
  impact: Impact;
  confidence: number | null;
};

type AlertItem = {
  id: string;
  tone: 'warning' | 'positive' | 'info';
  title: string;
  detail: string;
};

type OperationalWindow = {
  time: string;
  status: Category;
  confidence: number;
  reason: string;
};

function clamp(value: number, min = 0, max = 100) {
  return Math.min(Math.max(value, min), max);
}

function average(values: number[]): number | null {
  const filtered = values.filter((v) => Number.isFinite(v));
  if (filtered.length === 0) return null;
  const sum = filtered.reduce((acc, v) => acc + v, 0);
  return sum / filtered.length;
}

function averageFromPoints(points: Array<number | null | undefined>): number | null {
  const filtered = points.filter((v): v is number => typeof v === 'number' && Number.isFinite(v));
  if (filtered.length === 0) return null;
  const sum = filtered.reduce((acc, v) => acc + v, 0);
  return sum / filtered.length;
}

function gustSpread(points: HourPoint[]): number {
  let sum = 0;
  let count = 0;
  points.forEach((p) => {
    if (typeof p.gust_ms === 'number' && typeof p.wind_ms === 'number') {
      sum += Math.max(0, p.gust_ms - p.wind_ms);
      count++;
    }
  });
  return count > 0 ? sum / count : 0;
}

function sumRain(points: HourPoint[]): number {
  return points.reduce((acc, p) => acc + (typeof p.rain_mm === 'number' ? p.rain_mm : 0), 0);
}

function computeOperationalWindows(
  data: HourPoint[],
  thresholds: Thresholds,
  minWindowHours: number,
  offset = 0,
) {
  const evals = data.map((d) => evaluateHour(d, thresholds));
  const minLen = Math.max(1, Math.floor(minWindowHours));
  const windows: Array<{ startIdx: number; endIdx: number; status: Category; confidence: number; reason: string }>= [];

  let s = 0;
  while (s < evals.length) {
    const cat = evals[s].category;
    if (cat === 'Scarsa') {
      s++;
      continue;
    }
    let e = s;
    let sumScore = 0;
    let count = 0;
    const reasons: string[] = [];
    while (e < evals.length && (evals[e].category === 'Buona' || evals[e].category === 'Discreta')) {
      sumScore += evals[e].score;
      count++;
      if (reasons.length < 3 && evals[e].brief) reasons.push(evals[e].brief);
      e++;
    }
    if (count >= minLen) {
      const reason = reasons[0] || evals[s].brief || '';
      const avgScore = sumScore / count;
      windows.push({
        startIdx: offset + s,
        endIdx: offset + e - 1,
        status: avgScore >= 85 ? 'Buona' : 'Discreta',
        confidence: Math.round(avgScore),
        reason,
      });
    }
    s = e + 1;
  }
  return windows;
}

const fallbackMetrics: AnalysisMetric[] = [
  {
    name: 'Stabilità Atmosferica',
    value: null,
    trend: 'stable',
    description: 'Seleziona un punto sulla mappa per i dati in tempo reale',
    icon: Activity,
    color: 'green',
  },
  {
    name: 'Rischio Deriva',
    value: null,
    trend: 'stable',
    description: 'In attesa di dati locali su vento e raffiche',
    icon: Wind,
    color: 'blue',
  },
  {
    name: 'Finestra Operativa',
    value: null,
    trend: 'stable',
    description: 'Disponibilità della finestra operativa non ancora calcolata',
    icon: Calendar,
    color: 'purple',
  },
  {
    name: 'Stress Idrico',
    value: null,
    trend: 'stable',
    description: 'Umidità e pioggia saranno stimate dopo la selezione',
    icon: Droplets,
    color: 'orange',
  },
];

const fallbackFactors: EnvironmentalFactor[] = [
  { factor: 'Inversione Termica', status: 'n/d', impact: 'Neutro', confidence: null },
  { factor: 'Turbolenza Aria', status: 'n/d', impact: 'Neutro', confidence: null },
  { factor: 'Bagnatura Fogliare', status: 'n/d', impact: 'Neutro', confidence: null },
  { factor: 'Radiazione Solare', status: 'n/d', impact: 'Neutro', confidence: null },
];

const fallbackAlerts: AlertItem[] = [
  {
    id: 'select-area',
    tone: 'info',
    title: 'Seleziona un punto sulla mappa',
    detail: 'Scegli la tua area di interesse per abilitare il monitoraggio avanzato.',
  },
];

type PredictiveInsight = {
  score: number | null;
  label: string;
  note: string;
  recommendation: string;
  extra?: string;
};

type PredictiveSummary = {
  dispersion: PredictiveInsight;
  evaporation: PredictiveInsight & { estimateMinutes: number | null };
  deposition: PredictiveInsight;
};

const fallbackPredictive: PredictiveSummary = {
  dispersion: {
    score: null,
    label: 'n/d',
    note: 'Seleziona una località per stimare la dispersione.',
    recommendation: 'Definisci l’area operativa per ottenere indicazioni mirate.',
  },
  evaporation: {
    score: null,
    label: 'n/d',
    note: 'Dati microclimatici insufficienti per valutare l’evaporazione.',
    recommendation: 'Verifica temperatura e umidità dell’area selezionata.',
    estimateMinutes: null,
  },
  deposition: {
    score: null,
    label: 'n/d',
    note: 'Impossibile stimare l’efficienza di deposizione senza dati locali.',
    recommendation: 'Seleziona un punto sulla mappa per valutare la stabilità atmosferica.',
  },
};

const ConditionsAnalysis = () => {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [hourly, setHourly] = useState<HourPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [lastFetchTs, setLastFetchTs] = useState<number | null>(null);

  const [selectedCrop, setSelectedCrop] = useState<CropPresetKey>('standard');
  const [selectedProduct, setSelectedProduct] = useState<ProductPresetKey>('fungicida');
  const [windSensitivity, setWindSensitivity] = useState<WindSensitivityKey>('balanced');
  const [thresholds, setThresholds] = useState<Thresholds>(INITIAL_THRESHOLDS);
  const [minWindowHours, setMinWindowHours] = useState<number>(2);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  const cropPreset = CROP_PRESETS[selectedCrop];
  const productPreset = PRODUCT_PRESETS[selectedProduct];
  const windPreset = WIND_SENSITIVITY_PRESETS[windSensitivity];

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PREFS_STORAGE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved === 'object') {
          if (saved.selectedCrop && saved.selectedCrop in CROP_PRESETS) {
            setSelectedCrop(saved.selectedCrop as CropPresetKey);
          }
          if (saved.selectedProduct && saved.selectedProduct in PRODUCT_PRESETS) {
            setSelectedProduct(saved.selectedProduct as ProductPresetKey);
          }
          if (saved.windSensitivity && saved.windSensitivity in WIND_SENSITIVITY_PRESETS) {
            setWindSensitivity(saved.windSensitivity as WindSensitivityKey);
          }
          if (typeof saved.minWindowHours === 'number' && saved.minWindowHours >= 1) {
            setMinWindowHours(Math.min(12, Math.max(1, Math.round(saved.minWindowHours))));
          }
        }
      }
    } catch {
      // preferenze non disponibili
    } finally {
      setPrefsLoaded(true);
    }
  }, []);

  useEffect(() => {
    const merged = mergeThresholds(
      DEFAULT_THRESHOLDS,
      CROP_PRESETS[selectedCrop]?.thresholds,
      PRODUCT_PRESETS[selectedProduct]?.adjustments,
      WIND_SENSITIVITY_PRESETS[windSensitivity]?.overrides,
    );
    setThresholds((prev) => (thresholdsEqual(prev, merged) ? prev : merged));
  }, [selectedCrop, selectedProduct, windSensitivity]);

  useEffect(() => {
    try {
      const n = localStorage.getItem('agri:selectedPlaceName');
      if (n) setPlaceName(n);
      const c = localStorage.getItem('agri:selectedPlaceCoords');
      if (c) {
        const [latStr, lonStr] = c.split(',').map((s) => s.trim());
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setCoords({ lat, lon });
        }
      }
    } catch {
      // nessuna selezione salvata
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true);
    setErr(null);
    fetchHourly(coords.lat, coords.lon)
      .then((data) => {
        setHourly(data);
        setLastFetchTs(Date.now());
      })
      .catch((e) => setErr(e?.message || 'Errore dati meteo'))
      .finally(() => setLoading(false));
  }, [coords]);

  const derived = useMemo(() => {
    if (!hourly || hourly.length === 0) return null;
    const times = hourly.map((p) => p.ts);
    const idx = nearestIndexToNow(times);
    const currentHour = hourly[idx];
    const currentEval = evaluateHour(currentHour, thresholds);

    const upcoming = hourly.slice(idx, idx + 12);
    const later = hourly.slice(idx + 12, idx + 24);
    const upcomingEvals = upcoming.map((p) => evaluateHour(p, thresholds));
    const laterEvals = later.map((p) => evaluateHour(p, thresholds));

    const nearSpread = gustSpread(upcoming.slice(0, 6));
    const futureSpread = gustSpread(upcoming.slice(6, 12));

    const stabilityValue = clamp(Math.round(100 - Math.min(70, nearSpread * 25)));
    const stabilityTrend = futureSpread < nearSpread - 0.2 ? 'up' : futureSpread > nearSpread + 0.2 ? 'down' : 'stable';
    const stabilityDesc = stabilityValue >= 70
      ? 'Flussi regolari e vento quasi costante'
      : 'Variazioni di raffica da monitorare';

    const windScoreNow = currentEval.factors.wind.gained / WEIGHTS.wind;
    const forecastWindScore = average(upcomingEvals.map((ev) => ev.factors.wind.gained / WEIGHTS.wind)) ?? windScoreNow;
    const riskValue = clamp(Math.round(100 - windScoreNow * 100));
    const futureRisk = clamp(Math.round(100 - forecastWindScore * 100));
    const riskTrend = futureRisk < riskValue - 5 ? 'down' : futureRisk > riskValue + 5 ? 'up' : 'stable';
    const riskDesc = riskValue <= 30
      ? 'Basso rischio di deriva del prodotto'
      : riskValue <= 60
        ? 'Rischio moderato, monitorare raffiche'
        : 'Rischio elevato: vento ai limiti';

    const workableHours = upcomingEvals.filter((ev) => ev.category !== 'Scarsa').length;
    const goodHours = upcomingEvals.filter((ev) => ev.category === 'Buona').length;
    const upcomingScore = upcomingEvals.length
      ? clamp(Math.round(((goodHours * 0.7) + (workableHours * 0.3)) / upcomingEvals.length * 100))
      : null;

    const laterWorkable = laterEvals.filter((ev) => ev.category !== 'Scarsa').length;
    const laterGood = laterEvals.filter((ev) => ev.category === 'Buona').length;
    const laterScore = laterEvals.length
      ? clamp(Math.round(((laterGood * 0.7) + (laterWorkable * 0.3)) / laterEvals.length * 100))
      : upcomingScore ?? 0;
    const windowValue = upcomingScore ?? laterScore;
    const windowTrend = upcomingScore == null
      ? 'stable'
      : laterScore > upcomingScore + 5
        ? 'up'
        : laterScore < upcomingScore - 5
          ? 'down'
          : 'stable';
    const windowDesc = windowValue != null && windowValue >= 80
      ? 'Ampia finestra per operazioni efficaci'
      : windowValue != null && windowValue >= 50
        ? 'Finestre operative disponibili a tratti'
        : 'Finestre limitate: pianificare con attenzione';

    const humidityAvg = averageFromPoints(upcoming.map((p) => p.rh_pct)) ?? 60;
    const rainNext12 = sumRain(upcoming);
    const drynessIndex = clamp(100 - humidityAvg);
    const rainMitigation = Math.max(0, 1 - Math.min(rainNext12 / 3, 1));
    const stressValue = clamp(Math.round(drynessIndex * 0.6 + rainMitigation * 40));

    const laterHumidity = averageFromPoints(later.map((p) => p.rh_pct)) ?? humidityAvg;
    const laterRain = sumRain(later);
    const laterDryness = clamp(100 - laterHumidity);
    const laterMitigation = Math.max(0, 1 - Math.min(laterRain / 3, 1));
    const laterStress = clamp(Math.round(laterDryness * 0.6 + laterMitigation * 40));
    const stressTrend = laterStress < stressValue - 5 ? 'down' : laterStress > stressValue + 5 ? 'up' : 'stable';
    const stressDesc = stressValue <= 40
      ? 'Livelli di stress idrico contenuti'
      : stressValue <= 70
        ? 'Stress idrico moderato nelle colture'
        : 'Stress idrico elevato: valutare irrigazione';

    const gradientTemp = (hourly[idx + 3]?.temp_c ?? currentHour.temp_c ?? 0) - (currentHour.temp_c ?? 0);
    const turbulenceStatus = nearSpread <= 1
      ? 'Bassa'
      : nearSpread <= 2
        ? 'Moderata'
        : 'Elevata';
    const turbulenceImpact: Impact = nearSpread <= 1.5 ? 'Positivo' : nearSpread <= 2.5 ? 'Neutro' : 'Negativo';

    const wetStatus = rainNext12 > 0.2 || humidityAvg > 85 ? 'Umida' : 'Secca';
    const wetImpact: Impact = wetStatus === 'Secca' ? 'Positivo' : 'Neutro';

    const currentHourValue = currentHour.ts ? new Date(currentHour.ts).getHours() : null;
    const radiationStatus = currentHourValue == null
      ? 'n/d'
      : currentHourValue >= 10 && currentHourValue <= 16
        ? 'Alta'
        : currentHourValue >= 7 && currentHourValue < 10
          ? 'Media'
          : 'Bassa';
    const radiationImpact: Impact = radiationStatus === 'Alta' ? 'Neutro' : 'Positivo';

    const factors: EnvironmentalFactor[] = [
      {
        factor: 'Inversione Termica',
        status: gradientTemp <= -2 ? 'Probabile' : gradientTemp <= -1 ? 'Possibile' : 'Assente',
        impact: gradientTemp <= -2 ? 'Negativo' : gradientTemp <= -1 ? 'Neutro' : 'Positivo',
        confidence: clamp(100 - Math.abs(gradientTemp) * 10),
      },
      {
        factor: 'Turbolenza Aria',
        status: turbulenceStatus,
        impact: turbulenceImpact,
        confidence: clamp(100 - nearSpread * 15),
      },
      {
        factor: 'Bagnatura Fogliare',
        status: wetStatus,
        impact: wetImpact,
        confidence: clamp(90 - rainNext12 * 10),
      },
      {
        factor: 'Radiazione Solare',
        status: radiationStatus,
        impact: radiationImpact,
        confidence: radiationStatus === 'n/d' ? null : 75,
      },
    ];

    const futureWindows = computeOperationalWindows(hourly.slice(idx), thresholds, minWindowHours, idx)
      .slice(0, 5)
      .map<OperationalWindow>((w) => ({
        time: `${fmtHHmm(hourly[w.startIdx].ts)}-${fmtHHmm(hourly[w.endIdx].ts)}`,
        status: w.status,
        confidence: w.confidence,
        reason: w.reason,
      }));

    const alerts: AlertItem[] = [];
    if (gradientTemp <= -2) {
      alerts.push({
        id: 'temp-inversion',
        tone: 'warning',
        title: 'Possibile inversione termica',
        detail: `Monitorare dalle ${fmtHHmm(currentHour.ts)}: ΔT ${gradientTemp.toFixed(1)}°C nelle prossime 3h`,
      });
    }

    if (futureWindows.length > 0) {
      const best = futureWindows[0];
      alerts.push({
        id: 'best-window',
        tone: 'positive',
        title: 'Finestra ottimale identificata',
        detail: `${best.time} • ${best.status} • Confidenza ${best.confidence}%`,
      });
    } else {
      alerts.push({
        id: 'no-window',
        tone: 'info',
        title: 'Nessuna finestra continua rilevata',
        detail: 'Valuta l’adattamento delle soglie o un intervallo temporale differente.',
      });
    }

    if (alerts.length < 2) {
      alerts.push({
        id: 'water-stress',
        tone: stressValue >= 65 ? 'warning' : 'info',
        title: stressValue >= 65 ? 'Stress idrico in aumento' : 'Stress idrico contenuto',
        detail: stressValue >= 65
          ? 'Considera un’irrigazione di supporto o un intervento mitigante.'
          : 'Livelli di umidità favorevoli al trattamento nelle prossime ore.',
      });
    }

    const metrics: AnalysisMetric[] = [
      {
        name: 'Stabilità Atmosferica',
        value: stabilityValue,
        trend: stabilityTrend,
        description: stabilityDesc,
        icon: Activity,
        color: 'green',
      },
      {
        name: 'Rischio Deriva',
        value: riskValue,
        trend: riskTrend,
        description: riskDesc,
        icon: Wind,
        color: 'blue',
      },
      {
        name: 'Finestra Operativa',
        value: windowValue,
        trend: windowTrend,
        description: windowDesc,
        icon: Calendar,
        color: 'purple',
      },
      {
        name: 'Stress Idrico',
        value: stressValue,
        trend: stressTrend,
        description: stressDesc,
        icon: Droplets,
        color: 'orange',
      },
    ];

    const windNow = currentHour?.wind_ms ?? windScoreNow * 6;
    const gustNow = currentHour?.gust_ms ?? windNow;
    const tempNow = currentHour?.temp_c ?? 22;

    const dispersionScore = clamp(Math.round(100 - riskValue));
    const dispersionLabel = riskValue >= 60 ? 'Critico' : riskValue >= 35 ? 'Attenzione' : 'Controllato';
    const dispersionNote = `Vento medio ${windNow.toFixed(1)} m/s • Raffiche ${gustNow.toFixed(1)} m/s`;
    const dispersionRecommendation =
      riskValue >= 60
        ? 'Passa a ugelli antideriva e riduci altezza barra (≤50 cm).'
        : riskValue >= 35
          ? 'Mantieni velocità sotto 6 km/h e verifica barriere anti-deriva.'
          : 'Configurazione corrente adeguata; continua a monitorare le raffiche.';

    const humidityForEvap = humidityAvg ?? currentHour?.rh_pct ?? 60;
    const evapMinutesRaw = 12 + (humidityForEvap - 60) / 3 - (tempNow - 22) / 2 - (windNow || 0) * 1.5;
    const evaporationMinutes = clamp(Math.round(evapMinutesRaw), 3, 25);
    const evaporationScore = clamp(Math.round((evaporationMinutes / 25) * 100));
    const evaporationLabel = evaporationMinutes <= 6 ? 'Rapida' : evaporationMinutes <= 12 ? 'Bilanciata' : 'Lenta';
    const evaporationNote = `Temperatura ${tempNow.toFixed(1)}°C • UR ${humidityForEvap.toFixed(0)}%`;
    const evaporationRecommendation =
      evaporationMinutes <= 6
        ? 'Utilizza gocce medio-grosse o aggiungi condizionanti per rallentare l’evaporazione.'
        : evaporationMinutes <= 12
          ? 'Condizioni equilibrate: mantieni il volume abituale.'
          : 'Riduci il volume irrorato per evitare gocciolamenti e colature.';

    const stressPenalty = Math.min(60, Math.abs(stressValue - 45) * 1.2);
    const depositionScore = clamp(Math.round(stabilityValue * 0.6 + (100 - stressPenalty) * 0.4));
    const depositionLabel = depositionScore >= 75 ? 'Ottimale' : depositionScore >= 55 ? 'Buona' : 'Bassa';
    const depositionNote = `Stabilità ${stabilityValue}% • Stress idrico ${stressValue}%`;
    const depositionRecommendation =
      depositionScore >= 75
        ? 'Approfitta della stabilità per trattamenti mirati anche su bersagli difficili.'
        : depositionScore >= 55
          ? 'Mantieni ugelli a ventaglio stretto e monitora uniformità di bagnatura.'
          : 'Aumenta volume e riduci velocità per migliorare la deposizione.';

    const predictive: PredictiveSummary = {
      dispersion: {
        score: dispersionScore,
        label: dispersionLabel,
        note: dispersionNote,
        recommendation: dispersionRecommendation,
      },
      evaporation: {
        score: evaporationScore,
        label: evaporationLabel,
        note: evaporationNote,
        recommendation: evaporationRecommendation,
        estimateMinutes: evaporationMinutes,
        extra: `Stimata permanenza gocce: ${evaporationMinutes} min`,
      },
      deposition: {
        score: depositionScore,
        label: depositionLabel,
        note: depositionNote,
        recommendation: depositionRecommendation,
      },
    };

    return {
      metrics,
      factors,
      alerts,
      futureWindows,
      currentHour,
      currentEval,
      riskValue,
      stabilityValue,
      windowValue,
      stressValue,
      gradientTemp,
      nearSpread,
      rainNext12,
      humidityAvg,
      predictive,
    };
  }, [hourly, thresholds, minWindowHours]);

  const metrics = derived?.metrics ?? fallbackMetrics;
  const factors = derived?.factors ?? fallbackFactors;
  const alerts = derived?.alerts ?? fallbackAlerts;
  const windows = derived?.futureWindows ?? [];
  const currentHour = derived?.currentHour ?? null;
  const currentEval = derived?.currentEval ?? null;
  const gradientTemp = derived?.gradientTemp ?? null;

  const lastUpdate = lastFetchTs
    ? new Date(lastFetchTs).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })
    : '—';
  const currentWind = currentHour?.wind_ms != null ? `${currentHour.wind_ms.toFixed(1)} m/s` : '—';
  const currentGust = currentHour?.gust_ms != null ? `${currentHour.gust_ms.toFixed(1)} m/s` : '—';
  const currentCategory = currentEval?.category ?? 'n/d';
  const currentConfidence = currentEval ? `${currentEval.score}%` : '—';
  const bestWindow = windows[0] ?? null;
  const gradientInterpretation = gradientTemp == null
    ? null
    : gradientTemp <= -2
      ? 'Inversione marcata: elevato rischio deriva verticale'
      : gradientTemp <= -1
        ? 'Lieve inversione: monitorare nelle prossime ore'
        : gradientTemp <= 1
          ? 'Profilo quasi neutro'
          : 'Convezione debole in sviluppo';
  const turbulenceIndex = derived?.nearSpread ?? null;
  const turbulenceStatusLabel = turbulenceIndex == null
    ? null
    : turbulenceIndex <= 1
      ? 'Bassa turbolenza (quasi laminare)'
      : turbulenceIndex <= 2
        ? 'Moderata: controllare deriva laterale'
        : 'Elevata: rischio disomogeneità';
  const humidityAvg = derived?.humidityAvg ?? null;
  const humidityStatusLabel = humidityAvg == null
    ? null
    : humidityAvg >= 55 && humidityAvg <= 85
      ? 'Bilancio idrico favorevole'
      : humidityAvg < 55
        ? 'Tendenza a disseccamento fogliare'
        : 'UR elevata: attenzione a colature';
  const rainNext12 = derived?.rainNext12 ?? null;
  const predictive = derived?.predictive ?? fallbackPredictive;

  const aiAdvice = useMemo(() => {
    if (!coords || !derived || !currentEval || !currentHour) {
      return {
        headline: 'Consiglio tecnico AI',
        summary: 'Seleziona una zona dalla mappa e assicurati di aver impostato coltura e prodotto per generare una raccomandazione agronomica dedicata.',
        recommendations: [] as string[],
        cautions: [] as string[],
      };
    }

    const recs: string[] = [];
    const cautions: string[] = [];

    const windowLabel = bestWindow
      ? `${bestWindow.time} (conf. ${bestWindow.confidence}%)`
      : null;
    const minWindowSuggested = Math.max(
      minWindowHours,
      productPreset.suggestedMinWindow ?? minWindowHours,
    );

    if (windowLabel) {
      recs.push(
        `Programmare il trattamento tra ${windowLabel}, garantendo continuità operativa ≥ ${minWindowSuggested}h in linea con le soglie definite.`,
      );
    } else {
      cautions.push(
        'Nessuna finestra continua rilevata: considera l’adeguamento delle soglie o pianifica un intervento alternativo.',
      );
    }

    if (derived.riskValue >= 60) {
      cautions.push(
        `Deriva stimata elevata: impiega ugelli antideriva, riduci pressione e mantieni il vento operativo < ${thresholds.windGood.toFixed(1)} m/s come da sensibilità "${windPreset.label}".`,
      );
    } else if (derived.riskValue >= 35) {
      recs.push('Rischio deriva moderato: mantieni barra bassa, velocità < 6 km/h e monitora raffiche in tempo reale.');
    } else {
      recs.push('Vento sotto controllo: mantieni configurazione attuale del cantiere e verifica solo eventuali cambi repentini.');
    }

    if (derived.stressValue >= 65) {
      cautions.push('Stress idrico elevato: preferire interventi serali o previa leggera irrigazione di soccorso.');
    } else if (derived.stressValue <= 35) {
      recs.push('Bilancio idrico favorevole: sfrutta l’ottima bagnatura fogliare per massimizzare l’assorbimento del formulato.');
    }

    if (derived.gradientTemp <= -1.5) {
      cautions.push('Possibile inversione termica entro 3h: opera con ugelli a ventaglio stretto e monitoraggio deriva verticale.');
    }

    if (derived.rainNext12 > 0.4) {
      cautions.push('Pioggia significativa prevista <12h: valuta adesivanti rapidi o rinvia per non compromettere la persistenza.');
    }

    if (derived.humidityAvg < 45) {
      cautions.push('Umidità media bassa: calibra goccia più grossolana e aumenta volume per limitare evaporazione.');
    }

    const summary = `Per ${cropPreset.label.toLowerCase()} con intervento ${productPreset.label.toLowerCase()}, le condizioni attuali risultano ${currentEval.category.toLowerCase()} (indice ${currentEval.score}%).`;

    return {
      headline: 'Consiglio tecnico AI',
      summary,
      recommendations: recs,
      cautions,
    };
  }, [
    bestWindow,
    coords,
    cropPreset.label,
    currentEval,
    currentHour,
    derived,
    minWindowHours,
    productPreset.label,
    productPreset.suggestedMinWindow,
    thresholds.windGood,
    windPreset.label,
  ]);

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural mb-4">
            Analisi delle Condizioni
          </Badge>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Monitoraggio Ambientale Avanzato
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Analisi completa delle condizioni ambientali per ottimizzare l'efficacia dei trattamenti e ridurre l'impatto su colture e ambiente.
          </p>
          <div className="text-sm text-muted-foreground mt-4">
            {placeName && coords ? (
              <>
                Area selezionata: <span className="font-medium">{placeName}</span> ({coords.lat.toFixed(3)}, {coords.lon.toFixed(3)})
              </>
            ) : (
              <>Seleziona un punto sulla <Link to="/map" className="underline">mappa</Link> per caricare i dati reali.</>
            )}
          </div>
          {loading && <div className="text-sm text-muted-foreground mt-2">Aggiornamento dati in corso…</div>}
          {err && <div className="text-sm text-destructive mt-2">⚠️ {err}</div>}
        </div>

        {/* Key Metrics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {metrics.map((metric) => (
            <Card key={metric.name} className="shadow-card-soft text-center">
              <CardContent className="p-6">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${
                    metric.color === 'green'
                      ? 'bg-green-100'
                      : metric.color === 'blue'
                        ? 'bg-blue-100'
                        : metric.color === 'purple'
                          ? 'bg-purple-100'
                          : 'bg-orange-100'
                  }`}
                >
                  <metric.icon
                    className={`w-6 h-6 ${
                      metric.color === 'green'
                        ? 'text-green-600'
                        : metric.color === 'blue'
                          ? 'text-blue-600'
                          : metric.color === 'purple'
                            ? 'text-purple-600'
                            : 'text-orange-600'
                    }`}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-center space-x-2">
                    <span className="text-2xl font-bold">
                      {metric.value != null ? `${metric.value}%` : '—'}
                    </span>
                    {metric.value != null && metric.trend === 'up' && (
                      <TrendingUp className="w-4 h-4 text-green-500" />
                    )}
                    {metric.value != null && metric.trend === 'down' && (
                      <TrendingDown className="w-4 h-4 text-red-500" />
                    )}
                  </div>
                  <h3 className="font-semibold text-sm">{metric.name}</h3>
                  <p className="text-xs text-muted-foreground">{metric.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Environmental Factors */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="w-5 h-5 mr-2 text-primary" />
              Fattori Ambientali Critici
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {factors.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
                  <div className="flex items-center space-x-4">
                    <div className="font-semibold">{item.factor}</div>
                    <Badge
                      variant={
                        item.impact === 'Positivo'
                          ? 'default'
                          : item.impact === 'Neutro'
                            ? 'secondary'
                            : 'destructive'
                      }
                    >
                      {item.status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="text-sm font-medium">{item.impact}</div>
                      <div className="text-xs text-muted-foreground">
                        {item.confidence != null ? `${item.confidence}% confidenza` : 'Confidenza n/d'}
                      </div>
                    </div>
                    <div className="w-16">
                      <Progress value={item.confidence ?? 0} className="h-2" />
                    </div>
                  </div>
                </div>
              ))}
        </div>
      </CardContent>
    </Card>

        {/* Analysis Tools */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-primary" />
                Analisi Microclimatica
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                      <span>Gradiente termico 0-3h</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {gradientInterpretation ?? 'Dato non disponibile'}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {gradientTemp != null ? `${gradientTemp.toFixed(1)}°C` : 'n/d'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <Wind className="w-4 h-4 text-blue-500 mr-2" />
                      <span>Shear vento (raffica - medio)</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {turbulenceStatusLabel ?? 'Dato non disponibile'}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {turbulenceIndex != null
                      ? `${turbulenceIndex.toFixed(2)} m/s`
                      : 'n/d'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <Droplets className="w-4 h-4 text-cyan-500 mr-2" />
                      <span>UR media prossime 6h</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {humidityStatusLabel ?? 'Dato non disponibile'}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {humidityAvg != null ? `${humidityAvg.toFixed(0)}%` : 'n/d'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center">
                      <Cloud className="w-4 h-4 text-muted-foreground mr-2" />
                      <span>Pioggia cumulata 12h</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {rainNext12 != null && rainNext12 > 0.4
                        ? 'Valuta la tenuta del formulato (possibile dilavamento)'
                        : 'Nessun evento significativo atteso'}
                    </div>
                  </div>
                  <Badge variant="outline" className="font-mono">
                    {rainNext12 != null ? `${rainNext12.toFixed(1)} mm` : 'n/d'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 text-purple-500 mr-2" />
                    <span>Ultimo aggiornamento</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{lastUpdate}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <LineChart className="w-5 h-5 mr-2 text-primary" />
                Modelli Predittivi
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-900">Dispersione aerosol</span>
                    <Badge variant="outline" className="text-blue-800 border-blue-300">
                      {predictive.dispersion.label}
                    </Badge>
                  </div>
                  <Progress value={predictive.dispersion.score ?? 0} className="h-2 mb-2" />
                  <div className="text-xs text-blue-700">{predictive.dispersion.note}</div>
                  <div className="text-xs text-blue-900 mt-1">
                    Suggerimento: {predictive.dispersion.recommendation}
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-900">Evaporazione gocce</span>
                    <Badge variant="outline" className="text-green-800 border-green-300">
                      {predictive.evaporation.label}
                    </Badge>
                  </div>
                  <Progress value={predictive.evaporation.score ?? 0} className="h-2 mb-2" />
                  <div className="text-xs text-green-700">{predictive.evaporation.note}</div>
                  <div className="text-xs text-green-800 mt-1">
                    {predictive.evaporation.extra ?? ''}
                  </div>
                  <div className="text-xs text-green-900 mt-1">
                    Suggerimento: {predictive.evaporation.recommendation}
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-purple-900">Deposizione su target</span>
                    <Badge variant="outline" className="text-purple-800 border-purple-300">
                      {predictive.deposition.label}
                    </Badge>
                  </div>
                  <Progress value={predictive.deposition.score ?? 0} className="h-2 mb-2" />
                  <div className="text-xs text-purple-700">{predictive.deposition.note}</div>
                  <div className="text-xs text-purple-900 mt-1">
                    Suggerimento: {predictive.deposition.recommendation}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Real-time Monitoring */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle>Monitoraggio in Tempo Reale</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <Activity className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-green-700 mb-1">{currentCategory}</div>
                <div className="text-sm text-green-600">Indice Sprayability Attuale</div>
                <div className="text-xs text-muted-foreground mt-2">Confidenza {currentConfidence}</div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <Wind className="w-8 h-8 text-blue-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-blue-700 mb-1">{currentWind}</div>
                <div className="text-sm text-blue-600">Raffiche {currentGust}</div>
                <div className="text-xs text-muted-foreground mt-2">Aggiornato alle {lastUpdate}</div>
              </div>

              <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                <Gauge className="w-8 h-8 text-purple-500 mx-auto mb-3" />
                <div className="text-2xl font-bold text-purple-700 mb-1">
                  {bestWindow ? bestWindow.time : '—'}
                </div>
                <div className="text-sm text-purple-600">Prossima finestra</div>
                <div className="text-xs text-muted-foreground mt-2">
                  {bestWindow ? `${bestWindow.status} • Confidenza ${bestWindow.confidence}%` : 'Nessuna finestra continua rilevata'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* AI Agronomist Advice */}
        <Card className="shadow-card-soft mb-12 border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center text-primary">
              <Bot className="w-5 h-5 mr-2" />
              {aiAdvice.headline}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <p className="text-muted-foreground">{aiAdvice.summary}</p>

            {aiAdvice.recommendations.length > 0 && (
              <div>
                <div className="font-semibold text-foreground mb-1">Azioni consigliate</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {aiAdvice.recommendations.map((item, idx) => (
                    <li key={`rec-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            {aiAdvice.cautions.length > 0 && (
              <div>
                <div className="font-semibold text-foreground mb-1">Punti di attenzione</div>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  {aiAdvice.cautions.map((item, idx) => (
                    <li key={`caution-${idx}`}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Alerts and Warnings */}
        <Card className="shadow-card-soft mb-12 border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="flex items-center text-yellow-800">
              <AlertCircle className="w-5 h-5 mr-2" />
              Avvisi e Raccomandazioni
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => {
                const dotColor =
                  alert.tone === 'warning'
                    ? 'bg-yellow-500'
                    : alert.tone === 'positive'
                      ? 'bg-green-500'
                      : 'bg-blue-500';
                const titleColor =
                  alert.tone === 'warning'
                    ? 'text-yellow-800'
                    : alert.tone === 'positive'
                      ? 'text-green-800'
                      : 'text-blue-800';
                const detailColor =
                  alert.tone === 'warning'
                    ? 'text-yellow-700'
                    : alert.tone === 'positive'
                      ? 'text-green-700'
                      : 'text-blue-700';

                return (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 bg-white/60 rounded-lg">
                    <div className={`w-2 h-2 rounded-full mt-2 ${dotColor}`} />
                    <div>
                      <div className={`font-semibold text-sm ${titleColor}`}>{alert.title}</div>
                      <div className={`text-xs ${detailColor}`}>{alert.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-agricultural hover:opacity-90 text-primary-foreground shadow-agricultural"
          >
            <Link to="/map">
              <Activity className="w-5 h-5 mr-2" />
              Visualizza Analisi Completa
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Accedi all'analisi dettagliata delle condizioni per la tua area
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConditionsAnalysis;
