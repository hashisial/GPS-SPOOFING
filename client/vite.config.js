import { fileURLToPath, URL } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, "/");

          if (!normalizedId.includes("/node_modules/")) {
            return undefined;
          }

          if (
            normalizedId.includes("/react/") ||
            normalizedId.includes("/react-dom/") ||
            normalizedId.includes("/react-router-dom/")
          ) {
            return "react";
          }

          if (
            normalizedId.includes("/@reduxjs/toolkit/") ||
            normalizedId.includes("/react-redux/")
          ) {
            return "redux";
          }

          if (
            normalizedId.includes("/leaflet/") ||
            normalizedId.includes("/react-leaflet/")
          ) {
            return "maps";
          }

          if (normalizedId.includes("/socket.io-client/")) {
            return "realtime";
          }

          return undefined;
        }
      }
    }
  },
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    globals: true
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url))
    }
  }
});
