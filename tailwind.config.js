module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './src/styles/global.css'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#e53935',
          500: '#e53935',
          light: '#ffcdd2',
        },
        secondary: {
          DEFAULT: '#222222',
        },
        success: {
          DEFAULT: '#388e3c',
        },
        warning: {
          DEFAULT: '#fbc02d',
        },
        danger: {
          DEFAULT: '#b71c1c',
        },
        error: {
          DEFAULT: '#b71c1c',
        },
        background: {
          DEFAULT: '#f4f4f4',
        },
        surface: {
          DEFAULT: '#ffffff',
        },
        text: {
          DEFAULT: '#222222',
          secondary: '#757575',
        },
        border: {
          DEFAULT: '#e0e0e0',
        },
        lightGray: {
          DEFAULT: '#f4f4f4',
        },
      },
    },
  },
  plugins: [],
};

