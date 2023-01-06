const plugin = require("tailwindcss/plugin");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./game/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      boxShadow: {
        touchable:
          "-0.1vmin -0.1vmin rgba(255,255,255,0.3), 0.1vmin 0.1vmin rgba(0,0,0,0.3)",
        pushed: "inset 0 2vmin 3vmin 1vmin rgb(0 0 0 / 0.05), -0.1vmin -0.1vmin 0.1vmin rgba(0,0,0,0.4), 0.1vmin 0.1vmin rgba(255,255,255,0.3)",

      },
      textShadow: {
        texture:
          "-0.08vmin -0.08vmin rgba(0,0,0,0.1), 0.08vmin 0.08vmin rgba(255,255,255,0.1)",
      },
    },
  },
  plugins: [
    plugin(function ({ matchUtilities, theme }) {
      matchUtilities(
        {
          "text-shadow": (value) => ({
            textShadow: value,
          }),
        },
        { values: theme("textShadow") }
      );
    }),
  ],
};
