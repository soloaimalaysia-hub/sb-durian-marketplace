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
        // SB Durian — new brand palette
        'sb-green':      '#5E7F1F',
        'sb-dark':       '#243b2f',
        'sb-gold':       '#C7A617',
        'sb-cream':      '#F6F1E7',
        'sb-champagne':  '#D4AF37',
        'sb-ivory':      '#EFE5D2',
        'sb-red':        '#B33A2E',
        // brand-* aliases → remapped to new palette (backward compat)
        brand: {
          green:         '#5E7F1F',
          'green-light': '#4a6518',
          gold:          '#C7A617',
          'gold-light':  '#D4AF37',
          dark:          '#243b2f',
          'dark-card':   '#1a2d20',
          'dark-border': '#3a4a30',
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
