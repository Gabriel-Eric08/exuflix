import { describe, expect, it } from "vitest";
import { buildTarget, isPrivateAddress, normalizeServerUrl, runProxy } from "../../api/_xtreamCore";
import { episodeUrl, isMixedContent, liveUrl, movieUrl, streamBase, type XtreamAccount } from "../xtream/client";
import { accountFromAuth, XtreamAuthError } from "../xtream/credentials";
import { neighbors } from "../xtream/live";
import {
  b64,
  episodesOf,
  epgOf,
  nowNext,
  seasonsOf,
  seriesInfoToDetails,
  splitYear,
  vodInfoToDetails,
  vodToSummary,
  youtubeKey,
} from "../xtream/normalize";
import { searchTitles } from "../xtream/queries";
import { parsePastedLink } from "../xtream/LoginModal";
import type { LiveChannel } from "../xtream/types";

const ACC: XtreamAccount = {
  url: "http://iptv.test:8080",
  username: "fulano",
  password: "s3nh@/x",
  status: "Active",
  expiresAt: null,
  maxConnections: 1,
  activeConnections: 0,
  isTrial: false,
  formats: ["m3u8", "ts"],
  server: { protocol: "http", host: "iptv.test", port: 8080, httpsPort: 8443, timezone: null },
  savedAt: 0,
};

describe("proxy: validação contra SSRF", () => {
  it("bloqueia loopback, redes privadas e link-local", () => {
    for (const h of ["localhost", "127.0.0.1", "10.1.2.3", "172.16.0.1", "172.31.255.255", "192.168.0.10", "169.254.169.254", "0.0.0.0", "::1", "[::1]", "fd00::1", "::ffff:127.0.0.1", "nas.local"]) {
      expect(isPrivateAddress(h), h).toBe(true);
    }
  });

  it("libera endereços públicos", () => {
    for (const h of ["8.8.8.8", "172.32.0.1", "iptv.exemplo.com", "2606:4700::1111"]) {
      expect(isPrivateAddress(h), h).toBe(false);
    }
  });

  it("normaliza a URL digitada", () => {
    expect(normalizeServerUrl("dominio.com:8080/")).toBe("http://dominio.com:8080");
    expect(normalizeServerUrl("https://dominio.com/player_api.php")).toBe("https://dominio.com");
    expect(normalizeServerUrl("http://dominio.com:80/painel/get.php")).toBe("http://dominio.com/painel");
    expect(normalizeServerUrl("ftp://dominio.com")).toBeNull();
    expect(normalizeServerUrl("")).toBeNull();
  });

  it("monta player_api.php e recusa ação/parâmetro estranhos", () => {
    const ok = buildTarget({ url: "iptv.test:8080", username: "u", password: "p&x", action: "get_vod_info", params: { vod_id: 5 } });
    expect(ok.ok && ok.target.toString()).toBe("http://iptv.test:8080/player_api.php?username=u&password=p%26x&action=get_vod_info&vod_id=5");
    expect(buildTarget({ url: "iptv.test", username: "u", password: "p", action: "../x" })).toMatchObject({ ok: false, status: 400 });
    expect(buildTarget({ url: "iptv.test", username: "u", password: "p", params: { "a=b": 1 } })).toMatchObject({ ok: false, status: 400 });
    expect(buildTarget({ url: "http://127.0.0.1", username: "u", password: "p" })).toMatchObject({ ok: false, status: 403 });
    expect(buildTarget(null)).toMatchObject({ ok: false, status: 400 });
  });

  it("bloqueia domínio que resolve para IP interno (antes de qualquer fetch)", async () => {
    const out = await runProxy({ url: "http://interno.exemplo.com", username: "u", password: "p" }, async () => ["10.0.0.5"]);
    expect(out.status).toBe(403);
  });
});

