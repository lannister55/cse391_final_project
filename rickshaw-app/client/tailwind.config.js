/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
      colors: {
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7',
          600: '#7c3aed', // Electric Violet
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: '#ec4899', // Neon Fuchsia
        accent: '#06b6d4', // Electric Cyan
        midnight: '#0b0f19', // Deep dark slate/navy background
        glass: 'rgba(15, 23, 42, 0.6)',
        glassLight: 'rgba(255, 255, 255, 0.03)',
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.3)',
        'premium': '0 20px 40px -10px rgba(124, 58, 237, 0.3)',
        'glow-primary': '0 0 20px 0 rgba(124, 58, 237, 0.5)',
        'glow-secondary': '0 0 20px 0 rgba(236, 72, 153, 0.5)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
};
