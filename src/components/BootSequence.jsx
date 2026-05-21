import React, { useState, useEffect, useRef } from 'react';

const BOOT_LOG = [
  { text: "POST: System BIOS Shadowed...OK",                          delay: 30 },
  { text: "Memory Test: 65536K OK",                                    delay: 20 },
  { text: "Detecting IDE drives...",                                   delay: 50 },
  { text: "  hda: WDC WD40EFAX-68JH4N1 4.0TB",                        delay: 30 },
  { text: "  hdb: WDC WD40EFAX-68JH4N1 4.0TB",                        delay: 30 },
  { text: "  hdc: Samsung SSD 970 EVO Plus 1TB",                      delay: 20 },
  { text: "Booting from hard disk...",                                 delay: 80 },
  { text: "",                                                          delay: 40 },
  { text: "TrueNAS SCALE 24.10 (Electric Eel)",                       delay: 60 },
  { text: "Kernel: 6.6.44-production+truenas amd64",                  delay: 30 },
  { text: "Loading initial ramdisk...",                               delay: 40 },
  { text: "",                                                          delay: 30 },
  { text: "systemd[1]: Inserted module 'zfs'",                        delay: 40 },
  { text: "systemd[1]: Starting udev Kernel Device Manager...",       delay: 30 },
  { text: "systemd[1]: Started udev Kernel Device Manager.",          delay: 20 },
  { text: "systemd[1]: Found device WDC_WD40EFAX-68JH4N1 tank.",      delay: 30 },
  { text: "[  OK  ] Started systemd-journald.service",                delay: 20 },
  { text: "[  OK  ] Mounted /boot/efi",                               delay: 20 },
  { text: "[  OK  ] Started ZFS pool import: tank",                   delay: 70 },
  { text: "[  OK  ] ZFS dataset tank/appdata mounted",                delay: 30 },
  { text: "[  OK  ] ZFS dataset tank/media mounted",                  delay: 20 },
  { text: "importing keys... OK",                                     delay: 20 },
  { text: "mounting cgroups... OK",                                   delay: 15 },
  { text: "starting rpcbind... OK",                                   delay: 15 },
  { text: "starting nfsd... OK",                                      delay: 15 },
  { text: "[  OK  ] Started Docker daemon",                           delay: 50 },
  { text: "docker: initializing network bridge... OK",                delay: 30 },
  { text: "docker: starting container 'nextcloud-db'...",             delay: 40 },
  { text: "docker: starting container 'nextcloud-redis'...",          delay: 30 },
  { text: "docker: starting container 'nextcloud-app'...",            delay: 50 },
  { text: "[  OK  ] Container nextcloud: healthy",                    delay: 40 },
  { text: "docker: starting container 'jellyfin'...",                 delay: 40 },
  { text: "docker: starting container 'jellyfin-ffmpeg'...",          delay: 30 },
  { text: "[  OK  ] Container jellyfin: healthy",                     delay: 40 },
  { text: "docker: starting container 'factorio-server'...",          delay: 30 },
  { text: "[  OK  ] Factorio server listening on 0.0.0.0:34197",      delay: 30 },
  { text: "docker: starting container 'signals-visualizer'...",       delay: 20 },
  { text: "[  OK  ] Container signals-visualizer: healthy",           delay: 30 },
  { text: "[  OK  ] Started Network Manager",                         delay: 20 },
  { text: "[  OK  ] Reached target Network is Online.",               delay: 15 },
  { text: "[  OK  ] Started sshd.service - OpenSSH Daemon",           delay: 20 },
  { text: "Starting system message bus...",                           delay: 15 },
  { text: "[  OK  ] Started D-Bus System Message Bus.",               delay: 15 },
  { text: "[  OK  ] Started Prometheus node_exporter.",               delay: 20 },
  { text: "Initializing ENCOM gateway protocols...",                  delay: 50 },
  { text: "Handshaking with external telemetry...",                   delay: 40 },
  { text: "Synchronizing global clock... OK",                         delay: 20 },
  { text: "",                                                          delay: 30 },
  { text: "All services operational. Uplink established.",             delay: 60 },
  { text: "Launching bcs-frontend interface...",                       delay: 100 },
];

export default function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const containerRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    let timeoutId;
    function addNext() {
      const i = indexRef.current;
      if (i < BOOT_LOG.length) {
        setLines(prev => [...prev, BOOT_LOG[i].text]);
        indexRef.current = i + 1;
        timeoutId = setTimeout(addNext, Math.max(10, BOOT_LOG[i].delay / 5));
      } else {
        setDone(true);
        timeoutId = setTimeout(() => { if (onComplete) onComplete(); }, 600);
      }
    }
    addNext();
    return () => clearTimeout(timeoutId);
  }, [onComplete]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="fixed inset-0 z-50 bg-black grid-bg scanlines relative flex items-center justify-center p-4">
      {/* ── Matrix rain background overlay (subtle) ── */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-30">
        {/* We can reuse the main dashboard styling classes here */}
      </div>

      <div
        ref={containerRef}
        className="w-full max-w-5xl h-[85vh] overflow-y-auto p-6 md:p-8 border-glow bg-black/95 relative animate-flicker-in z-10"
      >
        <div className="font-mono text-xs sm:text-sm leading-relaxed text-green-500 text-glow">
          {lines.map((line, i) => (
            <div key={i} className="animate-fade-up" style={{ animationDelay: '0ms' }}>
              {line || '\u00A0'}
            </div>
          ))}
          {!done && (
            <span className="cursor-blink text-green-400">▌</span>
          )}
        </div>
      </div>
    </div>
  );
}
