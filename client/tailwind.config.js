/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#0D9488",
          dark: "#0F766E",
          light: "#5EEAD4",
        },
        accent: "#10B981",
        danger: "#EF4444",
        "illustration-bg": "#ECFEF6",
        /* Legacy aliases — keep temporarily so old classes don't break instantly */
        "primary-btn": "#0D9488",
        "primary-btn-hover": "#0F766E",
        "secondary-btn": "#f2f2f2",
        "danger-btn": "#EF4444",
      },
      fontFamily: {
        sans: [
          "Inter",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "'Liberation Mono'",
          "'Courier New'",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 1px 3px rgba(0,0,0,0.05)",
        card: "0 10px 15px -3px rgba(0,0,0,0.1)",
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
