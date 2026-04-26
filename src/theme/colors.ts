/**
 * Theme colors — matches the webapp's palette.
 * Primary: deep teal/sky blue (#0ea5e9 family)
 * Accent: orange (#f97316) for streaks
 * Dark mode default
 */

export const Colors = {
  // Primary sky blue
  primary: '#0ea5e9',
  primaryDark: '#0284c7',
  primaryLight: '#38bdf8',

  // Accent orange (streaks, highlights)
  accent: '#f97316',
  accentDark: '#ea580c',

  // Dark theme (default)
  dark: {
    bg: '#0c1220',
    surface: '#131d2e',
    surfaceAlt: '#1a2540',
    border: '#1e3a5f',
    text: '#e2e8f0',
    textMuted: '#94a3b8',
    textFaint: '#475569',
    card: '#152035',
  },

  // Light theme
  light: {
    bg: '#f0f4f8',
    surface: '#ffffff',
    surfaceAlt: '#f8fafc',
    border: '#e2e8f0',
    text: '#1e293b',
    textMuted: '#64748b',
    textFaint: '#94a3b8',
    card: '#ffffff',
  },

  // Semantic
  success: '#22c55e',
  warning: '#f59e0b',
  error: '#ef4444',

  // Macro colors
  protein: '#0ea5e9',
  carbs: '#f59e0b',
  fat: '#f97316',
  kcal: '#a855f7',

  // Phase colors
  phases: {
    foundation: '#0ea5e9',
    acceleration: '#22c55e',
    grind: '#f59e0b',
    reveal: '#f97316',
    'final-cut': '#ef4444',
  },
} as const;

export type ThemeMode = 'dark' | 'light';

export function getTheme(mode: ThemeMode) {
  return mode === 'dark' ? Colors.dark : Colors.light;
}
