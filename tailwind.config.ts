import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#173A63",
        panel: "#ffffff",
        glass: "#ffffff",
        line: "#c8deef",
        volt: "#FFC93C",
        mint: "#19C39A",
        sky: "#36ABE8",
        danger: "#EE4D4D"
      },
      boxShadow: {
        glow: "0 5px 0 #173A63, 0 16px 24px -12px rgba(23, 58, 99, 0.45)",
        card: "0 18px 40px -22px rgba(23, 58, 99, 0.55)"
      },
      fontFamily: {
        sans: ["Nunito", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["Fredoka", "Nunito", "ui-sans-serif", "system-ui", "sans-serif"]
      }
    }
  },
  plugins: []
};

export default config;
