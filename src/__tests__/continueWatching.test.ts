import { describe, expect, it } from "vitest";
import { buildContinueWatching } from "../storage/continueWatching";
import type { ProgressStore } from "../storage/progress";

const meta = (title: string) => ({ title, poster: "/p", backdrop: "/b" });

const store: ProgressStore = {
  items: {
    "movie:1": { type: "movie", id: 1, position: 300, duration: 600, completed: false, updatedAt: 10, meta: meta("Em andamento") },
    "movie:2": { type: "movie", id: 2, position: 0, duration: 600, completed: true, updatedAt: 20, meta: meta("Concluído") },
    "tv:3": {
      type: "tv",
      id: 3,
      current: { season: 1, episode: 3 },
      episodes: { s1e3: { position: 842.7, duration: 1340, completed: false, updatedAt: 30, title: "O Cruzamento", still: "/s3" } },
      updatedAt: 30,
      meta: meta("Série A"),
    },
    "tv:4": {
      type: "tv",
      id: 4,
      current: { season: 1, episode: 2 },
      episodes: { s1e2: { position: 1300, duration: 1300, completed: true, updatedAt: 40 } },
      updatedAt: 40,
      meta: meta("Série B"),
    },
    "tv:5": {
      type: "tv",
      id: 5,
      current: { season: 2, episode: 10 },
      episodes: { s2e10: { position: 1300, duration: 1300, completed: true, updatedAt: 50 } },
      updatedAt: 50,
      meta: meta("Série terminada"),
    },
  },
};

const seasons: Record<number, { number: number; episodeCount: number }[]> = {
  4: [{ number: 1, episodeCount: 2 }, { number: 2, episodeCount: 8 }],
  5: [{ number: 1, episodeCount: 10 }, { number: 2, episodeCount: 10 }],
};

describe("buildContinueWatching", () => {
  const out = buildContinueWatching(store, [], id => seasons[id]);

  it("ordena do mais recente e ignora concluídos/terminados", () => {
    expect(out.map(i => i.key)).toEqual(["tv:4", "tv:3", "movie:1"]);
  });

  it("filme mostra quanto falta", () => {
    expect(out.find(i => i.key === "movie:1")).toMatchObject({ subtitle: "Faltam 5 min", progress: 0.5, href: "/assistir/filme/1" });
  });

  it("episódio em andamento usa o still e o nome", () => {
    expect(out.find(i => i.key === "tv:3")).toMatchObject({
      subtitle: "T1:E3 · O Cruzamento",
      backdrop: "/s3",
      href: "/assistir/serie/3/1/3",
    });
  });

  it("episódio concluído aponta para o próximo", () => {
    expect(out.find(i => i.key === "tv:4")).toMatchObject({ subtitle: "Próximo: T2:E1", progress: 0, href: "/assistir/serie/4/2/1" });
  });

  it("respeita os removidos", () => {
    expect(buildContinueWatching(store, ["tv:3"], id => seasons[id]).some(i => i.key === "tv:3")).toBe(false);
  });

  it("sem temporadas carregadas, a série concluída fica de fora por enquanto", () => {
    expect(buildContinueWatching(store, [], () => undefined).some(i => i.key === "tv:4")).toBe(false);
  });
});
