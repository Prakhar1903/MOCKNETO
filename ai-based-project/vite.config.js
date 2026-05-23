/* eslint-env node */
/* global process */
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
};

const hmrHost = typeof process !== 'undefined' ? (process.env.VITE_HMR_HOST || process.env.HMR_HOST) : undefined;
const hmrPort = toNumber(typeof process !== 'undefined' ? (process.env.VITE_HMR_PORT || process.env.HMR_PORT) : undefined);
const hmrClientPort = toNumber(
  typeof process !== 'undefined' ? (process.env.VITE_HMR_CLIENT_PORT || process.env.HMR_CLIENT_PORT) : undefined,
);

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    strictPort: false,
    ...(hmrHost || hmrPort || hmrClientPort
      ? {
        hmr: {
          protocol: "ws",
          host: hmrHost,
          port: hmrPort,
          clientPort: hmrClientPort,
        },
      }
      : {}),
    proxy: {
      '/api': {
        target: 'http://localhost:5600',
        changeOrigin: true,
        secure: false,
      },
      '/warmup': {
        target: 'http://localhost:5600',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
