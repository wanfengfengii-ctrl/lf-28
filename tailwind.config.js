/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
    },
    extend: {
      colors: {
        museum: {
          teal: '#0F766E',
          'teal-light': '#14B8A6',
          'teal-dark': '#0D5C56',
          gold: '#D97706',
          'gold-light': '#F59E0B',
          ivory: '#FFFBEB',
          slate: '#475569',
          'slate-light': '#94A3B8',
          canvas: '#1E293B',
          'canvas-light': '#334155',
        }
      },
      fontFamily: {
        display: ['"Playfair Display"', 'serif'],
        body: ['"Noto Sans SC"', 'sans-serif'],
      }
    },
  },
  plugins: [],
};
