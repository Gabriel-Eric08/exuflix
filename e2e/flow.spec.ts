import { expect, test } from "@playwright/test";
import { mockTmdb } from "./tmdb-mock";

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
});

test("home mostra destaque e linhas sem erros", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "Big Buck Bunny" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Top 10 no Brasil hoje" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Assistir/ }).first()).toBeVisible();
  expect(errors).toEqual([]);
});

test("card abre o modal de detalhes e Esc fecha", async ({ page }) => {
  await page.goto("/filmes?modo=grade");
  await page.getByRole("button", { name: "Sintel" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Detalhes do título" });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText("Sacha Goedegebure")).toBeVisible();
  await expect(page).toHaveURL(/\/titulo\/filme\/45745$/);
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/filmes\?modo=grade$/);
});

test("título sem fonte mostra trailer e onde assistir", async ({ page }) => {
  await page.goto("/titulo/filme/1");
  await expect(page.getByText("Ainda não disponível na Exuflix. Veja o trailer ou onde assistir.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Trailer" })).toBeVisible();
  await expect(page.getByText("Dados de disponibilidade: JustWatch")).toBeVisible();
});

test("minha lista guarda no localStorage", async ({ page }) => {
  await page.goto("/titulo/filme/45745");
  await page.getByRole("button", { name: "Adicionar à Minha lista" }).click();
  await expect(page.getByText("Adicionado à Minha lista")).toBeVisible();
  await page.goto("/minha-lista");
  await expect(page.getByRole("button", { name: "Sintel" })).toBeVisible();
});

test("home → play → sair → continuar assistindo → retomar", async ({ page }) => {
  await page.goto("/titulo/filme/10378");
  await page.getByRole("button", { name: "Assistir", exact: true }).click();
  await expect(page).toHaveURL(/\/assistir\/filme\/10378$/);

  const video = page.locator("video");
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.duration || 0), { timeout: 30_000 }).toBeGreaterThan(100);

  // "3" pula para 30% do vídeo; o tracker salva ao pausar
  await page.keyboard.press("3");
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 20_000 }).toBeGreaterThan(60);
  await page.keyboard.press("k");
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.paused)).toBe(true);

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("exuflix:v1:progress") ?? "{}"));
  expect(saved.items["movie:10378"].position).toBeGreaterThan(60);
  expect(saved.items["movie:10378"].completed).toBe(false);

  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.goto("/");
  const row = page.locator("section", { has: page.getByRole("heading", { name: "Continuar assistindo" }) });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /Continuar Big Buck Bunny/ }).click();

  await expect(page.getByRole("dialog", { name: "Big Buck Bunny" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Continuar de/ })).toBeFocused();
  await page.getByRole("button", { name: /Continuar de/ }).click();
  await expect.poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime), { timeout: 20_000 }).toBeGreaterThan(55);
});
