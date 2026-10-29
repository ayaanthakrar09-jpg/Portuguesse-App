import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // "./" keeps asset paths relative so the built site also works on GitHub Pages
  base: "./",
  // Vitest runs src/**/*.test.js(x); the browser tests in e2e/ run with Playwright instead.
  test: { exclude: ["e2e/**", "node_modules/**"] },
});
