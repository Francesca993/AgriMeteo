import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useMap } from 'react-leaflet';
import { MapContainer, TileLayer, Marker, useMapEvents, Circle } from 'react-leaflet';
import L, { type LatLngExpression, type PathOptions } from 'leaflet';
// Vite-friendly imports for leaflet marker images
import markerIcon2xUrl from 'leaflet/dist/images/marker-icon-2x.png?url';
import markerIconUrl from 'leaflet/dist/images/marker-icon.png?url';
import markerShadowUrl from 'leaflet/dist/images/marker-shadow.png?url';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Cloud,
  Wind,
  Thermometer,
  Droplets,
  MapPin,
  Download,
  Share2,
  AlertTriangle,
} from 'lucide-react';
import { Search } from 'lucide-react';
import { Globe } from 'lucide-react';
import { Flag } from 'lucide-react';

// ---------- Leaflet icon fix (Vite/Next bundlers) ----------
try {
  // @ts-expect-error Leaflet type does not expose this private field
  delete L.Icon.Default.prototype._getIconUrl;
} catch {
  /* noop */
}
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2xUrl,
  iconUrl: markerIconUrl,
  shadowUrl: markerShadowUrl,
});

// ---------- Helpers ----------
type HourPoint = {
  ts: string; // ISO string in Europe/Rome
  temp_c: number | null;
  rh_pct: number | null;
  rain_mm: number | null;
  wind_ms: number | null;
  gust_ms: number | null;
  wind_dir_deg: number | null;
};

type WeatherNorm = {
  provider: string;
  timezone: string;
  hourly: HourPoint[];
  current?: {
    temp_c: number | null;
    rh_pct: number | null;
    rain_mm: number | null;
    wind_ms: number | null;
    gust_ms: number | null;
    wind_dir_deg: number | null;
  };
};

type NominatimResult = {
  lat: string;
  lon: string;
  display_name?: string;
};

type ReverseGeocodeResult = {
  display_name?: string;
};

const center = { lat: 44.4968, lng: 11.3548 }; // default center (Italy)

function hhmm(ts: string) {
  try {
    return new Date(ts).toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}

function sum(arr: (number | null | undefined)[]) {
  return arr.reduce((s, v) => s + (typeof v === 'number' ? v : 0), 0);
}

function toErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
}

function isNominatimResult(value: unknown): value is NominatimResult {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return typeof record.lat === 'string' && typeof record.lon === 'string';
}

// Sprayability rules v0
function labelSprayability(
  h: HourPoint,
  rainNext6h: number
): 'Buona' | 'Discreta' | 'Scarsa' {
  const windOk = (h.wind_ms ?? Infinity) <= 4;
  const gustOk = h.gust_ms == null || h.gust_ms <= 6;
  const rainOk = rainNext6h <= 0.2;
  const tempOk = h.temp_c != null && h.temp_c >= 8 && h.temp_c <= 30;
  const rhOk = h.rh_pct != null && h.rh_pct >= 30 && h.rh_pct <= 90;

  const good = windOk && gustOk && rainOk && tempOk && rhOk;
  if (good) return 'Buona';

  const fair =
    (h.wind_ms ?? Infinity) <= 6 &&
    rainNext6h <= 0.5; // condizioni minime accettabili
  if (fair) return 'Discreta';

  return 'Scarsa';
}

function computeWindows(
  labels: { ts: string; label: 'Buona' | 'Discreta' | 'Scarsa' }[],
  minHours = 2
) {
  const wins: { start: string; end: string; label: string }[] = [];
  let start: string | null = null;
  for (let i = 0; i < labels.length; i++) {
    const ok = labels[i].label === 'Buona' || labels[i].label === 'Discreta';
    if (ok && !start) start = labels[i].ts;
    if ((!ok || i === labels.length - 1) && start) {
      const end = ok && i === labels.length - 1 ? labels[i].ts : labels[i - 1].ts;
      // check duration
      const hours =
        (new Date(end).getTime() - new Date(start).getTime()) / (1000 * 60 * 60) + 1e-9;
      if (hours >= minHours - 1e-6) wins.push({ start, end, label: 'Buona/Discreta' });
      start = null;
    }
  }
  return wins;
}

