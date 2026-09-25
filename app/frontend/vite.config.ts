/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

/**
 * One origin. In a sandbox the frontend container's web server serves this app and forwards
 * `/api`, `/status` and `/admin` to the backend (app/frontend/Caddyfile, decision record
 * 0001). On a builder's machine the dev server does the same, so an address is the same
 * address wherever the app runs.
 */
const BACKEND = process.env.BACKEND_URL ?? "http://localhost:3001";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // The validation and permission rules live once, and both sides call them.
      "@rules": fileURLToPath(new URL("../backend/src/rules", import.meta.url)),
    },
  },
  server: {
    port: Number(process.env.PORT ?? 4300),
    proxy: {
      "/api": { target: BACKEND, changeOrigin: false },
      "/status": { target: BACKEND, changeOrigin: false },
      "/admin": { target: BACKEND, changeOrigin: false },
    },
  },
  preview: {
    port: Number(process.env.PORT ?? 4300),
  },
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"],
    setupFiles: ["tests/setup.ts"],
    css: false,
  },
});
