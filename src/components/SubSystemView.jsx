import React, { useState, useEffect, useRef } from 'react';

/* ── Fake subsystem data generators ─────────────────── */
function genPartitions() {
  return [
    { mount: '/',         size: '50G',  used: '12G',  pct: 24 },
    { mount: '/boot/efi', size: '512M', used: '48M',  pct: 9 },
    { mount: '/tank',     size: '8.0T', used: '5.4T', pct: 67 },
    { mount: '/tank/appdata', size: '500G', used: '128G', pct: 26 },
    { mount: '/tank/media',   size: '7.5T', used: '5.2T', pct: 69 },
  ];
}

function genSockets() {
  const states = ['ESTABLISHED', 'LISTEN', 'TIME_WAIT'];
  const ports = [80, 443, 8080, 8096, 5432, 22, 34197, 3478];
  return Array.from({ length: 8 }, (_, i) => ({
    proto: 'tcp',
    local: `0.0.0.0:${ports[i]}`,
    remote: i < 4 ? `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}:${Math.floor(Math.random()*60000+1024)}` : '*:*',
    state: states[Math.min(i, states.length - 1)],
  }));
}

function genDockerPs(service) {
  let key = service.replace(/[\s-]/g, '_').toLowerCase();
  if (key === 'm5core2_controller') key = 'm5_controller';
  const containers = {
    nextcloud: [
      { id: 'a1b2c3d4', name: 'nextcloud-app',  status: 'Up 14 days', ports: '443->443/tcp' },
      { id: 'e5f6a7b8', name: 'nextcloud-db',   status: 'Up 14 days', ports: '5432/tcp' },
      { id: 'c9d0e1f2', name: 'nextcloud-redis', status: 'Up 14 days', ports: '6379/tcp' },
    ],
    jellyfin: [
      { id: 'f3a4b5c6', name: 'jellyfin',        status: 'Up 7 days', ports: '8096->8096/tcp' },
      { id: 'd7e8f9a0', name: 'jellyfin-ffmpeg', status: 'Up 7 days', ports: '' },
    ],
    sd_tester: [
      { id: 'b1c2d3e4', name: 'sd-tester-daemon', status: 'Up 5 days', ports: '8080->8080/tcp' },
      { id: 'e9f0a1b2', name: 'sd-tester-db',     status: 'Up 5 days', ports: '5432/tcp' }
    ],
    tdashcamstudio: [
      { id: 'a4b5c6d7', name: 'tdashcam-studio-web', status: 'Up 2 days', ports: '3000->3000/tcp' },
      { id: 'f8g9h0i1', name: 'tdashcam-ffmpeg',     status: 'Up 2 days', ports: '' }
    ],
    tesla_scanner: [
      { id: 'c3d4e5f6', name: 'tesla-scanner-listener', status: 'Up 10 days', ports: '8443->8443/tcp' },
      { id: 'e7f8a9b0', name: 'tesla-scanner-api',      status: 'Up 10 days', ports: '8000/tcp' }
    ],
    m5_controller: [
      { id: 'm5c2sys1', name: 'm5core2-system-controller', status: 'Up 1 day', ports: '80->80/tcp, 1883->1883/tcp' },
      { id: 'm5c2db02', name: 'm5core2-influxdb',          status: 'Up 1 day', ports: '8086/tcp' }
    ],
    factorio: [
      { id: 'b1c2d3e4', name: 'factorio-server', status: 'Up 3 days', ports: '34197->34197/udp' },
    ],
    ssh: [
      { id: 'f5a6b7c8', name: 'sshd', status: 'Up 30 days', ports: '22->22/tcp' },
    ],
    signals: [
      { id: 'ab12cd34', name: 'signals-visualizer', status: 'Up 2 days', ports: '80->80/tcp' },
    ],
  };
  return containers[key] || [];
}

