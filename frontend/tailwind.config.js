/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // WanderSync palette — warm sand + dark charcoal + amber gold
        sand: {
          50:  '#FAFAF7',
          100: '#F5F3EC',
          200: '#EDE9DC',
          300: '#E2DBCC',
          400: '#D3C9B4',
          500: '#BFB49A',
          600: '#A89E84',
          700: '#8C8267',
          800: '#6E664F',
          900: '#504B38',
        },
        ink: {
          50:  '#F2F2F0',
          100: '#DDDDD8',
          200: '#B8B8B0',
          300: '#909088',
          400: '#6C6C63',
          500: '#4A4A42',
          600: '#333330',
          700: '#26261F',  // main dark bg
          800: '#1C1C16',
          900: '#111110',
        },
        amber: {
          DEFAULT: '#E8C547',
          50:  '#FEF9E7',
          100: '#FDF1C0',
          200: '#FBE485',
          300: '#F5D24A',
          400: '#E8C547',  // primary accent
          500: '#D4AE2E',
          600: '#B08E1A',
          700: '#896D0D',
          800: '#624E07',
          900: '#3C3003',
        },
        terracotta: {
          DEFAULT: '#C4614A',
          light: '#D4795F',
          dark: '#A04A35',
        },
        sage: {
          DEFAULT: '#7A9E7E',
          light: '#96B89A',
          dark: '#5E8062',
        },
      },
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body: ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'slide-in-right': 'slideInRight 0.35s ease forwards',
        'scale-in': 'scaleIn 0.25s ease forwards',
        'shimmer': 'shimmer 1.8s infinite linear',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: 0, transform: 'translateY(16px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        slideInRight: {
          '0%': { opacity: 0, transform: 'translateX(24px)' },
          '100%': { opacity: 1, transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%': { opacity: 0, transform: 'scale(0.92)' },
          '100%': { opacity: 1, transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-700px 0' },
          '100%': { backgroundPosition: '700px 0' },
        },
      },
      boxShadow: {
        'card': '0 2px 12px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.06)',
        'card-hover': '0 8px 28px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.08)',
        'amber': '0 4px 20px rgba(232,197,71,0.3)',
        'inner-light': 'inset 0 1px 0 rgba(255,255,255,0.08)',
      },
      backgroundImage: {
        'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};