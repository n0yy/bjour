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
        display: ['ui-rounded'],
      },
    },
  },
  plugins: [],
};
