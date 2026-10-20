export function getEnterpriseUrl(): string {
  const url =
    (import.meta.env.URL_ENTERPRISE as string | undefined) ||
    (import.meta.env.VITE_URL_ENTERPRISE as string | undefined) ||
    "";
  return url.trim().replace(/\/+$/, "");
}

export function hasEnterpriseConfigured(): boolean {
  return !!getEnterpriseUrl();
}

/**
 * URL do iframe para Filme:
 * {URL_ENTERPRISE}/filme/{id}
 */
export function getMovieEmbedUrl(id: number | string): string {
  const base = getEnterpriseUrl();
  return `${base}/filme/${id}`;
}

/**
 * URL do iframe para Série / Episódio:
 * - Lista de episódios: {URL_ENTERPRISE}/serie/{id}
 * - Episódio direto:    {URL_ENTERPRISE}/serie/{id}/{temporada}/{episodio}
 */
export function getSeriesEmbedUrl(id: number | string, season?: number, episode?: number): string {
  const base = getEnterpriseUrl();
  if (season !== undefined && episode !== undefined) {
    return `${base}/serie/${id}/${season}/${episode}`;
  }
  return `${base}/serie/${id}`;
}

