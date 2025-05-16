/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./src/layout/**/*.{ts,tsx}",
    "./src/layout/**/**/*.{ts,tsx}",
    "./src/layout/**/**/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    extend: {},
  },
  plugins: [],
};