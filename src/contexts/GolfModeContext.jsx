import React, { createContext, useContext, useEffect, useState } from 'react';

const GolfModeContext = createContext(null);

export function GolfModeProvider({ children, initial = 'ncaam' }) {
  const [mode, setMode] = useState(() => {
    try {
      const stored = localStorage.getItem('kelly_mode');
      return stored || initial;
    } catch (e) {
      return initial;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('kelly_mode', mode);
    } catch (e) {
      // ignore
    }
  }, [mode]);

  return (
    <GolfModeContext.Provider value={{ mode, setMode }}>{children}</GolfModeContext.Provider>
  );
}

export function useGolfMode() {
  const ctx = useContext(GolfModeContext);
  if (!ctx) throw new Error('useGolfMode must be used within GolfModeProvider');
  return ctx;
}
