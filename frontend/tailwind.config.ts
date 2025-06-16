import { type Config } from "tailwindcss";

export default {
  content: [
    "./routes/**/*.{tsx,ts}",
    "./islands/**/*.{tsx,ts}",
    "./components/**/*.{tsx,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Modern dark theme palette inspired by GitHub Dark
        "background": "#0D1117",
        "surface": "#161B22",
        "surface-hover": "#21262D",
        "primary": "#58A6FF",
        "primary-hover": "#79C0FF",
        "secondary": "#21262D",
        "border": "#30363D",
        "text-primary": "#C9D1D9",
        "text-secondary": "#8B949E",
        "text-muted": "#6E7681",
        "success": "#3FB950",
        "success-hover": "#56D364",
        "danger": "#F85149",
        "danger-hover": "#FF7B72",
        "warning": "#D29922",
        "warning-hover": "#E3B341",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'scale-in': 'scaleIn 0.2s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 5px rgba(88, 166, 255, 0.5)' },
          '50%': { boxShadow: '0 0 20px rgba(88, 166, 255, 0.8)' },
        },
      },
      fontFamily: {
        'sans': ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },
      backdropBlur: {
        'xs': '2px',
      },
      boxShadow: {
        'glow': '0 0 20px rgba(88, 166, 255, 0.3)',
        'glow-sm': '0 0 10px rgba(88, 166, 255, 0.2)',
        'card': '0 8px 32px rgba(0, 0, 0, 0.3)',
        'card-hover': '0 12px 40px rgba(0, 0, 0, 0.4)',
      },
    },
  },
} satisfies Config;