// ---------- Map click handler ----------
function ClickHandler({ onSelect }: { onSelect: (latlng: { lat: number; lng: number }) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

// ---------- API (Open-Meteo) ----------
async function fetchOpenMeteo(lat: number, lon: number): Promise<WeatherNorm> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    timezone: 'Europe/Rome',
    forecast_days: '2', // ~48h
    current:
      'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m',
    hourly:
      'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m,wind_direction_10m',
  }).toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Errore Open-Meteo');
  const j = await res.json();

  const H = j.hourly;
  const out: HourPoint[] = H.time.map((ts: string, i: number) => ({
    ts,
    temp_c: H.temperature_2m?.[i] ?? null,
    rh_pct: H.relative_humidity_2m?.[i] ?? null,
    rain_mm: H.precipitation?.[i] ?? null,
    wind_ms: H.wind_speed_10m?.[i] ?? null,
    gust_ms: H.wind_gusts_10m?.[i] ?? null,
    wind_dir_deg: H.wind_direction_10m?.[i] ?? null,
  }));

  const current = j.current
    ? {
        temp_c: j.current.temperature_2m ?? null,
        rh_pct: j.current.relative_humidity_2m ?? null,
        rain_mm: j.current.precipitation ?? null,
        wind_ms: j.current.wind_speed_10m ?? null,
        gust_ms: j.current.wind_gusts_10m ?? null,
        wind_dir_deg: j.current.wind_direction_10m ?? null,
      }
    : undefined;

  return { provider: 'open-meteo', timezone: j.timezone, hourly: out, current };
}

