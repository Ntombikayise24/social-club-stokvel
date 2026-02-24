/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  safelist: [
    // Dynamic color classes used in feature cards, profiles, etc.
    {
      pattern: /bg-(primary|secondary|green|blue|red|purple|orange|yellow|indigo|teal|emerald|amber)-(50|100|200|600)/,
    },
    {
      pattern: /text-(primary|secondary|green|blue|red|purple|orange|yellow|indigo|teal|emerald|amber)-(600|700)/,
    },
    {
      pattern: /from-(primary|secondary|green|blue|red|purple|orange|yellow|indigo|teal|emerald|amber)-(50|100|600)/,
    },
    {
      pattern: /to-(primary|secondary|green|blue|red|purple|orange|yellow|indigo|teal|emerald|amber)-(50|100|500)/,
    },
    {
      pattern: /border-(primary|secondary|green|blue|red|purple|orange|yellow|indigo|teal|emerald|amber)-(200|300)/,
    },
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#e8f5e9',
          100: '#c8e6c9',
          200: '#a5d6a7',
          300: '#81c784',
          400: '#66bb6a',
          500: '#4caf50',
          600: '#43a047',
          700: '#388e3c',
          800: '#2e7d32',
          900: '#1b5e20',
        },
        secondary: {
          50: '#fef3c7',
          100: '#fde68a',
          200: '#fcd34d',
          300: '#fbbf24',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#451a03',
        }
      },
    },
  },
  plugins: [],
}