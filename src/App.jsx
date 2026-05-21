import React, { useState } from 'react';
import BootSequence from './components/BootSequence';
import Dashboard from './components/Dashboard';

export default function App() {
  const [isBooting, setIsBooting] = useState(() => {
    return !sessionStorage.getItem('hasBooted');
  });

  return (
    <>
      <Dashboard />
      {isBooting && (
        <BootSequence
          onComplete={() => {
            sessionStorage.setItem('hasBooted', 'true');
            setIsBooting(false);
          }}
        />
      )}
    </>
  );
}
