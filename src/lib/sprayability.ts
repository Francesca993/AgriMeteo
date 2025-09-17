import type { LucideIcon } from 'lucide-react';

export type HourPoint = {
  ts: string;
  temp_c: number | null;
  rh_pct: number | null;
  wind_ms: number | null;
  gust_ms: number | null;
  rain_mm: number | null;
  rain6h_mm?: number | null;
};

export type Factor = 'wind' | 'rain6h' | 'temp' | 'rh';

export type Category = 'Buona' | 'Discreta' | 'Scarsa';

export type FactorScore = {
  ok: 'good' | 'mid' | 'bad';
  gained: number;
  reason?: string;
};

export type Thresholds = {
  windGood: number;
  windMid: number;
  gustGood: number;
  gustMid: number;
  rainGood: number;
  rainMid: number;
  tempGoodMin: number;
  tempGoodMax: number;
  tempMidMin: number;
  tempMidMax: number;
  rhGoodMin: number;
  rhGoodMax: number;
  rhMidMin: number;
  rhMidMax: number;
};

export const WEIGHTS: Record<Factor, number> = {
  wind: 30,
  rain6h: 25,
  temp: 20,
  rh: 25,
};

export const WIND_GOOD = 4;
export const WIND_MID = 6;
export const GUST_GOOD = 6;
export const GUST_MID = 8;

export const RAIN_GOOD = 0.2;
export const RAIN_MID = 0.5;

export const TEMP_GOOD_MIN = 8;
export const TEMP_GOOD_MAX = 30;
export const TEMP_MID_MIN = 5;
export const TEMP_MID_MAX = 33;

export const RH_GOOD_MIN = 30;
export const RH_GOOD_MAX = 90;
export const RH_MID_MIN = 20;
export const RH_MID_MAX = 95;

export const DEFAULT_THRESHOLDS: Thresholds = {
  windGood: WIND_GOOD,
  windMid: WIND_MID,
  gustGood: GUST_GOOD,
  gustMid: GUST_MID,
  rainGood: RAIN_GOOD,
  rainMid: RAIN_MID,
  tempGoodMin: TEMP_GOOD_MIN,
  tempGoodMax: TEMP_GOOD_MAX,
  tempMidMin: TEMP_MID_MIN,
  tempMidMax: TEMP_MID_MAX,
  rhGoodMin: RH_GOOD_MIN,
  rhGoodMax: RH_GOOD_MAX,
  rhMidMin: RH_MID_MIN,
  rhMidMax: RH_MID_MAX,
};

export const PREFS_STORAGE_KEY = 'agri:spray:prefs';

export const CROP_PRESETS = {
  standard: {
    label: 'Standard',
    description: 'Parametri generici adatti alla maggior parte delle colture.',
    thresholds: {},
  },
  grano: {
    label: 'Grano',
    description: 'Maggior tolleranza a temperature fresche e vento moderato.',
    thresholds: {
      tempGoodMin: 6,
      tempGoodMax: 28,
      tempMidMin: 3,
      tempMidMax: 32,
      rhGoodMin: 30,
      rhGoodMax: 85,
      windGood: 5,
      windMid: 7,
      gustGood: 7,
      gustMid: 9,
      rainGood: 0.3,
      rainMid: 0.6,
    },
  },
  vite: {
    label: 'Vite',
    description: 'Preferisce vento debole, clima mite e UR medio-alta.',
    thresholds: {
      tempGoodMin: 10,
      tempGoodMax: 27,
      tempMidMin: 7,
      tempMidMax: 30,
      rhGoodMin: 40,
      rhGoodMax: 95,
      windGood: 3.5,
      windMid: 5.5,
      gustGood: 5.5,
      gustMid: 7,
      rainGood: 0.2,
      rainMid: 0.4,
    },
  },
  olivo: {
    label: 'Olivo',
    description: 'Tollerante alle temperature alte, sensibile alla pioggia ravvicinata.',
    thresholds: {
      tempGoodMin: 8,
      tempGoodMax: 32,
      tempMidMin: 5,
      tempMidMax: 35,
      rhGoodMin: 25,
      rhGoodMax: 85,
      windGood: 4.5,
      windMid: 6.5,
      gustGood: 6.5,
      gustMid: 8.5,
      rainGood: 0.15,
      rainMid: 0.4,
    },
  },
} as const;

