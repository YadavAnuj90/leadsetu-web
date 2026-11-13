import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Leadsetu brand colours
        brand: {
          navy: '#17243A',
          dark: '#0B1320',
          slate: '#1E3150',
          blue: '#3978EA',
          sky: '#68A0FF',
          light: '#EEF3FD',
          surface: '#F8FAFF',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        'brand-sm': '0 4px 16px -2px rgba(57, 120, 234, 0.12)',
        'brand-lg': '0 20px 45px -12px rgba(57, 120, 234, 0.28)',
        'navy-xl': '0 25px 60px -15px rgba(13, 25, 40, 0.45)',
      },
      animation: {
        'float-slow': 'float 6s ease-in-out infinite',
        'float-delayed': 'float 6s ease-in-out 3s infinite',
        'pulse-soft': 'pulseSoft 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
      },
    },
  },
  plugins: [],
}

export default config
