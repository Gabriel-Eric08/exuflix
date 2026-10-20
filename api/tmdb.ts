// Vercel Function: proxy do TMDB. Esconde o token e adiciona cache na CDN.
// /api/tmdb/<caminho>?<query> chega aqui via rewrite do vercel.json como ?path=<caminho>.
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = process.env.TMDB_TOKEN;
  if (!token) return res.status(500).json({ error: "TMDB_TOKEN não configurado" });

  const { path, ...rest } = req.query;
  const p = Array.isArray(path) ? path.join("/") : path ?? "";
  if (!p || p.includes("..")) return res.status(404).json({ error: "Not found" });

  const target = new URL(`https://api.themoviedb.org/3/${p}`);
  for (const [k, v] of Object.entries(rest)) {
    if (typeof v === "string") target.searchParams.set(k, v);
  }

  const upstream = await fetch(target, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
  });
  const body = await upstream.text();
  res.status(upstream.status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  if (upstream.ok) res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=86400");
  return res.send(body);
}
