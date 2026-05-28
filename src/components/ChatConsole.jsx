import React, { useState, useRef, useEffect } from 'react';
import { useTelemetry } from './TelemetryContext';

export default function ChatConsole() {
  const { chatMessages, sendChatMessage, setCallsign, isConnected } = useTelemetry();
  const [input, setInput] = useState('');
  const [username, setUsername] = useState('');
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Load saved username if it exists
    const saved = localStorage.getItem('chat_username');
    if (saved) {
      setUsername(saved);
      setIsEditingUsername(false);
      // Link identity to the backend session if connected
      if (isConnected) setCallsign(saved);
    } else {
      // No saved username — prompt user to create one
      setIsEditingUsername(true);
    }
    setInitialized(true);
  }, [isConnected, setCallsign]);

  const handleSaveUsername = (e) => {
    e.preventDefault();
    if (username.trim()) {
      localStorage.setItem('chat_username', username.trim());
      setIsEditingUsername(false);
      setCallsign(username.trim());
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (input.trim() && username.trim()) {
      sendChatMessage(username.trim(), input.trim());
      setInput('');
    }
  };

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages]);

  if (!initialized) return null;

  return (
    <div className="border-glow bg-black/60 p-3 flex flex-col h-[400px]">
      <div className="text-[10px] uppercase tracking-widest text-green-500/60 mb-3 font-bold flex justify-between items-center" style={{ fontFamily: 'var(--font-display)' }}>
        <span className="flex items-center gap-2">
          BCS_SYS:// Global Chat
          <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 shadow-[0_0_6px_rgba(34,197,94,0.8)]' : 'bg-red-500 animate-pulse'}`}></span>
        </span>
        {!isEditingUsername && username && (
          <button 
            onClick={() => setIsEditingUsername(true)}
            className="text-[9px] hover:text-green-400 opacity-50 hover:opacity-100"
          >
            [{username}] [Change ID]
          </button>
        )}
      </div>

      {isEditingUsername ? (
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="text-green-500/60 text-[10px] uppercase tracking-widest mb-4 text-center">
            ── IDENTITY CONFIGURATION ──
          </div>
          <div className="border border-green-500/30 bg-black/80 p-4 w-full max-w-[280px]">
            <form onSubmit={handleSaveUsername} className="flex flex-col gap-3">
              <label className="text-green-500/80 text-[10px] uppercase tracking-wider">
                {username ? 'Update Callsign:' : 'Create New Callsign:'}
              </label>
              <input 
                type="text" 
                value={username}
                onChange={e => setUsername(e.target.value.replace(/[^a-zA-Z0-9_-]/g, '').substring(0, 15))}
                className="bg-black/50 border border-green-500/50 text-green-400 p-2 px-3 outline-none focus:border-green-400 font-mono text-sm"
                placeholder="Agent_007"
                autoFocus
              />
              <div className="text-[9px] text-green-500/30">
                Max 15 chars · Letters, numbers, _ and - only
              </div>
              <button 
                type="submit" 
                disabled={!username.trim()}
                className="border border-green-500/50 hover:bg-green-500/20 px-4 py-2 text-green-400 text-[10px] uppercase tracking-widest disabled:opacity-30 transition-colors"
              >
                [ Confirm Identity ]
              </button>
            </form>
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1 pr-2 scrollbar-thin scrollbar-thumb-green-900 scrollbar-track-transparent">
            {chatMessages.length === 0 && isConnected && (
              <div className="text-green-500/40 italic">No communications received...</div>
            )}
            {chatMessages.map((msg, idx) => {
              const isMe = msg.username === username;
              const date = new Date(msg.timestamp || Date.now());
              const timeStr = `${date.getHours().toString().padStart(2, '0')}${date.getMinutes().toString().padStart(2, '0')}h`;

              return (
                <div key={msg.id || idx} className={`flex gap-2 ${isMe ? 'text-green-300' : 'text-green-500'}`}>
                  <span className="opacity-50 shrink-0">[{timeStr}]</span>
                  <span className={`${isMe ? 'text-cyan-400' : 'text-yellow-400'} shrink-0`}>&lt;{msg.username}&gt;</span>
                  <span className="break-words min-w-0">{msg.content}</span>
                  {isMe && <span className="text-green-500/20 shrink-0 ml-auto">✓</span>}
                </div>
              );
            })}
            {!isConnected && (
              <div className="text-red-500/80 animate-pulse text-glow font-bold uppercase tracking-wider text-[9px] py-1.5 border-t border-b border-red-500/20 my-2 text-center bg-red-950/10">
                ⚠ COMMUNICATIONS LINK FAILURE — RECONNECTING...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="mt-3 flex gap-2 border-t border-green-500/30 pt-3">
            <span className={`text-[11px] mt-1 shrink-0 ${isConnected ? 'text-cyan-400/50' : 'text-red-500/50'}`}>
              {username}&gt;
            </span>
            <input 
              type="text" 
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={!isConnected}
              className="bg-transparent border-none text-green-400 p-0 text-[11px] flex-1 outline-none placeholder-green-500/30 font-mono min-w-0 disabled:text-red-500/40 disabled:placeholder-red-950/60"
              placeholder={isConnected ? "Transmit message..." : "Link offline. Reconnecting..."}
            />
            <button 
              type="submit" 
              disabled={!input.trim() || !isConnected} 
              className={`text-[9px] uppercase tracking-widest shrink-0 transition-colors ${
                isConnected 
                  ? 'text-green-500/60 hover:text-green-400 disabled:opacity-30' 
                  : 'text-red-500/40 cursor-not-allowed'
              }`}
            >
              {isConnected ? "[TX]" : "[OFFLINE]"}
            </button>
          </form>
        </>
      )}
    </div>
  );
}
