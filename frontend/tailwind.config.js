/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        hedge: {
          blue: '#2563eb',
          green: '#059669',
          red: '#dc2626',
          orange: '#ea580c',
          gray: '#6b7280'
        }
      }
    },
  },
  plugins: [],
}