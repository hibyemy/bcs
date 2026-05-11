import React, { useState, useEffect, useRef } from 'react';

const BOOT_LOG = [
  { text: "POST: System BIOS Shadowed...OK",                          delay: 120 },
  { text: "Memory Test: 65536K OK",                                    delay: 80  },
  { text: "Detecting IDE drives...",                                   delay: 300 },
  { text: "  hda: WDC WD40EFAX-68JH4N1 4.0TB",                        delay: 150 },
  { text: "  hdb: WDC WD40EFAX-68JH4N1 4.0TB",                        delay: 100 },
  { text: "Booting from hard disk...",                                 delay: 400 },
  { text: "",                                                          delay: 200 },
  { text: "TrueNAS SCALE 24.10 (Electric Eel)",                       delay: 250 },
  { text: "Kernel: 6.6.44-production+truenas amd64",                  delay: 120 },
  { text: "",                                                          delay: 100 },
  { text: "[  OK  ] Started systemd-journald.service",                delay: 80  },
  { text: "[  OK  ] Mounted /boot/efi",                               delay: 60  },
  { text: "[  OK  ] Started ZFS pool import: tank",                   delay: 350 },
  { text: "[  OK  ] ZFS dataset tank/appdata mounted",                delay: 100 },
  { text: "[  OK  ] ZFS dataset tank/media mounted",                  delay: 80  },
  { text: "[  OK  ] Started Docker daemon",                           delay: 200 },
  { text: "[  OK  ] Container nextcloud: healthy",                    delay: 150 },
  { text: "[  OK  ] Container jellyfin: healthy",                     delay: 120 },
  { text: "[  OK  ] Factorio server listening on 0.0.0.0:34197",      delay: 180 },
  { text: "[  OK  ] Started Network Manager",                         delay: 100 },
  { text: "[  OK  ] Started sshd.service - OpenSSH Daemon",           delay: 80  },
  { text: "",                                                          delay: 150 },
  { text: "All services operational. Uplink established.",             delay: 300 },
  { text: "Launching bcs-frontend interface...",                       delay: 600 },
];

export default function BootSequence({ onComplete }) {
  const [lines, setLines] = useState([]);
  const [done, setDone] = useState(false);
  const containerRef = useRef(null);
  const indexRef = useRef(0);

  useEffect(() => {
    function addNext() {
      const i = indexRef.current;
      if (i < BOOT_LOG.length) {
        setLines(prev => [...prev, BOOT_LOG[i].text]);
        indexRef.current = i + 1;
        setTimeout(addNext, BOOT_LOG[i].delay);
      } else {
        setDone(true);
        setTimeout(() => { if (onComplete) onComplete(); }, 800);
      }
    }
    addNext();
  }, [onComplete]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex items-end sm:items-start">
      <div
        ref={containerRef}
        className="w-full h-full overflow-y-auto p-4 md:p-8"
      >
        <div className="font-mono text-xs sm:text-sm leading-relaxed text-green-500 text-glow max-w-3xl">
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
