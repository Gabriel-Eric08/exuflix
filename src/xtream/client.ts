import { normalizeServerUrl } from "../../api/_xtreamCore";
import { read } from "../storage/store";
import type { XtServerInfo } from "./types";

const ENDPOINT = "/api/xtream";
export const ACCOUNT_KEY = "xtream:account";

export interface XtreamCredentials {
  url: string; // normalizada, sem barra final
  username: string;
  password: string;
}

export interface XtreamAccount extends XtreamCredentials {
  status: string;
  expiresAt: number | null; // ms
  maxConnections: number | null;
  activeConnections: number | null;
  isTrial: boolean;
  formats: string[];
  server: { protocol: "http" | "https"; host: string; port: number | null; httpsPort: number | null; timezone: string | null };
  savedAt: number;
}

export class XtreamError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export const getAccount = () => read<XtreamAccount | null>(ACCOUNT_KEY, null);

/** Chama player_api.php pelo proxy. Sem `action`, retorna user_info/server_info (login). */
export async function xtreamRequest<T>(
  creds: XtreamCredentials,
  action?: string,
  params?: Record<string, string | number>,
  signal?: AbortSignal,
): Promise<T> {
  let res: Response;
  try {
    res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: creds.url, username: creds.username, password: creds.password, action, params }),
      signal,
    });
  } catch {
    throw new XtreamError(0, "Sem conexão com o servidor do site");
  }
  const text = await res.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new XtreamError(502, "Resposta inválida do proxy");
  }
  if (!res.ok) throw new XtreamError(res.status, (data as { error?: string } | null)?.error ?? `Erro ${res.status}`);
  return data as T;
}

/** Chamada autenticada com a conta salva. */
export function xtreamCall<T>(action: string, params?: Record<string, string | number>, signal?: AbortSignal): Promise<T> {
  const acc = getAccount();
  if (!acc) return Promise.reject(new XtreamError(401, "Nenhuma conta IPTV conectada"));
  return xtreamRequest<T>(acc, action, params, signal);
}

export { normalizeServerUrl };

/** Converte server_info no formato salvo na conta. */
export function parseServer(url: string, info: XtServerInfo | undefined): XtreamAccount["server"] {
  const u = new URL(url);
  const num = (v: unknown) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));
  return {
    protocol: info?.server_protocol === "https" || u.protocol === "https:" ? "https" : "http",
    host: u.hostname,
    port: num(info?.port) ?? num(u.port),
    httpsPort: num(info?.https_port),
    timezone: info?.timezone ?? null,
  };
}

/**
 * Base das URLs de vídeo. Em página HTTPS, usa a porta HTTPS do servidor quando ele oferece uma
 * (evita o bloqueio de mixed content). Senão, usa a URL que o usuário digitou.
 */
export function streamBase(acc: XtreamAccount, pageProtocol = typeof location !== "undefined" ? location.protocol : "https:"): string {
  if (acc.url.startsWith("https://")) return acc.url;
  if (pageProtocol === "https:" && acc.server.httpsPort) {
    const path = new URL(acc.url).pathname.replace(/\/+$/, "");
    const port = acc.server.httpsPort === 443 ? "" : `:${acc.server.httpsPort}`;
    return `https://${acc.server.host}${port}${path}`;
  }
  return acc.url;
}

/** O vídeo vai ser bloqueado pelo navegador (HTTP dentro de página HTTPS)? */
export function isMixedContent(url: string, pageProtocol = typeof location !== "undefined" ? location.protocol : "https:") {
  return pageProtocol === "https:" && url.startsWith("http://");
}

const enc = encodeURIComponent;
const creds = (acc: XtreamAccount) => `${enc(acc.username)}/${enc(acc.password)}`;

export const liveUrl = (acc: XtreamAccount, id: number, ext: "m3u8" | "ts" = "m3u8", base = streamBase(acc)) =>
  `${base}/live/${creds(acc)}/${id}.${ext}`;

export const movieUrl = (acc: XtreamAccount, id: number, ext = "mp4", base = streamBase(acc)) =>
  `${base}/movie/${creds(acc)}/${id}.${ext || "mp4"}`;

export const episodeUrl = (acc: XtreamAccount, id: number | string, ext = "mp4", base = streamBase(acc)) =>
  `${base}/series/${creds(acc)}/${id}.${ext || "mp4"}`;

/** Catch-up: start no fuso do servidor, formato AAAA-MM-DD:HH-MM; duração em minutos. */
export const timeshiftUrl = (acc: XtreamAccount, id: number, start: string, minutes: number, base = streamBase(acc)) =>
  `${base}/timeshift/${creds(acc)}/${minutes}/${start}/${id}.ts`;

/** Lista M3U com uma entrada, para abrir em players externos. */
export function m3uFor(title: string, url: string) {
  return `#EXTM3U\n#EXTINF:-1,${title.replace(/[\r\n]/g, " ")}\n${url}\n`;
}