function genLogs(service) {
  let key = service.replace(/[\s-]/g, '_').toLowerCase();
  if (key === 'm5core2_controller') key = 'm5_controller';
  const msgs = {
    nextcloud: [
      '[INFO] WebDAV sync completed for user: admin',
      '[INFO] CalDAV calendar refresh — 0 conflicts',
      '[WARN] Rate limit reached for IP 203.0.113.42',
      '[INFO] Background job: files:scan completed in 4.2s',
      '[INFO] Cron job executed successfully',
      '[INFO] User login: admin from 10.0.1.100',
    ],
    jellyfin: [
      '[INFO] Transcoding session started: Movie.mkv (H.265 → H.264)',
      '[INFO] Direct play: user admin — S02E05.mkv',
      '[INFO] Library scan completed: 1,247 items indexed',
      '[INFO] Hardware acceleration: VAAPI active',
      '[WARN] Subtitle extraction failed for 1 file',
    ],
    sd_tester: [
      '[INFO] SD Tester daemon started.',
      '[INFO] Benchmarking partition /dev/sdb1...',
      '[INFO] Test sequential write: 45.2 MB/s',
      '[INFO] Test sequential read: 92.1 MB/s',
      '[INFO] Sector integrity check completed: 0 bad sectors',
      '[INFO] Disk test cycle 4 completed successfully.'
    ],
    tdashcamstudio: [
      '[INFO] TDashcamStudio stream decoders active.',
      '[INFO] Loading clip folder: /mnt/tesla_cam/SavedClips/2026-05-21/',
      '[INFO] Multi-cam synchronization: sync lock achieved (6 channels)',
      '[INFO] Transcoding export job started: clip_front.mp4 (H.264)',
      '[INFO] GUI Web client connected: session_3a1b',
    ],
    tesla_scanner: [
      '[INFO] Tesla Scanner socket interface active.',
      '[INFO] Handshake verified with OBD-II/CAN-bus gateway.',
      '[INFO] Query battery telemetry: SoC=82%, Temp=28.5C, Voltage=385V',
      '[INFO] Logged CAN frame ID 0x102 (Speed/RPM data)',
      '[WARN] Latency spike detected on CAN controller interface',
      '[INFO] Uploading diagnostics telemetry stream to cloud...',
    ],
    m5_controller: [
      '[INFO] M5Core2 Controller initialization sequence started.',
      '[INFO] Wi-Fi connection established. IP: 10.0.1.155',
      '[INFO] Connecting to MQTT broker at mqtt.bcs.local...',
      '[INFO] MQTT client connected. Subscribing to telemetry topics.',
      '[INFO] ESP32 core temp: 48C | Battery: 98% (charging)',
      '[INFO] Local HTTP API server listening on port 80',
      '[INFO] Sensors read: temp=21.4C, humidity=42.1%, pressure=1013hPa',
      '[WARN] Disconnecting / Reconnecting MQTT (KeepAlive timeout)',
      '[INFO] System logs flushed to database.'
    ],
    factorio: [
      '[INFO] Map saved: _autosave3.zip (24.8 MB)',
      '[INFO] Player connected: SteamID 76561198...',
      '[INFO] Research completed: Logistics 3',
      '[INFO] Tick rate: 60.0 UPS',
      '[WARN] Pollution cloud approaching biter nest at [142, -87]',
    ],
    ssh: [
      '[INFO] Accepted publickey for root from 10.0.1.100 port 52341',
      '[INFO] Session opened for user root',
      '[WARN] Failed password for invalid user admin from 185.220.100.252',
      '[INFO] Disconnected from authenticating user root 10.0.1.100 port 52341',
    ],
    signals: [
      '[INFO] GET /learn/continuous-time 200 OK',
      '[INFO] User accessed domain map view',
      '[INFO] Static assets served from cache',
      '[INFO] GET /api/healthcheck 200 OK',
    ],
  };
  return msgs[key] || ['[INFO] No logs available.'];
}

/* ═══════════════════════════════════════════════════════
   SUBSYSTEM VIEW
   ═══════════════════════════════════════════════════════ */
