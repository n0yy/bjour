import { useColorScheme } from 'react-native';

// Design system tokens dari DESIGN.md (Clay.com claymation style)
// Mirrors src/global.css CSS custom properties — kept in sync manually
// since SVG stroke props and placeholderTextColor can't consume className.
const LIGHT = {
  paper: '#fffaf0',      // canvas
  ink: '#0a0a0a',        // primary/ink
  muted: '#6a6a6a',      // muted
  fill: '#faf5e8',       // surface-soft
  fill2: '#f5f0e0',      // surface-card
  line: '#e5e5e5',       // hairline
  frame: '#1a1a1a',      // body-strong
  accent: '#ff4d8b',     // brand-pink
  card: '#f5f0e0',       // surface-card
  // Brand accent colors
  brandTeal: '#1a3a3a',
  brandLavender: '#b8a4ed',
  brandPeach: '#ffb084',
  brandOchre: '#e8b94a',
  brandMint: '#a4d4c5',
  brandCoral: '#ff6b5a',
} as const;

const DARK = {
  paper: '#0a1a1a',      // surface-dark
  ink: '#ffffff',        // on-dark
  muted: '#a0a0a0',      // on-dark-soft
  fill: '#1a2a2a',       // surface-dark-elevated
  fill2: '#2F3035',      // darker variant
  line: '#55564F',       // darker hairline
  frame: '#8A8B84',      // lighter text on dark
  accent: '#ff4d8b',     // brand-pink
  card: '#1a2a2a',       // surface-dark-elevated
  // Brand accent colors (same in dark)
  brandTeal: '#1a3a3a',
  brandLavender: '#b8a4ed',
  brandPeach: '#ffb084',
  brandOchre: '#e8b94a',
  brandMint: '#a4d4c5',
  brandCoral: '#ff6b5a',
} as const;

export function useColors() {
  const scheme = useColorScheme();
  return scheme === 'dark' ? DARK : LIGHT;
}

/** Distinct hues for category charts (donut/legend), built from the same
 * per-scheme tokens above so it inverts correctly in dark mode — no separate
 * hardcoded hex list to fall out of sync. */
export function useCategoryPalette(): string[] {
  const c = useColors();
  return [c.frame, c.accent, c.muted, c.line, c.fill2, c.ink];
}
