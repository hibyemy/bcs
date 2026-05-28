import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';

const TelemetryContext = createContext();

export function useTelemetry() {
  return useContext(TelemetryContext);
}

export function TelemetryProvider({ children, enabled = true }) {
  const [telemetry, setTelemetry] = useState({
    iss: null,
    node: null,
    earthquakes: []
  });

  const [presences, setPresences] = useState({});
  const [chatMessages, setChatMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  // Expose a method to send chat messages
  const sendChatMessage = useCallback((username, content) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'chat', username, content, timestamp: Date.now() }));
    }
  }, []);

  // Expose a method to securely map callsign to identity
  const setCallsign = useCallback((username) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: 'set_username', username }));
    }
  }, []);

  // Update presence method
  const sendPresence = useCallback((lat, lng, continent) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      // Send a random session ID so we can uniquely identify ourselves
      // Usually you'd store this in sessionStorage
      let sessionId = sessionStorage.getItem('sessionId');
      if (!sessionId) {
        sessionId = Math.random().toString(36).substring(2, 9);
        sessionStorage.setItem('sessionId', sessionId);
      }
      wsRef.current.send(JSON.stringify({ type: 'presence', sessionId, lat, lng, continent }));
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    let active = true;

    // 1. IP / Node
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => { 
        if (active) {
          setTelemetry(p => ({ ...p, node: d }));
          // Once we have our node, if the socket is open, send presence immediately
          sendPresence(d.latitude, d.longitude, d.continent_code);
        }
      })
      .catch(e => console.error('Node fetch error:', e));

    // 2. ISS
    const fetchIss = () => {
      fetch('https://api.wheretheiss.at/v1/satellites/25544')
        .then(r => r.json())
        .then(d => { if (active) setTelemetry(p => ({ ...p, iss: d })) })
        .catch(e => console.error('ISS fetch error:', e));
    };
    fetchIss();
    const issTimer = setInterval(fetchIss, 120000);

    // 3. Earthquakes
    const fetchEq = () => {
      fetch('https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson')
        .then(r => r.json())
        .then(d => { if (active) setTelemetry(p => ({ ...p, earthquakes: d.features || [] })) })
        .catch(e => console.error('EQ fetch error:', e));
    };
    fetchEq();
    const eqTimer = setInterval(fetchEq, 60000);

    // 4. WebSocket setup
    const connectWs = () => {
      const token = localStorage.getItem("bcs_access_token");
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      let wsUrl = `${protocol}//${window.location.host}/api/hub`;
      if (token) wsUrl += `?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        // When connected, if we already have our node data, send presence
        setTelemetry(t => {
          if (t.node) {
            sendPresence(t.node.latitude, t.node.longitude, t.node.continent_code);
          }
          return t;
        });
        
        // Also send heartbeat presence every 10 seconds
        const presenceTimer = setInterval(() => {
           setTelemetry(t => {
             if (t.node) sendPresence(t.node.latitude, t.node.longitude, t.node.continent_code);
             return t;
           });
        }, 10000);
        ws.presenceTimer = presenceTimer;
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          
          if (msg.type === 'history') {
            setChatMessages(Array.isArray(msg.data) ? msg.data : []);
          } else if (msg.type === 'chat') {
            setChatMessages(prev => {
              const next = [...prev, msg];
              if (next.length > 100) return next.slice(-100); // Prevent memory leak
              return next;
            });
          } else if (msg.type === 'presence') {
            // Update presence map with timestamp
            setPresences(prev => ({
              ...prev,
              [msg.sessionId]: { ...msg, lastSeen: Date.now() }
            }));
          }
        } catch (e) {
          console.error("Failed to parse websocket message", e);
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (ws.presenceTimer) clearInterval(ws.presenceTimer);
        // Try to reconnect in 5 seconds
        if (active) setTimeout(connectWs, 5000);
      };
    };

    connectWs();

    // 5. Cleanup stale presences
    const cleanupTimer = setInterval(() => {
       const now = Date.now();
       setPresences(prev => {
         const next = { ...prev };
         let changed = false;
         for (const key in next) {
            if (now - next[key].lastSeen > 30000) { // 30 seconds timeout
               delete next[key];
               changed = true;
            }
         }
         return changed ? next : prev;
       });
    }, 5000);

    return () => {
      active = false;
      clearInterval(issTimer);
      clearInterval(eqTimer);
      clearInterval(cleanupTimer);
      if (wsRef.current) {
        if (wsRef.current.presenceTimer) clearInterval(wsRef.current.presenceTimer);
        wsRef.current.close();
      }
    };
  }, [enabled, sendPresence]);

  return (
    <TelemetryContext.Provider value={{ telemetry, presences, chatMessages, sendChatMessage, setCallsign, isConnected }}>
      {children}
    </TelemetryContext.Provider>
  );
}
