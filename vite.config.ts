import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base: "./" — GH Pages (subpath) кез келген қалтаға қолайлы
export default defineConfig({
  base: "./",
  plugins: [react()],
  preview: { host: "0.0.0.0", port: 4173, allowedHosts: true },
  server: { host: "0.0.0.0", port: 5173, allowedHosts: true },
  build: { chunkSizeWarningLimit: 1600 },
});
