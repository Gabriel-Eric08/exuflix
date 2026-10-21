import { expect, test, type Page } from "@playwright/test";
import { mockTmdb } from "./tmdb-mock";
import { XT, mockXtream } from "./xtream-mock";

test.beforeEach(async ({ page }) => {
  await mockTmdb(page);
  await mockXtream(page);
});

async function connect(page: Page) {
  const dialog = page.getByRole("dialog", { name: "Conectar IPTV" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("URL do servidor").fill(XT.url);
  await dialog.getByLabel("Usuário").fill(XT.username);
  await dialog.getByLabel("Senha", { exact: true }).fill(XT.password);
  await dialog.getByRole("button", { name: "Conectar" }).click();
  await expect(dialog.getByRole("heading", { name: "Tudo certo!" })).toBeVisible();
}

test("ao entrar sem conta, o modal pergunta e a aba fica cinza", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("dialog", { name: "Conectar IPTV" })).toBeVisible();
  await page.getByRole("button", { name: "Agora não" }).click();
  const tab = page.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: /Marcondes de Oxóssi .bloqueado/ });
  await expect(tab).toHaveAttribute("data-locked", "true");
  // Clicar na aba cinza reabre o login
  await tab.click();
  await expect(page.getByRole("dialog", { name: "Conectar IPTV" })).toBeVisible();
});

test("senha errada mostra erro e não libera a aba", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Conectar IPTV" });
  await dialog.getByLabel("URL do servidor").fill(XT.url);
  await dialog.getByLabel("Usuário").fill(XT.username);
  await dialog.getByLabel("Senha", { exact: true }).fill("errada");
  await dialog.getByRole("button", { name: "Conectar" }).click();
  await expect(dialog.getByRole("alert")).toHaveText("Usuário ou senha incorretos.");
  expect(await page.evaluate(() => localStorage.getItem("exuflix:v1:xtream:account"))).toBeNull();
});

test("link M3U colado preenche usuário e senha", async ({ page }) => {
  await page.goto("/");
  const dialog = page.getByRole("dialog", { name: "Conectar IPTV" });
  await dialog.getByLabel("URL do servidor").fill(`${XT.url}/get.php?username=${XT.username}&password=${XT.password}&type=m3u_plus`);
  await expect(dialog.getByLabel("URL do servidor")).toHaveValue(XT.url);
  await expect(dialog.getByLabel("Usuário")).toHaveValue(XT.username);
  await expect(dialog.getByLabel("Senha", { exact: true })).toHaveValue(XT.password);
});

test("login → área Marcondes → detalhes → player com a URL Xtream → sair", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", e => errors.push(e.message));

  await page.goto("/");
  await connect(page);
  await page.getByRole("button", { name: /Abrir Marcondes de Oxóssi/ }).click();
  await expect(page).toHaveURL(/\/pai-marcondes$/);
  await expect(page.getByRole("heading", { name: "Filmes adicionados recentemente" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: "Sintel" })).toBeVisible();

  // Card → modal de detalhes com dados do get_vod_info
  await page.getByRole("button", { name: "Tears of Steel" }).first().click();
  const details = page.getByRole("dialog", { name: "Detalhes do título" });
  await expect(details).toBeVisible();
  await expect(page).toHaveURL(/\/pai-marcondes\/titulo\/filme\/102$/);
  await expect(details.getByText("Colin Levy")).toBeVisible();

  await details.getByRole("button", { name: "Assistir", exact: true }).click();
  await expect(page).toHaveURL(/\/pai-marcondes\/assistir\/filme\/102$/);
  const video = page.locator("video");
  await expect(video).toHaveAttribute("src", `${XT.url}/movie/${XT.username}/${XT.password}/102.mp4`);

  await page.getByRole("button", { name: "Voltar", exact: true }).click();
  await page.goto("/pai-marcondes");
  await page.getByRole("button", { name: "Conta IPTV" }).click();
  await page.getByRole("button", { name: "Sair" }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("navigation", { name: "Principal" }).getByRole("button", { name: /Marcondes de Oxóssi .bloqueado/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test("série abre no episódio e TV ao vivo mostra a programação", async ({ page }) => {
  await page.goto("/");
  await connect(page);
  await page.getByRole("button", { name: "Continuar aqui" }).click();

  await page.goto("/pai-marcondes/titulo/serie/201");
  await expect(page.getByRole("heading", { name: "Episódios" })).toBeVisible();
  await page.getByRole("button", { name: /Final/ }).click();
  await expect(page).toHaveURL(/\/pai-marcondes\/assistir\/serie\/201\/1\/2$/);
  await expect(page.locator("video")).toHaveAttribute("src", `${XT.url}/series/${XT.username}/${XT.password}/5002.mp4`);

  await page.goto("/pai-marcondes/ao-vivo");
  const card = page.getByRole("button", { name: /Canal Um, agora: Jornal da Noite/ });
  await expect(card).toBeVisible();
  await card.click();
  await expect(page).toHaveURL(/\/pai-marcondes\/ao-vivo\/301$/);
  await expect(page.getByText("Ao vivo", { exact: true })).toBeVisible();
  await expect(page.getByText(/Agora: Jornal da Noite/)).toBeVisible();
});

test("sem conta, /pai-marcondes volta para o início e pede login", async ({ page }) => {
  await page.goto("/pai-marcondes/filmes");
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole("dialog", { name: "Conectar IPTV" })).toBeVisible();
});
