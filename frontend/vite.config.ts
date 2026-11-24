/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'

// The FastAPI backend runs on :8000; the browser only talks to the Vite origin, so cookies stay same-site.
const backend = process.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) } },
  server: {
    host: true,
    // The phone opens the app over the VS Code forwarded port (https, needed for the camera); Vite blocks unknown hosts.
    allowedHosts: ['.devtunnels.ms'],
    // `npm run dev:mock` fakes the API in the browser: no proxy, so its fixture media URLs never hit a real backend.
    proxy:
      mode === 'mock'
        ? undefined
        : {
            // xfwd: X-Forwarded-Host/-Proto tell the backend the address the browser used, so QR stickers hold it.
            '/api': { target: backend, ws: true, changeOrigin: true, xfwd: true },
            '/uploads': { target: backend, changeOrigin: true },
            // SQLAdmin (KAN-41) builds absolute links from Host + scheme: keep the browser's host (no changeOrigin)
            // and pass http/https on, else its links jump to :8000, which a phone on the forwarded URL can't open.
            '/admin': {
              target: backend,
              configure: (proxy) =>
                proxy.on('proxyReq', (req, incoming) => {
                  const proto = String(incoming.headers['x-forwarded-proto'] ?? 'http').split(',')[0].trim();
                  req.setHeader('x-forwarded-proto', proto);
                }),
            },
          },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
    css: false,
  },
}))
