import { describe, expect, it, afterEach } from "vitest";
import { getEnterpriseUrl, getMovieEmbedUrl, getSeriesEmbedUrl, hasEnterpriseConfigured } from "../player/embed";

describe("embed player URLs", () => {
  const originalUrl = import.meta.env.URL_ENTERPRISE;

  afterEach(() => {
    (import.meta.env as Record<string, unknown>).URL_ENTERPRISE = originalUrl;
  });

  it("getEnterpriseUrl remove barra final", () => {
    (import.meta.env as Record<string, unknown>).URL_ENTERPRISE = "https://empresa.com/embed///";
    expect(getEnterpriseUrl()).toBe("https://empresa.com/embed");
    expect(hasEnterpriseConfigured()).toBe(true);
  });

  it("getMovieEmbedUrl monta a rota /filme/{id}", () => {
    (import.meta.env as Record<string, unknown>).URL_ENTERPRISE = "https://empresa.com";
    expect(getMovieEmbedUrl(10378)).toBe("https://empresa.com/filme/10378");
  });

  it("getSeriesEmbedUrl monta /serie/{id} para lista de episódios", () => {
    (import.meta.env as Record<string, unknown>).URL_ENTERPRISE = "https://empresa.com";
    expect(getSeriesEmbedUrl(30984)).toBe("https://empresa.com/serie/30984");
  });

  it("getSeriesEmbedUrl monta /serie/{id}/{temporada}/{episodio} para episódio direto", () => {
    (import.meta.env as Record<string, unknown>).URL_ENTERPRISE = "https://empresa.com";
    expect(getSeriesEmbedUrl(30984, 1, 1)).toBe("https://empresa.com/serie/30984/1/1");
    expect(getSeriesEmbedUrl(30984, 2, 5)).toBe("https://empresa.com/serie/30984/2/5");
  });
});