// ---------- Component ----------
const Map = () => {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();
  const [selectedName, setSelectedName] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<{ lat: number; lng: number } | null>(null);
  const [weather, setWeather] = useState<WeatherNorm | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mapDefaultCenter: LatLngExpression = [center.lat, center.lng];
  const selectionCircleOptions: PathOptions = { color: '#16a34a', opacity: 0.5 };

  // Fetch weather when selecting a point
  useEffect(() => {
    if (!selectedArea) return;
    const { lat, lng } = selectedArea;
    (async () => {
      setLoading(true);
      setError(null);
      setWeather(null);
      try {
        const data = await fetchOpenMeteo(lat, lng);
        setWeather(data);
      } catch (err) {
        setError(toErrorMessage(err, 'Errore sconosciuto'));
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedArea]);

  // Compute sprayability labels & windows
  const sprayability = useMemo(() => {
    if (!weather?.hourly?.length) return { labels: [] as { ts: string; label: 'Buona' | 'Discreta' | 'Scarsa' }[], windows: [] as { start: string; end: string; label: string }[] };
    const H = weather.hourly;
    const labels = H.map((h, i) => {
      // somma pioggia nelle 6 ore successive (inclusa corrente?)
      const rainNext6h = sum(H.slice(i, i + 6).map((x) => x.rain_mm ?? 0));
      return { ts: h.ts, label: labelSprayability(h, rainNext6h) };
    });
    const windows = computeWindows(labels, 2);
    return { labels, windows };
  }, [weather?.hourly]);

  // slice 24h
  const next24 = sprayability.labels.slice(0, 24);

  // Component to read query params and center map
  function QueryMapCenter({ onCenter }: { onCenter: (latlng: { lat: number; lng: number }) => void }) {
    const location = useLocation();
    const map = useMap();

    useEffect(() => {
      const params = new URLSearchParams(location.search);
      const latS = params.get('lat');
      const lngS = params.get('lng');
      if (!latS || !lngS) return;
      const lat = parseFloat(latS);
      const lng = parseFloat(lngS);
      if (Number.isFinite(lat) && Number.isFinite(lng)) {
        // set selected area and pan the map
        onCenter({ lat, lng });
        try {
          map.setView([lat, lng], 13);
        } catch (mapError: unknown) {
          console.warn('Impossibile aggiornare la vista della mappa', mapError);
        }
      }
    }, [location.search, map, onCenter]);

    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-earth pt-16">
      {/* Header portato da AreaSelection: badge, titolo e descrizione */}
      <div className="container mx-auto px-4 py-4 max-w-4xl">
        <div className="text-center mb-8">
          <Badge className="bg-primary/10 text-primary mb-2 px-2 py-0.5 text-xs">
            Selezione Aree
          </Badge>
          <h1 className="text-3xl font-semibold mb-2 text-foreground">Seleziona la tua area</h1>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Identifica con precisione la tua zona di interesse usando gli strumenti di selezione
            sulla mappa interattiva per ottenere dati meteo locali e indici di sprayability.
          </p>
        </div>
      </div>

      {/* Search bar sotto header */}
      <div className="container mx-auto px-4 max-w-4xl mb-4">
        <div className="max-w-2xl mx-auto">
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!query.trim()) return;
              try {
                const q = encodeURIComponent(query.trim());
                const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${q}`;
                const res = await fetch(url, { headers: { 'Accept-Language': 'it' } });
                const payload: unknown = await res.json();
                if (!Array.isArray(payload) || payload.length === 0 || !isNominatimResult(payload[0])) {
                  alert('Nessun risultato trovato');
                  return;
                }
                const place = payload[0];
                const lat = parseFloat(place.lat);
                const lon = parseFloat(place.lon);
                const display = typeof place.display_name === 'string' ? place.display_name : '';
                // set selected area and update query params so QueryMapCenter recenters as well
                setSelectedArea({ lat, lng: lon });
                if (display) {
                  setSelectedName(display);
                  try {
                    localStorage.setItem('agri:selectedPlaceName', display);
                  } catch {
                    /* noop */
                  }
                }
                try {
                  localStorage.setItem('agri:selectedPlaceCoords', `${lat.toFixed(5)}, ${lon.toFixed(5)}`);
                } catch {
                  /* noop */
                }
                navigate(`/map?lat=${lat.toFixed(5)}&lng=${lon.toFixed(5)}`);
              } catch (err: unknown) {
                console.error(err);
                alert('Errore nel geocoding');
              }
            }}
          >
            <div className="relative">
              <span className="absolute inset-y-0 left-4 flex items-center text-agricultural-green">
                <Search className="w-6 h-6 text-agricultural-green" />
              </span>
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca località, indirizzo o coordinate (es. Bologna 44.5, 11.3)"
                className="pl-16 h-14 rounded-full shadow-md text-lg"
                style={{ borderWidth: '2px', borderColor: 'hsl(var(--agricultural-green))' }}
              />
            </div>
          </form>
        </div>
      </div>

      <div className="flex h-[calc(100vh-4rem)]">
        {/* Map Area */}
        <div className="flex-1 relative">
          <MapContainer center={mapDefaultCenter} zoom={6} className="w-full h-full">
            <QueryMapCenter onCenter={(latlng) => setSelectedArea(latlng)} />
            <TileLayer
              attribution="&copy; <a href=\"https://www.openstreetmap.org/copyright\">OpenStreetMap</a> contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <ClickHandler onSelect={(latlng) => {
              // set selected area and reverse-geocode to get a friendly name
              setSelectedArea(latlng);
              (async () => {
                try {
                  const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latlng.lat}&lon=${latlng.lng}&zoom=10&addressdetails=1`;
                  const res = await fetch(url, { headers: { 'Accept-Language': 'it' } });
                  const payload: unknown = await res.json();
                  const reverse = (payload ?? {}) as ReverseGeocodeResult;
                  const name = typeof reverse.display_name === 'string'
                    ? reverse.display_name
                    : `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`;
                  setSelectedName(name);
                  try {
                    localStorage.setItem('agri:selectedPlaceName', name);
                  } catch {
                    /* noop */
                  }
                  try {
                    localStorage.setItem('agri:selectedPlaceCoords', `${latlng.lat.toFixed(5)}, ${latlng.lng.toFixed(5)}`);
                  } catch {
                    /* noop */
                  }
                } catch (fetchError: unknown) {
                  console.warn('Reverse geocoding non disponibile', fetchError);
                }
              })();
            }} />

            {selectedArea && (
              <>
                <Marker position={[selectedArea.lat, selectedArea.lng]} />
                <Circle
                  center={[selectedArea.lat, selectedArea.lng]}
                  radius={250}
                  pathOptions={selectionCircleOptions}
                />
              </>
            )}
          </MapContainer>

          <div className="absolute top-4 left-4 z-50">
            <Card className="shadow-card-soft">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground mb-2">
                  Clicca sulla mappa per selezionare un&apos;area
                </p>
                {selectedArea && (
                  <div className="text-xs text-foreground">
                    Lat: {selectedArea.lat.toFixed(5)}, Lng: {selectedArea.lng.toFixed(5)}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-96 bg-background border-l border-border overflow-y-auto">
          {!selectedArea ? (
            <div className="p-6 text-center">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Seleziona un&apos;area</h3>
              <p className="text-muted-foreground">
                Clicca sulla mappa per visualizzare i dati meteo e gli indici di sprayability
              </p>
            </div>
          ) : (
            <div className="p-6 space-y-6">
              {/* Loading / Error */}
              {loading && (
                <Card className="shadow-card-soft">
                  <CardContent className="p-4 text-sm text-muted-foreground">
                    Recupero dati meteo…
                  </CardContent>
                </Card>
              )}
              {error && (
                <Card className="shadow-card-soft border-destructive">
                  <CardContent className="p-4 text-sm text-destructive">
                    {error} — riprova più tardi.
                  </CardContent>
                </Card>
              )}

              {/* Current Weather */}
              {/* Selected place summary */}
              {(selectedArea || selectedName) && (
                <Card className="shadow-card-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <MapPin className="w-5 h-5 mr-2 text-primary" />
                      Luogo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm">
                      {selectedName && (
                        <div className="flex items-center font-semibold text-foreground">
                          <Flag className="w-4 h-4 mr-2 text-agricultural-green" />
                          <span>{selectedName}{selectedArea ? ',' : ''}</span>
                        </div>
                      )}
                      {selectedArea && (
                        <div className="flex items-center text-muted-foreground mt-1">
                          <Globe className="w-4 h-4 mr-2 text-agricultural-green" />
                          <span>{selectedArea.lat.toFixed(5)}, {selectedArea.lng.toFixed(5)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!loading && weather && (
                <Card className="shadow-card-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <Cloud className="w-5 h-5 mr-2 text-primary" />
                      Condizioni Attuali
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Thermometer className="w-4 h-4 text-agricultural-earth" />
                        <span className="text-sm">
                          {weather.current?.temp_c != null ? `${weather.current?.temp_c}°C` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Droplets className="w-4 h-4 text-agricultural-sky" />
                        <span className="text-sm">
                          {weather.current?.rh_pct != null ? `${weather.current?.rh_pct}%` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Wind className="w-4 h-4 text-agricultural-green" />
                        <span className="text-sm">
                          {weather.current?.wind_ms != null ? `${weather.current?.wind_ms} m/s` : '—'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Cloud className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm">
                          {weather.current?.rain_mm != null ? `${weather.current?.rain_mm} mm` : '—'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Sprayability Index */}
              {!loading && weather && (
                <Card className="shadow-card-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center text-lg">
                      <AlertTriangle className="w-5 h-5 mr-2 text-primary" />
                      Indice Sprayability (24h)
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {next24.map((h, idx) => (
                        <div key={h.ts + idx} className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">{hhmm(h.ts)}</span>
                          <Badge
                            variant={
                              h.label === 'Buona'
                                ? 'default'
                                : h.label === 'Discreta'
                                ? 'secondary'
                                : 'destructive'
                            }
                            className="text-xs"
                          >
                            {h.label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommended Windows */}
              {!loading && weather && (
                <Card className="shadow-card-soft">
                  <CardHeader>
                    <CardTitle className="text-lg">Finestre Consigliate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {sprayability.windows.length === 0 ? (
                      <div className="text-sm text-muted-foreground">Nessuna finestra nelle prossime 48h</div>
                    ) : (
                      <div className="space-y-2">
                        {sprayability.windows.slice(0, 3).map((w, i) => (
                          <div key={i} className="p-3 bg-green-50 rounded-lg border border-green-200">
                            <div className="font-semibold text-green-800 text-sm">
                              {hhmm(w.start)} - {hhmm(w.end)}
                            </div>
                            <div className="text-xs text-green-600">Vento e pioggia entro soglia</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Export Actions */}
              <div className="flex space-x-2">
                <Button variant="outline" className="flex-1">
                  <Download className="w-4 h-4 mr-2" />
                  PNG
                </Button>
                <Button variant="outline" className="flex-1">
                  <Share2 className="w-4 h-4 mr-2" />
                  Condividi
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Map;
