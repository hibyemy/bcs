import React, { useState, useEffect, useRef, useCallback } from 'react';

/* ── ASCII art for neofetch ─────────────────────────── */
const NEOFETCH = [
  '         ╔══════════════════════╗',
  '         ║   ___  ___ ___      ║      OS:     BCS Terminal v2.0',
  '         ║  | _ )/ __/ __|     ║      Kernel: Vite 8.0 + React 19',
  '         ║  | _ \\ (_ \\__ \\     ║      Shell:  bcs-sh 1.0',
  '         ║  |___/\\___|___/     ║      CPU:    Xeon E-2236 @ 3.4GHz',
  '         ║                     ║      Memory: 32GB DDR4 ECC',
  '         ╚══════════════════════╝      Storage: 8TB ZFS Mirror (RAIDZ1)',
];

/* ── Command definitions ────────────────────────────── */
const COMMANDS = {
  help: () => [
    'Available commands:',
    '',
    '  help        Show this message',
    '  status      System status overview',
    '  clear       Clear the console',
    '  neofetch    System information',
    '  ping <svc>  Ping a service (nextcloud, jellyfin, sd_tester, tdashcamstudio, tesla_scanner)',
    '  ssh <svc>   Connect to a service',
    '  whoami      Current user info',
    '  uptime      Show system uptime',
    '  ls          List active services',
    '  cat motd    Message of the day',
    '  exit        Close console',
    '',
  ],

  neofetch: () => NEOFETCH,

  whoami: () => ['root@bcs-gateway'],

  ls: () => [
    'drwxr-xr-x  nextcloud/',
    'drwxr-xr-x  jellyfin/',
    'drwxr-xr-x  sd_tester/',
    'drwxr-xr-x  tdashcamstudio/',
    'drwxr-xr-x  tesla_scanner/',
    '-rw-r--r--  motd',
    '-rw-r--r--  .env',
  ],

  'cat motd': () => [
    '',
    '═══════════════════════════════════════════════',
    '  Welcome to Bowen Cloud Services Gateway',
    '  All systems nominal. Unauthorized access',
    '  will be logged and reported.',
    '═══════════════════════════════════════════════',
    '',
  ],
};

/* ── Service URLs for ssh/ping ──────────────────────── */
const SERVICES = {
  nextcloud: 'https://cloud.bowenchen.xyz',
  jellyfin: 'https://jellyfin.bowenchen.xyz',
  sd_tester: 'https://github.com/hibyemy/sd_tester',
  tdashcamstudio: 'https://github.com/hibyemy/TDashcamStudio',
  tesla_scanner: 'https://github.com/hibyemy/tesla_scanner',
};

