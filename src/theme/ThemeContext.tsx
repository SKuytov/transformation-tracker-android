import React, { createContext, useState, useEffect, ReactNode } from 'react';
import { store } from '../data/store';

interface ThemeContextValue {
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: 'dark',
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    store.getSettings().then((s) => setTheme(s.theme));
  }, []);

  async function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    await store.updateSettings({ theme: next });
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
