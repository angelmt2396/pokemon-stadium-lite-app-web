import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#101828',
        mist: '#f3f4f6',
        ember: '#d9485f',
        tide: '#2f6fed',
        moss: '#1c7c54',
        sand: '#f4e9d8',
      },
      borderRadius: {
        xl2: '1.5rem',
      },
      boxShadow: {
        panel: '0 18px 50px rgba(16, 24, 40, 0.12)',
      },
      fontFamily: {
        sans: ['"Trebuchet MS"', '"Segoe UI"', 'sans-serif'],
      },
    },
  },
};

export default config;

