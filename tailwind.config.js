/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        grid: {
          darkest: '#070B14',
          darker: '#0B1120',
          card: '#111827',
          panel: '#161F30',
          border: '#1E293B',
          borderLight: '#334155',
          accent: '#06B6D4', // cyan
          cyanGlow: 'rgba(6, 182, 212, 0.25)',
          warning: '#F59E0B', // amber
          danger: '#EF4444', // red
          success: '#10B981', // emerald
          electric: '#3B82F6', // blue
        },
      },
      animation: {
        'pulse-fast': 'pulse 1.2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'flow-line': 'flowLine 1.5s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: 0.8, transform: 'scale(1)' },
          '50%': { opacity: 0.3, transform: 'scale(1.3)' },
        },
        flowLine: {
          '0%': { strokeDashoffset: '24' },
          '100%': { strokeDashoffset: '0' },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [],
}