export const PRODUCT_PRESETS = {
  fungicida: {
    label: 'Fungicida',
    description: 'Richiede UR medio-alta e pioggia limitata nelle ore successive.',
    adjustments: {
      rhGoodMin: 45,
      rhGoodMax: 95,
      rainGood: 0.15,
      rainMid: 0.35,
    },
    suggestedMinWindow: 3,
  },
  insetticida: {
    label: 'Insetticida',
    description: 'Predilige vento molto contenuto per limitare la deriva.',
    adjustments: {
      windGood: 3.2,
      windMid: 5,
      gustGood: 4.8,
      gustMid: 6.2,
    },
    suggestedMinWindow: 2,
  },
  diserbante: {
    label: 'Diserbante',
    description: 'Più tollerante al vento ma attenzione alla pioggia imminente.',
    adjustments: {
      windGood: 4.8,
      windMid: 6.8,
      gustGood: 6.8,
      gustMid: 8.8,
      rainGood: 0.25,
      rainMid: 0.6,
    },
    suggestedMinWindow: 2,
  },
} as const;

export const WIND_SENSITIVITY_PRESETS = {
  strict: {
    label: 'Alta (molto sensibile)',
    description: 'Interventi solo con vento molto debole.',
    overrides: {
      windGood: 3,
      windMid: 4.5,
      gustGood: 5,
      gustMid: 6.5,
    },
  },
  balanced: {
    label: 'Media',
    description: 'Compromesso tra efficienza e operatività.',
    overrides: {},
  },
  tolerant: {
    label: 'Bassa (più tollerante)',
    description: 'Consente trattamenti anche con vento leggermente più sostenuto.',
    overrides: {
      windGood: 4.8,
      windMid: 6.8,
      gustGood: 6.8,
      gustMid: 8.5,
    },
  },
} as const;

export type CropPresetKey = keyof typeof CROP_PRESETS;
export type ProductPresetKey = keyof typeof PRODUCT_PRESETS;
export type WindSensitivityKey = keyof typeof WIND_SENSITIVITY_PRESETS;

export function mergeThresholds(
  base: Thresholds,
  ...overrides: Array<Partial<Thresholds> | undefined>
): Thresholds {
  const merged: Thresholds = { ...base };
  overrides.forEach((override) => {
    if (!override) return;
    (Object.keys(override) as (keyof Thresholds)[]).forEach((key) => {
      const value = override[key];
      if (typeof value === 'number') {
        merged[key] = value;
      }
    });
  });
  return merged;
}

export function thresholdsEqual(a: Thresholds, b: Thresholds): boolean {
  for (const key of Object.keys(a) as (keyof Thresholds)[]) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}

