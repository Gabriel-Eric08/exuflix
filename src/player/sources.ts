import { useQuery } from "@tanstack/react-query";
import type { MediaType } from "../api/types";

export interface VideoSource {
  kind: "hls" | "mp4";
  url: string;
  subtitles?: { lang: string; label: string; url: string }[];
  markers?: { introStart?: number; introEnd?: number; creditsStart?: number };
  attribution?: string;
}

export interface SourceRegistry {
  version: number;
  movies?: Record<string, VideoSource>;
  series?: Record<string, { seasons: Record<string, Record<string, VideoSource>> }>;
}

let registry: Promise<SourceRegistry> | null = null;
export const loadRegistry = () =>
  (registry ??= fetch("/sources.json")
    .then(r => (r.ok ? r.json() : { version: 1 }))
    .catch(() => ({ version: 1 }))) as Promise<SourceRegistry>;

export async function resolveMovie(id: number): Promise<VideoSource | null> {
  return (await loadRegistry()).movies?.[id] ?? null;
}

export async function resolveEpisode(id: number, s: number, e: number): Promise<VideoSource | null> {
  return (await loadRegistry()).series?.[id]?.seasons?.[s]?.[e] ?? null;
}

/** Com o sistema de embed, todos os títulos possuem player disponível. */
export async function hasSource(_type: MediaType, _id: number) {
  return true;
}

export const useRegistry = () =>
  useQuery({ queryKey: ["sources"], queryFn: loadRegistry, staleTime: Infinity });

/** Todos os títulos do catálogo estão disponíveis para assistir via embed. */
export function useHasSource(_type: MediaType, _id: number) {
  return true;
}

class UniversalSet<T> extends Set<T> {
  override has(_value: T): boolean {
    return true;
  }
}

/** Todos os episódios estão disponíveis para assistir via embed. */
export function useEpisodeSources(_id: number) {
  return new UniversalSet<string>();
}