describe("URLs de stream", () => {
  it("monta live/movie/series com credenciais escapadas", () => {
    expect(liveUrl(ACC, 7, "m3u8", ACC.url)).toBe("http://iptv.test:8080/live/fulano/s3nh%40%2Fx/7.m3u8");
    expect(movieUrl(ACC, 9, "mkv", ACC.url)).toBe("http://iptv.test:8080/movie/fulano/s3nh%40%2Fx/9.mkv");
    expect(episodeUrl(ACC, "5001", "", ACC.url)).toBe("http://iptv.test:8080/series/fulano/s3nh%40%2Fx/5001.mp4");
  });

  it("em página HTTPS usa a porta HTTPS do servidor, se houver", () => {
    expect(streamBase(ACC, "https:")).toBe("https://iptv.test:8443");
    expect(streamBase(ACC, "http:")).toBe("http://iptv.test:8080");
    expect(streamBase({ ...ACC, server: { ...ACC.server, httpsPort: null } }, "https:")).toBe("http://iptv.test:8080");
    expect(streamBase({ ...ACC, server: { ...ACC.server, httpsPort: 443 } }, "https:")).toBe("https://iptv.test");
  });

  it("detecta mixed content", () => {
    expect(isMixedContent("http://x/1.mp4", "https:")).toBe(true);
    expect(isMixedContent("https://x/1.mp4", "https:")).toBe(false);
    expect(isMixedContent("http://x/1.mp4", "http:")).toBe(false);
  });
});

describe("login", () => {
  const ok = { user_info: { username: "u", password: "p", auth: 1, status: "Active", exp_date: "2000000000", max_connections: "2", active_cons: "1", is_trial: "0", allowed_output_formats: ["m3u8"] }, server_info: { url: "iptv.test", port: "8080", https_port: "8443", server_protocol: "http" } };

  it("monta a conta a partir de user_info/server_info", () => {
    const acc = accountFromAuth("http://iptv.test:8080", "u", "p", ok, 1_000_000_000_000);
    expect(acc).toMatchObject({ expiresAt: 2_000_000_000_000, maxConnections: 2, activeConnections: 1, isTrial: false, formats: ["m3u8"] });
    expect(acc.server).toMatchObject({ protocol: "http", host: "iptv.test", port: 8080, httpsPort: 8443 });
  });

  it("recusa senha errada, conta expirada e bloqueada", () => {
    expect(() => accountFromAuth("http://x", "u", "p", { user_info: { username: "u", password: "p", auth: 0 } })).toThrow(XtreamAuthError);
    expect(() => accountFromAuth("http://x", "u", "p", null)).toThrow("Usuário ou senha incorretos.");
    expect(() => accountFromAuth("http://x", "u", "p", { user_info: { ...ok.user_info, status: "Banned" } })).toThrow("bloqueada");
    expect(() => accountFromAuth("http://x", "u", "p", { user_info: { ...ok.user_info, exp_date: "1000" } })).toThrow("expirou");
  });

  it("exp_date nulo = sem vencimento", () => {
    expect(accountFromAuth("http://x", "u", "p", { user_info: { ...ok.user_info, exp_date: null } }).expiresAt).toBeNull();
  });

  it("link M3U colado vira URL + usuário + senha", () => {
    expect(parsePastedLink("http://iptv.test:8080/get.php?username=a&password=b&type=m3u_plus")).toEqual({ url: "http://iptv.test:8080", username: "a", password: "b" });
    expect(parsePastedLink("iptv.test")).toBeNull();
  });
});

