import React, { useState, useEffect } from 'react';
import { useTelemetry } from './TelemetryContext';

/* ═══════════════════════════════════════════════════════
   LIVE DATA FEEDS
   Pulls from free, no-auth APIs:
   - Open-Meteo for weather
   - CoinGecko for crypto
   - Various Telemetry (ISS, Node, USGS) via context
   ═══════════════════════════════════════════════════════ */

function DeepSpaceFeed() {
  const telemetry = useTelemetry();

  if (!telemetry) return null;

  const { iss, node, earthquakes } = telemetry;
  const recentEq = earthquakes?.length > 0 ? earthquakes[0] : null;

  return (
    <div className="space-y-3">
      {/* NODE ID */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-yellow-400/40 font-bold"
          style={{ fontFamily: 'var(--font-display)' }}>
          Client Node Uplink
        </div>
        {!node ? (
          <div className="text-[11px] text-yellow-400/30 animate-pulse">Detecting origin...</div>
        ) : (
          <div className="text-[11px] text-yellow-400/60 space-y-0.5">
            <div>IP: <span className="text-yellow-400 text-glow">{node.ip}</span></div>
            <div>LOC: <span className="text-yellow-400 text-glow">{node.city}, {node.country_name}</span></div>
            <div>LAT/LON: <span className="text-yellow-400 text-glow">{node.latitude?.toFixed(2)} / {node.longitude?.toFixed(2)}</span></div>
          </div>
        )}
      </div>

      {/* ISS TRACKER */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-red-400/40 font-bold"
          style={{ fontFamily: 'var(--font-display)' }}>
          Orbital Telemetry
        </div>
        {!iss ? (
          <div className="text-[11px] text-red-400/30 animate-pulse">Tracking satellite...</div>
        ) : (
          <div className="text-[11px] text-red-400/60 space-y-0.5">
            <div>ID: <span className="text-red-400 text-glow">ISS_ALPHA_1</span></div>
            <div>ALT: <span className="text-red-400 text-glow">{Math.round(iss.altitude)} km</span></div>
            <div>VEL: <span className="text-red-400 text-glow">{Math.round(iss.velocity)} km/h</span></div>
            <div>COORD: <span className="text-red-400 text-glow">{iss.latitude?.toFixed(2)}, {iss.longitude?.toFixed(2)}</span></div>
          </div>
        )}
      </div>

      {/* SEISMIC */}
      <div>
        <div className="text-[10px] uppercase tracking-widest text-orange-400/40 font-bold"
          style={{ fontFamily: 'var(--font-display)' }}>
          Global Seismic
        </div>
        {!recentEq ? (
          <div className="text-[11px] text-orange-400/30 animate-pulse">Monitoring sensors...</div>
        ) : (
          <div className="text-[11px] text-orange-400/60 space-y-0.5">
            <div>EVENT: <span className="text-orange-400 text-glow">M {recentEq.properties.mag?.toFixed(1)}</span></div>
            <div>LOC: <span className="text-orange-400 text-glow">{recentEq.properties.place}</span></div>
            <div>TIME: <span className="text-orange-400 text-glow">{new Date(recentEq.properties.time).toLocaleTimeString()}</span></div>
          </div>
        )}
      </div>
    </div>
  );
}

function WeatherFeed() {
  const [weather, setWeather] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchWeather() {
      try {
        const res = await fetch(
          'https://api.open-meteo.com/v1/forecast?latitude=37.5483&longitude=-121.9886&current=temperature_2m,wind_speed_10m,relative_humidity_2m,weather_code&temperature_unit=fahrenheit&wind_speed_unit=mph'
        );
        if (!cancelled) {
          const data = await res.json();
          setWeather(data.current);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchWeather();
    const id = setInterval(fetchWeather, 120000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  const weatherDesc = (code) => {
    if (code <= 3)  return 'CLEAR';
    if (code <= 48) return 'FOG';
    if (code <= 67) return 'RAIN';
    if (code <= 77) return 'SNOW';
    if (code <= 82) return 'SHOWERS';
    return 'STORM';
  };

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-green-500/40 font-bold"
        style={{ fontFamily: 'var(--font-display)' }}>
        Environmental Sensors
      </div>
      {error && <div className="text-[11px] text-red-500/50">FEED OFFLINE</div>}
      {!weather && !error && <div className="text-[11px] text-green-500/30 animate-pulse">Acquiring telemetry...</div>}
      {weather && (
        <div className="text-[11px] text-green-500/60 space-y-0.5">
          <div>TEMP: <span className="text-green-400 text-glow">{weather.temperature_2m}°F</span></div>
          <div>WIND: <span className="text-green-400 text-glow">{weather.wind_speed_10m} mph</span></div>
          <div>HUMIDITY: <span className="text-green-400 text-glow">{weather.relative_humidity_2m}%</span></div>
          <div>STATUS: <span className="text-cyan-400/60 text-glow-cyan">{weatherDesc(weather.weather_code)}</span></div>
        </div>
      )}
    </div>
  );
}

function CryptoFeed() {
  const [prices, setPrices] = useState(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchPrices() {
      try {
        const res = await fetch(
          'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum&vs_currencies=usd&include_24hr_change=true'
        );
        if (!cancelled) {
          const data = await res.json();
          setPrices(data);
        }
      } catch {
        if (!cancelled) setError(true);
      }
    }

    fetchPrices();
    const id = setInterval(fetchPrices, 60000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <div className="space-y-1">
      <div className="text-[10px] uppercase tracking-widest text-green-500/40 font-bold"
        style={{ fontFamily: 'var(--font-display)' }}>
        Market Telemetry
      </div>
      {error && <div className="text-[11px] text-red-500/50">FEED OFFLINE</div>}
      {!prices && !error && <div className="text-[11px] text-green-500/30 animate-pulse">Connecting to exchange...</div>}
      {prices && (
        <div className="text-[11px] text-green-500/60 space-y-0.5">
          {prices.bitcoin && (
            <>
              <div>BTC: <span className="text-green-400 text-glow">${prices.bitcoin.usd?.toLocaleString()}</span>
                {prices.bitcoin.usd_24h_change != null && (
                  <span className={`ml-2 ${prices.bitcoin.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {prices.bitcoin.usd_24h_change >= 0 ? '▲' : '▼'} {Math.abs(prices.bitcoin.usd_24h_change).toFixed(2)}%
                  </span>
                )}
              </div>
            </>
          )}
          {prices.ethereum && (
            <div>ETH: <span className="text-green-400 text-glow">${prices.ethereum.usd?.toLocaleString()}</span>
              {prices.ethereum.usd_24h_change != null && (
                <span className={`ml-2 ${prices.ethereum.usd_24h_change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {prices.ethereum.usd_24h_change >= 0 ? '▲' : '▼'} {Math.abs(prices.ethereum.usd_24h_change).toFixed(2)}%
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Combined live feeds panel ──────────────────────── */
export default function LiveFeeds() {
  return (
    <div className="border-glow bg-black/60 p-3 space-y-4">
      <DeepSpaceFeed />
      <div className="border-t border-green-500/10" />
      <WeatherFeed />
      <div className="border-t border-green-500/10" />
      <CryptoFeed />
    </div>
  );
}
