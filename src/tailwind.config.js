/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class', // <--- 加入了这一行，这是解决黑色卡片的关键！
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}