/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
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
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
