/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./src/index.css", // <- adiciona explicitamente o CSS
  ],
  safelist: [
    'bg-red-100',
    'bg-blue-100',
    'bg-yellow-100',
    'bg-orange-100',
    'bg-green-100',
    'bg-gray-100',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}