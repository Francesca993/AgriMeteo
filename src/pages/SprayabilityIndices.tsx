import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  Wind,
  Droplets,
  Thermometer,
  ArrowRight,
  Calculator,
  Target,
  Activity,
} from 'lucide-react';
import {
  WEIGHTS,
  DEFAULT_THRESHOLDS,
  PREFS_STORAGE_KEY,
  WIND_GOOD,
  WIND_MID,
  GUST_GOOD,
  GUST_MID,
  RAIN_GOOD,
  RAIN_MID,
  TEMP_GOOD_MIN,
  TEMP_GOOD_MAX,
  TEMP_MID_MIN,
  TEMP_MID_MAX,
  RH_GOOD_MIN,
  RH_GOOD_MAX,
  RH_MID_MIN,
  RH_MID_MAX,
  CROP_PRESETS,
  PRODUCT_PRESETS,
  WIND_SENSITIVITY_PRESETS,
  mergeThresholds,
  thresholdsEqual,
  fmtHHmm,
  nearestIndexToNow,
  evaluateHour,
  fetchHourly,
  type HourPoint,
  type Category,
  type Thresholds,
  type CropPresetKey,
  type ProductPresetKey,
  type WindSensitivityKey,
  type SprayabilityFactorDisplay,
} from '@/lib/sprayability';

const INITIAL_THRESHOLDS = mergeThresholds(
  DEFAULT_THRESHOLDS,
  CROP_PRESETS.standard.thresholds,
  PRODUCT_PRESETS.fungicida.adjustments,
  WIND_SENSITIVITY_PRESETS.balanced.overrides,
);

