/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'primary': '#1E3A8A',
        'primary-hover': '#1e40af',
        'accent': '#9381FF',
        'accent-light': '#EFF6FF',
        'success': '#10B981',
        'error': '#EF4444',
      }
    },
  },
  plugins: [],
}

