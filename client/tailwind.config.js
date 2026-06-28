/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#0F4C81',
          light: '#1A6DB5',
          dark: '#0A3660'
        },
        accent: '#00A878',
        risk: {
          low: '#16A34A',
          moderate: '#D97706',
          high: '#EA580C',
          critical: '#DC2626'
        },
        surface: {
          DEFAULT: '#FFFFFF',
          alt: '#F1F5F9'
        },
        border: '#E2E8F0',
        'text-primary': '#0F172A',
        'text-muted': '#64748B'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif']
      }
    },
  },
  plugins: [],
};
