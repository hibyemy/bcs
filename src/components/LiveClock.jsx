import React, { useState, useEffect } from 'react';

export default function LiveClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="font-mono text-sm md:text-base text-slate-400 tabular-nums">
      {time.toLocaleString()}
    </div>
  );
}
