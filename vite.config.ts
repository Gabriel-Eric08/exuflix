import { lookup } from "node:dns/promises";
import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { runProxy } from "./api/_xtreamCore";

/** Em dev/preview, /api/xtream roda o mesmo núcleo da Vercel Function (alvo dinâmico, por isso não usa server.proxy). */
function xtreamProxy(): Plugin {
  const mount = (use: (path: string, fn: (req: import("node:http").IncomingMessage, res: import("node:http").ServerResponse) => void) => void) => {
    use("/api/xtream", (req, res) => {
      if (req.method !== "POST") {
        res.statusCode = 405;
        return res.end(JSON.stringify({ error: "Use POST" }));
      }
      let raw = "";
      req.on("data", c => (raw += c));
      req.on("end", async () => {
        let body: unknown = null;
        try {
          body = JSON.parse(raw);
        } catch {
          /* corpo inválido: runProxy responde 400 */
        }
        const out = await runProxy(body, async host => (await lookup(host, { all: true })).map(a => a.address));
        res.statusCode = out.status;
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(out.body);
      });
    });
  };
  return {
    name: "xtream-proxy",
    configureServer(server) {
      mount((p, fn) => void server.middlewares.use(p, fn));
    },
    configurePreviewServer(server) {
      mount((p, fn) => void server.middlewares.use(p, fn));
    },
  };
}

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
    plugins: [react(), xtreamProxy()],
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
