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
    "bg-green-50","text-green-800","border-green-200",
    "bg-red-50","text-red-800","border-red-200",
    "bg-blue-50","text-blue-800","border-blue-200",
    "cursor-wait","backdrop-blur-[1px]",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}