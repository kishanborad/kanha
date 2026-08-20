import { useState, useEffect, useCallback } from 'react';

// --- WMO Weather Code to description + icon ---
interface WeatherCondition { description: string; icon: string; }

function wmoToCondition(code: number): WeatherCondition {
  if (code === 0)  return { description: 'Clear Sky',        icon: '☀️'  };
  if (code === 1)  return { description: 'Mainly Clear',     icon: '🌤️'  };
  if (code === 2)  return { description: 'Partly Cloudy',    icon: '⛅'  };
  if (code === 3)  return { description: 'Overcast',         icon: '☁️'  };
  if (code <= 49)  return { description: 'Foggy',            icon: '🌫️'  };
  if (code <= 57)  return { description: 'Drizzle',          icon: '🌦️'  };
  if (code <= 67)  return { description: 'Rain',             icon: '🌧️'  };
  if (code <= 77)  return { description: 'Snow',             icon: '❄️'  };
  if (code <= 82)  return { description: 'Rain Showers',     icon: '🌦️'  };
  if (code <= 86)  return { description: 'Snow Showers',     icon: '🌨️'  };
  if (code <= 99)  return { description: 'Thunderstorm',     icon: '⛈️'  };
  return { description: 'Unknown', icon: '🌡️' };
}

// --- Types ---
interface CurrentWeather {
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  feelsLike: number;
}

interface DayForecast {
  date: string;
  tempMax: number;
  tempMin: number;
  weatherCode: number;
  precipitationSum: number;
}

interface WeatherData {
  city: string;
  current: CurrentWeather;
  forecast: DayForecast[];
}

interface GeoResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
}

// --- API helpers ---
async function fetchWeatherByCoords(lat: number, lon: number, cityName: string): Promise<WeatherData> {
  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    current: 'temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m',
    daily: 'temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum',
    forecast_days: '5',
    timezone: 'auto',
  });

  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  const data = await res.json();

  const c = data.current;
  const d = data.daily;

  const forecast: DayForecast[] = (d.time as string[]).map((date: string, i: number) => ({
    date,
    tempMax: Math.round(d.temperature_2m_max[i]),
    tempMin: Math.round(d.temperature_2m_min[i]),
    weatherCode: d.weather_code[i],
    precipitationSum: d.precipitation_sum[i] ?? 0,
  }));

  return {
    city: cityName,
    current: {
      temperature: Math.round(c.temperature_2m),
      humidity: c.relative_humidity_2m,
      windSpeed: Math.round(c.wind_speed_10m),
      weatherCode: c.weather_code,
      feelsLike: Math.round(c.apparent_temperature),
    },
    forecast,
  };
}

async function geocodeCity(query: string): Promise<GeoResult[]> {
  const params = new URLSearchParams({ name: query, count: '5', language: 'en', format: 'json' });
  const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
  if (!res.ok) throw new Error('Geocoding failed');
  const data = await res.json();
  return data.results ?? [];
}

function getDayLabel(dateStr: string, index: number): string {
  if (index === 0) return 'Today';
  if (index === 1) return 'Tomorrow';
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[new Date(dateStr).getDay()];
}