export default function SubSystemView({ service, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');
  const [logs, setLogs] = useState([]);
  const logRef = useRef(null);
  const allLogs = genLogs(service);

  /* Stream in logs one at a time */
  useEffect(() => {
    setLogs([]);
    let idx = 0;
    const id = setInterval(() => {
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString('en-US', { hour12: false })}] ${allLogs[idx % allLogs.length]}`]);
      idx++;
    }, 2200);
    return () => clearInterval(id);
  }, [service]);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  const partitions = genPartitions();
  const sockets = genSockets();
  const containers = genDockerPs(service);

  const tabs = ['overview', 'containers', 'network', 'logs'];

  return (
    <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4 animate-flicker-in">
      <div className="border-glow bg-black/90 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* ── Title bar ─────────────────────────── */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]" />
            <span
              className="text-sm font-black tracking-[0.15em] uppercase text-green-400 text-glow-strong"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {service}://subsystem
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 transition-colors border border-green-500/20 px-3 py-1 hover:border-green-500/50"
          >
            [ESC] Close
          </button>
        </div>

        {/* ── Tabs ──────────────────────────────── */}
        <div className="flex border-b border-green-500/10 shrink-0">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-4 py-2 text-[10px] uppercase tracking-widest font-bold transition-colors ${
                activeTab === t
                  ? 'text-green-400 border-b-2 border-green-500 text-glow'
                  : 'text-green-500/30 hover:text-green-500/60'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* ── Tab content ───────────────────────── */}
        <div className="flex-1 overflow-y-auto p-4 text-[11px] text-green-500/70">

          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="text-green-400 text-glow mb-2">$ df -h</div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-green-500/40 text-[10px] uppercase tracking-widest border-b border-green-500/10">
                    <th className="py-1 pr-4">Filesystem</th>
                    <th className="py-1 pr-4">Size</th>
                    <th className="py-1 pr-4">Used</th>
                    <th className="py-1 pr-4">Use%</th>
                    <th className="py-1">Bar</th>
                  </tr>
                </thead>
                <tbody>
                  {partitions.map((p, i) => (
                    <tr key={i} className="border-b border-green-500/5">
                      <td className="py-1.5 pr-4 text-green-400">{p.mount}</td>
                      <td className="py-1.5 pr-4">{p.size}</td>
                      <td className="py-1.5 pr-4">{p.used}</td>
                      <td className="py-1.5 pr-4">{p.pct}%</td>
                      <td className="py-1.5">
                        <div className="w-24 h-1.5 bg-green-500/10">
                          <div
                            className={`h-full transition-all duration-500 ${p.pct > 80 ? 'bg-red-500/60' : 'bg-green-500/50'}`}
                            style={{ width: `${p.pct}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'containers' && (
            <div className="space-y-4">
              <div className="text-green-400 text-glow mb-2">$ docker ps --filter label=com.bcs.service={service}</div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-green-500/40 text-[10px] uppercase tracking-widest border-b border-green-500/10">
                    <th className="py-1 pr-4">Container ID</th>
                    <th className="py-1 pr-4">Name</th>
                    <th className="py-1 pr-4">Status</th>
                    <th className="py-1">Ports</th>
                  </tr>
                </thead>
                <tbody>
                  {containers.map((c, i) => (
                    <tr key={i} className="border-b border-green-500/5">
                      <td className="py-1.5 pr-4 text-cyan-400/60">{c.id}</td>
                      <td className="py-1.5 pr-4 text-green-400">{c.name}</td>
                      <td className="py-1.5 pr-4">{c.status}</td>
                      <td className="py-1.5 text-green-500/40">{c.ports || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-4">
              <div className="text-green-400 text-glow mb-2">$ ss -tulnp</div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-green-500/40 text-[10px] uppercase tracking-widest border-b border-green-500/10">
                    <th className="py-1 pr-4">Proto</th>
                    <th className="py-1 pr-4">Local Address</th>
                    <th className="py-1 pr-4">Foreign Address</th>
                    <th className="py-1">State</th>
                  </tr>
                </thead>
                <tbody>
                  {sockets.map((s, i) => (
                    <tr key={i} className="border-b border-green-500/5">
                      <td className="py-1.5 pr-4">{s.proto}</td>
                      <td className="py-1.5 pr-4 text-green-400">{s.local}</td>
                      <td className="py-1.5 pr-4 text-green-500/40">{s.remote}</td>
                      <td className={`py-1.5 ${s.state === 'ESTABLISHED' ? 'text-cyan-400/60' : 'text-green-500/40'}`}>
                        {s.state}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'logs' && (
            <div className="space-y-2">
              <div className="text-green-400 text-glow mb-2">$ journalctl -u {service} -f</div>
              <div ref={logRef} className="max-h-[400px] overflow-y-auto space-y-0.5">
                {logs.map((l, i) => (
                  <div key={i} className={`whitespace-pre-wrap ${l.includes('[WARN]') ? 'text-yellow-500/70' : ''}`}>
                    {l}
                  </div>
                ))}
                <span className="cursor-blink text-green-400">▌</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
