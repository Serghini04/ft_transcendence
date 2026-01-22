// app/frontend/tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        'float': {
          '0%, 100%': { transform: 'translate(0, 0) rotate(0deg)' },
          '25%': { transform: 'translate(10px, -15px) rotate(5deg)' },
          '50%': { transform: 'translate(-15px, 10px) rotate(-5deg)' },
          '75%': { transform: 'translate(15px, 5px) rotate(3deg)' },
        },
        'zoom-rotate': {
          '0%': { transform: 'scale(0) rotate(-180deg)', opacity: '0' },
          '60%': { transform: 'scale(1.1) rotate(10deg)' },
          '100%': { transform: 'scale(1) rotate(0deg)', opacity: '1' },
        },
        'winning-cell': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.05)' },
        },
        'confetti-fall': {
          '0%': { transform: 'translateY(-10px) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(500px) rotate(720deg)', opacity: '0' },
        },
        'expand-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.6' },
          '100%': { transform: 'scale(4)', opacity: '0' },
        },
          'fade-in': {
            '0%': { opacity: '0', transform: 'translateY(6px)' },
            '100%': { opacity: '1', transform: 'translateY(0)' },
          },
      },
      animation: {
        'float': 'float 25s ease-in-out infinite',
        'zoom-rotate': 'zoom-rotate 0.6s ease-out forwards',
        'winning-cell': 'winning-cell 0.6s ease-out infinite',
        // You can use a short default for confetti; dynamic durations/delays often set inline.
        'confetti-fall': 'confetti-fall 2.5s ease-in-out infinite',
        'expand-ring': 'expand-ring 2s ease-out forwards',
        'fade-in': 'fade-in 0.5s ease-out forwards',
      },
    },
  },
  plugins: [],
};

export default config;