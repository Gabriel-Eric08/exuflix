import { queryClient } from "../app/queryClient";
import { remove, write } from "../storage/store";
import { useStored } from "../storage/useStored";
import {
  ACCOUNT_KEY,
  XtreamError,
  normalizeServerUrl,
  parseServer,
  xtreamRequest,
  type XtreamAccount,
} from "./client";
import type { XtAuthResponse } from "./types";

export const DISMISSED_KEY = "xtream:dismissed";

/** O servidor IPTV respondeu, mas recusou a conta (senha errada, expirada, bloqueada). */
export class XtreamAuthError extends XtreamError {}

export const useXtreamAccount = () => useStored<XtreamAccount | null>(ACCOUNT_KEY, null)[0];

const num = (v: unknown) => (v === "" || v == null || !Number.isFinite(Number(v)) ? null : Number(v));

/** Conta expirou desde o login? (exp_date nulo = vitalícia) */
export const isExpired = (acc: XtreamAccount, now = Date.now()) => acc.expiresAt !== null && acc.expiresAt < now;

/** Valida a resposta de login e monta a conta (função pura, testável). */
export function accountFromAuth(url: string, username: string, password: string, data: XtAuthResponse | null, now = Date.now()): XtreamAccount {
  const u = data?.user_info;
  if (!u || Number(u.auth) !== 1) throw new XtreamAuthError(401, "Usuário ou senha incorretos.");
  const status = u.status ?? "Active";
  const exp = num(u.exp_date);
  const expiresAt = exp ? exp * 1000 : null;
  if (status !== "Active") {
    const msg: Record<string, string> = {
      Expired: "Essa assinatura expirou.",
      Banned: "Essa conta foi bloqueada pelo provedor.",
      Disabled: "Essa conta está desativada.",
    };
    throw new XtreamAuthError(403, msg[status] ?? `Conta com status "${status}".`);
  }
  if (expiresAt !== null && expiresAt < now) throw new XtreamAuthError(403, "Essa assinatura expirou.");
  return {
    url,
    username,
    password,
    status,
    expiresAt,
    maxConnections: num(u.max_connections),
    activeConnections: num(u.active_cons),
    isTrial: Number(u.is_trial) === 1,
    formats: Array.isArray(u.allowed_output_formats) ? u.allowed_output_formats : [],
    server: parseServer(url, data?.server_info),
    savedAt: now,
  };
}

/** Testa as credenciais no servidor e, se ok, salva a conta. */
export async function login(rawUrl: string, username: string, password: string): Promise<XtreamAccount> {
  const url = normalizeServerUrl(rawUrl);
  if (!url) throw new XtreamError(400, "Confira a URL do servidor (ex.: http://dominio.com:8080).");
  if (!username.trim() || !password) throw new XtreamError(400, "Preencha usuário e senha.");
  const data = await xtreamRequest<XtAuthResponse>({ url, username: username.trim(), password });
  const acc = accountFromAuth(url, username.trim(), password, data);
  queryClient.removeQueries({ queryKey: ["xt"] });
  write(ACCOUNT_KEY, acc);
  return acc;
}

/** Atualiza validade/conexões em segundo plano (sem deslogar se a rede falhar). */
export async function refreshAccount(acc: XtreamAccount) {
  try {
    const data = await xtreamRequest<XtAuthResponse>(acc);
    write(ACCOUNT_KEY, accountFromAuth(acc.url, acc.username, acc.password, data));
  } catch (err) {
    // Credencial recusada de verdade: desconecta
    if (err instanceof XtreamAuthError) logout();
  }
}

export function logout() {
  remove(ACCOUNT_KEY);
  queryClient.removeQueries({ queryKey: ["xt"] });
}
