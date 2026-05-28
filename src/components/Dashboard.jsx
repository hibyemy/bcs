import React, { useState, useEffect, useRef, useCallback, Suspense, lazy } from 'react';
import CommandConsole from './CommandConsole';
import SubSystemView from './SubSystemView';

const LiveFeeds = lazy(() => import('./LiveFeeds'));
const ChatConsole = lazy(() => import('./ChatConsole'));
import SettingsPanel from './SettingsPanel';
import GuidePanel from './GuidePanel';
import NetworkStats from './NetworkStats';
import { TelemetryProvider } from './TelemetryContext';

/* ── Tiny helper: random hex chars ──────────────────── */
function randHex(len = 8) {
  return Array.from({ length: len }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('').toUpperCase();
}

/* ── Matrix rain column ─────────────────────────────── */
function MatrixColumn({ left, speed, chars }) {
  const [col, setCol] = useState('');
  useEffect(() => {
    const id = setInterval(() => {
      setCol(Array.from({ length: chars }, () =>
        String.fromCharCode(0x30A0 + Math.random() * 96)
      ).join('\n'));
    }, speed);
    return () => clearInterval(id);
  }, [chars, speed]);

  return (
    <div
      className="absolute top-0 text-green-500/20 text-[10px] leading-[12px] whitespace-pre select-none pointer-events-none"
      style={{
        left: `${left}%`,
        animation: `rain-fall ${4 + Math.random() * 6}s linear infinite`,
      }}
    >
      {col}
    </div>
  );
}

/* ── Scrolling data ticker ──────────────────────────── */
function DataTicker() {
  const [data, setData] = useState('');
  useEffect(() => {
    const gen = () => {
      const segs = [];
      for (let i = 0; i < 20; i++) {
        segs.push(`PKT:${randHex(4)}  SRC:10.0.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}  DST:${randHex(4)}  TTL:${Math.floor(Math.random()*128+1)}  SEQ:${randHex(6)}`);
      }
      setData(segs.join('   ///   '));
    };
    gen();
    const id = setInterval(gen, 30000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="w-full overflow-hidden border-t border-b border-green-500/20 py-1 bg-black/60">
      <div className="animate-ticker whitespace-nowrap text-[10px] text-green-500/40 text-glow">
        {data}
      </div>
    </div>
  );
}

/* ── Network activity log panel ─────────────────────── */
function ActivityLog({ onClose }) {
  const [entries, setEntries] = useState([]);
  const logRef = useRef(null);

  const hosts = [
    'cloud.bowenchen.xyz',
    'jellyfin.bowenchen.xyz',
    'factorio.bowenchen.xyz',
    'ssh.bowenchen.xyz',
    'dns.bowenchen.xyz',
    'signals.bowenchen.xyz',
  ];
  const actions = [
    'SYNC', 'AUTH', 'STREAM', 'HEARTBEAT', 'TRANSFER',
    'QUERY', 'RESOLVE', 'CONNECT', 'HANDSHAKE',
  ];

  useEffect(() => {
    const id = setInterval(() => {
      const host = hosts[Math.floor(Math.random() * hosts.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const ts = new Date().toLocaleTimeString('en-US', { hour12: false });
      setEntries(prev => {
        const next = [...prev, `[${ts}] ${action} ${host} — ${randHex(6)}`];
        return next.slice(-40);
      });
    }, 1800);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [entries]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-10 pointer-events-auto" onClick={onClose}>
      <div className="w-full max-w-2xl border border-green-500/50 bg-black/95 shadow-[0_0_40px_rgba(34,197,94,0.15)] flex flex-col h-[60vh] sm:h-[500px]" onClick={e => e.stopPropagation()}>
        
        {/* Retro Title Bar */}
        <div className="border-b border-green-500/50 bg-green-900/20 px-3 py-2 flex items-center justify-between">
          <div className="text-[10px] text-green-400 font-bold uppercase tracking-widest flex items-center gap-2" style={{ fontFamily: 'var(--font-display)' }}>
            <span className="w-2 h-2 bg-green-500 rounded-sm animate-pulse"></span>
            BCS_SYS:// Network Activity Log
          </div>
          <button 
            onClick={onClose}
            className="text-[10px] text-green-400 hover:bg-green-500 hover:text-black border border-green-500/50 px-2 py-0.5 transition-colors"
          >
            [X]
          </button>
        </div>

        <div className="p-4 flex-1 flex flex-col overflow-hidden">
          <div ref={logRef} className="flex-1 overflow-y-auto text-[11px] leading-[16px] text-green-500/70 text-glow">
            {entries.map((e, i) => <div key={i}>{e}</div>)}
            <span className="cursor-blink text-green-400">▌</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── System stats gauges ────────────────────────────── */
function SystemStats() {
  const [stats, setStats] = useState({ cpu: 12, ram: 43, zpool: 67, net: 2.4 });

  useEffect(() => {
    const id = setInterval(() => {
      setStats(prev => ({
        cpu: Math.max(3, Math.min(95, prev.cpu + (Math.random() * 10 - 5))),
        ram: Math.max(20, Math.min(90, prev.ram + (Math.random() * 4 - 2))),
        zpool: Math.max(50, Math.min(85, prev.zpool + (Math.random() * 2 - 1))),
        net: Math.max(0.1, Math.min(10, prev.net + (Math.random() * 2 - 1))),
      }));
    }, 2000);
    return () => clearInterval(id);
  }, []);

  const bars = [
    { label: 'CPU',   value: stats.cpu,   unit: '%' },
    { label: 'RAM',   value: stats.ram,   unit: '%' },
    { label: 'ZPOOL', value: stats.zpool, unit: '%' },
    { label: 'NET',   value: stats.net,   unit: 'Gb/s' },
  ];

  return (
    <div className="border-glow bg-black/60 p-3">
      <div className="text-[10px] uppercase tracking-widest text-green-500/60 mb-3 font-bold"
        style={{ fontFamily: 'var(--font-display)' }}>
        System Resources
      </div>
      <div className="space-y-2">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-[10px] text-green-500/60 mb-0.5">
              <span>{b.label}</span>
              <span>{b.unit === '%' ? Math.round(b.value) : b.value.toFixed(1)}{b.unit}</span>
            </div>
            <div className="h-1.5 bg-green-500/10 overflow-hidden">
              <div
                className="h-full bg-green-500/60 transition-all duration-1000"
                style={{ width: `${b.unit === '%' ? b.value : b.value * 10}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Service node card ──────────────────────────────── */
function ServiceNode({ name, desc, url, status, onDrillDown, drillDownEnabled }) {
  const [hover, setHover] = useState(false);

  const handleClick = (e) => {
    if (drillDownEnabled && onDrillDown) {
      e.preventDefault();
      onDrillDown(name.toLowerCase());
    }
  };

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      onClick={handleClick}
      className="block border-glow bg-black/60 p-4 relative overflow-hidden group transition-all duration-300 hover:border-green-500/60 hover:bg-green-500/5"
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      {hover && (
        <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-500">
          <div className="absolute inset-0 rounded-full bg-green-500 animate-pulse-ring" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-2">
        <div className={`w-1.5 h-1.5 rounded-full ${status === 'online' ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-red-500'}`} />
        <span className="text-[10px] uppercase tracking-widest text-green-500/50">
          {status}
        </span>
        {drillDownEnabled && (
          <span className="text-[9px] uppercase tracking-widest text-cyan-400/30 ml-auto">
            [click to inspect]
          </span>
        )}
      </div>

      <div className="text-sm font-bold text-green-400 text-glow mb-1 group-hover:text-green-300 transition-colors">
        &gt; {name}
      </div>
      <div className="text-[11px] text-green-500/50 leading-tight">
        {desc}
      </div>

      <div className="mt-3 text-[9px] text-green-500/30 truncate">
        {url}
      </div>

      <div className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-transparent via-green-500/40 to-transparent w-full opacity-0 group-hover:opacity-100 transition-opacity" />
    </a>
  );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */
export default function Dashboard() {
  const [uptime, setUptime] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showGuide, setShowGuide] = useState(false);
  const [showEdgeStats, setShowEdgeStats] = useState(false);
  const [showActivityLog, setShowActivityLog] = useState(false);
  const [drillDownService, setDrillDownService] = useState(null);
  
  const [hasAccess, setHasAccess] = useState(() => document.cookie.includes('bcs_is_auth=true'));

  useEffect(() => {
    // Session state verification on mount
    fetch('/api/me')
      .then(r => r.json())
      .then(data => {
        setHasAccess(data.authenticated);
      })
      .catch(e => {
        console.error("[dashboard] Session verification failed on mount:", e);
      });
  }, []);

  const handleLogin = () => {
    const baseUrl = import.meta.env.VITE_AUTH_ISSUER_URL || (import.meta.env.DEV ? "http://localhost:8789" : "https://openauth-template.bc2005530.workers.dev");
    const authUrl = new URL(baseUrl + "/authorize");
    authUrl.searchParams.set("client_id", "bcs-frontend");
    authUrl.searchParams.set("redirect_uri", window.location.origin + "/api/callback");
    authUrl.searchParams.set("response_type", "code");
    window.location.href = authUrl.toString();
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    window.location.href = "/api/logout";
  };

  const [features, setFeatures] = useState(() => {
    const defaultFeatures = { console: true, drilldown: false, livefeeds: false, sysstats: false, chat: true };
    try {
      const saved = sessionStorage.getItem('bcs-features');
      if (saved) {
        return { ...defaultFeatures, ...JSON.parse(saved) };
      }
    } catch {}
    return defaultFeatures;
  });

  useEffect(() => {
    sessionStorage.setItem('bcs-features', JSON.stringify(features));
  }, [features]);

  const toggleFeature = useCallback((key) => {
    setFeatures(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  /* ── Uptime counter ─────────────────────────────────  */
  useEffect(() => {
    const id = setInterval(() => setUptime(p => p + 1), 1000);
    return () => clearInterval(id);
  }, []);

  const fmtUptime = (s) => {
    const h = String(Math.floor(s / 3600)).padStart(2, '0');
    const m = String(Math.floor((s % 3600) / 60)).padStart(2, '0');
    const sec = String(s % 60).padStart(2, '0');
    return `${h}:${m}:${sec}`;
  };

  /* ── Keyboard shortcut for settings ─────────────────  */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') {
        if (drillDownService) setDrillDownService(null);
        else if (showSettings) setShowSettings(false);
        else if (showGuide) setShowGuide(false);
        else if (showEdgeStats) setShowEdgeStats(false);
        else if (showActivityLog) setShowActivityLog(false);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [drillDownService, showSettings, showGuide, showEdgeStats, showActivityLog]);

  /* ── Matrix rain columns ────────────────────────────  */
  const rainCols = Array.from({ length: 12 }, (_, i) => (
    <MatrixColumn
      key={i}
      left={i * 8 + Math.random() * 4}
      speed={80 + Math.random() * 120}
      chars={15 + Math.floor(Math.random() * 20)}
    />
  ));

  return (
    <TelemetryProvider enabled={features.livefeeds || features.globe || features.chat}>
      <div className="min-h-screen w-full bg-black grid-bg scanlines relative overflow-hidden">

      {/* ── Matrix rain background ────────────────── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {rainCols}
      </div>

      {/* ── Sub-system overlay ────────────────────── */}
      {features.drilldown && drillDownService && (
        <SubSystemView
          service={drillDownService}
          onClose={() => setDrillDownService(null)}
        />
      )}

      {/* Guide overlay */}
      {showGuide && (
        <GuidePanel onClose={() => setShowGuide(false)} />
      )}

      {/* Edge Stats overlay */}
      {showEdgeStats && (
        <NetworkStats onClose={() => setShowEdgeStats(false)} />
      )}

      {/* Activity Log overlay */}
      {showActivityLog && (
        <ActivityLog onClose={() => setShowActivityLog(false)} />
      )}

      {/* ── Settings overlay ──────────────────────── */}
      {showSettings && (
        <SettingsPanel
          features={features}
          onToggle={toggleFeature}
          onClose={() => setShowSettings(false)}
        />
      )}

      {/* ── Top bar ───────────────────────────────── */}
      <div className="relative z-10 border-b border-green-500/20 bg-black/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1
              className="text-lg md:text-xl font-black tracking-[0.3em] uppercase text-green-400 text-glow-strong"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              BCS://
            </h1>
            <span className="hidden sm:inline text-[10px] text-green-500/40 uppercase tracking-widest">
              Bowen Cloud Services — Terminal v2.0
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-green-500/60">
            <button
              onClick={() => setShowEdgeStats(true)}
              className="text-[10px] uppercase tracking-widest text-cyan-500/40 hover:text-cyan-400 border border-cyan-500/20 px-2 py-1 hover:border-cyan-500/50 transition-colors hidden sm:block"
            >
              [EDGE_STATS]
            </button>
            <button
              onClick={() => setShowActivityLog(true)}
              className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-2 py-1 hover:border-green-500/50 transition-colors hidden sm:block"
            >
              [ACTIVITY]
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-2 py-1 hover:border-green-500/50 transition-colors hidden sm:block"
            >
              [GUIDE]
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-2 py-1 hover:border-green-500/50 transition-colors hidden sm:block"
            >
              [CONFIG]
            </button>
            <span className="hidden md:inline">CONNECTION UPTIME {fmtUptime(uptime)}</span>
            {hasAccess ? (
              <button onClick={handleLogout} className="text-[10px] text-green-400 border border-green-500/50 px-2 py-0.5 hover:bg-green-500/20 hover:border-green-400 transition-colors bg-green-500/10">[LOG OUT]</button>
            ) : (
              <button onClick={handleLogin} className="text-[10px] text-yellow-400 border border-yellow-500/50 px-2 py-0.5 hover:bg-yellow-500/20 transition-colors">[LOGIN]</button>
            )}
            <span className="tabular-nums">
              {new Date().toLocaleTimeString('en-US', { hour12: false })}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
          </div>
        </div>
      </div>

      {/* ── Data ticker ───────────────────────────── */}
      <div className="relative z-10">
        <DataTicker />
      </div>

      {/* ── Main grid ─────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 py-6 md:py-10">

        {/* Hero area */}
        <div className="mb-10 animate-flicker-in">
          <div
            className="text-3xl md:text-5xl font-black tracking-[0.15em] uppercase text-green-400 text-glow-strong mb-2"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Network Dashboard
          </div>
          <div className="text-sm text-green-500/40">
            root@bcs-gateway:~# status --all
          </div>
          {/* Mobile buttons */}
          <div className="flex flex-wrap gap-2 mt-3 sm:hidden">
            <button
              onClick={() => setShowEdgeStats(true)}
              className="text-[10px] uppercase tracking-widest text-cyan-500/40 hover:text-cyan-400 border border-cyan-500/20 px-3 py-1.5 hover:border-cyan-500/50 transition-colors"
            >
              [EDGE_STATS]
            </button>
            <button
              onClick={() => setShowActivityLog(true)}
              className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-3 py-1.5 hover:border-green-500/50 transition-colors"
            >
              [ACTIVITY]
            </button>
            <button
              onClick={() => setShowGuide(true)}
              className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-3 py-1.5 hover:border-green-500/50 transition-colors"
            >
              [GUIDE]
            </button>
            <button
              onClick={() => setShowSettings(true)}
              className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-3 py-1.5 hover:border-green-500/50 transition-colors"
            >
              [CONFIG]
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">

          {/* ── Left column ───────────────────────── */}
          <div className="lg:col-span-2 space-y-4">

            {/* Services header */}
            <div className="text-[10px] uppercase tracking-[0.2em] text-green-500/40 mb-1 font-bold"
              style={{ fontFamily: 'var(--font-display)' }}>
              Active Services
              {features.drilldown && (
                <span className="text-cyan-400/30 ml-3">[drill-down enabled]</span>
              )}
            </div>

            {/* Service cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <ServiceNode
                name="Nextcloud"
                desc="Private cloud storage · WebDAV · CalDAV · CardDAV sync"
                url="https://cloud.bowenchen.xyz"
                status="online"
                onDrillDown={setDrillDownService}
                drillDownEnabled={features.drilldown}
              />
              <ServiceNode
                name="Jellyfin"
                desc="Media server · Transcoding · Live TV · DLNA"
                url="https://jellyfin.bowenchen.xyz"
                status="online"
                onDrillDown={setDrillDownService}
                drillDownEnabled={features.drilldown}
              />
              <ServiceNode
                name="SD Tester"
                desc="SD card performance & reliability testing utility"
                url="https://github.com/hibyemy/sd_tester"
                status="online"
                onDrillDown={setDrillDownService}
                drillDownEnabled={features.drilldown}
              />
              <ServiceNode
                name="TDashcamStudio"
                desc="Tesla dashcam footage viewer & multi-angle player"
                url="https://github.com/hibyemy/TDashcamStudio"
                status="online"
                onDrillDown={setDrillDownService}
                drillDownEnabled={features.drilldown}
              />
              <ServiceNode
                name="Tesla Scanner"
                desc="Tesla vehicle diagnostics & CAN bus reader tool"
                url="https://github.com/hibyemy/tesla_scanner"
                status="online"
                onDrillDown={setDrillDownService}
                drillDownEnabled={features.drilldown}
              />
              <ServiceNode
                name="M5Core2 Controller"
                desc="M5Core2 IoT controller firmware & home automation system"
                url="https://github.com/hibyemy/m5core2systemcontroller-projects"
                status="online"
                onDrillDown={setDrillDownService}
                drillDownEnabled={features.drilldown}
              />
            </div>

            {/* Stats */}
            {features.sysstats && <SystemStats />}

            {/* Live Feeds */}
            {features.livefeeds && (
              <Suspense fallback={<div className="border-glow bg-black/60 p-3 h-64 flex items-center justify-center text-green-500 animate-pulse text-[10px] tracking-widest">[LOADING_MODULE: LIVE_FEEDS]</div>}>
                <LiveFeeds />
              </Suspense>
            )}
          </div>

          {/* ── Right column ──────────────────────── */}
          <div className="lg:col-span-1 space-y-4">
            {features.chat && hasAccess && (
              <Suspense fallback={<div className="border-glow bg-black/60 p-3 h-[400px] flex items-center justify-center text-green-500 animate-pulse text-[10px] tracking-widest">[ESTABLISHING_COMM_LINK]</div>}>
                <ChatConsole />
              </Suspense>
            )}
            {features.chat && !hasAccess && (
              <div className="border-glow bg-black/60 p-6 h-[500px] flex flex-col items-center justify-center text-center">
                <svg className="w-12 h-12 text-yellow-500 mb-4 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <span className="text-yellow-400 mb-2 text-sm tracking-[0.2em] uppercase font-bold text-glow">⚠ ACCESS DENIED</span>
                <span className="text-green-500/50 text-[10px] uppercase mb-8 max-w-[200px]">
                  Communication link with the global live chat network requires a verified session token.
                </span>
                <button onClick={handleLogin} className="border border-green-500 hover:bg-green-500/20 px-6 py-2 text-green-400 transition-all uppercase tracking-[0.2em] font-bold shadow-[0_0_10px_rgba(34,197,94,0.2)] hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]">
                  [ INITIATE LOGIN ]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* ── Console (full width at bottom) ──────── */}
        {features.console && (
          <div className="mt-6 h-[280px]">
            <CommandConsole
              uptimeSeconds={uptime}
              onDrillDown={features.drilldown ? setDrillDownService : null}
            />
          </div>
        )}
      </div>

      {/* ── Footer ────────────────────────────────── */}
      <div className="relative z-10 border-t border-green-500/10 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-[10px] text-green-500/30">
          <span>&#169; {new Date().getFullYear()} Bowen Cloud Services, Ltd.</span>
          <span>SYS_OK — ALL NODES NOMINAL</span>
        </div>
      </div>
    </div>
    </TelemetryProvider>
  );
}
