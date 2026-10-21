import type { Page, Route } from "@playwright/test";

/** Servidor Xtream falso: responde /api/xtream (proxy) e redireciona os streams para vídeos de teste públicos. */
export const XT = { url: "http://iptv.test:8080", username: "demo", password: "segredo" };

const b64 = (s: string) => Buffer.from(s, "utf8").toString("base64");
const now = () => Math.floor(Date.now() / 1000);

const MOVIES = [
  { stream_id: 101, name: "Sintel (2010)", stream_icon: "", rating: "7.4", added: "1700000300", category_id: "1", container_extension: "mp4" },
  { stream_id: 102, name: "Tears of Steel (2012)", stream_icon: "", rating: "6.1", added: "1700000200", category_id: "1", container_extension: "mp4" },
  { stream_id: 103, name: "Cosmos Laundromat", stream_icon: "", rating: "", added: "1700000100", category_id: "2", container_extension: "mkv" },
];

const SERIES = [
  {
    series_id: 201,
    name: "Série Aberta",
    cover: "",
    plot: "Uma série de teste com dois episódios.",
    genre: "Drama",
    rating: "8",
    backdrop_path: ["https://image.tmdb.org/t/p/w1280/fundo.jpg"],
    last_modified: "1700000400",
    category_id: "10",
  },
];

const LIVE = [
  { stream_id: 301, name: "Canal Um", stream_icon: "", epg_channel_id: "um.br", category_id: "20", tv_archive: 0 },
  { stream_id: 302, name: "Canal Dois", stream_icon: "", epg_channel_id: "dois.br", category_id: "20", tv_archive: 1 },
];

function respond(body: { username?: string; password?: string; action?: string; params?: Record<string, string | number> }) {
  if (body.username !== XT.username || body.password !== XT.password) {
    return { user_info: { auth: 0 } };
  }
  switch (body.action) {
    case undefined:
      return {
        user_info: {
          username: XT.username,
          password: XT.password,
          auth: 1,
          status: "Active",
          exp_date: String(now() + 30 * 86400),
          is_trial: "0",
          active_cons: "0",
          max_connections: "2",
          allowed_output_formats: ["m3u8", "ts"],
        },
        server_info: { url: "iptv.test", port: "8080", https_port: "", server_protocol: "http", timezone: "America/Sao_Paulo" },
      };
    case "get_vod_categories":
      return [{ category_id: "1", category_name: "Animação" }, { category_id: "2", category_name: "Curtas" }];
    case "get_series_categories":
      return [{ category_id: "10", category_name: "Drama" }];
    case "get_live_categories":
      return [{ category_id: "20", category_name: "Abertos" }];
    case "get_vod_streams":
      return MOVIES;
    case "get_series":
      return SERIES;
    case "get_live_streams":
      return LIVE;
    case "get_vod_info": {
      const m = MOVIES.find(x => x.stream_id === Number(body.params?.vod_id));
      if (!m) return { info: [], movie_data: null };
      return {
        info: {
          name: m.name,
          plot: `Sinopse de ${m.name}.`,
          cast: "Atriz Um, Ator Dois",
          director: "Colin Levy",
          genre: "Animação, Fantasia",
          releasedate: "2010-09-27",
          duration_secs: 888,
          backdrop_path: ["https://image.tmdb.org/t/p/w1280/fundo.jpg"],
          youtube_trailer: "eRsGyueVLvQ",
        },
        movie_data: { stream_id: m.stream_id, name: m.name, category_id: m.category_id, container_extension: m.container_extension },
      };
    }
    case "get_series_info":
      return {
        seasons: [],
        info: SERIES[0],
        episodes: {
          "1": [
            { id: "5001", episode_num: 1, title: "Piloto", container_extension: "mp4", season: 1, info: { plot: "Começo.", duration_secs: 600 } },
            { id: "5002", episode_num: 2, title: "Final", container_extension: "mp4", season: 1, info: { plot: "Fim.", duration_secs: 600 } },
          ],
        },
      };
    case "get_short_epg":
      return {
        epg_listings: [
          { title: b64("Jornal da Noite"), description: b64("Notícias."), start_timestamp: String(now() - 600), stop_timestamp: String(now() + 1200) },
          { title: b64("Filme da Madrugada"), description: "", start_timestamp: String(now() + 1200), stop_timestamp: String(now() + 5000) },
        ],
      };
    default:
      return [];
  }
}

export async function mockXtream(page: Page) {
  await page.route("**/api/xtream", async (route: Route) => {
    const body = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(respond(body)) });
  });
  // Vídeos: o "servidor IPTV" manda para arquivos públicos de teste
  await page.route("http://iptv.test:8080/movie/**", r => r.fulfill({ status: 302, headers: { location: "https://archive.org/download/Sintel/sintel-2048-surround_512kb.mp4" } }));
  await page.route("http://iptv.test:8080/series/**", r => r.fulfill({ status: 302, headers: { location: "https://archive.org/download/Sintel/sintel-2048-surround_512kb.mp4" } }));
  await page.route("http://iptv.test:8080/live/**", r => r.fulfill({ status: 302, headers: { location: "https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8" } }));
}

/** Pula o modal de "tem IPTV?" nos testes que não tratam dele. */
export async function skipXtreamPrompt(page: Page) {
  await page.addInitScript(() => sessionStorage.setItem("exuflix:xtream-asked", "1"));
}
