import { describe, expect, it } from "vitest";
import { nextEpisode, previousEpisode } from "../player/nextEpisode";
import { applyProgress, isCompleted, pruneOld } from "../hooks/useProgressTracker";
import { formatTime, spokenTime } from "../player/format";
import { resumePoint, shouldOfferResume, type ProgressStore } from "../storage/progress";

const seasons = [
  { number: 1, episodeCount: 3 },
  { number: 2, episodeCount: 0 },
  { number: 3, episodeCount: 2 },
];

describe("nextEpisode", () => {
  it("avança dentro da temporada", () => {
    expect(nextEpisode(seasons, 1, 1)).toEqual({ season: 1, episode: 2 });
  });
  it("pula temporadas vazias", () => {
    expect(nextEpisode(seasons, 1, 3)).toEqual({ season: 3, episode: 1 });
  });
  it("null no fim da série", () => {
    expect(nextEpisode(seasons, 3, 2)).toBeNull();
  });
  it("não depende da ordem do array", () => {
    expect(nextEpisode([{ number: 3, episodeCount: 1 }, { number: 2, episodeCount: 1 }, { number: 1, episodeCount: 1 }], 1, 1)).toEqual({ season: 2, episode: 1 });
  });
  it("previousEpisode volta para o último da temporada anterior", () => {
    expect(previousEpisode(seasons, 3, 1)).toEqual({ season: 1, episode: 3 });
    expect(previousEpisode(seasons, 1, 1)).toBeNull();
  });
});

describe("isCompleted", () => {
  it("falso sem duração", () => {
    expect(isCompleted(100, 0, "movie")).toBe(false);
    expect(isCompleted(100, NaN, "movie")).toBe(false);
  });
  it("passou dos créditos", () => {
    expect(isCompleted(560, 6000, "movie", 560)).toBe(true);
  });
  it("95% assistido", () => {
    expect(isCompleted(950, 1000, "episode")).toBe(true);
  });
  it("faltam ≤ 180 s (filme) ou ≤ 60 s (episódio)", () => {
    // Em vídeos curtos a regra de tempo restante vem antes dos 95%
    expect(isCompleted(1000 - 180, 1000, "movie")).toBe(true);
    expect(isCompleted(1000 - 181, 1000, "movie")).toBe(false);
    expect(isCompleted(600 - 60, 600, "episode")).toBe(true);
    expect(isCompleted(600 - 61, 600, "episode")).toBe(false);
  });
});

describe("applyProgress", () => {
  const meta = { title: "Big Buck Bunny", poster: "/p", backdrop: "/b" };

  it("filme em andamento guarda a posição", () => {
    const s = applyProgress({ items: {} }, { kind: "movie", id: 10378, meta }, 312.4, 596.5, false, 1);
    expect(s.items["movie:10378"]).toEqual({ type: "movie", id: 10378, position: 312.4, duration: 596.5, completed: false, updatedAt: 1, meta });
  });

  it("filme concluído volta a posição para 0", () => {
    const s = applyProgress({ items: {} }, { kind: "movie", id: 1, meta }, 590, 596.5, false, 1);
    expect(s.items["movie:1"]).toMatchObject({ position: 0, completed: true });
  });

  it("episódio mescla com os anteriores e atualiza o atual", () => {
    let s: ProgressStore = { items: {} };
    const ep = (e: number) => ({ kind: "episode" as const, id: 9, season: 1, episode: e, meta: { ...meta, episodeTitle: `Ep ${e}`, still: null } });
    s = applyProgress(s, ep(1), 1310, 1320, true, 1);
    s = applyProgress(s, ep(2), 400, 1300, false, 2);
    const sp = s.items["tv:9"];
    expect(sp.type).toBe("tv");
    if (sp.type !== "tv") return;
    expect(sp.current).toEqual({ season: 1, episode: 2 });
    expect(sp.episodes.s1e1).toMatchObject({ completed: true, position: 1320 });
    expect(sp.episodes.s1e2).toMatchObject({ completed: false, position: 400, title: "Ep 2" });
    expect(sp.updatedAt).toBe(2);
  });

  it("pruneOld mantém os 300 mais recentes", () => {
    const items: ProgressStore["items"] = {};
    for (let i = 0; i < 305; i++) {
      items[`movie:${i}`] = { type: "movie", id: i, position: 50, duration: 100, completed: false, updatedAt: i, meta };
    }
    const out = pruneOld(items);
    expect(Object.keys(out)).toHaveLength(300);
    expect(out["movie:0"]).toBeUndefined();
    expect(out["movie:304"]).toBeDefined();
  });
});

describe("retomar", () => {
  it("oferece retomar após 30 s e não concluído", () => {
    expect(shouldOfferResume({ position: 31, completed: false })).toBe(true);
    expect(shouldOfferResume({ position: 30, completed: false })).toBe(false);
    expect(shouldOfferResume({ position: 500, completed: true })).toBe(false);
  });
  it("volta 5 s antes", () => {
    expect(resumePoint({ position: 100 })).toBe(95);
    expect(resumePoint({ position: 3 })).toBe(0);
  });
});

describe("format", () => {
  it("formatTime", () => {
    expect(formatTime(73)).toBe("1:13");
    expect(formatTime(3733)).toBe("1:02:13");
    expect(formatTime(NaN)).toBe("0:00");
  });
  it("spokenTime", () => {
    expect(spokenTime(42 * 60, 108 * 60)).toBe("42 minutos de 1 hora e 48");
  });
});
