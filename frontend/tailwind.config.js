/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9f4',
          100: '#dcf0e4',
          200: '#bce1cc',
          300: '#8ecaa8',
          400: '#5ba980',
          500: '#368b60',
          600: '#237837',
          700: '#1e5f3c',
          800: '#14663e', // Official Greatway Ceylon Green
          900: '#123e29',
          950: '#072417',
        },
        accent: {
          gold: '#c59b27',
          lightGreen: '#dbe8d8', // Invoice banner tint
        }
      },
    },
  },
  plugins: [],
}
