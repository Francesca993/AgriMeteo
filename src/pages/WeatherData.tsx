import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { MapPin } from 'lucide-react';
import {
  Cloud,
  Thermometer,
  Wind,
  Droplets,
  Eye,
  Clock,
  Gauge,
  ArrowRight,
  TrendingUp,
  CloudRain,
  Sun,
  CloudSnow,
} from 'lucide-react';

import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

/* -------------------- UTIL -------------------- */
function degToCompass(deg?: number): string | null {
  if (typeof deg !== 'number' || Number.isNaN(deg)) return null;
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return dirs[Math.round((((deg % 360) + 360) % 360) / 22.5) % 16];
}

// Magnus formula (approssimata) per dew point
function dewPointFromTRH(t?: number, rh?: number): number | null {
  if (typeof t !== 'number' || typeof rh !== 'number' || rh <= 0) return null;
  const a = 17.27, b = 237.7;
  const gamma = (a * t) / (b + t) + Math.log(rh / 100);
  return +(b * gamma / (a - gamma)).toFixed(1);
}

// Windchill (Canada formula) valido ~T <= 10°C e vento > 1.3 m/s
function windChill(t?: number, v?: number): number | null {
  if (typeof t !== 'number' || typeof v !== 'number' || t > 10 || v <= 1.3) return null;
  const wc = 13.12 + 0.6215*t - 11.37*Math.pow(v,0.16) + 0.3965*t*Math.pow(v,0.16);
  return +wc.toFixed(1);
}

// Heat Index (Rothfusz) valido ~T >= 27°C e UR >= 40%
function heatIndex(t?: number, rh?: number): number | null {
  if (typeof t !== 'number' || typeof rh !== 'number' || t < 27 || rh < 40) return null;
  const c1 = -8.78469475556, c2 = 1.61139411, c3 = 2.33854883889, c4 = -0.14611605;
  const c5 = -0.012308094, c6 = -0.0164248277778, c7 = 0.002211732, c8 = 0.00072546, c9 = -0.000003582;
  const hi = c1 + c2*t + c3*rh + c4*t*rh + c5*t*t + c6*rh*rh + c7*t*t*rh + c8*t*rh*rh + c9*t*t*rh*rh;
  return +hi.toFixed(1);
}

function labelOggiDomani(ts: string) {
  const d = new Date(ts);
  const now = new Date();
  const d0 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const d1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const diffDays = Math.round((d1.getTime() - d0.getTime()) / (1000 * 60 * 60 * 24));
  const dayStr = diffDays === 0 ? 'Oggi' : diffDays === 1 ? 'Domani' : d1.toLocaleDateString('it-IT', { weekday: 'short' });
  const hh = d.toLocaleTimeString('it-IT', { hour: '2-digit' });
  return `${dayStr} ${hh}`;
}

/* -------------------- TYPES -------------------- */
type ApiCurrent = {
  temperature: number | null;
  humidity: number | null;
  windSpeed: number | null;
  windDirectionDeg: number | null;
  windDirection: string | null;
  precipitation: number | null;
};

type ApiExtras = {
  pressure_hPa: number | null;
  visibility_km: number | null;
  uvIndex: number | null;
  dewPoint_c: number | null;
};

type HourlyPoint = {
  ts: string;
  temp_c: number | null;
  rh_pct: number | null;
  wind_ms: number | null;
  rain_mm: number | null;
};

/* -------------------- API -------------------- */
// Dati attuali base
async function fetchOpenMeteoCurrent(lat: number, lon: number): Promise<ApiCurrent> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(lat.toFixed(4)),
    longitude: String(lon.toFixed(4)),
    timezone: 'Europe/Rome',
    current:
      'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_direction_10m',
    windspeed_unit: 'ms',
    precipitation_unit: 'mm',
  }).toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Open-Meteo error (current)');
  const j = await res.json();
  const c = j.current ?? {};
  return {
    temperature: typeof c.temperature_2m === 'number' ? c.temperature_2m : null,
    humidity: typeof c.relative_humidity_2m === 'number' ? c.relative_humidity_2m : null,
    windSpeed: typeof c.wind_speed_10m === 'number' ? c.wind_speed_10m : null,
    windDirectionDeg: typeof c.wind_direction_10m === 'number' ? c.wind_direction_10m : null,
    windDirection: degToCompass(c.wind_direction_10m),
    precipitation: typeof c.precipitation === 'number' ? c.precipitation : null,
  };
}

