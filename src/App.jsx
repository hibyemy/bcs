import React, { useState } from 'react';
import BootSequence from './components/BootSequence';
import Dashboard from './components/Dashboard';
import { TelemetryProvider } from './components/TelemetryContext';

export default function App() {
  const [isBooting, setIsBooting] = useState(() => {
    return !sessionStorage.getItem('hasBooted');
  });

  if (isBooting) {
    return (
      <BootSequence
        onComplete={() => {
          sessionStorage.setItem('hasBooted', 'true');
          setIsBooting(false);
        }}
      />
    );
  }

  return (
    <TelemetryProvider>
      <Dashboard />
    </TelemetryProvider>
  );
}