export function fmtHHmm(ts: string): string {
  try {
    return new Date(ts).toLocaleTimeString('it-IT', {
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return ts;
  }
}

export function nearestIndexToNow(times: string[]): number {
  const now = Date.now();
  let idx = 0;
  let best = Number.POSITIVE_INFINITY;
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(new Date(times[i]).getTime() - now);
    if (d < best) {
      best = d;
      idx = i;
    }
  }
  return idx;
}

export function sumWindow(values: Array<number | null | undefined>, start: number, len: number): number {
  let s = 0;
  for (let k = 0; k < len; k++) {
    const v = values[start + k];
    if (typeof v === 'number') s += v;
  }
  return +s.toFixed(2);
}

export function classify(score: number): Category {
  if (score >= 85) return 'Buona';
  if (score >= 50) return 'Discreta';
  return 'Scarsa';
}

export function scoreWind(
  wind_ms?: number | null,
  gust_ms?: number | null,
  thr: Thresholds | null = null,
): FactorScore {
  const W = thr ?? DEFAULT_THRESHOLDS;
  const w = typeof wind_ms === 'number' ? wind_ms : Infinity;
  const g = typeof gust_ms === 'number' ? gust_ms : Infinity;

  if (w <= W.windGood && g <= W.gustGood) {
    return {
      ok: 'good',
      gained: WEIGHTS.wind,
      reason: `vento ${w.toFixed(1)} m/s, raffiche ${isFinite(g) ? g.toFixed(1) : '—'} m/s`,
    };
  }
  if (w <= W.windMid && g <= W.gustMid) {
    return {
      ok: 'mid',
      gained: WEIGHTS.wind * 0.6,
      reason: `vento ${w.toFixed(1)} m/s (moderato)`,
    };
  }
  return {
    ok: 'bad',
    gained: 0,
    reason: `vento ${isFinite(w) ? w.toFixed(1) : '—'} m/s (alto)`,
  };
}

export function scoreRain(rain6h?: number | null, thr: Thresholds | null = null): FactorScore {
  const W = thr ?? DEFAULT_THRESHOLDS;
  const r = typeof rain6h === 'number' ? rain6h : Infinity;
  if (r <= W.rainGood) {
    return {
      ok: 'good',
      gained: WEIGHTS.rain6h,
      reason: `pioggia prossime 6h ${r.toFixed(1)} mm`,
    };
  }
  if (r <= W.rainMid) {
    return {
      ok: 'mid',
      gained: WEIGHTS.rain6h * 0.6,
      reason: `pioggia 6h ${r.toFixed(1)} mm (bassa)`,
    };
  }
  return {
    ok: 'bad',
    gained: 0,
    reason: `pioggia 6h ${isFinite(r) ? r.toFixed(1) : '—'} mm (alta)`,
  };
}

export function scoreTemp(t?: number | null, thr: Thresholds | null = null): FactorScore {
  const W = thr ?? DEFAULT_THRESHOLDS;
  const val = typeof t === 'number' ? t : NaN;
  if (!Number.isFinite(val)) return { ok: 'bad', gained: 0, reason: 'T° n/d' };
  if (val >= W.tempGoodMin && val <= W.tempGoodMax) {
    return { ok: 'good', gained: WEIGHTS.temp, reason: `T° ${val.toFixed(1)}°C` };
  }
  if (val >= W.tempMidMin && val <= W.tempMidMax) {
    return {
      ok: 'mid',
      gained: WEIGHTS.temp * 0.6,
      reason: `T° ${val.toFixed(1)}°C (accett.)`,
    };
  }
  return { ok: 'bad', gained: 0, reason: `T° ${val.toFixed(1)}°C (limite)` };
}

export function scoreRH(rh?: number | null, thr: Thresholds | null = null): FactorScore {
  const W = thr ?? DEFAULT_THRESHOLDS;
  const val = typeof rh === 'number' ? rh : NaN;
  if (!Number.isFinite(val)) return { ok: 'bad', gained: 0, reason: 'UR n/d' };
  if (val >= W.rhGoodMin && val <= W.rhGoodMax) {
    return { ok: 'good', gained: WEIGHTS.rh, reason: `UR ${val.toFixed(0)}%` };
  }
  if (val >= W.rhMidMin && val <= W.rhMidMax) {
    return {
      ok: 'mid',
      gained: WEIGHTS.rh * 0.6,
      reason: `UR ${val.toFixed(0)}% (accett.)`,
    };
  }
  return { ok: 'bad', gained: 0, reason: `UR ${val.toFixed(0)}% (limite)` };
}

export function evaluateHour(
  h: HourPoint,
  thr: Thresholds | null = null,
): {
  score: number;
  category: Category;
  factors: { wind: FactorScore; rain6h: FactorScore; temp: FactorScore; rh: FactorScore };
  brief: string;
} {
  const fWind = scoreWind(h.wind_ms, h.gust_ms, thr);
  const fRain = scoreRain(h.rain6h_mm ?? null, thr);
  const fTemp = scoreTemp(h.temp_c, thr);
  const fRH = scoreRH(h.rh_pct, thr);
  const sum = fWind.gained + fRain.gained + fTemp.gained + fRH.gained;
  const score = Math.round(sum);
  const category = classify(score);
  const reasons = [fWind, fRain, fTemp, fRH]
    .sort(
      (a, b) =>
        (a.ok === 'good' ? 0 : a.ok === 'mid' ? 1 : 2) -
        (b.ok === 'good' ? 0 : b.ok === 'mid' ? 1 : 2),
    )
    .slice(0, 2)
    .map((r) => r.reason)
    .filter(Boolean)
    .join(', ');
  return {
    score,
    category,
    factors: { wind: fWind, rain6h: fRain, temp: fTemp, rh: fRH },
    brief: reasons,
  };
}

export async function fetchHourly(lat: number, lon: number): Promise<HourPoint[]> {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.search = new URLSearchParams({
    latitude: String(lat.toFixed(4)),
    longitude: String(lon.toFixed(4)),
    timezone: 'Europe/Rome',
    forecast_days: '2',
    hourly: 'temperature_2m,relative_humidity_2m,precipitation,wind_speed_10m,wind_gusts_10m',
    windspeed_unit: 'ms',
    precipitation_unit: 'mm',
  }).toString();

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error('Errore Open-Meteo (hourly)');
  const j = await res.json();
  const H = j?.hourly || {};
  const time: string[] = H.time || [];
  const out: HourPoint[] = time.map((ts: string, i: number) => ({
    ts,
    temp_c: H.temperature_2m?.[i] ?? null,
    rh_pct: H.relative_humidity_2m?.[i] ?? null,
    wind_ms: H.wind_speed_10m?.[i] ?? null,
    gust_ms: H.wind_gusts_10m?.[i] ?? null,
    rain_mm: H.precipitation?.[i] ?? null,
  }));
  const rains = out.map((o) => o.rain_mm ?? 0);
  for (let i = 0; i < out.length; i++) {
    out[i].rain6h_mm = sumWindow(rains, i, 6);
  }
  return out;
}

export type SprayabilityFactorDisplay = {
  name: string;
  icon: LucideIcon;
  threshold: string;
  current: number | string;
  unit: string;
  status: 'good' | 'mid' | 'bad';
  weight: number;
};
