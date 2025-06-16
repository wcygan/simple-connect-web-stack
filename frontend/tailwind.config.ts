import { type Config } from "tailwindcss";

export default {
  content: [
    "./routes/**/*.{tsx,ts}",
    "./islands/**/*.{tsx,ts}",
    "./components/**/*.{tsx,ts}",
  ],
  theme: {
    extend: {
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'base': '1rem',
      },
    },
  },
} satisfies Config;