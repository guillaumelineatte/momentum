import { defineConfig, devices } from '@playwright/test'

const PORT = 3100

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  // Les tests créent de vrais comptes : ils tournent sur la base de DATABASE_URL (.env),
  // qui doit être la branche Neon "dev", jamais "production".
  webServer: {
    command: `pnpm exec next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/connexion`,
    reuseExistingServer: true,
    // Auth.js construit ses redirections à partir de cette URL : elle doit viser le serveur de test.
    env: { NEXTAUTH_URL: `http://localhost:${PORT}`, AUTH_URL: `http://localhost:${PORT}` },
    timeout: 120_000,
  },
})
