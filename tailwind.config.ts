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
        forest: {
          50: '#F0FDF4',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#22C55E',
          600: '#16A34A',
          700: '#15803D',
          800: '#05A658', // Official Nisargshala Brand Green
          900: '#045830',
          950: '#02341C',
        },
        sand: {
          50: '#FAFBF9',
          100: '#F4F7F3',
          200: '#E8EFE6',
          300: '#D5E2D1',
          400: '#B8CBB2',
          500: '#95AF8D',
        },
        amber: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'sans-serif'],
        serif: ['var(--font-outfit)', 'serif'],
      },
    },
  },
  plugins: [],
};
export default config;