// --- Component ---
export default function WeatherApp() {
  const [weather, setWeather]       = useState<WeatherData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [geoResults, setGeoResults] = useState<GeoResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [unit, setUnit]             = useState<'C' | 'F'>('C');

  const toF = (c: number) => Math.round(c * 9 / 5 + 32);
  const showTemp = (c: number) => unit === 'C' ? `${c}°C` : `${toF(c)}°F`;

  const loadWeather = useCallback(async (lat: number, lon: number, name: string) => {
    setLoading(true);
    setError(null);
    setGeoResults([]);
    setSearchQuery('');
    try {
      const data = await fetchWeatherByCoords(lat, lon, name);
      setWeather(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load weather');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported. Search for a city manually.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      pos => {
        loadWeather(pos.coords.latitude, pos.coords.longitude, 'Current Location');
      },
      () => {
        setError('Location access denied. Search for a city manually.');
      },
      { timeout: 8000 }
    );
  }, [loadWeather]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearchLoading(true);
    setError(null);
    try {
      const results = await geocodeCity(searchQuery.trim());
      setGeoResults(results);
      if (results.length === 0) setError('No cities found. Try a different name.');
    } catch {
      setError('City search failed. Check your connection.');
    } finally {
      setSearchLoading(false);
    }
  };

  const condition = weather ? wmoToCondition(weather.current.weatherCode) : null;

  const cardCls = 'glass-panel rounded-xl p-3 flex flex-col gap-1';

  return (
    <div className="h-full flex flex-col p-4 gap-3 overflow-y-auto">
      {/* Search bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchQuery}
            onChange={e => { setSearchQuery(e.target.value); setGeoResults([]); }}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Search city..."
            className="w-full bg-transparent border border-z-border rounded-xl px-4 py-2 text-sm font-mono text-z-text placeholder-z-dimmed focus:outline-none focus:border-z-primary/50 pr-10"
          />
          {searchLoading && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-z-primary text-xs font-mono animate-pulse">...</span>
          )}
        </div>
        <button
          onClick={handleSearch}
          disabled={searchLoading}
          className="px-4 py-2 rounded-xl text-sm font-mono bg-z-primary/20 text-z-primary border border-z-primary/40 hover:bg-z-primary/30 transition-all active:scale-95 disabled:opacity-50"
        >
          Search
        </button>
        <button
          onClick={() => setUnit(u => u === 'C' ? 'F' : 'C')}
          className="px-3 py-2 rounded-xl text-sm font-mono glass-panel text-z-dimmed hover:text-z-text transition-colors"
        >
          °{unit === 'C' ? 'F' : 'C'}
        </button>
      </div>

      {/* Geo search results */}
      {geoResults.length > 0 && (
        <div className="glass-panel rounded-xl divide-y divide-z-border overflow-hidden">
          {geoResults.map(r => (
            <button
              key={r.id}
              onClick={() => loadWeather(r.latitude, r.longitude, `${r.name}, ${r.country}`)}
              className="w-full text-left px-4 py-2.5 hover:bg-z-primary/5 transition-colors flex justify-between items-center"
            >
              <span className="text-sm font-mono text-z-text">{r.name}</span>
              <span className="text-xs font-mono text-z-dimmed">{r.country} · {r.latitude.toFixed(1)}°, {r.longitude.toFixed(1)}°</span>
            </button>
          ))}
        </div>
      )}

      {/* Error state */}
      {error && !loading && !weather && (
        <div className="glass-panel rounded-xl p-4 border border-z-error/30">
          <p className="text-sm font-mono text-z-error">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-2 border-z-primary/30 border-t-z-primary animate-spin" />
            <p className="text-xs font-mono text-z-dimmed">Fetching weather...</p>
          </div>
        </div>
      )}

      {/* Weather data */}
      {weather && !loading && (
        <div className="flex flex-col gap-3">
          {/* Current weather hero */}
          <div className="glass-panel glow-border rounded-xl p-4">
            <div className="flex justify-between items-start mb-3">
              <div>
                <p className="text-xs font-mono text-z-dimmed uppercase tracking-wider">{weather.city}</p>
                <p className="text-5xl font-mono text-z-primary mt-1 leading-none">
                  {showTemp(weather.current.temperature)}
                </p>
                <p className="text-sm font-mono text-z-dimmed mt-1">
                  Feels like {showTemp(weather.current.feelsLike)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-5xl">{condition?.icon}</p>
                <p className="text-xs font-mono text-z-text mt-1">{condition?.description}</p>
              </div>
            </div>

            {/* Current metrics grid */}
            <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-z-border">
              <div className="text-center">
                <p className="text-[10px] font-mono text-z-dimmed uppercase">Humidity</p>
                <p className="text-lg font-mono text-z-secondary">{weather.current.humidity}%</p>
              </div>
              <div className="text-center border-x border-z-border">
                <p className="text-[10px] font-mono text-z-dimmed uppercase">Wind</p>
                <p className="text-lg font-mono text-z-secondary">{weather.current.windSpeed} km/h</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-z-dimmed uppercase">Code</p>
                <p className="text-lg font-mono text-z-secondary">WMO {weather.current.weatherCode}</p>
              </div>
            </div>
          </div>

          {/* 5-day forecast */}
          <p className="text-[10px] font-mono text-z-dimmed uppercase tracking-widest px-1">5-Day Forecast</p>
          <div className="grid grid-cols-5 gap-2">
            {weather.forecast.map((day, i) => {
              const cond = wmoToCondition(day.weatherCode);
              return (
                <div key={day.date} className={`${cardCls} items-center text-center ${i === 0 ? 'border-z-primary/30 bg-z-primary/5' : ''}`}>
                  <p className="text-[10px] font-mono text-z-dimmed">{getDayLabel(day.date, i)}</p>
                  <p className="text-xl my-0.5">{cond.icon}</p>
                  <p className="text-xs font-mono text-z-primary">{showTemp(day.tempMax)}</p>
                  <p className="text-[10px] font-mono text-z-dimmed">{showTemp(day.tempMin)}</p>
                  {day.precipitationSum > 0 && (
                    <p className="text-[9px] font-mono text-z-secondary mt-0.5">{day.precipitationSum}mm</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Attribution */}
          <p className="text-[9px] font-mono text-z-dimmed text-center">
            Data from{' '}
            <span className="text-z-primary/60">Open-Meteo</span>
            {' '}· Free &amp; no API key required
          </p>
        </div>
      )}

      {/* Empty state */}
      {!weather && !loading && !error && (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center space-y-2">
            <p className="text-4xl">🌍</p>
            <p className="text-sm font-mono text-z-dimmed">Detecting location...</p>
          </div>
        </div>
      )}
    </div>
  );
}
