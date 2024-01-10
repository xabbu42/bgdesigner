/** @type {import('tailwindcss').Config} */
const plugin = require('tailwindcss/plugin')
export default {
  content: ['./src/**/*.{html,js,svelte,ts}', './static/games/**/*.{json,json5,jsonc}'],
  theme: {
    extend: {},
  },
  plugins: [
    plugin(function ({ addVariant }) {
      addVariant('front', '&.front');
      addVariant('back', '&.back');
    })
  ]
}

