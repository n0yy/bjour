/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        paper: '#F6F6F3',
        ink: '#26272B',
        muted: '#6D6E67',
        fill: '#E6E6E2',
        'fill-2': '#DDDDD8',
        line: '#A9A9A3',
        frame: '#4A4B46',
        accent: '#2F5FE0',
        card: '#FFFFFF',
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
