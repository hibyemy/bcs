import React from 'react';

const GUIDE_SECTIONS = [
  {
    title: 'Interactive Console',
    description: 'A functional bcs-sh terminal. Use it to probe the system directly.',
    usage: 'Type "help" to see all commands. Supports Tab completion and Arrow Up/Down for history.',
    status: 'FUNCTIONAL'
  },
  {
    title: 'Subsystem Drill-Down',
    description: 'Deep-dive into individual service nodes to check health and logs.',
    usage: 'Click any service card (or type "ssh <service>" in console) to open the inspector.',
    status: 'SIMULATED'
  },
  {
    title: 'Environmental Sensors',
    description: 'Real-time telemetry from external environmental monitoring stations.',
    usage: 'Displays current temperature, wind speed, and atmospheric conditions.',
    status: 'LIVE DATA (Open-Meteo API)'
  },
  {
    title: 'Market Telemetry',
    description: 'Cryptographic asset valuation uplink.',
    usage: 'Tracks BTC and ETH prices with 24h percentage shifts.',
    status: 'LIVE DATA (CoinGecko API)'
  },
  {
    title: 'Global Uplink (3D Globe)',
    description: 'Visualization of global BCS node distribution and traffic arcs.',
    usage: 'Interactive rotation showing primary connection nodes across the network.',
    status: 'VISUAL ONLY'
  },
  {
    title: 'System Resources',
    description: 'Real-time load balancing and hardware utilization gauges.',
    usage: 'Monitors CPU, RAM, ZFS Pool health, and Network throughput.',
    status: 'SIMULATED'
  },
  {
    title: 'Network Activity Log',
    description: 'A scrolling buffer of all inbound/outbound packet handshakes.',
    usage: 'Monitor for SYNC, AUTH, and TRANSFER events across the gateway.',
    status: 'SIMULATED'
  }
];

export default function GuidePanel({ onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={onClose}>
      <div
        className="border-glow bg-black/95 w-full max-w-2xl max-h-[80vh] flex flex-col animate-flicker-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-green-500/20 shrink-0">
          <span
            className="text-sm font-black tracking-[0.15em] uppercase text-green-400 text-glow-strong"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            sys://man_pages
          </span>
          <button
            onClick={onClose}
            className="text-[10px] uppercase tracking-widest text-green-500/40 hover:text-green-400 border border-green-500/20 px-3 py-1 hover:border-green-500/50 transition-colors"
          >
            [ESC] Close
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="space-y-2">
            <h2 className="text-green-400 text-lg font-bold uppercase tracking-wider text-glow" style={{ fontFamily: 'var(--font-display)' }}>
              Getting Started
            </h2>
            <p className="text-[12px] text-green-500/70 leading-relaxed">
              Welcome to the BCS Boardroom Terminal. This interface is designed for high-fidelity monitoring 
              and control of the Bowen Cloud Services network. Navigate using the visual nodes or the 
              integrated command console for advanced operations.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {GUIDE_SECTIONS.map((section, idx) => (
              <div key={idx} className="border border-green-500/10 p-4 bg-green-500/5 space-y-2">
                <div className="flex items-center justify-between">
                  <h3 className="text-green-400 text-sm font-bold uppercase tracking-widest">{section.title}</h3>
                  <span className={`text-[9px] px-2 py-0.5 border ${
                    section.status.includes('LIVE') 
                      ? 'border-cyan-500/50 text-cyan-400 bg-cyan-500/10' 
                      : section.status === 'FUNCTIONAL'
                      ? 'border-green-500/50 text-green-400 bg-green-500/10'
                      : 'border-green-500/20 text-green-500/40'
                  }`}>
                    {section.status}
                  </span>
                </div>
                <p className="text-[11px] text-green-500/60 italic">{section.description}</p>
                <div className="text-[11px] text-green-400/80">
                  <span className="text-green-500/40 uppercase font-bold text-[9px] block mb-1">Instruction:</span>
                  {section.usage}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-green-500/10 text-[10px] text-green-500/30 text-center uppercase tracking-widest">
            End of Documentation — BCS Terminal v2.0
          </div>
        </div>
      </div>
    </div>
  );
}
