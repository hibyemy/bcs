import React from 'react';

export default function Header({ toggleTheme, currentTheme }) {
  return (
    <header className={`flex flex-col md:flex-row items-center md:items-end justify-between border-b pb-6 mb-8 ${currentTheme === 'retro' ? 'border-green-500/50' : 'border-slate-700/50'}`}>
      <div className="flex-1">
        {currentTheme === 'retro' ? (
          <pre className="text-[10px] md:text-xs leading-[1.1] text-green-500 font-bold mb-4 md:mb-0 block overflow-x-auto whitespace-pre">
{`  ___  ___ ___ 
 | _ )/ __/ __|
 | _ \\ (_ \\__ \\
 |___/\\___|___/`}
          </pre>
        ) : (
          <h1 className="text-4xl font-bold mb-4 md:mb-0">
            <img 
              alt="Bowen Cloud Services" 
              src="/assets/images/bowen-archive.png" 
              className="w-64 md:w-80 object-contain"
            />
          </h1>
        )}
      </div>
      <div className="mt-4 md:mt-0">
        <button 
          onClick={toggleTheme}
          className={currentTheme === 'retro' 
            ? "px-4 py-2 bg-transparent border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors text-sm font-bold uppercase"
            : "px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 rounded transition-colors text-sm font-semibold cursor-pointer"
          }
        >
          {currentTheme === 'modern' ? 'Switch to CRT Mode' : 'Switch to Modern UI'}
        </button>
      </div>
    </header>
  );
}
