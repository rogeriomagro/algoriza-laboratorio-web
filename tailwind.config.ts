import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        ink: "#172033",
        panel: "#f7f9fc",
        brand: {
          deep: "#042f28",
          forest: "#063f34",
          emerald: "#007a5a",
          teal: "#2f8f8b",
          mint: "#e8f4ee",
          silver: "#bcc4c6",
          charcoal: "#23292c",
          offwhite: "#f7f6ef"
        }
      }
    }
  },
  plugins: []
};

export default config;
