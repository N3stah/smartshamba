import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#FBFBFA',
        surface: '#FFFFFF',
        text: '#111C24',
        border: '#E5E7EB',
        public: {
          primary: '#1D4A38',
          secondary: '#E6F0EC',
        },
        farmer: {
          primary: '#D97706',
          secondary: '#FEF3C7',
        },
        buyer: {
          primary: '#0F4C81',
          secondary: '#E0F2FE',
        },
        transport: {
          primary: '#4B5563',
          route: '#0284C7',
          secondary: '#F3F4F6',
        },
        admin: {
          primary: '#4F46E5',
          secondary: '#EEF2FF',
        },
      },
      fontFamily: {
        sans: ['var(--font-jakarta)', 'sans-serif'],
        serif: ['var(--font-merriweather)', 'serif'],
      },
      borderRadius: {
        'md': '6px',
        'lg': '8px',
      }
    },
  },
  plugins: [],
};
export default config;
