/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0a0a0f',
        surface: '#0a0a0f',
        card: '#0a0a0f',
        line: 'rgba(255,255,255,0.08)',
        // Class names stay 'purple-*' for diff size, but the values are cyan.
        purple: {
          DEFAULT: '#0891B2',
          accent: '#22D3EE',
          light: '#67E8F9',
        },
        ok: '#1D9E75',
        danger: '#E24B4A',
        warn: '#D9A441',
        txt: {
          DEFAULT: '#ffffff',
          dim: 'rgba(255,255,255,0.5)',
          mute: 'rgba(255,255,255,0.3)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'ui-serif', 'Georgia', 'serif'],
        mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      lineHeight: {
        relaxed: '1.7',
      },
      maxWidth: {
        container: '1180px',
      },
    },
  },
  plugins: [],
};
