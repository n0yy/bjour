/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        // Resolved from CSS variables (src/global.css) so every screen using
        // these tokens gets dark mode for free via @media (prefers-color-scheme).
        paper: 'var(--color-paper)',
        ink: 'var(--color-ink)',
        muted: 'var(--color-muted)',
        fill: 'var(--color-fill)',
        'fill-2': 'var(--color-fill-2)',
        line: 'var(--color-line)',
        frame: 'var(--color-frame)',
        accent: 'var(--color-accent)',
        card: 'var(--color-card)',
      },
      borderWidth: {
        3: '3px',
      },
      fontFamily: {
        // Comic-style display face for headings/amounts; the actual bundled typeface
        // lands in the visual-polish ticket (.scratch/bjour-fase-1-ledger/issues/10-polish-visual-komik.md).
        // 'ui-rounded' resolves to San Francisco Rounded on iOS; platforms/browsers that
        // don't recognize it fall back to their default system font, so this is safe everywhere.
        display: ['ui-rounded'],
      },
    },
  },
  plugins: [],
};
