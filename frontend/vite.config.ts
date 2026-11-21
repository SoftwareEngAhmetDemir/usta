/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// The FastAPI backend runs on :8000; the browser only talks to the Vite origin, so cookies stay same-site.
const backend = process.env.VITE_BACKEND_URL ?? 'http://localhost:8000'

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    host: true,
    // `npm run dev:mock` fakes the API in the browser: no proxy, so its fixture media URLs never hit a real backend.
    proxy:
      mode === 'mock'
        ? undefined
        : {
            '/api': { target: backend, ws: true, changeOrigin: true },
            '/uploads': { target: backend, changeOrigin: true },
            '/admin': { target: backend, changeOrigin: true }, // SQLAdmin (KAN-41)
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