const SprayabilityIndices = () => {
  const [placeName, setPlaceName] = useState<string | null>(null);
  const [coords, setCoords] = useState<{lat: number; lon: number} | null>(null);

  const [hourly, setHourly] = useState<HourPoint[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [currentStatus, setCurrentStatus] = useState<Category | null>(null);
  const [currentScore, setCurrentScore] = useState<number | null>(null);

  const [selectedCrop, setSelectedCrop] = useState<CropPresetKey>('standard');
  const [selectedProduct, setSelectedProduct] = useState<ProductPresetKey>('fungicida');
  const [windSensitivity, setWindSensitivity] = useState<WindSensitivityKey>('balanced');
  const [thresholds, setThresholds] = useState<Thresholds>(INITIAL_THRESHOLDS);
  const [minWindowHours, setMinWindowHours] = useState<number>(2);
  const [prefsLoaded, setPrefsLoaded] = useState(false);

  // fattori mostrati nel riquadro “Indice attuale”
  const [sprayabilityFactors, setSprayabilityFactors] = useState<SprayabilityFactorDisplay[]>([
    { name: 'Velocità Vento', icon: Wind, threshold: `≤ ${INITIAL_THRESHOLDS.windGood.toFixed(1)} m/s`, current: '—', unit: 'm/s', status: 'mid', weight: WEIGHTS.wind },
    { name: 'Pioggia Prevista', icon: Droplets, threshold: `≤ ${INITIAL_THRESHOLDS.rainGood.toFixed(1)} mm/6h`, current: '—', unit: 'mm', status: 'mid', weight: WEIGHTS.rain6h },
    { name: 'Temperatura', icon: Thermometer, threshold: `${INITIAL_THRESHOLDS.tempGoodMin.toFixed(0)}-${INITIAL_THRESHOLDS.tempGoodMax.toFixed(0)}°C`, current: '—', unit: '°C', status: 'mid', weight: WEIGHTS.temp },
    { name: 'Umidità Relativa', icon: Droplets, threshold: `${INITIAL_THRESHOLDS.rhGoodMin.toFixed(0)}-${INITIAL_THRESHOLDS.rhGoodMax.toFixed(0)}%`, current: '—', unit: '%', status: 'mid', weight: WEIGHTS.rh },
  ]);

  const [timeWindows, setTimeWindows] = useState<Array<{ time: string; status: Category; confidence: number; reason: string }>>([]);

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
      // Ignore malformed preferences
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
    if (!prefsLoaded) return;
    try {
      localStorage.setItem(
        PREFS_STORAGE_KEY,
        JSON.stringify({
          selectedCrop,
          selectedProduct,
          windSensitivity,
          minWindowHours,
        }),
      );
    } catch {
      // Ignore write errors (storage full / private mode)
    }
  }, [selectedCrop, selectedProduct, windSensitivity, minWindowHours, prefsLoaded]);

  useEffect(() => {
    // leggi selezione dalla mappa
    try {
      const n = localStorage.getItem('agri:selectedPlaceName');
      if (n) setPlaceName(n);
      const c = localStorage.getItem('agri:selectedPlaceCoords'); // "lat, lon"
      if (c) {
        const [latStr, lonStr] = c.split(',').map(s => s.trim());
        const lat = parseFloat(latStr), lon = parseFloat(lonStr);
        if (Number.isFinite(lat) && Number.isFinite(lon)) setCoords({lat, lon});
      }
    } catch (_error) {
      // Ignora errori di accesso allo storage (modalità privata, ecc.)
      return;
    }
  }, []);

  useEffect(() => {
    if (!coords) return;
    setLoading(true); setErr(null);
    fetchHourly(coords.lat, coords.lon)
      .then((data) => {
        setHourly(data);
      })
      .catch((e) => setErr(e?.message || 'Errore dati meteo'))
      .finally(() => setLoading(false));
  }, [coords]);

  // ricalcola indici e finestre quando cambiano i dati o le soglie
  useEffect(() => {
    if (!hourly) return;
    const data = hourly;
    // indice corrente
    const times = data.map(d => d.ts);
    const idx = nearestIndexToNow(times);
    const nowEval = evaluateHour(data[idx], thresholds);

    setCurrentStatus(nowEval.category);
    setCurrentScore(nowEval.score);

    // aggiorna fattori mostrati (mostriamo le soglie attive nel testo)
    const fWind = nowEval.factors.wind.ok;
    const fRain = nowEval.factors.rain6h.ok;
    const fTemp = nowEval.factors.temp.ok;
    const fRH   = nowEval.factors.rh.ok;
    const formatValue = (value: number | null | undefined, digits = 1) =>
      typeof value === 'number' ? value.toFixed(digits) : '—';
    setSprayabilityFactors([
      {
        name: 'Velocità Vento',
        icon: Wind,
        threshold: `≤ ${thresholds.windGood.toFixed(1)} m/s (raffiche ≤ ${thresholds.gustGood.toFixed(1)} m/s)`,
        current: formatValue(data[idx].wind_ms, 1),
        unit: 'm/s',
        status: fWind,
        weight: WEIGHTS.wind,
      },
      {
        name: 'Pioggia Prevista',
        icon: Droplets,
        threshold: `≤ ${thresholds.rainGood.toFixed(1)} mm/6h`,
        current: formatValue(data[idx].rain6h_mm, 1),
        unit: 'mm',
        status: fRain,
        weight: WEIGHTS.rain6h,
      },
      {
        name: 'Temperatura',
        icon: Thermometer,
        threshold: `${thresholds.tempGoodMin.toFixed(0)}-${thresholds.tempGoodMax.toFixed(0)}°C`,
        current: formatValue(data[idx].temp_c, 1),
        unit: '°C',
        status: fTemp,
        weight: WEIGHTS.temp,
      },
      {
        name: 'Umidità Relativa',
        icon: Droplets,
        threshold: `${thresholds.rhGoodMin.toFixed(0)}-${thresholds.rhGoodMax.toFixed(0)}%`,
        current: formatValue(data[idx].rh_pct, 0),
        unit: '%',
        status: fRH,
        weight: WEIGHTS.rh,
      },
    ]);

    // costruisci finestre consecutive (>= minWindowHours) per Buona/Discreta
    const evals = data.map(d => evaluateHour(d, thresholds));
    const windows: Array<{startIdx:number; endIdx:number; status: Category; confidence: number; reason: string}> = [];
    let s = 0;
    while (s < evals.length) {
      const cat = evals[s].category;
      if (cat === 'Scarsa') { s++; continue; }
      let e = s;
      let sumScore = 0; let count = 0;
      const reasons: string[] = [];
      while (e < evals.length && (evals[e].category === 'Buona' || evals[e].category === 'Discreta')) {
        sumScore += evals[e].score; count++;
        if (reasons.length < 3 && evals[e].brief) reasons.push(evals[e].brief);
        e++;
      }
      if (count >= Math.max(1, Math.floor(minWindowHours))) {
        const reason = reasons[0] || evals[s].brief || '';
        windows.push({
          startIdx: s,
          endIdx: e - 1,
          status: (sumScore / count >= 85 ? 'Buona' : 'Discreta'),
          confidence: Math.round(sumScore / count),
          reason,
        });
      }
      s = e + 1;
    }
    setTimeWindows(
      windows.slice(0, 5).map(w => ({
        time: `${fmtHHmm(data[w.startIdx].ts)}-${fmtHHmm(data[w.endIdx].ts)}`,
        status: w.status,
        confidence: w.confidence,
        reason: w.reason,
      }))
    );
  }, [hourly, thresholds, minWindowHours]);

  const cropPreset = CROP_PRESETS[selectedCrop];
  const productPreset = PRODUCT_PRESETS[selectedProduct];
  const windPreset = WIND_SENSITIVITY_PRESETS[windSensitivity];

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural mb-2">
            Indici di Sprayability
          </Badge>
          <h1 className="text-4xl font-bold mb-2 text-foreground">
            Calcolo Finestre Operative Ottimali
          </h1>
          <p className="text-sm text-muted-foreground">
            {placeName && coords ? (
              <>Area selezionata: <span className="font-medium">{placeName}</span> ({coords.lat.toFixed(3)}, {coords.lon.toFixed(3)})</>
            ) : (
              <>Seleziona un punto sulla <Link to="/map" className="underline">mappa</Link> per vedere i dati reali.</>
            )}
          </p>
          {loading && <div className="text-sm text-muted-foreground mt-2">Calcolo in corso…</div>}
          {err && <div className="text-sm text-destructive mt-2">⚠️ {err}</div>}
        </div>

        {/* Current Index */}
        <Card className="shadow-card-soft mb-12 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <CheckCircle className="w-6 h-6 mr-3 text-green-600" />
              Indice Sprayability Attuale
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className={`text-4xl font-bold mb-2 ${
                  currentStatus === 'Buona' ? 'text-green-700' :
                  currentStatus === 'Discreta' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {currentStatus ?? '—'}
                </div>
                <div className={
                  currentStatus === 'Buona' ? 'text-green-600' :
                  currentStatus === 'Discreta' ? 'text-yellow-600' : 'text-red-600'
                }>
                  {currentStatus === 'Buona' ? 'Condizioni ideali per il trattamento' :
                   currentStatus === 'Discreta' ? 'Condizioni accettabili' :
                   currentStatus === 'Scarsa' ? 'Sconsigliato trattare' : 'In attesa dati'}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${
                  currentStatus === 'Buona' ? 'text-green-700' :
                  currentStatus === 'Discreta' ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  {currentScore != null ? `${currentScore}%` : '—'}
                </div>
                <div className={
                  currentStatus === 'Buona' ? 'text-sm text-green-600' :
                  currentStatus === 'Discreta' ? 'text-sm text-yellow-600' : 'text-sm text-red-600'
                }>
                  Confidenza
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {sprayabilityFactors.map((factor) => (
                <div key={factor.name} className="text-center p-3 bg-white/50 rounded-lg">
                  <factor.icon className={`w-6 h-6 mx-auto mb-2 ${
                    factor.status === 'good' ? 'text-green-600' :
                    factor.status === 'mid' ? 'text-yellow-600' : 'text-red-600'
                  }`} />
                  <div className={`font-semibold text-sm ${
                    factor.status === 'good' ? 'text-green-800' :
                    factor.status === 'mid' ? 'text-yellow-800' : 'text-red-800'
                  }`}>
                    {typeof factor.current === 'number' ? factor.current.toString() : factor.current}{factor.unit}
                  </div>
                  <div className={`text-xs ${
                    factor.status === 'good' ? 'text-green-600' :
                    factor.status === 'mid' ? 'text-yellow-600' : 'text-red-600'
                  }`}>
                    {factor.threshold}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Calculation Method */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calculator className="w-5 h-5 mr-2 text-primary" />
                Metodo di Calcolo v0.1
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground text-sm mb-4">
                Ogni ora nelle prossime 48h viene classificata su tre livelli (Buona/Discreta/Scarsa) in base a:
              </p>
              {[
                { name: 'Velocità Vento', w: WEIGHTS.wind, thr: `Buona ≤ ${WIND_GOOD} m/s (raffiche ≤ ${GUST_GOOD}) • Discreta ≤ ${WIND_MID} m/s` },
                { name: 'Pioggia 6h', w: WEIGHTS.rain6h, thr: `Buona ≤ ${RAIN_GOOD} mm • Discreta ≤ ${RAIN_MID} mm` },
                { name: 'Temperatura', w: WEIGHTS.temp, thr: `Buona ${TEMP_GOOD_MIN}-${TEMP_GOOD_MAX}°C • Discreta ${TEMP_MID_MIN}-${TEMP_MID_MAX}°C` },
                { name: 'Umidità Relativa', w: WEIGHTS.rh, thr: `Buona ${RH_GOOD_MIN}-${RH_GOOD_MAX}% • Discreta ${RH_MID_MIN}-${RH_MID_MAX}%` },
              ].map((f) => (
                <div key={f.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{f.name}</span>
                    <Badge variant="outline">{f.w}%</Badge>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Progress value={f.w} className="flex-1 h-2" />
                    <span className="text-xs text-muted-foreground">{f.thr}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Target className="w-5 h-5 mr-2 text-primary" />
                Soglie di Classificazione
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                    <div>
                      <div className="font-semibold text-green-800">BUONA</div>
                      <div className="text-xs text-green-600">Tutti i parametri ottimali o quasi</div>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-800">85–100%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center">
                    <AlertTriangle className="w-4 h-4 text-yellow-600 mr-2" />
                    <div>
                      <div className="font-semibold text-yellow-800">DISCRETA</div>
                      <div className="text-xs text-yellow-600">Condizioni accettabili</div>
                    </div>
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800">50–84%</Badge>
                </div>

                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center">
                    <XCircle className="w-4 h-4 text-red-600 mr-2" />
                    <div>
                      <div className="font-semibold text-red-800">SCARSA</div>
                      <div className="text-xs text-red-600">Sconsigliato trattare</div>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-800">0–49%</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Time Windows */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Clock className="w-5 h-5 mr-2 text-primary" />
              Finestre Operative Prossime 24–48h
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timeWindows.length === 0 ? (
              <div className="text-sm text-muted-foreground">Nessuna finestra rilevata (ancora). Prova a selezionare un’altra area.</div>
            ) : (
              <div className="space-y-3">
                {timeWindows.map((w, i) => (
                  <div 
                    key={i} 
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      w.status === 'Buona' ? 'bg-green-50 border-green-200' :
                      w.status === 'Discreta' ? 'bg-yellow-50 border-yellow-200' :
                      'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className="font-mono text-lg font-semibold">
                        {w.time}
                      </div>
                      <Badge 
                        variant={
                          w.status === 'Buona' ? 'default' :
                          w.status === 'Discreta' ? 'secondary' :
                          'destructive'
                        }
                      >
                        {w.status}
                      </Badge>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2 mb-1">
                        <Activity className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm font-medium">{w.confidence}%</span>
                      </div>
                      <div className="text-xs text-muted-foreground">{w.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

  {/* Advanced Features (placeholder/roadmap) */}
  <div className="grid grid-cols-1 gap-6 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Personalizzazione</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-sm">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Tipo di Coltura</label>
                  <select
                    value={selectedCrop}
                    onChange={(e) => setSelectedCrop(e.target.value as CropPresetKey)}
                    className="w-full rounded-md border px-2 py-1 bg-background"
                  >
                    {Object.entries(CROP_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">{cropPreset.description}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Tipo di Prodotto</label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value as ProductPresetKey)}
                    className="w-full rounded-md border px-2 py-1 bg-background"
                  >
                    {Object.entries(PRODUCT_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">
                    {productPreset.description}
                    {productPreset.suggestedMinWindow
                      ? ` • Suggerita finestra ≥ ${productPreset.suggestedMinWindow}h`
                      : ''}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Sensibilità al vento</label>
                  <select
                    value={windSensitivity}
                    onChange={(e) => setWindSensitivity(e.target.value as WindSensitivityKey)}
                    className="w-full rounded-md border px-2 py-1 bg-background"
                  >
                    {Object.entries(WIND_SENSITIVITY_PRESETS).map(([key, preset]) => (
                      <option key={key} value={key}>
                        {preset.label}
                      </option>
                    ))}
                  </select>
                  <div className="text-xs text-muted-foreground">{windPreset.description}</div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Finestra minima (ore)</label>
                  <input
                    type="number"
                    min={1}
                    max={12}
                    step={1}
                    value={minWindowHours}
                    onChange={(e) => {
                      const parsed = Number.parseInt(e.target.value || '1', 10);
                      const next = Number.isFinite(parsed) ? Math.min(12, Math.max(1, parsed)) : 1;
                      setMinWindowHours(next);
                    }}
                    className="w-24 rounded-md border px-2 py-1"
                  />
                  <div className="text-xs text-muted-foreground">
                    Mostra finestre di almeno {minWindowHours} h
                    {productPreset.suggestedMinWindow && minWindowHours < productPreset.suggestedMinWindow
                      ? ` (consigliato ≥ ${productPreset.suggestedMinWindow}h)`
                      : ''}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <div className="flex items-center justify-between rounded-md border px-2 py-1 bg-muted/30">
                    <span>Vento buono</span>
                    <Badge variant="outline">≤ {thresholds.windGood.toFixed(1)} m/s</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-2 py-1 bg-muted/30">
                    <span>Raffiche</span>
                    <Badge variant="outline">≤ {thresholds.gustGood.toFixed(1)} m/s</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-2 py-1 bg-muted/30">
                    <span>Pioggia 6h</span>
                    <Badge variant="outline">≤ {thresholds.rainGood.toFixed(1)} mm</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-2 py-1 bg-muted/30">
                    <span>Temperatura</span>
                    <Badge variant="outline">{thresholds.tempGoodMin.toFixed(0)}-{thresholds.tempGoodMax.toFixed(0)}°C</Badge>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-2 py-1 bg-muted/30">
                    <span>Umidità</span>
                    <Badge variant="outline">{thresholds.rhGoodMin.toFixed(0)}-{thresholds.rhGoodMax.toFixed(0)}%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Warning */}
        <Card className="shadow-card-soft mb-12 border-destructive/20 bg-destructive/5">
          <CardHeader>
            <CardTitle className="flex items-center text-destructive">
              <AlertTriangle className="w-5 h-5 mr-2" />
              Avvertenze Importanti
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>• Gli indici sono informativi e sperimentali (versione v0.1)</p>
              <p>• Consultare sempre l'etichetta del prodotto fitosanitario</p>
              <p>• Rispettare le normative locali su tempi di carenza e deriva</p>
              <p>• Utilizzare sempre dispositivi di protezione individuale appropriati</p>
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
              <TrendingUp className="w-5 h-5 mr-2" />
              Calcola Indici per la Tua Area
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Prova il calcolo degli indici di sprayability sulla tua area
          </p>
        </div>
      </div>
    </div>
  );
};

export default SprayabilityIndices;
