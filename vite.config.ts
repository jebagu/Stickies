import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: process.env.VITE_BASE_PATH ?? "/SS-React-Flow-Charts/",
  server: {
    host: "127.0.0.1",
    port: 5178,
    strictPort: true,
  },
  preview: {
    host: "127.0.0.1",
    port: 4178,
    strictPort: true,
  },
});
