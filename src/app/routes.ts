import type { MediaType } from "../api/types";

export const typeSlug = (t: MediaType) => (t === "movie" ? "filme" : "serie");
export const slugType = (s: string | undefined): MediaType | null =>
  s === "filme" ? "movie" : s === "serie" ? "tv" : null;

export const detailsHref = (t: MediaType, id: number) => `/titulo/${typeSlug(t)}/${id}`;
export const watchHref = (t: MediaType, id: number) => `/assistir/${typeSlug(t)}/${id}`;
export const episodeHref = (id: number, s: number, e: number) => `/assistir/serie/${id}/${s}/${e}`;

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
