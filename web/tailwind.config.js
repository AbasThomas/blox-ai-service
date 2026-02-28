/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx,js,jsx}', './app/**/*.{ts,tsx,js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'ui-sans-serif', 'system-ui'],
        display: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        brand: {
          50: '#e8f6f5',
          100: '#cdeceb',
          200: '#9adad6',
          300: '#62c4be',
          400: '#34aba2',
          500: '#228f87',
          600: '#1f756f',
          700: '#1c605b',
          800: '#194f4b',
          900: '#173f3d',
        },
      },
      backgroundImage: {
        'hero-mesh': 'radial-gradient(circle at top right, rgba(34,143,135,0.25), transparent 45%), radial-gradient(circle at 20% 20%, rgba(10,79,120,0.24), transparent 40%)',
      },
    },
  },
  plugins: [],
};

