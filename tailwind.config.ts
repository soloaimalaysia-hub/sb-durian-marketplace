import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // SB Durian Marketplace brand colors
        brand: {
          green: '#1B4332',
          'green-light': '#2D6A4F',
          gold: '#F59E0B',
          'gold-light': '#FCD34D',
          dark: '#0D1117',
          'dark-card': '#161B22',
          'dark-border': '#30363D',
        },
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans SC', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
