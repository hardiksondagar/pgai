import React, { useState, useEffect } from 'react';
import AppLayout from './components/Layout/AppLayout';
import { Connection } from './types';

function App() {
  const [currentConnection, setCurrentConnection] = useState<Connection | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    // Apply theme to document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <AppLayout
      currentConnection={currentConnection}
      onConnectionChange={setCurrentConnection}
      theme={theme}
      onThemeChange={setTheme}
    />
  );
}

export default App;

