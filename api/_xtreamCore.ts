// Núcleo do proxy Xtream (sem dependências de Node): validação da URL e montagem da chamada.
// Usado pela Vercel Function (api/xtream.ts) e pelo middleware de dev do Vite.

export interface XtreamProxyRequest {
  url: string;
  username: string;
  password: string;
  action?: string;
  params?: Record<string, string | number>;
}

const ACTION = /^[a-z_]{1,40}$/;
const PARAM_KEY = /^[a-z_]{1,30}$/;

/** IPs literais de loopback, rede privada, link-local e afins (bloqueados contra SSRF). */
export function isPrivateAddress(host: string): boolean {
  const h = host.replace(/^\[|\]$/g, "").toLowerCase();
  if (h === "localhost" || h.endsWith(".localhost") || h.endsWith(".local") || h.endsWith(".internal")) return true;

  const v4 = h.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (v4) {
    const [a, b] = [Number(v4[1]), Number(v4[2])];
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 100 && b >= 64 && b <= 127) ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a >= 224
    );
  }

  if (h.includes(":")) {
    if (h === "::" || h === "::1") return true;
    if (h.startsWith("fc") || h.startsWith("fd") || h.startsWith("fe80")) return true;
    const mapped = h.match(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/);
    if (mapped) return isPrivateAddress(mapped[1]);
  }
  return false;
}

/** Normaliza a URL digitada pelo usuário: aceita "dominio.com:8080", remove barras e "/player_api.php". */
export function normalizeServerUrl(raw: string): string | null {
  let s = raw.trim();
  if (!s) return null;
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(s) && !/^https?:\/\//i.test(s)) return null; // ftp://, file://...
  if (!/^https?:\/\//i.test(s)) s = `http://${s}`;
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return null;
  }
  if (u.protocol !== "http:" && u.protocol !== "https:") return null;
  const path = u.pathname.replace(/\/(player_api|get|xmltv)\.php$/i, "").replace(/\/+$/, "");
  return `${u.protocol}//${u.host}${path}`;
}

export type BuildResult = { ok: true; target: URL; host: string } | { ok: false; status: number; error: string };

/** Valida o pedido e monta a URL de player_api.php. */
export function buildTarget(body: unknown): BuildResult {
  const b = body as Partial<XtreamProxyRequest> | null;
  if (!b || typeof b.url !== "string" || typeof b.username !== "string" || typeof b.password !== "string") {
    return { ok: false, status: 400, error: "Pedido inválido" };
  }
  const base = normalizeServerUrl(b.url);
  if (!base) return { ok: false, status: 400, error: "URL do servidor inválida" };
  const host = new URL(base).hostname;
  if (isPrivateAddress(host)) return { ok: false, status: 403, error: "Endereço não permitido" };

  const target = new URL(`${base}/player_api.php`);
  target.searchParams.set("username", b.username);
  target.searchParams.set("password", b.password);
  if (b.action !== undefined) {
    if (typeof b.action !== "string" || !ACTION.test(b.action)) return { ok: false, status: 400, error: "Ação inválida" };
    target.searchParams.set("action", b.action);
  }
  for (const [k, v] of Object.entries(b.params ?? {})) {
    if (!PARAM_KEY.test(k) || (typeof v !== "string" && typeof v !== "number")) {
      return { ok: false, status: 400, error: "Parâmetro inválido" };
    }
    target.searchParams.set(k, String(v));
  }
  return { ok: true, target, host };
}

/** Executa a chamada (fetch injetado) e devolve status + corpo JSON em texto. */
export async function runProxy(
  body: unknown,
  resolveHost: (host: string) => Promise<string[]>,
): Promise<{ status: number; body: string }> {
  const built = buildTarget(body);
  if (!built.ok) return { status: built.status, body: JSON.stringify({ error: built.error }) };

  // Bloqueia hosts cujo DNS aponta para rede interna
  try {
    const ips = await resolveHost(built.host);
    if (ips.length === 0 || ips.some(isPrivateAddress)) {
      return { status: 403, body: JSON.stringify({ error: "Endereço não permitido" }) };
    }
  } catch {
    return { status: 502, body: JSON.stringify({ error: "Servidor não encontrado (DNS)" }) };
  }

  let upstream: Response;
  try {
    upstream = await fetch(built.target, {
      redirect: "manual",
      signal: AbortSignal.timeout(20_000),
      // Muitos painéis recusam user-agents que não parecem de player
      headers: { "User-Agent": "VLC/3.0.20 LibVLC/3.0.20", accept: "application/json" },
    });
  } catch (err) {
    const timeout = (err as Error)?.name === "TimeoutError";
    return { status: 504, body: JSON.stringify({ error: timeout ? "O servidor IPTV não respondeu" : "Servidor IPTV inacessível" }) };
  }

  const text = await upstream.text();
  if (!upstream.ok) {
    return { status: upstream.status === 401 || upstream.status === 403 ? upstream.status : 502, body: JSON.stringify({ error: `Servidor IPTV respondeu ${upstream.status}` }) };
  }
  const trimmed = text.trim();
  if (!trimmed) return { status: 200, body: "null" };
  if (trimmed[0] !== "{" && trimmed[0] !== "[") {
    return { status: 502, body: JSON.stringify({ error: "Resposta inesperada do servidor IPTV" }) };
  }
  return { status: 200, body: trimmed };
}
