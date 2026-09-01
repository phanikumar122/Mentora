/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // User Provided Palette: 1. Midnight Violet
        'midnight-violet': {
          50: '#f4eff6',
          100: '#e8dfec',
          200: '#d1beda',
          300: '#ba9ec7',
          400: '#a37db5',
          500: '#8c5da2',
          600: '#704a82',
          700: '#543861',
          800: '#382541',
          900: '#1c1320',
          950: '#140d17',
        },
        // User Provided Palette: 2. Space Indigo
        'space-indigo': {
          50: '#f0f0f5',
          100: '#e1e2ea',
          200: '#c2c5d6',
          300: '#a4a7c1',
          400: '#868aac',
          500: '#676d98',
          600: '#535779',
          700: '#3e415b',
          800: '#292c3d',
          900: '#15161e',
          950: '#0e0f15',
        },
        // User Provided Palette: 3. Blue Slate
        'blue-slate': {
          50: '#f1f2f4',
          100: '#e3e5e8',
          200: '#c6cbd2',
          300: '#aab2bb',
          400: '#8e98a4',
          500: '#717e8e',
          600: '#5b6571',
          700: '#444c55',
          800: '#2d3239',
          900: '#17191c',
          950: '#101214',
        },
        // User Provided Palette: 4. Sand Dune
        'sand-dune': {
          50: '#f5f6ef',
          100: '#ebecdf',
          200: '#d7d9bf',
          300: '#c4c69f',
          400: '#b0b47e',
          500: '#9ca15e',
          600: '#7d814b',
          700: '#5e6039',
          800: '#3e4026',
          900: '#1f2013',
          950: '#16160d',
        },
        // User Provided Palette: 5. Dry Sage
        'dry-sage': {
          50: '#f7f5ee',
          100: '#eeecdd',
          200: '#ddd8bb',
          300: '#cdc598',
          400: '#bcb176',
          500: '#ab9e54',
          600: '#897e43',
          700: '#675f32',
          800: '#443f22',
          900: '#222011',
          950: '#18160c',
        },

        // Map Brand to Space Indigo (Primary UI theme)
        brand: {
          50: '#f0f0f5',
          100: '#e1e2ea',
          200: '#c2c5d6',
          300: '#a4a7c1',
          400: '#868aac',
          500: '#676d98',
          600: '#535779',
          700: '#3e415b',
          800: '#292c3d',
          900: '#15161e',
          950: '#0e0f15',
        },

        // Override default tailwind indigo with Space Indigo
        indigo: {
          50: '#f0f0f5',
          100: '#e1e2ea',
          200: '#c2c5d6',
          300: '#a4a7c1',
          400: '#868aac',
          500: '#676d98',
          600: '#535779',
          700: '#3e415b',
          800: '#292c3d',
          900: '#15161e',
          950: '#0e0f15',
        },

        // Override default tailwind purple with Midnight Violet
        purple: {
          50: '#f4eff6',
          100: '#e8dfec',
          200: '#d1beda',
          300: '#ba9ec7',
          400: '#a37db5',
          500: '#8c5da2',
          600: '#704a82',
          700: '#543861',
          800: '#382541',
          900: '#1c1320',
          950: '#140d17',
        },

        // Override default tailwind slate with Blue Slate
        slate: {
          50: '#f1f2f4',
          100: '#e3e5e8',
          200: '#c6cbd2',
          300: '#aab2bb',
          400: '#8e98a4',
          500: '#717e8e',
          600: '#5b6571',
          700: '#444c55',
          800: '#2d3239',
          850: '#1e2126',
          900: '#17191c',
          950: '#101214',
        },
      },
      boxShadow: {
        'card-light': '0 1px 3px 0 rgba(23, 25, 28, 0.04), 0 1px 2px -1px rgba(23, 25, 28, 0.04)',
        'card-dark': '0 4px 20px -2px rgba(16, 18, 20, 0.6)',
        'floating': '0 20px 40px -15px rgba(14, 15, 21, 0.35)',
        'glow-brand': '0 0 25px -5px rgba(83, 87, 121, 0.35)',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['Outfit', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};




