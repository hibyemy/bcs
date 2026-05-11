import React, { useState, useEffect } from 'react';

export default function NetworkStats({ onClose }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        if (!res.ok) {
          throw new Error('Telemetry link failed');
        }
        let data;
        try {
          data = await res.json();
        } catch (e) {
          throw new Error('Telemetry link failed (Invalid response format(i havent setup the api yet!!!!))');
        }
        
        if (data.error) {
           throw new Error(data.error);
        }

        if (!cancelled) {
          setStats(data);
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    fetchStats();
    const id = setInterval(fetchStats, 60000); // refresh every minute
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  const hitRate = stats && stats.requests > 0 
    ? ((stats.cached / stats.requests) * 100).toFixed(1) 
    : '0.0';
    
  const bandwidthGb = stats 
    ? (stats.bandwidth / 1073741824).toFixed(2) 
    : '0.00';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div 
        className="border-glow bg-black/95 w-full max-w-3xl flex flex-col relative overflow-hidden animate-flicker-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/20 shrink-0">
          <span
            className="text-sm font-black tracking-[0.15em] uppercase text-green-400 text-glow-strong"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            sys://edge_telemetry
          </span>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-3 py-1 hover:border-green-500/50 transition-colors"
          >
            [ESC] Close
          </button>
        </div>

        {/* Content */}
        <div className="p-8 min-h-[300px] flex flex-col">
          {loading && (
            <div className="flex-1 flex items-center justify-center text-[11px] text-green-500/70 animate-pulse text-center">
              <div>
                <span className="cursor-blink mr-2 text-green-400">▌</span>
                [ WAIT ] Establishing secure telemetry link to Edge Network...
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="flex-1 flex items-center justify-center text-[11px] text-red-500/70 text-glow-red text-center">
              <div>[ ERR ] {error}</div>
            </div>
          )}

          {stats && !loading && !error && (
            <div className="flex-1 grid grid-cols-2 gap-8 items-center">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-green-500/40 mb-2">24H Requests</div>
                <div className="text-3xl font-bold text-green-400 text-glow">{stats.requests.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-green-500/40 mb-2">Unique Visitors</div>
                <div className="text-3xl font-bold text-green-400 text-glow">{stats.visitors.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-green-500/40 mb-2">Edge Cache Hit</div>
                <div className="text-3xl font-bold text-green-400 text-glow">{hitRate}%</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-green-500/40 mb-2">Bandwidth Served</div>
                <div className="text-3xl font-bold text-green-400 text-glow">{bandwidthGb} GB</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
