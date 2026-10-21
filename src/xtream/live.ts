import type { LiveChannel } from "./types";

const clock = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" });

/** 1700000000000 → "19:30" no fuso do navegador */
export const formatClock = (ms: number) => clock.format(ms);

/** Canais vizinhos na mesma categoria (para trocar de canal sem sair do player). */
export function neighbors(channels: LiveChannel[], current: LiveChannel) {
  const cat = current.categoryIds[0];
  const list = cat === undefined ? channels : channels.filter(c => c.categoryIds.includes(cat));
  const i = list.findIndex(c => c.id === current.id);
  if (i < 0 || list.length < 2) return { prev: null, next: null };
  return { prev: list[(i - 1 + list.length) % list.length], next: list[(i + 1) % list.length] };
}

/** Canais abertos recentemente (ids, mais novo primeiro). */
export const RECENT_LIVE_KEY = "xt:recent-live";
