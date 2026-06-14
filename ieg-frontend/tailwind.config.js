/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Primary brand palette — exact from spec
        navy: {
          DEFAULT: '#0d1b3e',
          50:  '#f0f4ff',
          100: '#dce8ff',
          200: '#b9d1ff',
          300: '#7faef7',
          400: '#4d88f0',
          500: '#2a65d4',
          600: '#1a2f6e',
          700: '#1a2340',
          800: '#0d1b3e',
          900: '#080f25',
        },
        gold: {
          DEFAULT: '#f5b400',
          50:  '#fffbeb',
          100: '#fff3c2',
          200: '#ffe680',
          300: '#ffd133',
          400: '#f5b400',
          500: '#f5b400',
          600: '#d49a00',
          700: '#a87600',
          800: '#7a5500',
          900: '#4d3500',
        },
        // Secondary
        slate: { 750: '#1e2a4a' },
      },
      fontFamily: {
        sans:    ['Inter', 'DM Sans', 'sans-serif'],
        display: ['Inter', 'sans-serif'],
        body:    ['Inter', 'DM Sans', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in':     'fadeIn 0.5s ease-out',
        'fade-up':     'fadeUp 0.6s ease-out',
        'slide-up':    'slideUp 0.4s ease-out',
        'slide-in-r':  'slideInRight 0.3s ease-out',
        'pulse-gold':  'pulseGold 2s infinite',
        'spin-slow':   'spin 3s linear infinite',
        'counter':     'counter 1.5s ease-out forwards',
        'float':       'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:       { from: { opacity: '0' }, to: { opacity: '1' } },
        fadeUp:       { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideUp:      { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        slideInRight: { from: { opacity: '0', transform: 'translateX(20px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseGold:    { '0%,100%': { boxShadow: '0 0 0 0 rgba(245,180,0,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(245,180,0,0)' } },
        float:        { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(105deg, #0d1b3e 0%, #0d1b3e 40%, rgba(13,27,62,0.85) 65%, rgba(13,27,62,0.2) 100%)',
        'navy-mesh':     'radial-gradient(ellipse at 20% 50%, #1e3a8a22 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(245,180,0,0.08) 0%, transparent 60%)',
        'cta-gradient':  'linear-gradient(135deg, #0d1b3e 0%, #1a2f6e 50%, #0d1b3e 100%)',
      },
      boxShadow: {
        'gold':       '0 0 20px rgba(245,180,0,0.25)',
        'card':       '0 4px 24px rgba(0,0,0,0.08)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.15)',
        'feature':    '0 2px 16px rgba(13,27,62,0.08)',
        'feature-hover':'0 8px 32px rgba(13,27,62,0.16)',
      },
    },
  },
  plugins: [],
}
