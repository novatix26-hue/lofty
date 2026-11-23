import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f9ff',
          100: '#e0f2fe',
          200: '#bae6fd',
          300: '#7dd3fc',
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
        },
        kids: {
          sky: '#0EA5E9',
          yellow: '#FACC15',
          orange: '#FB923C',
          green: '#22C55E',
          purple: '#A855F7',
          pink: '#FB7185',
          coral: '#F43F5E',
          lime: '#84CC16',
          cream: '#FFFDF5',
          cloud: '#F0F9FF',
          card: '#FFFFFF',
          text: '#1E293B',
          border: '#E2E8F0',
        },
        adults: {
          primary: '#0F172A',
          secondary: '#334155',
          accent: '#3B82F6',
          muted: '#64748B',
          bg: '#F8FAFC',
        },
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-fredoka)', 'var(--font-nunito)', 'sans-serif'],
        kids: ['var(--font-fredoka)', 'cursive', 'sans-serif'],
        urdu: ['var(--font-baloo)', 'system-ui', 'sans-serif'],
      },
      screens: {
        xs: '375px',
      },
      boxShadow: {
        'chunky': '0 4px 0 0 rgba(0, 0, 0, 0.15)',
        'chunky-amber': '0 4px 0 0 #D97706',
        'chunky-sky': '0 4px 0 0 #0284C7',
        'chunky-purple': '0 4px 0 0 #7E22CE',
        'chunky-green': '0 4px 0 0 #15803D',
        'chunky-orange': '0 4px 0 0 #C2410C',
        'chunky-pink': '0 4px 0 0 #BE185D',
      },
    },
  },
  plugins: [],
};

export default config;
