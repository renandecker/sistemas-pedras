/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Paleta inspirada em pedra natural: ardósia escura, veio de mármore, cobre oxidado
        slate: {
          950: '#0f1419',
        },
        stone: {
          925: '#171412',
        },
        copper: {
          400: '#c9805a',
          500: '#b06840',
          600: '#8f5230',
        },
        veio: '#d8cfc2',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        sans: ['"Inter"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
