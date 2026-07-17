import { useColorScheme } from 'react-native';

// Mirrors the CSS custom properties in src/global.css — kept in sync manually
// since SVG stroke props and placeholderTextColor can't consume className.
const LIGHT = {
  paper: '#F6F6F3',
  ink: '#26272B',
  muted: '#6D6E67',
  fill: '#E6E6E2',
  fill2: '#DDDDD8',
  line: '#A9A9A3',
  frame: '#4A4B46',
  accent: '#2F5FE0',
  card: '#FFFFFF',
} as const;

const DARK = {
  paper: '#17181B',
  ink: '#E8E8E4',
  muted: '#9B9C94',
  fill: '#26272B',
  fill2: '#2F3035',
  line: '#55564F',
  frame: '#8A8B84',
  accent: '#7C97F2',
  card: '#1E1F23',
} as const;

export function useComicColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}

/** Distinct hues for category charts (donut/legend), built from the same
 * per-scheme tokens above so it inverts correctly in dark mode — no separate
 * hardcoded hex list to fall out of sync. */
export function useCategoryPalette(): string[] {
  const c = useComicColors();
  return [c.frame, c.accent, c.muted, c.line, c.fill2, c.ink];
}
