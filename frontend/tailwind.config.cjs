/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'z-bg': '#050510',
        'z-surface': 'rgba(10, 15, 40, 0.7)',
        'z-glass': 'rgba(255, 255, 255, 0.03)',
        'z-border': 'rgba(255, 255, 255, 0.06)',
        'z-primary': '#00F0FF',
        'z-secondary': '#818CF8',
        'z-success': '#34D399',
        'z-warning': '#FBBF24',
        'z-error': '#F87171',
        'z-text': '#E2E8F0',
        'z-dimmed': '#64748B',
      },
      boxShadow: {
        'z-glow': '0 0 20px rgba(0, 240, 255, 0.3)',
        'z-glow-sm': '0 0 10px rgba(0, 240, 255, 0.15)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
};
