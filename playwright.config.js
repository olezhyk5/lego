import { defineConfig, devices } from '@playwright/test';

const PORT = 4173;

// E2E-тести (e2e/*.spec.js) на продакшн-збірці. Сервер — browser-sync зі статикою з кореня теми.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
  ],
  webServer: {
    command: `npm run build && npx browser-sync start --server --port ${PORT} --no-open --no-notify --no-ui --no-ghost-mode`,
    url: `http://localhost:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