export default function CommandConsole({ uptimeSeconds = 0, onDrillDown }) {
  const [history, setHistory] = useState([
    '$ Bowen Cloud Services — Interactive Terminal',
    '$ Type "help" for available commands.',
    '',
  ]);
  const [input, setInput] = useState('');
  const [cmdHistory, setCmdHistory] = useState([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isProcessing, setIsProcessing] = useState(false);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);

  /* Auto-scroll */
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  /* Focus input on click */
  const focusInput = useCallback(() => {
    inputRef.current?.focus();
  }, []);

  /* Execute command */
  const exec = useCallback((raw) => {
    const cmd = raw.trim().toLowerCase();
    const prompt = `root@bcs-gateway:~# ${raw}`;
    let output = [];

    if (!cmd) {
      setHistory(h => [...h, prompt]);
      return;
    }

    /* Built-in commands */
    if (cmd === 'clear') {
      setHistory([]);
      return;
    }
    if (cmd === 'exit') {
      setHistory(h => [...h, prompt, 'Connection closed.']);
      return;
    }

    if (COMMANDS[cmd]) {
      output = COMMANDS[cmd]();
    } else if (cmd === 'status') {
      const h = String(Math.floor(uptimeSeconds / 3600)).padStart(2, '0');
      const m = String(Math.floor((uptimeSeconds % 3600) / 60)).padStart(2, '0');
      const s = String(uptimeSeconds % 60).padStart(2, '0');
      output = [
        `Uptime:     ${h}:${m}:${s}`,
        'Services:   4 active / 0 failed',
        'ZFS Pool:   ONLINE (tank: 8TB)',
        'Docker:     4 containers running',
        'Network:    All uplinks nominal',
        `Load Avg:   ${(Math.random() * 2).toFixed(2)}, ${(Math.random() * 1.5).toFixed(2)}, ${(Math.random()).toFixed(2)}`,
      ];
    } else if (cmd.startsWith('ping ')) {
      const svc = cmd.split(' ')[1];
      if (SERVICES.hasOwnProperty(svc)) {
        setHistory(h => [...h, prompt, `PING ${svc}.bcs.local (10.0.1.${Math.floor(Math.random()*254+1)})...`]);
        setIsProcessing(true);
        setTimeout(() => {
          const lines = [];
          for (let i = 0; i < 4; i++) {
            const ms = (Math.random() * 5 + 0.2).toFixed(2);
            lines.push(`64 bytes: icmp_seq=${i+1} ttl=64 time=${ms} ms`);
          }
          lines.push('', `--- ${svc}.bcs.local ping statistics ---`, '4 packets transmitted, 4 received, 0% packet loss');
          setHistory(h => [...h, ...lines]);
          setIsProcessing(false);
        }, 1200);
        return;
      } else {
        output = [`ping: unknown host: ${svc}`, 'Known hosts: nextcloud, jellyfin, sd_tester, tdashcamstudio, tesla_scanner'];
      }
    } else if (cmd.startsWith('ssh ')) {
      const svc = cmd.split(' ')[1];
      if (SERVICES.hasOwnProperty(svc)) {
        setHistory(h => [...h, prompt, `Connecting to ${svc}.bcs.local...`]);
        setIsProcessing(true);
        setTimeout(() => {
          if (onDrillDown) {
            onDrillDown(svc);
          } else if (SERVICES[svc] && SERVICES[svc] !== '#') {
            setHistory(h => [...h, 'Connection established.', `Redirecting to ${svc} landing page...`]);
            window.open(SERVICES[svc], '_blank', 'noopener,noreferrer');
          } else {
            setHistory(h => [...h, 'Connection established.', `Entering ${svc} subsystem...`]);
          }
          setIsProcessing(false);
        }, 800);
        return;
      } else {
        output = [`ssh: Could not resolve hostname ${svc}`, 'Known hosts: nextcloud, jellyfin, sd_tester, tdashcamstudio, tesla_scanner'];
      }
    } else {
      output = [`bcs-sh: command not found: ${cmd}`, 'Type "help" for available commands.'];
    }

    setHistory(h => [...h, prompt, ...output]);
  }, [uptimeSeconds, onDrillDown]);

  /* Handle submit */
  const handleSubmit = (e) => {
    e.preventDefault();
    if (isProcessing) return;
    exec(input);
    setCmdHistory(h => [input, ...h]);
    setHistoryIdx(-1);
    setInput('');
  };

  /* Arrow key history navigation and Tab completion */
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const availableCommands = ['help', 'status', 'clear', 'neofetch', 'ping', 'ssh', 'whoami', 'uptime', 'ls', 'cat motd', 'exit'];
      if (input.startsWith('ping ') || input.startsWith('ssh ')) {
        const parts = input.split(' ');
        const prefix = parts[0] + ' ';
        const partialSvc = parts[1] || '';
        const svcs = Object.keys(SERVICES);
        const match = svcs.find(s => s.startsWith(partialSvc));
        if (match) setInput(prefix + match);
      } else {
        const match = availableCommands.find(c => c.startsWith(input.toLowerCase()));
        if (match) setInput(match);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newIdx = Math.min(historyIdx + 1, cmdHistory.length - 1);
      setHistoryIdx(newIdx);
      if (cmdHistory[newIdx]) setInput(cmdHistory[newIdx]);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newIdx = Math.max(historyIdx - 1, -1);
      setHistoryIdx(newIdx);
      setInput(newIdx === -1 ? '' : cmdHistory[newIdx]);
    }
  };

  return (
    <div className="border-glow bg-black/80 flex flex-col h-full" onClick={focusInput}>
      <div className="text-[10px] uppercase tracking-widest text-green-500/60 px-3 pt-3 pb-1 font-bold flex items-center justify-between"
        style={{ fontFamily: 'var(--font-display)' }}>
        <span>Interactive Console</span>
        <span className="text-green-500/30">bcs-sh v1.0</span>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 pb-2 text-[11px] leading-[18px] text-green-500/80 text-glow">
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap">{line || '\u00A0'}</div>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-1 px-3 pb-3 border-t border-green-500/10 pt-2">
        <span className="text-[11px] text-green-500/50 text-glow shrink-0">root@bcs-gateway:~#</span>
        <div className="relative flex-1 flex items-center min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isProcessing}
            className="w-full bg-transparent text-[11px] text-green-400 text-glow outline-none border-none caret-transparent font-mono relative z-10"
            autoFocus
            spellCheck={false}
            autoComplete="off"
          />
          {/* Custom Cursor Overlay */}
          <div 
            className="absolute left-0 top-0 h-full flex items-center pointer-events-none text-[11px] font-mono whitespace-pre z-0"
            aria-hidden="true"
          >
            <span className="text-transparent">{input}</span>
            {!isProcessing && <span className="text-green-400 cursor-blink">▌</span>}
            {isProcessing && <span className="text-green-400 animate-pulse">⠿</span>}
          </div>
        </div>
      </form>
    </div>
  );
}
