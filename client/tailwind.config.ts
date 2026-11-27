import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#0c0a09', 900: '#141110', 800: '#1d1917', 700: '#2a2422', 600: '#3b3330' },
        cream: { 50: '#faf6ef', 100: '#f3ecdf', 200: '#e8dcc8', 300: '#d8c7a8', 400: '#c4ab7e' },
        wine: { 400: '#c96a4a', 500: '#b4502e', 600: '#9a3f22', 700: '#7d3319' },
        gold: { 300: '#d8b36c', 400: '#c9a155', 500: '#b8904a' },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Amiri', 'serif'],
        body: ['"Jost"', '"IBM Plex Sans Arabic"', 'sans-serif'],
        ar: ['"Amiri"', 'serif'],
      },
      letterSpacing: { mega: '0.35em' },
      transitionTimingFunction: { luxury: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
} satisfies Config;
