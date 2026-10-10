import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeContextType {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
  children,
  defaultTheme = 'light',
  storageKey = 'teja-qr-theme',
}: {
  children: ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
}) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTheme = urlParams.get('theme');
        if (urlTheme === 'light' || urlTheme === 'dark' || urlTheme === 'system') {
          localStorage.setItem(storageKey, urlTheme);
          urlParams.delete('theme');
          const newQuery = urlParams.toString();
          const newUrl = window.location.pathname + (newQuery ? `?${newQuery}` : '') + window.location.hash;
          if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', newUrl);
          }
          return urlTheme as Theme;
        }

        const hash = window.location.hash;
        if (hash && hash.includes('theme=')) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const hashTheme = hashParams.get('theme');
          if (hashTheme === 'light' || hashTheme === 'dark' || hashTheme === 'system') {
            localStorage.setItem(storageKey, hashTheme);
            return hashTheme as Theme;
          }
        }
      } catch {}
    }
    return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
  });

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const urlTheme = urlParams.get('theme');
        if (urlTheme === 'dark') return true;
        if (urlTheme === 'light') return false;

        const hash = window.location.hash;
        if (hash && hash.includes('theme=')) {
          const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
          const hashTheme = hashParams.get('theme');
          if (hashTheme === 'dark') return true;
          if (hashTheme === 'light') return false;
        }
      } catch {}
    }
    const saved = localStorage.getItem(storageKey) as Theme | null;
    if (saved === 'dark') return true;
    if (saved === 'light') return false;
    return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const applyTheme = () => {
      let activeDark = false;
      if (theme === 'dark') {
        activeDark = true;
      } else if (theme === 'light') {
        activeDark = false;
      } else {
        activeDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      }

      root.classList.remove('light', 'dark');
      if (activeDark) {
        root.classList.add('dark');
      } else {
        root.classList.add('light');
      }
      setIsDark(activeDark);
    };

    applyTheme();

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme();
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    localStorage.setItem(storageKey, newTheme);
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    const nextTheme = isDark ? 'light' : 'dark';
    setTheme(nextTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
