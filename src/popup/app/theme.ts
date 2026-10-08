import type { ThemeId } from '../../shared/timer';

// Settings load asynchronously, so the last theme is also kept in localStorage
// and applied before Angular starts. Without it, someone who picked Dark would
// see a white flash every time the popup opens.
const KEY = 'tomomomento.theme';

/** The page background for each theme, for the browser's own UI (address bar, title bar). */
const THEME_COLORS = { light: '#ffffff', dark: '#1c1f24' };

/** Sets <html data-theme>, which the stylesheets use to override the system preference. */
export function applyTheme(theme: ThemeId): void {
  const root = document.documentElement;
  if (theme === 'system') delete root.dataset['theme'];
  else root.dataset['theme'] = theme;

  // The web app's <meta name="theme-color"> tags follow the system by default.
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((meta) => {
    meta.dataset['systemColor'] ??= meta.content;
    meta.content = theme === 'system' ? meta.dataset['systemColor'] : THEME_COLORS[theme];
  });

  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // Storage blocked: the theme still applies once settings load.
  }
}

/** Applies the theme saved last time. Call before bootstrapping the app. */
export function restoreTheme(): void {
  let saved: string | null = null;
  try {
    saved = localStorage.getItem(KEY);
  } catch {
    return;
  }
  if (saved === 'light' || saved === 'dark') applyTheme(saved);
}
