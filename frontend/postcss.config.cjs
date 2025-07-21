module.exports = {
  plugins: [
    require('@tailwindcss/postcss'), // ✅ Este é o novo plugin de PostCSS do Tailwind v4
    require('autoprefixer'),
  ]
}