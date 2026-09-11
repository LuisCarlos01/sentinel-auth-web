import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'sentinel-theme';

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === 'light' || stored === 'dark' ? stored : 'dark';
}

/**
 * Estado do tema fica aqui (não em cada componente) porque tanto o
 * `PillSlideDesktopCard` quanto o `WaveMobileCard` (cada um com sua própria
 * `PullCord`) precisam do mesmo valor. Aplica `data-theme` na tag `<html>`
 * pra `index.css` poder trocar as variáveis (`--form-panel`,
 * `--form-foreground`, etc.) de acordo.
 *
 * Persiste em `localStorage`: sem isso, um recarregamento de página sempre
 * voltava pro escuro (o padrão do `useState`) mesmo que o usuário tivesse
 * acabado de puxar a cordinha pro claro — e como o `MobileIntro` só roda no
 * mount, a animação de carregamento ficava presa no tema errado até o
 * usuário puxar de novo.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readStoredTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
