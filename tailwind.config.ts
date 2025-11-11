import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)"]
      },
      backgroundImage: {
        "mesh-gradient": "radial-gradient(circle at 20% 20%, #3b82f6, transparent 35%), radial-gradient(circle at 80% 20%, #a855f7, transparent 35%), radial-gradient(circle at 50% 80%, #22d3ee, transparent 40%)"
      }
    }
  },
  plugins: []
};

export default config;
