// Vercel Function: proxy da Xtream Codes API (player_api.php).
// Servidores IPTV não enviam CORS e costumam ser HTTP; o navegador fala só com /api/xtream.
// Credenciais vão no corpo (POST) para não aparecerem em logs de URL. Sem cache: o conteúdo é por usuário.
import { lookup } from "node:dns/promises";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import { runProxy } from "./_xtreamCore.js";

export const resolveHost = async (host: string) => (await lookup(host, { all: true })).map(a => a.address);

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Use POST" });
  const body = typeof req.body === "string" ? safeParse(req.body) : req.body;
  const out = await runProxy(body, resolveHost);
  res.status(out.status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  return res.send(out.body);
}

function safeParse(s: string) {
  try {
    return JSON.parse(s);
  } catch {
    return null;
  }
}
