import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig({
  base: process.env.VITE_BASE_PATH || "/",
  plugins: [react(), tailwind()],
  test: { include: ["tests/**/*.test.ts"], environment: "node" },
  build: { chunkSizeWarningLimit: 1100 },
});
