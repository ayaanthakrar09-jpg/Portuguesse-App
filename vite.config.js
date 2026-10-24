import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // "./" keeps asset paths relative so the built site also works on GitHub Pages
  base: "./",
});
