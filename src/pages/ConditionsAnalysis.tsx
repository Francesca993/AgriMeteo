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
  ArrowRight,
  BarChart3,
  LineChart,
  Calendar,
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

const ConditionsAnalysis = () => {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const [hourly, setHourly] = useState<HourPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [selectedCrop, setSelectedCrop] = useState<CropPresetKey>('standard');
  const [selectedProduct, setSelectedProduct] = useState<ProductPresetKey>('fungicida');
  const [windSensitivity, setWindSensitivity] = useState<WindSensitivityKey>('balanced');
  const [thresholds, setThresholds] = useState<Thresholds>(INITIAL_THRESHOLDS);
  const [minWindowHours, setMinWindowHours] = useState<number>(2);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

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
      .then((data) => setHourly(data))
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
    };
  }, [hourly, thresholds, minWindowHours]);

  const metrics = derived?.metrics ?? fallbackMetrics;
  const factors = derived?.factors ?? fallbackFactors;
  const alerts = derived?.alerts ?? fallbackAlerts;
  const windows = derived?.futureWindows ?? [];
  const currentHour = derived?.currentHour ?? null;
  const currentEval = derived?.currentEval ?? null;
  const gradientTemp = derived?.gradientTemp ?? null;

  const lastUpdate = currentHour ? fmtHHmm(currentHour.ts) : '—';
  const currentWind = currentHour?.wind_ms != null ? `${currentHour.wind_ms.toFixed(1)} m/s` : '—';
  const currentGust = currentHour?.gust_ms != null ? `${currentHour.gust_ms.toFixed(1)} m/s` : '—';
  const currentCategory = currentEval?.category ?? 'n/d';
  const currentConfidence = currentEval ? `${currentEval.score}%` : '—';
  const bestWindow = windows[0] ?? null;

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
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm">Gradiente Termico (3h)</span>
                  </div>
                  <span className="text-sm font-mono">
                    {gradientTemp != null ? `${gradientTemp.toFixed(1)}°C` : 'n/d'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm">Profilo del Vento</span>
                  </div>
                  <span className="text-sm font-mono">
                    {currentHour?.wind_ms != null ? `${currentHour.wind_ms.toFixed(1)} m/s` : 'n/d'} • Raffiche {currentHour?.gust_ms != null ? currentHour.gust_ms.toFixed(1) : 'n/d'} m/s
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 text-cyan-500 mr-2" />
                    <span className="text-sm">Umidità Relativa</span>
                  </div>
                  <span className="text-sm font-mono">
                    {currentHour?.rh_pct != null ? `${currentHour.rh_pct.toFixed(0)}%` : 'n/d'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-sm">Ultimo Aggiornamento</span>
                  </div>
                  <span className="text-sm font-mono">{lastUpdate}</span>
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
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-blue-800">Dispersione Aerosol</span>
                    <Badge className="bg-blue-100 text-blue-800">Gaussiano</Badge>
                  </div>
                  <div className="text-xs text-blue-600">
                    Utilizza vento istantaneo ({currentWind}) e raffiche ({currentGust}) per stimare la deriva a breve termine.
                  </div>
                </div>

                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-green-800">Evaporazione Gocce</span>
                    <Badge className="bg-green-100 text-green-800">Termodinamico</Badge>
                  </div>
                  <div className="text-xs text-green-600">
                    Tiene conto di temperatura {currentHour?.temp_c != null ? `${currentHour.temp_c.toFixed(1)}°C` : 'n/d'} e UR {currentHour?.rh_pct != null ? `${currentHour.rh_pct.toFixed(0)}%` : 'n/d'}.
                  </div>
                </div>

                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold text-purple-800">Deposizione</span>
                    <Badge className="bg-purple-100 text-purple-800">Gravitazionale</Badge>
                  </div>
                  <div className="text-xs text-purple-600">
                    Combina indici di stabilità ({derived?.stabilityValue ?? '—'}%) e stress idrico ({derived?.stressValue ?? '—'}%) per stimare l'efficienza di assorbimento.
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
