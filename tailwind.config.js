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
        // Brand accent colors (from DESIGN.md)
        'brand-pink': '#ff4d8b',
        'brand-teal': '#1a3a3a',
        'brand-lavender': '#b8a4ed',
        'brand-peach': '#ffb084',
        'brand-ochre': '#e8b94a',
        'brand-mint': '#a4d4c5',
        'brand-coral': '#ff6b5a',
      },
      spacing: {
        // Base unit 4px from DESIGN.md
        xxs: '4px',
        xs: '8px',
        sm: '12px',
        md: '16px',
        lg: '24px',
        xl: '32px',
        xxl: '48px',
        section: '96px',
      },
      borderRadius: {
        // From DESIGN.md
        xs: '6px',
        sm: '8px',
        md: '12px',
        lg: '16px',
        xl: '24px',
        pill: '9999px',
        full: '9999px',
      },
      fontSize: {
        // Typography scale from DESIGN.md
        // Display: Plain Black 500 with negative letter-spacing
        'display-xl': ['72px', { lineHeight: '1', fontWeight: '500', letterSpacing: '-2.5px' }],
        'display-lg': ['56px', { lineHeight: '1.05', fontWeight: '500', letterSpacing: '-2px' }],
        'display-md': ['40px', { lineHeight: '1.1', fontWeight: '500', letterSpacing: '-1px' }],
        'display-sm': ['32px', { lineHeight: '1.15', fontWeight: '500', letterSpacing: '-0.5px' }],
        // Title: Inter 600
        'title-lg': ['24px', { lineHeight: '1.3', fontWeight: '600', letterSpacing: '-0.3px' }],
        'title-md': ['18px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],
        'title-sm': ['16px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '0' }],
        // Body: Inter 400
        'body-md': ['16px', { lineHeight: '1.55', fontWeight: '400', letterSpacing: '0' }],
        'body-sm': ['14px', { lineHeight: '1.55', fontWeight: '400', letterSpacing: '0' }],
        // Utility text
        caption: ['13px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0' }],
        'caption-uppercase': ['12px', { lineHeight: '1.4', fontWeight: '600', letterSpacing: '1.5px' }],
        button: ['14px', { lineHeight: '1', fontWeight: '600', letterSpacing: '0' }],
        'nav-link': ['14px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0' }],
      },
      fontFamily: {
        // Plain Black for display; Inter for body (fallback to system fonts)
        display: ['Plain Black', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        body: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Keep ui-rounded for compatibility with existing code
        rounded: ['ui-rounded'],
      },
      borderWidth: {
        3: '3px',
      },
    },
  },
  plugins: [],
};
