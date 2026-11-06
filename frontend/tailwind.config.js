/** @type {import('tailwindcss').Config} */

// Ink ramp: cool, barely tinted neutrals. Every surface, border and text role comes from here.
const ink = {
  50: '#f5f7fa',   // light page
  100: '#eceff4',  // light raised
  200: '#dde1e9',  // light hairline-strong
  300: '#c3c8d3',
  400: '#a3a9b8',  // dark secondary text
  500: '#767e92',  // muted text, both themes
  600: '#4b5565',  // light secondary text
  700: '#343b4a',
  800: '#1a1e28',  // dark raised
  850: '#11141c',  // dark card
  900: '#0b0d14',  // dark page
  950: '#07080d',  // dark deepest
};

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Existing slate-* classes across the app resolve to the ink ramp
        slate: ink,
        ink,
        card: {
          DEFAULT: '#11141c',
          foreground: '#eef0f5',
        },
        border: 'rgba(238, 240, 245, 0.08)',
        input: 'rgba(238, 240, 245, 0.12)',
        ring: '#4d8eff',
        background: '#0b0d14',
        foreground: '#eef0f5',
        primary: {
          DEFAULT: '#0066FF',
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#1a1e28',
          foreground: '#eef0f5',
        },
        muted: {
          DEFAULT: '#1a1e28',
          foreground: '#a3a9b8',
        },
        // Brand blue from the logo. 500 is the fill, 400 is the shade for text on dark, 600 for text on light
        brand: {
          50: '#eef4ff',
          100: '#dbe7ff',
          200: '#b8d0ff',
          400: '#4d8eff',
          500: '#0066FF',
          600: '#0052e0',
          700: '#0042b8',
        },
        destructive: {
          DEFAULT: '#e5484d',
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#1a1e28',
          foreground: '#eef0f5',
        },
        // Semantic colors, toned to sit inside the ink ramp
        emerald: {
          50: '#ecf8f1', 100: '#d3f0df', 200: '#a8e0c0', 300: '#74cc9c',
          400: '#4cc38a', 500: '#2fa872', 600: '#16a34a', 700: '#13803d',
          800: '#145c33', 900: '#123f26', 950: '#0b2618',
        },
        amber: {
          50: '#fbf6ea', 100: '#f5e9c8', 200: '#ebd394', 300: '#e0bb62',
          400: '#d9a441', 500: '#c78f2a', 600: '#a8741c', 700: '#855a18',
          800: '#5e4115', 900: '#3e2c10', 950: '#251a09',
        },
        rose: {
          50: '#fcf0f0', 100: '#f8dcdd', 200: '#f0b5b7', 300: '#ea8a8d',
          400: '#e5686c', 500: '#e5484d', 600: '#dc2626', 700: '#b42024',
          800: '#7f1d1f', 900: '#521416', 950: '#2e0b0c',
        },
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      transitionTimingFunction: {
        DEFAULT: 'cubic-bezier(0.22, 1, 0.36, 1)',
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      transitionDuration: {
        DEFAULT: '150ms',
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
        'accordion-up': 'accordion-up 0.2s cubic-bezier(0.22, 1, 0.36, 1)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      }
    },
  },
  plugins: [],
}