describe("normalização Xtream", () => {
  it("separa o ano do nome e tolera campos vazios", () => {
    expect(splitYear("Duna: Parte Dois (2024)")).toEqual({ title: "Duna: Parte Dois", year: 2024 });
    expect(splitYear("Matrix - [1999]")).toEqual({ title: "Matrix", year: 1999 });
    expect(splitYear("1917")).toEqual({ title: "1917", year: null });
    const s = vodToSummary({ stream_id: "12", name: "Filme (2020)", stream_icon: "", rating: "", rating_5based: 4, added: "100", category_id: "3" })!;
    expect(s).toMatchObject({ key: "movie:12", id: 12, title: "Filme", year: 2020, rating: 8, poster: null, genreIds: [3], popularity: 100 });
    expect(vodToSummary({ stream_id: null, name: "x" })).toBeNull();
  });

  it("youtube_trailer aceita id ou URL", () => {
    expect(youtubeKey("dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(youtubeKey("https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=1")).toBe("dQw4w9WgXcQ");
    expect(youtubeKey("")).toBeNull();
  });

  it("detalhes de filme: duração, elenco, gêneros e extensão", () => {
    const d = vodInfoToDetails(9, {
      info: { name: "X (2001)", plot: "Plot", cast: "A, B", director: "D", genre: "Ação / Drama", duration: "01:45:00", backdrop_path: ["https://img/b.jpg"], youtube_trailer: "dQw4w9WgXcQ" },
      movie_data: { stream_id: 9, container_extension: "mkv" },
    });
    expect(d).toMatchObject({ title: "X", year: 2001, runtime: 105, creators: ["D"], container: "mkv", backdrop: "https://img/b.jpg" });
    expect(d.cast.map(c => c.name)).toEqual(["A", "B"]);
    expect(d.genres.map(g => g.name)).toEqual(["Ação", "Drama"]);
    expect(d.trailer?.key).toBe("dQw4w9WgXcQ");
  });

  it("info vazia ([]) cai no item da lista", () => {
    const fallback = vodToSummary({ stream_id: 1, name: "Da lista", stream_icon: "https://p.jpg" })!;
    const d = vodInfoToDetails(1, { info: [], movie_data: undefined }, fallback);
    expect(d).toMatchObject({ title: "Da lista", poster: "https://p.jpg" });
  });

  it("temporadas saem dos episódios, mesmo com seasons vazio", () => {
    const raw = {
      seasons: [],
      info: { name: "S", series_id: 1 },
      episodes: {
        "2": [{ id: "22", episode_num: 1, title: "Ep 2x1", container_extension: "mkv" }],
        "1": [
          { id: "12", episode_num: 2, title: "B" },
          { id: "11", episode_num: 1, title: "A", info: { duration_secs: 1500, movie_image: "https://s.jpg" } },
          { id: "11b", episode_num: 1, title: "A (HD)" },
        ],
      },
    };
    expect(seasonsOf(raw).map(s => [s.number, s.episodeCount])).toEqual([[1, 3], [2, 1]]);
    const eps = episodesOf(1, raw, 1);
    expect(eps.map(e => [e.episode, e.streamId])).toEqual([[1, "11"], [2, "12"]]);
    expect(eps[0]).toMatchObject({ runtime: 25, still: "https://s.jpg", container: "mp4" });
    expect(episodesOf(1, raw, 2)[0]).toMatchObject({ streamId: "22", container: "mkv" });
    expect(seriesInfoToDetails(1, raw).seasons?.length).toBe(2);
  });

  it("EPG em base64 com acentos e agora/a seguir", () => {
    const enc = (s: string) => Buffer.from(s, "utf8").toString("base64");
    expect(b64(enc("Notícias da manhã"))).toBe("Notícias da manhã");
    const epg = epgOf([
      { title: enc("Depois"), start_timestamp: "200", stop_timestamp: "300" },
      { title: enc("Agora"), start_timestamp: "100", stop_timestamp: "200" },
    ]);
    expect(epg.map(e => e.title)).toEqual(["Agora", "Depois"]);
    expect(nowNext(epg, 150_000)).toMatchObject({ now: { title: "Agora" }, next: { title: "Depois" } });
    expect(nowNext(epg, 50_000)).toMatchObject({ now: null, next: { title: "Agora" } });
  });
});

describe("busca local e troca de canal", () => {
  it("ignora acento e caixa, prioriza começa-com", () => {
    const mk = (id: number, title: string) => ({ ...vodToSummary({ stream_id: id, name: title })! });
    const items = [mk(1, "O Poderoso Chefão"), mk(2, "Chefão de Família"), mk(3, "Outro")];
    expect(searchTitles(items, "chefao").map(t => t.id)).toEqual([2, 1]);
    expect(searchTitles(items, "poderoso chef").map(t => t.id)).toEqual([1]);
    expect(searchTitles(items, "c")).toEqual([]);
  });

  it("canal anterior/próximo dentro da categoria, em ciclo", () => {
    const ch = (id: number, cat: number): LiveChannel => ({ key: `live:${id}`, id, name: `C${id}`, logo: null, categoryIds: [cat], epgId: null, archive: false, archiveDays: 0, num: id });
    const list = [ch(1, 1), ch(2, 2), ch(3, 1), ch(4, 1)];
    expect(neighbors(list, list[0])).toMatchObject({ prev: { id: 4 }, next: { id: 3 } });
    expect(neighbors(list, list[1])).toEqual({ prev: null, next: null });
  });
});
