import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  appType: "spa",
  test: {
    environment: "node",
  },
  preview: {
    host: "0.0.0.0",
    port: 4173,
    allowedHosts: true,
  },
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: true,
  },
});
