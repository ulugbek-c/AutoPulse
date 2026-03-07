import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                neon: {
                    blue: "#00f3ff",
                    purple: "#9d00ff",
                    cyan: "#00ffcc",
                },
                glass: {
                    light: "rgba(255, 255, 255, 0.05)",
                    dark: "rgba(0, 0, 0, 0.3)",
                }
            },
            backgroundImage: {
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "dark-glow": "radial-gradient(circle at center, #1a1a2e 0%, #0f0f1a 100%)",
            },
            boxShadow: {
                "neon-blue": "0 0 15px rgba(0, 243, 255, 0.3)",
                "neon-purple": "0 0 15px rgba(157, 0, 255, 0.3)",
            }
        },
    },
    plugins: [],
};
export default config;
