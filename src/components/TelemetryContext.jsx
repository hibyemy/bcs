import React, { createContext, useContext, useState, useEffect } from 'react';

const TelemetryContext = createContext();

export function useTelemetry() {
  return useContext(TelemetryContext);
}

export function TelemetryProvider({ children }) {
  const [telemetry, setTelemetry] = useState({
    iss: null,
    node: null,
    earthquakes: []
  });

  useEffect(() => {
    let active = true;

    // 1. IP / Node
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { if (active) setTelemetry(p => ({ ...p, node: d })) })
      .catch(e => console.error('Node fetch error:', e));

    // 2. ISS
    const fetchIss = () => {
      fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then(r => r.json())
        .then(d => { if (active) setTelemetry(p => ({ ...p, iss: d })) })
        .catch(e => console.error('ISS fetch error:', e));
    };
    fetchIss();
    const issTimer = setInterval(fetchIss, 3000);

    // 3. Earthquakes (Past hour)
    const fetchEq = () => {
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
        .then(r => r.json())
        .then(d => { if (active) setTelemetry(p => ({ ...p, earthquakes: d.features || [] })) })
        .catch(e => console.error('EQ fetch error:', e));
    };
    fetchEq();
    const eqTimer = setInterval(fetchEq, 60000);

    return () => {
      active = false;
      clearInterval(issTimer);
      clearInterval(eqTimer);
    };
  }, []);

  return (
    <TelemetryContext.Provider value={telemetry}>
      {children}
    </TelemetryContext.Provider>
  );
}