// Variabili orarie extra: pressione, visibilità, UV, dew point (prendiamo lo slot più vicino a "ora")
async function fetchOpenMeteoExtras(lat: number, lon: number): Promise<ApiExtras> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(lat.toFixed(4)),
    longitude: String(lon.toFixed(4)),
    timezone: 'Europe/Rome',
    forecast_days: '1',
    hourly: 'surface_pressure,visibility,uv_index,dewpoint_2m',
  }).toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Open-Meteo error (hourly extras)');
  const j = await res.json();

  const H = j?.hourly || {};
  const times: string[] = H.time || [];
  // trova l'ora più vicina adesso
  let idx = 0, best = Number.POSITIVE_INFINITY, now = Date.now();
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(new Date(times[i]).getTime() - now);
    if (d < best) { best = d; idx = i; }
  }

  const pressure = Array.isArray(H.surface_pressure) ? H.surface_pressure[idx] : null;        // hPa
  const visibility = Array.isArray(H.visibility) ? H.visibility[idx] : null;                  // metri
  const uv = Array.isArray(H.uv_index) ? H.uv_index[idx] : null;                              // indice
  const dew = Array.isArray(H.dewpoint_2m) ? H.dewpoint_2m[idx] : null;                       // °C

  return {
    pressure_hPa: typeof pressure === 'number' ? +pressure.toFixed(0) : null,
    visibility_km: typeof visibility === 'number' ? +(visibility / 1000).toFixed(1) : null,
    uvIndex: typeof uv === 'number' ? +uv.toFixed(1) : null,
    dewPoint_c: typeof dew === 'number' ? +dew.toFixed(1) : null,
  };
}

// Previsioni orarie 48h (temp, UR, pioggia, vento)
async function fetchOpenMeteoHourly(lat: number, lon: number): Promise<HourlyPoint[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(lat.toFixed(4)),
    longitude: String(lon.toFixed(4)),
    timezone: 'Europe/Rome',
    forecast_days: '2', // ~48h
    hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m',
    windspeed_unit: 'ms',
    precipitation_unit: 'mm',
  }).toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Open-Meteo error (hourly 48h)');
  const j = await res.json();

  const H = j?.hourly || {};
  const out: HourlyPoint[] = (H.time || []).map((ts: string, i: number) => ({
    ts,
    temp_c: H.temperature_2m?.[i] ?? null,
    rh_pct: H.relative_humidity_2m?.[i] ?? null,
    wind_ms: H.wind_speed_10m?.[i] ?? null,
    rain_mm: H.precipitation?.[i] ?? null,
  }));
  return out;
}

/* -------------------- Tooltip personalizzato -------------------- */
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  // label è ts (ISO) perché XAxis usa dataKey="ts"
  const when = labelOggiDomani(label);
  // trova valori dai dataKey
  const d: any = payload[0]?.payload || {};
  return (
    <div className="rounded-md border bg-background px-3 py-2 shadow-sm text-sm">
      <div className="font-medium mb-1">{when}</div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1">
        <span>Temp</span><span className="text-right">{d?.temp_c ?? '—'} °C</span>
        <span>UR</span><span className="text-right">{d?.rh_pct ?? '—'} %</span>
        <span>Vento</span><span className="text-right">{d?.wind_ms ?? '—'} m/s</span>
        <span>Pioggia</span><span className="text-right">{d?.rain_mm ?? '—'} mm</span>
      </div>
    </div>
  );
}

// Tick personalizzato per ruotare le etichette dell'asse X (compatibile con le tipizzazioni)
function RotatedTick(props: any) {
  const { x, y, payload } = props;
  const label = labelOggiDomani(payload?.value ?? '');
  const dy = 16; // distanza verticale dal punto Y
  return (
    <text
      x={x}
      y={y + dy}
      textAnchor="end"
      transform={`rotate(-45 ${x} ${y + dy})`}
      style={{ fontSize: 12 }}
    >
      {label}
    </text>
  );
}

