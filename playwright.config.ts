import { defineConfig } from "@playwright/test";

// Usa o Chrome instalado na máquina (sem download de navegador). A API do TMDB é mockada nos testes.
export default defineConfig({
  testDir: "e2e",
  timeout: 60_000,
  use: {
    baseURL: "http://localhost:4173",
    channel: "chrome",
    viewport: { width: 1440, height: 900 },
    launchOptions: { args: ["--autoplay-policy=no-user-gesture-required"] },
  },
  webServer: {
    command: "npm run build && npx vite preview --port 4173 --strictPort",
    url: "http://localhost:4173",
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
