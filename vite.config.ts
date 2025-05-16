/* eslint-disable import/no-extraneous-dependencies */
import { defineConfig } from "vite";
import path from "path";
import react from "@vitejs/plugin-react";
import stdLibBrowser from "vite-plugin-node-stdlib-browser";

export default defineConfig({
  base: "./",
  esbuild: {
    supported: {
      "top-level-await": true,
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@components": path.resolve(__dirname, "./src/components"),
      "@layout": path.resolve(__dirname, "./src/layout"),
      "@lib": path.resolve(__dirname, "src/lib"),
    },
  },
  plugins: [
    react(),
    stdLibBrowser()
  ],
});


