import type { MediaType } from "../api/types";

export const typeSlug = (t: MediaType) => (t === "movie" ? "filme" : "serie");
export const slugType = (s: string | undefined): MediaType | null =>
  s === "filme" ? "movie" : s === "serie" ? "tv" : null;

/** Área Xtream ("Marcondes de Oxóssi") */
export const XT_BASE = "/pai-marcondes";

export const detailsHref = (t: MediaType, id: number, base = "") => `${base}/titulo/${typeSlug(t)}/${id}`;
export const watchHref = (t: MediaType, id: number, base = "") => `${base}/assistir/${typeSlug(t)}/${id}`;
export const episodeHref = (id: number, s: number, e: number, base = "") => `${base}/assistir/serie/${id}/${s}/${e}`;
export const liveHref = (id: number) => `${XT_BASE}/ao-vivo/${id}`;

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
