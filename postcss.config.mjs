/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss: { config: './tailwind.theme.config.js' },
    autoprefixer: {},
  },
}

export default config
