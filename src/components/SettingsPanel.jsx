import React from 'react';

const TOGGLES = [
  { key: 'console',    label: 'Interactive Console' },
  { key: 'drilldown',  label: 'Subsystem Drill-Down' },
  { key: 'livefeeds',  label: 'Live Data Feeds' },
  { key: 'sysstats',   label: 'System Resources' },
  { key: 'edgestats',  label: 'Edge Network Telemetry' },
];

export default function SettingsPanel({ features, onToggle, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="border-glow bg-black/95 w-full max-w-md animate-flicker-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/20">
          <span
            className="text-sm font-black tracking-[0.15em] uppercase text-green-400 text-glow-strong"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            sys://config
          </span>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-3 py-1 hover:border-green-500/50 transition-colors"
          >
            [ESC]
          </button>
        </div>

        {/* Toggle list */}
        <div className="p-4 space-y-3">
          <div className="text-[10px] uppercase tracking-widest text-green-500/40 mb-2">
            Module Control
          </div>
          {TOGGLES.map(t => (
            <div key={t.key} className="flex items-center justify-between py-2 border-b border-green-500/5">
              <span className="text-[12px] text-green-500/70">{t.label}</span>
              <button
                onClick={() => onToggle(t.key)}
                className={`w-14 h-6 rounded-none border transition-all duration-200 flex items-center px-0.5 ${
                  features[t.key]
                    ? 'border-green-500/60 bg-green-500/15'
                    : 'border-green-500/20 bg-black'
                }`}
              >
                <div className={`w-5 h-4 transition-all duration-200 ${
                  features[t.key]
                    ? 'translate-x-7 bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]'
                    : 'translate-x-0 bg-green-500/30'
                }`} />
              </button>
            </div>
          ))}

          <div className="pt-3 text-[10px] text-green-500/20">
            Changes apply immediately. Settings are saved to session.
          </div>
        </div>
      </div>
    </div>
  );
}
