/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: '#0B0B14',
          card: '#1A1A28',
          glass: 'rgba(26, 26, 40, 0.75)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          accent: 'rgba(212, 175, 55, 0.2)',
        },
        accent: {
          DEFAULT: '#D4AF37', // Fim Gold
          hover: '#E5C158',
        },
        danger: {
          DEFAULT: '#EF4444', // Red
          hover: '#DC2626',
        },
        success: {
          DEFAULT: '#10B981', // Green
          hover: '#059669',
        },
        text: {
          primary: '#FFFFFF',
          muted: '#A0A0B0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '16px',
        lg: '24px',
      },
      boxShadow: {
        accent: '0 4px 20px rgba(212, 175, 55, 0.15)',
        glass: '0 8px 32px rgba(0, 0, 0, 0.4)',
      },
      keyframes: {
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        shimmer: 'shimmer 3s infinite',
      }
    },
  },
  plugins: [],
}
