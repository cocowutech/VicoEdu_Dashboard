import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        blush: {
          50: '#FDE8EA',
          100: '#FBCDD2',
          500: '#FAD4D8',
          600: '#F5C0C6',
          700: '#E8A1B0',
        },
        gray: {
          50: '#F7F7F7',
          100: '#F5F5F5',
          500: '#808080',
          700: '#575757',
          800: '#3D3D3D',
          900: '#2D2D2D',
        },
        success: '#C4EBD8',
        warning: '#FED7AA',
        error: '#FECACA',
      },
      borderRadius: {
        button: '12px',
        card: '16px',
        input: '12px',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
      },
      fontFamily: {
        poppins: ['var(--font-poppins)', 'sans-serif'],
        inter: ['var(--font-inter)', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 8px rgba(0, 0, 0, 0.08)',
        'soft-lg': '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
    },
  },
  plugins: [],
}

export default config


