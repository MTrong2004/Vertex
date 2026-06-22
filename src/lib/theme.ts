export type ThemeMode = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'theme';

const LIGHT_THEME_COLOR = '#F8FAFC';
const DARK_THEME_COLOR = '#0B1220';

export const getStoredTheme = (): ThemeMode => {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  return storedTheme === 'dark' ? 'dark' : 'light';
};

export const applyTheme = (theme: ThemeMode) => {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.dataset.theme = theme;
  root.classList.toggle('dark', theme === 'dark');

  if (document.body) {
    document.body.dataset.theme = theme;
  }

  const themeColor = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (themeColor) {
    themeColor.setAttribute('content', theme === 'dark' ? DARK_THEME_COLOR : LIGHT_THEME_COLOR);
  }

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }
};