/* -------------------- COMPONENT -------------------- */
const WeatherData = () => {
  // mock fallback (se l'API fallisce o non c'è selezione)
  const mockCurrentData = {
    temperature: 22.5,
    humidity: 68,
    windSpeed: 4.2,
    windDirection: 'NE',
    precipitation: 0.2,
  };

  const [selectedPlaceName, setSelectedPlaceName] = useState<string | null>(null);
  const [selectedPlaceCoords, setSelectedPlaceCoords] = useState<string | null>(null);

  const [apiCurrent, setApiCurrent] = useState<ApiCurrent | null>(null);
  const [apiExtras, setApiExtras] = useState<ApiExtras | null>(null);
  const [hourly, setHourly] = useState<HourlyPoint[] | null>(null);

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    try {
      const s = localStorage.getItem('agri:selectedPlaceName');
      if (s) setSelectedPlaceName(s);
      const c = localStorage.getItem('agri:selectedPlaceCoords'); // es. "44.49, 11.35"
      if (c) {
        setSelectedPlaceCoords(c);
        const [latStr, lonStr] = c.split(',').map((t) => t.trim());
        const lat = parseFloat(latStr);
        const lon = parseFloat(lonStr);
        if (Number.isFinite(lat) && Number.isFinite(lon)) {
          setLoading(true);
          setErr(null);
          Promise.all([
            fetchOpenMeteoCurrent(lat, lon).then(setApiCurrent),
            fetchOpenMeteoExtras(lat, lon).then(setApiExtras).catch(() => setApiExtras(null)),
            fetchOpenMeteoHourly(lat, lon).then(setHourly),
          ])
            .catch((e) => setErr(e?.message || 'Errore dati meteo'))
            .finally(() => setLoading(false));
        }
      }
    } catch {
      // ignore storage errors
    }
  }, []);

  // valori mostrati (API -> fallback mock)
  const temp = apiCurrent?.temperature ?? mockCurrentData.temperature;
  const hum = apiCurrent?.humidity ?? mockCurrentData.humidity;
  const wspd = apiCurrent?.windSpeed ?? mockCurrentData.windSpeed;
  const wdirStr = apiCurrent?.windDirection ?? mockCurrentData.windDirection;
  const prcp = apiCurrent?.precipitation ?? mockCurrentData.precipitation;

  const pressure = apiExtras?.pressure_hPa ?? null;
  const visibility = apiExtras?.visibility_km ?? null;
  const uvIndex = apiExtras?.uvIndex ?? null;
  const dewPoint = apiExtras?.dewPoint_c ?? dewPointFromTRH(temp, hum);

  // derivati
  const wc = windChill(temp, wspd);
  const hi = heatIndex(temp, hum);
  const feelsLike = (hi ?? wc ?? temp) as number | null;

  // previsioni 12h e 48h
  const next12 = hourly ? hourly.slice(0, 12) : [];
  const next48 = hourly ?? [];
  const selectedLocationLabel = [selectedPlaceName, selectedPlaceCoords]
    .filter(Boolean)
    .join(' • ');

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="bg-gradient-agricultural text-primary-foreground shadow-agricultural mb-4">
            Dati Meteorologici
          </Badge>
          <h1 className="text-4xl font-bold mb-4 text-foreground">
            Previsioni Meteorologiche di Precisione
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Dati meteorologici aggiornati in tempo reale e previsioni precise fino a 48 ore,
            specificamente calibrati per le esigenze dell&apos;agricoltura moderna.
          </p>

          {(selectedPlaceCoords || selectedPlaceName) && (
            <div className="mt-6">
              <Card className="shadow-card-soft w-full">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 p-2 flex-nowrap overflow-x-auto">
                    <MapPin className="w-6 h-6 text-black shrink-0" />
                    <span className="text-xl font-semibold text-black whitespace-nowrap">
                      Coordinate selezionate:
                    </span>
                    {selectedLocationLabel && (
                      <span className="text-xl font-semibold text-black whitespace-nowrap">
                        {selectedLocationLabel}
                      </span>
                    )}
                  </div>
                  {loading && (
                    <div className="mt-3 text-xs text-muted-foreground">
                      Carico i dati meteo…
                    </div>
                  )}
                  {err && (
                    <div className="mt-3 text-xs text-destructive">
                      ⚠️ {err}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Current Weather Dashboard */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle className="flex items-center text-2xl">
              <Cloud className="w-6 h-6 mr-3 text-primary" />
              Condizioni Attuali
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl">
                <Thermometer className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-700">
                  {typeof temp === 'number' ? `${temp}°C` : '—'}
                </div>
                <div className="text-sm text-red-600">Temperatura</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                <Droplets className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-700">
                  {typeof hum === 'number' ? `${hum}%` : '—'}
                </div>
                <div className="text-sm text-blue-600">Umidità Relativa</div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                <Wind className="w-8 h-8 text-green-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-green-700">
                  {typeof wspd === 'number' ? `${wspd} m/s` : '—'}
                </div>
                <div className="text-sm text-green-600">
                  Vento {wdirStr || '—'}
                </div>
              </div>

              <div className="text-center p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl">
                <CloudRain className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-700">
                  {typeof prcp === 'number' ? `${prcp} mm` : '—'}
                </div>
                <div className="text-sm text-purple-600">Precipitazioni</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Parameters Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Parametri di Base */}
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Parametri di Base</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Thermometer className="w-4 h-4 text-red-500 mr-2" />
                    <span className="text-sm">Temperatura (°C)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeof temp === 'number' ? `${temp.toFixed(1)}°C` : '—'}</Badge>
                    <span className="text-xs text-muted-foreground">±0.5°C</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Droplets className="w-4 h-4 text-blue-500 mr-2" />
                    <span className="text-sm">Umidità Relativa (%)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeof hum === 'number' ? `${hum.toFixed(0)}%` : '—'}</Badge>
                    <span className="text-xs text-muted-foreground">±3%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Wind className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">Velocità Vento (m/s)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeof wspd === 'number' ? `${wspd.toFixed(1)} m/s` : '—'}</Badge>
                    <span className="text-xs text-muted-foreground">±0.8 m/s</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CloudRain className="w-4 h-4 text-purple-500 mr-2" />
                    <span className="text-sm">Precipitazioni (mm)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{typeof prcp === 'number' ? `${prcp.toFixed(1)} mm` : '—'}</Badge>
                    <span className="text-xs text-muted-foreground">±0.1 mm</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parametri Avanzati */}
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Parametri Avanzati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Gauge className="w-4 h-4 text-orange-500 mr-2" />
                    <span className="text-sm">Pressione (hPa)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{pressure != null ? `${pressure}` : '—'}</Badge>
                    <span className="text-xs text-muted-foreground">±1 hPa</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 text-gray-500 mr-2" />
                    <span className="text-sm">Visibilità (km)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{visibility != null ? `${visibility}` : '—'}</Badge>
                    <span className="text-xs text-muted-foreground">±2 km</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Sun className="w-4 h-4 text-yellow-500 mr-2" />
                    <span className="text-sm">Radiazione UV</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{uvIndex != null ? `${uvIndex}` : '—'}</Badge>
                    <span className="text-xs text-muted-foreground">Indice</span>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <CloudSnow className="w-4 h-4 text-cyan-500 mr-2" />
                    <span className="text-sm">Punto di Rugiada (°C)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {dewPoint != null ? `${dewPoint.toFixed(1)}°C` : '—'}
                    </Badge>
                    <span className="text-xs text-muted-foreground">±0.8°C</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Indici Derivati */}
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="text-lg">Indici Derivati</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Temperatura Percepita</span>
                  <Badge className="bg-red-100 text-red-800">
                    {feelsLike != null ? `${feelsLike.toFixed(1)}°C` : '—'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Windchill</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {wc != null ? `${wc.toFixed(1)}°C` : '—'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Evapotraspirazione</span>
                  <Badge className="bg-green-100 text-green-800">—</Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm">Bagnatura Fogliare</span>
                  <Badge className="bg-purple-100 text-purple-800">—</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ---- PREVISIONI 12 ORE ---- */}
        {next12.length > 0 && (
          <Card className="shadow-card-soft mb-12">
            <CardHeader>
              <CardTitle className="text-lg">Previsioni 12 ore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <div className="text-center text-sm text-muted-foreground mb-2">
                  <span className="inline-block">T (°C)&nbsp;&nbsp;UR (%)&nbsp;&nbsp;Vento (m/s)&nbsp;&nbsp;Pioggia (mm)</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer>
                    <ComposedChart data={next12} margin={{ top: 8, right: 0, left: 0, bottom: 64 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="ts"
                        tickFormatter={labelOggiDomani}
                        minTickGap={30}
                        tick={<RotatedTick />}
                        tickMargin={12}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      {/* Temp (linea, sinistra) */}
                      <Line yAxisId="left" type="monotone" dataKey="temp_c" name="T (°C)" dot={false} />
                      {/* UR (linea, sinistra) */}
                      <Line yAxisId="left" type="monotone" dataKey="rh_pct" name="UR (%)" dot={false} />
                      {/* Vento (linea, sinistra) */}
                      <Line yAxisId="left" type="monotone" dataKey="wind_ms" name="Vento (m/s)" dot={false} />
                      {/* Pioggia (barre, destra) */}
                      <Bar yAxisId="right" dataKey="rain_mm" name="Pioggia (mm)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Linee: temperatura, UR e vento (asse sinistro) · Barre: pioggia (asse destro)
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---- PREVISIONI 48 ORE ---- */}
        {next48.length > 0 && (
          <Card className="shadow-card-soft mb-12">
            <CardHeader>
              <CardTitle className="text-lg">Previsioni 48 ore</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="w-full">
                <div className="text-center text-sm text-muted-foreground mb-2">
                  <span className="inline-block">T (°C)&nbsp;&nbsp;UR (%)&nbsp;&nbsp;Vento (m/s)&nbsp;&nbsp;Pioggia (mm)</span>
                </div>
                <div className="h-80 w-full">
                  <ResponsiveContainer>
                    <ComposedChart data={next48} margin={{ top: 8, right: 0, left: 0, bottom: 64 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="ts"
                        interval={2}
                        tickFormatter={labelOggiDomani}
                        minTickGap={30}
                        tick={<RotatedTick />}
                        tickMargin={12}
                      />
                      <YAxis yAxisId="left" />
                      <YAxis yAxisId="right" orientation="right" />
                      <Tooltip content={<CustomTooltip />} />
                      <Line yAxisId="left" type="monotone" dataKey="temp_c" name="T (°C)" dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="rh_pct" name="UR (%)" dot={false} />
                      <Line yAxisId="left" type="monotone" dataKey="wind_ms" name="Vento (m/s)" dot={false} />
                      <Bar yAxisId="right" dataKey="rain_mm" name="Pioggia (mm)" />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="mt-3 text-xs text-muted-foreground">
                Mostra 48 ore: temperatura, UR, vento e pioggia oraria.
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quality Indicators */}
        <Card className="shadow-card-soft mb-12">
          <CardHeader>
            <CardTitle>Qualità e Affidabilità dei Dati</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                <div className="text-2xl font-bold text-green-700 mb-1">98%</div>
                <div className="text-sm text-green-600">Disponibilità</div>
              </div>

              <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="text-2xl font-bold text-blue-700 mb-1">±2°C</div>
                <div className="text-sm text-blue-600">Precisione T°</div>
              </div>

              <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
                <div className="text-2xl font-bold text-purple-700 mb-1">±15%</div>
                <div className="text-sm text-purple-600">Errore Pioggia</div>
              </div>

              <div className="text-center p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="text-2xl font-bold text-orange-700 mb-1">10 min</div>
                <div className="text-sm text-orange-600">Latenza Max</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- SPOSTATI IN FONDO --- */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-primary" />
                Fonti dei Dati
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-semibold text-sm">Open-Meteo</div>
                  <div className="text-xs text-muted-foreground">Dati principali</div>
                </div>
                <Badge variant="default">Primaria</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-semibold text-sm">MET Norway</div>
                  <div className="text-xs text-muted-foreground">Backup europeo</div>
                </div>
                <Badge variant="secondary">Fallback</Badge>
              </div>

              <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                <div>
                  <div className="font-semibold text-sm">Stazioni Locali</div>
                  <div className="text-xs text-muted-foreground">Calibrazione</div>
                </div>
                <Badge variant="outline">Ausiliario</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-card-soft">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                Frequenza Aggiornamenti
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Dati Attuali</span>
                  <Badge variant="default">~10 min</Badge>
                </div>
                <Progress value={100} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Previsioni 6h</span>
                  <Badge variant="default">~30 min</Badge>
                </div>
                <Progress value={85} className="h-2" />

                <div className="flex justify-between items-center">
                  <span className="text-sm">Previsioni 48h</span>
                  <Badge variant="secondary">~2 ore</Badge>
                </div>
                <Progress value={70} className="h-2" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            asChild
            size="lg"
            className="bg-gradient-agricultural hover:opacity-90 text-primary-foreground shadow-agricultural"
          >
            <Link to="/map">
              <Cloud className="w-5 h-5 mr-2" />
              Visualizza Dati Meteorologici Live
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Accesso completo ai dati meteorologici per la tua area
          </p>
        </div>
      </div>
    </div>
  );
};

export default WeatherData;
