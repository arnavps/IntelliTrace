/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Original glass theme (for existing components)
        bgDark: '#07090e',
        bgCard: 'rgba(16, 23, 42, 0.45)',
        bgCardHover: 'rgba(16, 23, 42, 0.7)',
        glassBorder: 'rgba(255, 255, 255, 0.08)',
        glassGlow: 'rgba(56, 189, 248, 0.12)',
        accentBlue: '#38bdf8',
        accentRed: '#ef4444',
        accentGreen: '#10b981',
        accentPurple: '#8b5cf6',
        textPrimary: '#f8fafc',
        textSecondary: '#94a3b8',

        // IntelliTrace Design System (from ui.json)
        it: {
          page:    '#0A0A0A',
          section: '#111111',
          card:    '#1A1A1A',
          cardel:  '#222222',
          nav:     '#0D0D0D',
          border:  '#2A2A2A',
          subtle:  '#1E1E1E',
          accent:  '#F5A623',
          'accent-dark': '#D4891A',
          'text-primary':   '#FFFFFF',
          'text-secondary': '#999999',
          'text-muted':     '#666666',
          critical: '#EF4444',
          high:     '#F97316',
          medium:   '#EAB308',
          low:      '#22C55E',
          info:     '#3B82F6',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      },
      borderRadius: {
        'card': '16px',
        'card-sm': '12px',
      },
      boxShadow: {
        'card':       '0 4px 24px rgba(0,0,0,0.4)',
        'card-hover': '0 8px 40px rgba(0,0,0,0.6)',
        'accent':     '0 0 20px rgba(245,166,35,0.25)',
        'accent-sm':  '0 4px 16px rgba(245,166,35,0.3)',
        'modal':      '0 20px 60px rgba(0,0,0,0.7)',
      },
      animation: {
        'pulse-slow': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.3s ease both',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        }
      }
    },
  },
  plugins: [],
}
