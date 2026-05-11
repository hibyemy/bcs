import React from 'react';

export default function ServiceCard({ title, description, iconPath, url, colorClass, theme }) {
  if (theme === 'retro') {
    return (
      <a 
        href={url}
        className="block border border-green-500/50 p-4 hover:bg-green-500 hover:text-black transition-colors duration-150 relative group"
      >
        <div className="font-bold text-lg mb-1 group-hover:text-black">> {title}</div>
        <div className="text-sm opacity-80 group-hover:text-black">{description}</div>
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 font-bold">
          [EXECUTE]
        </div>
      </a>
    );
  }

  return (
    <a 
      href={url}
      className={`group relative h-40 w-full sm:w-64 rounded-xl overflow-hidden shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 ${colorClass}`}
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent z-10"></div>
      <div className="absolute bottom-4 left-4 z-20">
        <h3 className="text-xl font-bold text-white drop-shadow-md mb-1">
          {title}
        </h3>
        {description && (
          <p className="text-sm text-slate-200 drop-shadow-sm">{description}</p>
        )}
      </div>
      <div className="absolute inset-0 flex items-center justify-center p-8 transition-transform duration-500 group-hover:scale-110">
        <img 
          src={iconPath} 
          alt={`${title} Icon`} 
          className="h-24 w-24 object-contain opacity-90 group-hover:opacity-100 drop-shadow-xl"
        />
      </div>
    </a>
  );
}
