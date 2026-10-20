const BASE = import.meta.env.VITE_API_BASE ?? "/api/tmdb";

export class TmdbError extends Error {
  constructor(public status: number, public path: string) {
    super(`TMDB ${status} em ${path}`);
  }
}

type Params = Record<string, string | number | boolean | undefined>;

export async function tmdb<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  url.searchParams.set("language", "pt-BR");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { signal });
  if (!res.ok) throw new TmdbError(res.status, path);
  return res.json() as Promise<T>;
}
