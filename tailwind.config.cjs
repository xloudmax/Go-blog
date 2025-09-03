/** @type {import('tailwindcss').Config} */
module.exports = {
  // 告诉 Tailwind 去哪些文件里扫描 class 名。
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx,html}"
  ],
  darkMode: "class", // 使用 class 切换暗黑模式
  theme: {
    extend: {
      // 如果你有自定义的 extend，可写在这里
    },
  },
  plugins: [
  ],
};
