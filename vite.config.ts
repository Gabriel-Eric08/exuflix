import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  // TMDB_TOKEN fica só no servidor (proxy do Vite em dev, Vercel Function em produção)
  const env = loadEnv(mode, process.cwd(), "");
  const urlEnterprise =
    env.URL_ENTERPRISE ||
    env.VITE_URL_ENTERPRISE ||
    process.env.URL_ENTERPRISE ||
    process.env.VITE_URL_ENTERPRISE ||
    "";

  return {
    plugins: [react()],
    define: {
      "import.meta.env.URL_ENTERPRISE": JSON.stringify(urlEnterprise),
      "import.meta.env.VITE_URL_ENTERPRISE": JSON.stringify(urlEnterprise),
    },
    envPrefix: ["VITE_", "URL_"],
    server: {
      proxy: {
        "/api/tmdb": {
          target: "https://api.themoviedb.org/3",
          changeOrigin: true,
          rewrite: p => p.replace(/^\/api\/tmdb/, ""),
          headers: { Authorization: `Bearer ${env.TMDB_TOKEN}` },
        },
      },
    },
    build: {
      // hls.js (~600 kB) só carrega sob demanda no player
      chunkSizeWarningLimit: 700,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ["react", "react-dom", "react-router-dom"],
            query: ["@tanstack/react-query"],
          },
        },
      },
    },
  };
});
