import { defineConfig, devices } from '@playwright/test'

// shortcut: the backend is not scaffolded yet, so e2e specs stub /api with page.route (e2e/backend.ts).
// Once backend/ exists, add its uvicorn command to webServer and drop the stubs.
// E2E uses its own port so it never collides with a `npm run dev` already running on 5173.
const PORT = 5199
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  use: { baseURL: `http://localhost:${PORT}`, trace: 'retain-on-failure' },
  projects: [{ name: 'phone', use: { ...devices['Pixel 7'] } }],
  webServer: {
    command: `npm run dev -- --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
  },
})
