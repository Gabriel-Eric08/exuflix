# Exuflix — Especificação de Produto, Identidade Visual e Arquitetura

> Versão 1.0 · Escopo: catálogo + players, **sem login** (todo estado do usuário fica no `localStorage`).
> Stack: React + TypeScript + Vite · Dados: TMDB API · Vídeo: HTML5 `<video>` + hls.js (e YouTube para trailers).

---

## Sumário

1. [Visão geral e princípios](#1-visão-geral-e-princípios)
2. [Identidade visual](#2-identidade-visual)
3. [Componentes de interface](#3-componentes-de-interface)
4. [Arquitetura técnica](#4-arquitetura-técnica)
5. [Dados: TMDB e o modelo JSON da Exuflix](#5-dados-tmdb-e-o-modelo-json-da-exuflix)
6. [Páginas e abas](#6-páginas-e-abas)
7. [Fontes de vídeo](#7-fontes-de-vídeo)
8. [Player de filme](#8-player-de-filme)
9. [Player de série](#9-player-de-série)
10. [Persistência no localStorage](#10-persistência-no-localstorage)
11. [Performance, acessibilidade e SEO](#11-performance-acessibilidade-e-seo)
12. [Atribuições e regras de conteúdo](#12-atribuições-e-regras-de-conteúdo)
13. [Roadmap](#13-roadmap)

---

## 1. Visão geral e princípios

**O que é:** uma plataforma de streaming no estilo Netflix/Disney+, com página inicial de destaques, abas de Filmes e Séries, categorias, busca, “Minha lista”, “Continuar assistindo” e players dedicados para filme e série.

**Princípios de produto**

1. **Abrir e assistir em 2 cliques.** Da home ao play em no máximo dois toques.
2. **A Exuflix lembra de você sem pedir cadastro.** Posição de reprodução, episódio atual, lista, volume e legenda ficam salvos no navegador.
3. **Imagem em primeiro lugar.** Arte do título (backdrop, pôster, logo) domina; texto é apoio.
4. **Rápido em qualquer rede.** Skeletons, imagens no tamanho certo, cache agressivo.
5. **Catálogo de metadados ≠ catálogo assistível.** O TMDB fornece informações de qualquer título; só tem botão “Assistir” o que tem fonte de vídeo legítima cadastrada (ver seção 7). Os demais mostram trailer e “Onde assistir”.

---

## 2. Identidade visual

### 2.1 Conceito de marca

**Nome:** Exuflix
**Conceito:** *a encruzilhada das histórias.* Na cultura afro-brasileira, Exu é o guardião dos caminhos e das encruzilhadas, o mensageiro, o princípio do movimento. A marca usa essa ideia de forma respeitosa e abstrata: a Exuflix é o ponto onde todos os caminhos (filmes, séries, gêneros) se cruzam e você escolhe para onde ir. As cores vermelho e preto vêm dessa referência; o dourado entra como “luz no caminho”.

> Diretriz de respeito: a marca não usa imagens religiosas, pontos riscados, figuras de entidades ou elementos litúrgicos. A referência é só conceitual (caminhos, cruzamento, movimento) e cromática.

**Tagline:** “Toda história passa por aqui.”
**Personalidade:** calorosa, brasileira, direta, um pouco provocadora. Nada corporativo.

### 2.2 Logotipo

- **Wordmark:** `EXUFLIX` em **Unbounded ExtraBold (800)**, caixa alta, tracking `-0.02em`.
- **Os dois “X”** são desenhados em vermelho (`--exu-red-500`); as demais letras em off-white (`--text-1`). Os X são o cruzamento, a encruzilhada.
- **Símbolo (ícone do app / favicon):** um único “X” de traços grossos, com pontas cortadas em 45°, sobre quadrado preto (`#0B0A0A`) com raio de 22%. No centro do cruzamento, um pequeno ponto dourado (`--gold-400`) de ~12% da largura: o ponto onde os caminhos se encontram.
- **Área de respiro:** altura da letra “E” em todos os lados.
- **Tamanho mínimo:** wordmark 72 px de largura; símbolo 16 px.
- **Usos proibidos:** contorno, sombra, gradiente nas letras, rotação, mudar as cores dos X.

**Versões**

| Versão | Uso |
|---|---|
| Wordmark completo | Navbar desktop, splash, rodapé |
| Símbolo “X” | Favicon, PWA icon, navbar mobile, loading |
| Monocromático branco | Sobre fotos/backdrops |

**Splash/loading:** o símbolo “X” desenha seus dois traços (stroke-dashoffset, 600 ms) e o ponto dourado acende (scale 0→1, 200 ms). Com `prefers-reduced-motion`, aparece estático.

### 2.3 Paleta de cores

Tema **escuro por padrão** (é uma plataforma de vídeo). Todas as cores existem como tokens CSS.

```css
:root {
  /* Fundos */
  --bg:            #0B0A0A;  /* preto quente, base da página */
  --surface-1:     #141212;  /* cards, navbar com scroll */
  --surface-2:     #1E1A1A;  /* modais, menus, painel de episódios */
  --surface-3:     #2A2424;  /* hover de linhas, inputs */
  --border:        #2F2828;

  /* Texto */
  --text-1:        #F5F1EE;  /* principal */
  --text-2:        #C9C1BC;  /* secundário, sinopses */
  --text-3:        #8E8580;  /* meta, legendas, placeholders */

  /* Marca */
  --exu-red-300:   #FF6B6F;
  --exu-red-500:   #E3262B;  /* primária: botões, X do logo, barra de progresso */
  --exu-red-600:   #C21B20;  /* hover/pressed */
  --exu-red-900:   #3A0D0E;  /* fundos de destaque sutis */
  --gold-400:      #F2B544;  /* acento: foco, Top 10, badges "Novo" */
  --gold-600:      #C98F1E;

  /* Estados */
  --success:       #2BB673;
  --warning:       #F2B544;
  --danger:        #FF4D4F;
  --focus-ring:    var(--gold-400);

  /* Overlays */
  --scrim-bottom:  linear-gradient(to top, var(--bg) 0%, rgba(11,10,10,.6) 35%, transparent 70%);
  --scrim-left:    linear-gradient(to right, rgba(11,10,10,.92) 0%, rgba(11,10,10,.5) 40%, transparent 70%);
  --scrim-player:  linear-gradient(to top, rgba(0,0,0,.85) 0%, transparent 30%, transparent 75%, rgba(0,0,0,.6) 100%);
}
```

**Regras de uso**

- Vermelho é ação: botão “Assistir”, barra de progresso, X do logo, item ativo. Nunca em grandes áreas de fundo.
- Dourado é atenção e foco: anel de foco do teclado, número do Top 10, selo “Novo episódio”.
- Contraste: `--text-1` e `--text-2` sobre `--bg` passam AA; `--text-3` só para metadados ≥ 14 px.
- Botão primário: fundo `--exu-red-500`, texto `#FFFFFF` (contraste 4.6:1).
- Botão “Assistir” no hero pode ser branco (`--text-1`) com texto `--bg` para máxima legibilidade sobre imagem; o vermelho fica para o hover/ícone.

**Classificação indicativa (ClassInd, Brasil)** — cores oficiais nos selos:

| Selo | Fundo | Texto |
|---|---|---|
| L | `#0A9E48` | branco |
| 10 | `#0094D9` | branco |
| 12 | `#F7C600` | preto |
| 14 | `#EE7623` | branco |
| 16 | `#E2001A` | branco |
| 18 | `#000000` (borda branca) | branco |

### 2.4 Tipografia

Ambas do Google Fonts.

| Papel | Fonte | Peso | Uso |
|---|---|---|---|
| Display | **Unbounded** | 600–800 | Logo, títulos do hero sem logo, números do Top 10, títulos de página |
| Texto/UI | **Manrope** | 400, 500, 600, 700 | Tudo o resto |
| Numérico | Manrope com `font-variant-numeric: tabular-nums` | 500 | Tempos do player, durações |

**Escala (fluida, base 16 px)**

```css
:root {
  --fs-xs:   0.75rem;                          /* 12 meta, badges */
  --fs-sm:   0.875rem;                         /* 14 meta de card, legendas */
  --fs-md:   1rem;                             /* 16 corpo */
  --fs-lg:   clamp(1.05rem, 0.9rem + .5vw, 1.25rem);   /* títulos de linha */
  --fs-xl:   clamp(1.4rem, 1rem + 1.4vw, 2rem);         /* títulos de página */
  --fs-hero: clamp(2rem, 1.2rem + 4vw, 4.5rem);         /* título no hero (Unbounded) */
  --fs-top10: clamp(5rem, 3rem + 8vw, 10rem);           /* números Top 10 */

  --lh-tight: 1.1;
  --lh-normal: 1.5;
}
```

- Títulos de linha (“Em alta”, “Continuar assistindo”): Manrope 700, `--fs-lg`, `--text-1`.
- Sinopse no hero: Manrope 500, `--fs-md`, `--text-2`, máximo 3 linhas (`line-clamp: 3`), largura máx. 42ch.
- Meta (ano · duração · gêneros): Manrope 600, `--fs-sm`, `--text-3`, separados por `·`.

### 2.5 Espaçamento, grid e raios

```css
:root {
  --space-1: 4px;  --space-2: 8px;  --space-3: 12px; --space-4: 16px;
  --space-5: 24px; --space-6: 32px; --space-7: 48px; --space-8: 64px;

  --gutter: clamp(16px, 4vw, 64px);   /* margem lateral da página */
  --row-gap: clamp(24px, 3vw, 48px);  /* espaço entre linhas de carrossel */

  --radius-sm: 6px;    /* badges, inputs */
  --radius-md: 10px;   /* cards */
  --radius-lg: 16px;   /* modais, painel de episódios */
  --radius-pill: 999px;/* botões, chips */
}
```

**Breakpoints e cards visíveis por linha (carrossel de pôsteres 2:3)**

| Breakpoint | Largura | Pôsteres por tela | Backdrops (16:9) por tela |
|---|---|---|---|
| xs | < 480 | 3.2 (deixa “peek” do próximo) | 1.6 |
| sm | 480–767 | 4.2 | 2.2 |
| md | 768–1023 | 5 | 3 |
| lg | 1024–1439 | 6 | 4 |
| xl | ≥ 1440 | 7 | 5 |

A fração (`.2`) é proposital no mobile: mostra que dá para rolar.

### 2.6 Elevação e sombras

```css
:root {
  --shadow-1: 0 2px 8px rgba(0,0,0,.35);
  --shadow-2: 0 8px 24px rgba(0,0,0,.5);
  --shadow-3: 0 20px 60px rgba(0,0,0,.65);   /* card expandido, modal */
  --glow-red: 0 0 0 1px rgba(227,38,43,.5), 0 8px 30px rgba(227,38,43,.25);
}
```

### 2.7 Movimento

```css
:root {
  --ease-out: cubic-bezier(.2,.8,.2,1);
  --ease-in-out: cubic-bezier(.65,0,.35,1);
  --dur-1: 120ms;  /* hover de botões */
  --dur-2: 200ms;  /* fades, controles do player */
  --dur-3: 320ms;  /* card expandindo, modal */
  --dur-4: 500ms;  /* troca de slide no hero */
}
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 1ms !important; transition-duration: 1ms !important; }
}
```

- Hover em card (desktop): espera **300 ms** (evita disparar ao passar o mouse), então escala 1.0 → 1.08 e expande o painel inferior.
- Hero: crossfade de 500 ms entre destaques, troca automática a cada 8 s, pausa com hover/foco.
- Controles do player: somem após 3 s sem movimento (fade 200 ms) e o cursor some junto.

### 2.8 Iconografia e imagem

- Ícones: **Lucide** (`lucide-react`), traço 2 px, tamanhos 16/20/24/32. Play, Pause, Plus, Check, Info, Volume2, VolumeX, Maximize, Minimize, Subtitles, SkipForward, ListVideo, ChevronLeft/Right, Search, X.
- Ícone de Play sempre preenchido (`fill="currentColor"`).
- Imagens do TMDB recebem sempre um scrim (gradiente) quando há texto por cima.
- Sem imagem? Fallback: fundo `--surface-2` com o título em Unbounded centralizado e um “X” vermelho em marca d’água a 6% de opacidade.

### 2.9 Voz e microcopy (PT-BR)

Tom: “você”, frases curtas, bom humor leve.

| Situação | Texto |
|---|---|
| Botão principal | **Assistir** · **Continuar** · **Assistir T1:E4** |
| Retomar | “Continuar de 42:13” / “Começar do início” |
| Lista vazia | “Sua lista está esperando. Toque no **+** em qualquer título.” |
| Busca sem resultado | “Nenhum caminho deu em ‘{termo}’. Tente outro nome.” |
| Erro de rede | “A conexão tropeçou. Tentar de novo?” |
| Próximo episódio | “Próximo episódio em 8s” |
| Sem fonte de vídeo | “Ainda não disponível na Exuflix. Veja o trailer ou onde assistir.” |

---

## 3. Componentes de interface

### 3.1 Navbar

- Fixa no topo, altura 64 px (desktop) / 56 px (mobile).
- Transparente com gradiente `rgba(0,0,0,.7) → transparent` no topo; ao rolar 40 px, vira `--surface-1` com `backdrop-filter: blur(12px)` (transição 200 ms).
- Desktop: Logo · Início · Séries · Filmes · Categorias · Minha lista · (direita) Busca.
- Mobile: símbolo “X” + busca no topo; **tab bar inferior** fixa com Início, Séries, Filmes, Busca, Minha lista (ícone + rótulo 11 px, ativo em `--exu-red-500`).
- Busca no desktop: ícone que expande em campo (largura 0 → 280 px).

### 3.2 Hero (Destaque)

- Altura `min(85vh, 56.25vw + 120px)`; mobile: pôster vertical 2:3 em largura total com scrim.
- Camadas: backdrop `original` → `--scrim-left` + `--scrim-bottom` → conteúdo.
- Conteúdo (alinhado à esquerda, `--gutter`): **logo do título** (imagem PNG do TMDB, máx. 40% da largura e 160 px de altura) ou título em Unbounded se não houver logo · meta (selo classificação · ano · duração/temporadas · 2 gêneros) · sinopse (3 linhas) · botões **Assistir/Continuar** (branco) e **Mais informações** (`rgba(110,110,110,.7)`).
- Indicadores de slide: 5 pílulas no canto inferior direito; ativa mais larga e vermelha.
- Opcional (preferência): trailer do YouTube mudo em loop após 3 s, só desktop e só se `autoplayPreviews` estiver ligado.

### 3.3 Linha (Row / Carrossel)

- Título da linha + link “Ver tudo ›” (aparece no hover do título).
- Scroll horizontal com `scroll-snap-type: x mandatory`, sem barra visível.
- Setas laterais (desktop) com fundo `rgba(11,10,10,.6)`, aparecem no hover da linha, avançam uma “página” de cards.
- Teclado: setas ← → movem foco entre cards; Enter abre detalhes; `P` dá play.
- Variações: **pôster** (2:3), **paisagem** (16:9, para “Continuar assistindo”), **Top 10** (número gigante + pôster).

### 3.4 Card de título

**Estado normal:** só a imagem, `--radius-md`, `--shadow-1`. Selo “Novo” ou “Novo episódio” em dourado no canto superior esquerdo quando aplicável.

**Hover (desktop, após 300 ms):** escala 1.08, ganha `--shadow-3`, expande painel em `--surface-2` abaixo com:
- Botões redondos 36 px: ▶ Play (branco) · ＋/✓ Minha lista · ⓘ Detalhes.
- Linha meta: selo classificação · duração ou “3 temporadas” · nota ★ 7.8.
- Até 3 gêneros separados por `·`.

**Mobile:** toque abre o modal de detalhes direto (sem hover).

**Card “Continuar assistindo”:** backdrop 16:9, barra de progresso de 4 px na base (`--exu-red-500` sobre `rgba(255,255,255,.25)`), abaixo “T2:E5 · Nome do episódio” ou “Faltam 38 min”. Botão “×” para remover da linha.

**Card Top 10:** número em Unbounded 800, `--fs-top10`, sem preenchimento, `-webkit-text-stroke: 3px var(--gold-400)`, sobreposto 30% atrás do pôster à esquerda.

### 3.5 Modal / página de detalhes

Abre como modal (`--radius-lg`, largura máx. 900 px, `--surface-1`) sobre a página atual; acessar a URL direto renderiza como página inteira.

1. Topo: backdrop com scrim, logo/título, botões **Assistir/Continuar T1:E3**, **Trailer**, **＋ Minha lista**, botão de som (se tocar trailer).
2. Duas colunas: esquerda (sinopse, ano, duração, selo, nota) · direita (Elenco: 3 nomes + “mais”, Gêneros, Criação/Direção).
3. **Séries:** seletor de temporada + lista de episódios (ver 9.3).
4. **Onde assistir** (TMDB watch providers, região BR) quando não houver fonte na Exuflix.
5. **Títulos semelhantes:** grid de 9 cards (recomendações do TMDB).

### 3.6 Outros

- **Chip de filtro:** pílula `--surface-3`, ativo `--text-1` com texto `--bg`.
- **Skeleton:** `--surface-2` com shimmer (`linear-gradient` animado, 1.4 s), mesmo formato do card final.
- **Toast:** canto inferior central, `--surface-2`, 4 s. Ex.: “Adicionado à Minha lista”.
- **Foco:** `outline: 2px solid var(--focus-ring); outline-offset: 3px;` em tudo que é interativo (`:focus-visible`).

---

## 4. Arquitetura técnica

### 4.1 Stack

| Camada | Escolha | Por quê |
|---|---|---|
| Build | **Vite** + **React 18** + **TypeScript** | Rápido, padrão de mercado |
| Rotas | **React Router v6** (data routers) | Rotas aninhadas, modal sobre rota |
| Dados remotos | **TanStack Query v5** | Cache, paginação infinita, prefetch |
| Estado local persistido | Módulo próprio sobre `localStorage` + `useSyncExternalStore` | Sem dependência, sincroniza abas |
| Estilo | CSS Modules + tokens CSS (seção 2) | Controle total da identidade |
| Vídeo | `<video>` nativo + **hls.js** (carregado sob demanda) | HLS em todos os navegadores |
| Trailers | YouTube IFrame (`youtube-nocookie.com`) | Fonte oficial dos trailers do TMDB |
| Ícones | `lucide-react` | Leve, consistente |
| Listas longas | `@tanstack/react-virtual` | Grid infinito sem travar |
| Proxy da API | Cloudflare Worker (ou Vercel Function) | Esconde o token e adiciona cache |

### 4.2 Estrutura de pastas

```
exuflix/
├─ public/
│  ├─ favicon.svg
│  ├─ manifest.webmanifest
│  └─ sources.json            # fontes de vídeo assistíveis (seção 7)
├─ src/
│  ├─ app/
│  │  ├─ router.tsx
│  │  ├─ queryClient.ts
│  │  └─ App.tsx
│  ├─ styles/
│  │  ├─ tokens.css           # cores, tipografia, espaço, movimento
│  │  └─ global.css
│  ├─ api/
│  │  ├─ tmdb.ts              # cliente fetch
│  │  ├─ endpoints.ts         # funções por recurso
│  │  ├─ normalize.ts         # TMDB → modelo Exuflix
│  │  ├─ images.ts            # URLs e srcset
│  │  └─ types.ts
│  ├─ hooks/
│  │  ├─ queries.ts           # useTrending, useTitle, useSeason...
│  │  ├─ useProgressTracker.ts
│  │  └─ usePlayerKeyboard.ts
│  ├─ storage/
│  │  ├─ store.ts             # read/write/subscribe
│  │  ├─ progress.ts
│  │  ├─ watchlist.ts
│  │  └─ preferences.ts
│  ├─ player/
│  │  ├─ VideoPlayer.tsx      # núcleo compartilhado
│  │  ├─ Controls.tsx
│  │  ├─ ProgressBar.tsx
│  │  ├─ MoviePlayerPage.tsx
│  │  ├─ SeriesPlayerPage.tsx
│  │  ├─ EpisodePanel.tsx
│  │  ├─ NextEpisodeCard.tsx
│  │  └─ sources.ts           # resolveSource()
│  ├─ components/             # Navbar, Hero, Row, TitleCard, DetailsModal, Skeleton...
│  └─ pages/                  # Home, Movies, Series, Categories, Genre, Search, MyList, Details
├─ worker/
│  └─ tmdb-proxy.ts
└─ .env                       # VITE_API_BASE=/api/tmdb
```

### 4.3 Rotas

| Rota | Página |
|---|---|
| `/` | Início (destaques) |
| `/series` | Aba Séries |
| `/filmes` | Aba Filmes |
| `/categorias` | Grade de categorias |
| `/categorias/:tipo/:generoId-:slug` | Página de gênero (ex.: `/categorias/filme/28-acao`) |
| `/busca?q=` | Busca |
| `/minha-lista` | Minha lista |
| `/titulo/:tipo/:id` | Detalhes (`tipo` = `filme` \| `serie`); com `state.background` vira modal |
| `/assistir/filme/:id` | Player de filme |
| `/assistir/serie/:id` | Redireciona para o episódio atual salvo (ou T1:E1) |
| `/assistir/serie/:id/:temporada/:episodio` | Player de série |

Os players são carregados com `React.lazy` (o hls.js só baixa quando alguém dá play).

### 4.4 Token do TMDB e proxy

O TMDB oferece um **Read Access Token (v4)**. Não deixe ele exposto no bundle do front. Use um proxy mínimo:

```ts
// worker/tmdb-proxy.ts (Cloudflare Worker)
export default {
  async fetch(req: Request, env: { TMDB_TOKEN: string }) {
    const url = new URL(req.url);
    if (!url.pathname.startsWith("/api/tmdb/")) return new Response("Not found", { status: 404 });

    const target = new URL("https://api.themoviedb.org/3" + url.pathname.replace("/api/tmdb", ""));
    target.search = url.search;

    const cache = caches.default;
    const cacheKey = new Request(target.toString());
    const hit = await cache.match(cacheKey);
    if (hit) return hit;

    const res = await fetch(target, {
      headers: { Authorization: `Bearer ${env.TMDB_TOKEN}`, accept: "application/json" },
    });
    const out = new Response(res.body, res);
    out.headers.set("Cache-Control", "public, max-age=3600"); // 1h
    if (res.ok) await cache.put(cacheKey, out.clone());
    return out;
  },
};
```

Em desenvolvimento, o proxy do Vite resolve:

```ts
// vite.config.ts
server: {
  proxy: {
    "/api/tmdb": {
      target: "https://api.themoviedb.org/3",
      changeOrigin: true,
      rewrite: p => p.replace(/^\/api\/tmdb/, ""),
      headers: { Authorization: `Bearer ${process.env.TMDB_TOKEN}` },
    },
  },
},
```

---

## 5. Dados: TMDB e o modelo JSON da Exuflix

### 5.1 Cliente base

```ts
// src/api/tmdb.ts
const BASE = import.meta.env.VITE_API_BASE ?? "/api/tmdb";

export class TmdbError extends Error {
  constructor(public status: number, public path: string) {
    super(`TMDB ${status} em ${path}`);
  }
}

type Params = Record<string, string | number | boolean | undefined>;

export async function tmdb<T>(path: string, params: Params = {}, signal?: AbortSignal): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  url.searchParams.set("language", "pt-BR");
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined) url.searchParams.set(k, String(v));
  }
  const res = await fetch(url, { signal });
  if (!res.ok) throw new TmdbError(res.status, path);
  return res.json() as Promise<T>;
}
```

### 5.2 Imagens

Base: `https://image.tmdb.org/t/p/{tamanho}{caminho}`.

| Tipo | Tamanhos disponíveis | Uso na Exuflix |
|---|---|---|
| poster | w92, w154, w185, w342, w500, w780, original | cards: w342 (srcset w185/w342/w500) |
| backdrop | w300, w780, w1280, original | hero: w1280/original · continuar assistindo: w780 |
| logo | w45, w92, w154, w185, w300, w500, original | hero e detalhes: w500 |
| still (episódio) | w92, w185, w300, original | lista de episódios: w300 |
| profile | w45, w185, h632, original | elenco: w185 |

```ts
// src/api/images.ts
const IMG = "https://image.tmdb.org/t/p";

export const img = (path: string | null | undefined, size = "w500") =>
  path ? `${IMG}/${size}${path}` : null;

export const posterSrcSet = (path: string | null) =>
  path ? `${IMG}/w185${path} 185w, ${IMG}/w342${path} 342w, ${IMG}/w500${path} 500w` : undefined;

export const backdropSrcSet = (path: string | null) =>
  path ? `${IMG}/w780${path} 780w, ${IMG}/w1280${path} 1280w, ${IMG}/original${path} 1920w` : undefined;
```

### 5.3 Endpoints usados

**Listas (home, abas, categorias)**

| Necessidade | Endpoint | Parâmetros úteis |
|---|---|---|
| Em alta hoje (tudo) | `GET /trending/all/day` | `page` |
| Em alta na semana | `GET /trending/movie/week`, `/trending/tv/week` | |
| Populares | `GET /movie/popular`, `/tv/popular` | `page`, `region=BR` (filme) |
| Mais bem avaliados | `GET /movie/top_rated`, `/tv/top_rated` | |
| Nos cinemas | `GET /movie/now_playing` | `region=BR` |
| Em breve | `GET /movie/upcoming` | `region=BR` |
| Séries no ar | `GET /tv/on_the_air`, `/tv/airing_today` | `timezone=America/Fortaleza` |
| Lista de gêneros | `GET /genre/movie/list`, `/genre/tv/list` | |
| Por gênero / filtros | `GET /discover/movie`, `/discover/tv` | `with_genres`, `sort_by`, `vote_count.gte`, `primary_release_year` / `first_air_date_year`, `with_original_language`, `watch_region=BR`, `with_watch_providers` |
| Busca | `GET /search/multi` | `query`, `page`, `include_adult=false` |

**Detalhes (uma chamada só, com `append_to_response`)**

```
GET /movie/{id}?append_to_response=videos,images,credits,release_dates,watch/providers,recommendations,external_ids
    &include_image_language=pt,en,null
    &include_video_language=pt,en

GET /tv/{id}?append_to_response=videos,images,aggregate_credits,content_ratings,watch/providers,recommendations,external_ids
    &include_image_language=pt,en,null
    &include_video_language=pt,en
```

**Temporada de série**

```
GET /tv/{id}/season/{season_number}
→ episodes[]: { episode_number, name, overview, still_path, runtime, air_date, vote_average }
```

Observações:
- `include_image_language=pt,en,null` traz logos em português quando existirem, senão em inglês; `null` traz backdrops sem texto (melhores para o hero).
- `release_dates` (filmes) e `content_ratings` (séries) trazem a classificação por país; filtre `iso_3166_1 === "BR"`.
- `seasons` dos detalhes da série inclui a temporada 0 (“Especiais”); oculte por padrão.
- O TMDB não tem “Top 10 do Brasil” oficial. O Top 10 da Exuflix é derivado de `/trending/all/day` (primeiros 10 com pôster).

### 5.4 Funções de endpoint

```ts
// src/api/endpoints.ts
import { tmdb } from "./tmdb";
import type * as T from "./types";

export const api = {
  trending: (type: "all" | "movie" | "tv", window: "day" | "week", page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>(`/trending/${type}/${window}`, { page }),

  list: (type: "movie" | "tv", list: string, page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>(`/${type}/${list}`, { page, region: type === "movie" ? "BR" : undefined }),

  genres: (type: "movie" | "tv") =>
    tmdb<{ genres: T.Genre[] }>(`/genre/${type}/list`),

  discover: (type: "movie" | "tv", filters: T.DiscoverFilters, page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>(`/discover/${type}`, {
      page,
      include_adult: false,
      sort_by: filters.sortBy ?? "popularity.desc",
      with_genres: filters.genreId,
      "vote_count.gte": filters.sortBy?.startsWith("vote_average") ? 300 : undefined,
      [type === "movie" ? "primary_release_year" : "first_air_date_year"]: filters.year,
      with_original_language: filters.lang,
      watch_region: "BR",
    }),

  search: (query: string, page = 1) =>
    tmdb<T.Paged<T.TmdbListItem>>("/search/multi", { query, page, include_adult: false }),

  movie: (id: number) =>
    tmdb<T.TmdbMovieDetails>(`/movie/${id}`, {
      append_to_response: "videos,images,credits,release_dates,watch/providers,recommendations,external_ids",
      include_image_language: "pt,en,null",
      include_video_language: "pt,en",
    }),

  tv: (id: number) =>
    tmdb<T.TmdbTvDetails>(`/tv/${id}`, {
      append_to_response: "videos,images,aggregate_credits,content_ratings,watch/providers,recommendations,external_ids",
      include_image_language: "pt,en,null",
      include_video_language: "pt,en",
    }),

  season: (tvId: number, season: number) =>
    tmdb<T.TmdbSeason>(`/tv/${tvId}/season/${season}`),
};
```

### 5.5 Modelo JSON normalizado da Exuflix

O front nunca usa o formato cru do TMDB nos componentes. Tudo passa por `normalize.ts`, que entrega um formato único para filmes e séries.

```ts
// src/api/types.ts (modelo da Exuflix)
export type MediaType = "movie" | "tv";

export interface TitleSummary {
  key: string;              // "movie:550" | "tv:1399" — chave única usada em todo o app e no localStorage
  id: number;               // id TMDB
  type: MediaType;
  title: string;
  originalTitle: string;
  overview: string;
  year: number | null;
  rating: number;           // 0–10, uma casa decimal
  voteCount: number;
  genreIds: number[];
  poster: string | null;    // caminho TMDB, ex. "/abc.jpg"
  backdrop: string | null;
  popularity: number;
}

export interface TitleDetails extends TitleSummary {
  genres: { id: number; name: string }[];
  tagline: string | null;
  runtime: number | null;            // minutos (filme) ou duração típica do episódio (série)
  certification: string | null;      // "L" | "10" | "12" | "14" | "16" | "18"
  logo: string | null;
  trailer: { key: string; name: string } | null; // YouTube
  cast: { id: number; name: string; character: string; profile: string | null }[];
  creators: string[];                // direção (filme) ou criação (série)
  imdbId: string | null;
  providersBR: { id: number; name: string; logo: string | null }[]; // streaming por assinatura no Brasil
  recommendations: TitleSummary[];
  // somente séries
  seasons?: { number: number; name: string; episodeCount: number; poster: string | null; airDate: string | null }[];
  status?: string;                   // "Returning Series", "Ended"...
}

export interface Episode {
  key: string;          // "tv:1399:s1e3"
  season: number;
  episode: number;
  title: string;
  overview: string;
  still: string | null;
  runtime: number | null;
  airDate: string | null;
}
```

**Normalizador**

```ts
// src/api/normalize.ts
import type * as T from "./types";

const yearOf = (d?: string) => (d ? Number(d.slice(0, 4)) : null);

export function toSummary(raw: T.TmdbListItem, fallbackType?: T.MediaType): T.TitleSummary | null {
  const type = (raw.media_type ?? fallbackType) as T.MediaType;
  if (type !== "movie" && type !== "tv") return null; // ignora "person" na busca multi
  return {
    key: `${type}:${raw.id}`,
    id: raw.id,
    type,
    title: type === "movie" ? raw.title! : raw.name!,
    originalTitle: type === "movie" ? raw.original_title! : raw.original_name!,
    overview: raw.overview ?? "",
    year: yearOf(type === "movie" ? raw.release_date : raw.first_air_date),
    rating: Math.round((raw.vote_average ?? 0) * 10) / 10,
    voteCount: raw.vote_count ?? 0,
    genreIds: raw.genre_ids ?? [],
    poster: raw.poster_path ?? null,
    backdrop: raw.backdrop_path ?? null,
    popularity: raw.popularity ?? 0,
  };
}

export const toSummaries = (items: T.TmdbListItem[], type?: T.MediaType) =>
  items.map(i => toSummary(i, type)).filter((x): x is T.TitleSummary => !!x);

function pickTrailer(videos?: T.TmdbVideos) {
  const yt = videos?.results.filter(v => v.site === "YouTube") ?? [];
  const best =
    yt.find(v => v.type === "Trailer" && v.iso_639_1 === "pt" && v.official) ??
    yt.find(v => v.type === "Trailer" && v.official) ??
    yt.find(v => v.type === "Trailer") ??
    yt.find(v => v.type === "Teaser");
  return best ? { key: best.key, name: best.name } : null;
}

function pickLogo(images?: T.TmdbImages) {
  const logos = images?.logos ?? [];
  return (logos.find(l => l.iso_639_1 === "pt") ?? logos.find(l => l.iso_639_1 === "en") ?? logos[0])?.file_path ?? null;
}

function certMovie(rd?: T.TmdbReleaseDates) {
  const br = rd?.results.find(r => r.iso_3166_1 === "BR");
  return br?.release_dates.find(d => d.certification)?.certification || null;
}

function certTv(cr?: T.TmdbContentRatings) {
  return cr?.results.find(r => r.iso_3166_1 === "BR")?.rating || null;
}

export function toDetails(raw: T.TmdbMovieDetails | T.TmdbTvDetails, type: T.MediaType): T.TitleDetails {
  const base = toSummary({ ...raw, media_type: type, genre_ids: raw.genres.map(g => g.id) } as T.TmdbListItem)!;
  const isMovie = type === "movie";
  const m = raw as T.TmdbMovieDetails;
  const t = raw as T.TmdbTvDetails;
  const credits = isMovie ? m.credits : t.aggregate_credits;
  const br = raw["watch/providers"]?.results?.BR;

  return {
    ...base,
    genres: raw.genres,
    tagline: raw.tagline || null,
    runtime: isMovie ? m.runtime ?? null : t.episode_run_time?.[0] ?? null,
    certification: isMovie ? certMovie(m.release_dates) : certTv(t.content_ratings),
    logo: pickLogo(raw.images),
    trailer: pickTrailer(raw.videos),
    cast: (credits?.cast ?? []).slice(0, 12).map((c: any) => ({
      id: c.id,
      name: c.name,
      character: c.character ?? c.roles?.[0]?.character ?? "",
      profile: c.profile_path ?? null,
    })),
    creators: isMovie
      ? (m.credits?.crew ?? []).filter(c => c.job === "Director").map(c => c.name)
      : (t.created_by ?? []).map(c => c.name),
    imdbId: raw.external_ids?.imdb_id ?? null,
    providersBR: (br?.flatrate ?? []).map(p => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path })),
    recommendations: toSummaries(raw.recommendations?.results ?? [], type).slice(0, 12),
    ...(isMovie ? {} : {
      seasons: t.seasons
        .filter(s => s.season_number > 0)
        .map(s => ({ number: s.season_number, name: s.name, episodeCount: s.episode_count, poster: s.poster_path, airDate: s.air_date })),
      status: t.status,
    }),
  };
}

export function toEpisodes(tvId: number, season: T.TmdbSeason): T.Episode[] {
  return season.episodes.map(e => ({
    key: `tv:${tvId}:s${e.season_number}e${e.episode_number}`,
    season: e.season_number,
    episode: e.episode_number,
    title: e.name,
    overview: e.overview,
    still: e.still_path,
    runtime: e.runtime,
    airDate: e.air_date,
  }));
}
```

**Exemplo do JSON resultante (`TitleDetails` de uma série)**

```json
{
  "key": "tv:1399",
  "id": 1399,
  "type": "tv",
  "title": "Game of Thrones",
  "originalTitle": "Game of Thrones",
  "overview": "Sete famílias nobres lutam pelo controle...",
  "year": 2011,
  "rating": 8.5,
  "voteCount": 25000,
  "genreIds": [10765, 18, 10759],
  "genres": [{ "id": 10765, "name": "Sci-Fi & Fantasy" }, { "id": 18, "name": "Drama" }],
  "poster": "/1XS1oqL89opfnbLl8WnZY1O1uJx.jpg",
  "backdrop": "/2OMB0ynKlyIenMJWI2Dy9IWT4c.jpg",
  "logo": "/x9iN2kVnnaS2rr0tGkqfyQ0D5cf.png",
  "certification": "16",
  "runtime": 60,
  "trailer": { "key": "KPLWWIOCOOQ", "name": "Trailer Oficial" },
  "cast": [{ "id": 22970, "name": "Peter Dinklage", "character": "Tyrion Lannister", "profile": "/9CAd7wr8QZyIN0E7nm8v1B6WkGn.jpg" }],
  "creators": ["David Benioff", "D. B. Weiss"],
  "imdbId": "tt0944947",
  "providersBR": [{ "id": 1899, "name": "Max", "logo": "/..." }],
  "seasons": [{ "number": 1, "name": "Temporada 1", "episodeCount": 10, "poster": "/...", "airDate": "2011-04-17" }],
  "status": "Ended",
  "recommendations": []
}
```

> Os valores acima são ilustrativos do formato; os reais vêm da API.

### 5.6 Hooks de dados (TanStack Query)

```ts
// src/hooks/queries.ts
import { useQuery, useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../api/endpoints";
import { toSummaries, toDetails, toEpisodes } from "../api/normalize";

const HOUR = 60 * 60 * 1000;

export const useRow = (key: string[], fn: () => Promise<any>, type?: "movie" | "tv") =>
  useQuery({
    queryKey: ["row", ...key],
    queryFn: async () => toSummaries((await fn()).results, type),
    staleTime: HOUR,
  });

export const useGenres = (type: "movie" | "tv") =>
  useQuery({ queryKey: ["genres", type], queryFn: async () => (await api.genres(type)).genres, staleTime: 24 * HOUR });

export const useTitle = (type: "movie" | "tv", id: number) =>
  useQuery({
    queryKey: ["title", type, id],
    queryFn: async () => toDetails(type === "movie" ? await api.movie(id) : await api.tv(id), type),
    staleTime: 6 * HOUR,
  });

export const useSeason = (tvId: number, season: number) =>
  useQuery({
    queryKey: ["season", tvId, season],
    queryFn: async () => toEpisodes(tvId, await api.season(tvId, season)),
    staleTime: 6 * HOUR,
    enabled: season > 0,
  });

export const useDiscover = (type: "movie" | "tv", filters: any) =>
  useInfiniteQuery({
    queryKey: ["discover", type, filters],
    queryFn: ({ pageParam }) => api.discover(type, filters, pageParam),
    initialPageParam: 1,
    getNextPageParam: last => (last.page < Math.min(last.total_pages, 500) ? last.page + 1 : undefined),
    select: data => data.pages.flatMap(p => toSummaries(p.results, type)),
    staleTime: HOUR,
  });

/** Prefetch dos detalhes quando o card recebe hover/foco */
export function usePrefetchTitle() {
  const qc = useQueryClient();
  return (type: "movie" | "tv", id: number) =>
    qc.prefetchQuery({
      queryKey: ["title", type, id],
      queryFn: async () => toDetails(type === "movie" ? await api.movie(id) : await api.tv(id), type),
      staleTime: 6 * HOUR,
    });
}
```

O TMDB limita `page` a 500 no discover; o `getNextPageParam` já respeita isso.

---

## 6. Páginas e abas

### 6.1 Início (`/`)

Ordem das seções (cada linha só aparece se tiver itens):

| # | Seção | Fonte |
|---|---|---|
| 1 | **Hero rotativo** (5 destaques) | `/trending/all/week`, filtrando itens com backdrop e sinopse; logo buscado via detalhes |
| 2 | **Continuar assistindo** | `localStorage` (seção 10.6), card paisagem com progresso |
| 3 | **Top 10 no Brasil hoje** | `/trending/all/day` (10 primeiros) |
| 4 | **Minha lista** | `localStorage` |
| 5 | Lançamentos nos cinemas | `/movie/now_playing?region=BR` |
| 6 | Séries em alta | `/trending/tv/week` |
| 7 | Filmes em alta | `/trending/movie/week` |
| 8 | Aclamados pela crítica | `/movie/top_rated` |
| 9 | Ação e aventura | `/discover/movie?with_genres=28` |
| 10 | Comédia | `/discover/movie?with_genres=35` |
| 11 | Terror | `/discover/movie?with_genres=27` |
| 12 | Animação | `/discover/movie?with_genres=16` |
| 13 | Produções brasileiras | `/discover/movie?with_original_language=pt&region=BR` |
| 14 | Documentários | `/discover/movie?with_genres=99` |
| 15 | **Porque você assistiu {X}** | recomendações do último título em “Continuar assistindo” |
| 16 | Disponível agora na Exuflix | títulos presentes em `sources.json` |

As linhas abaixo da dobra só buscam dados quando entram no viewport (`IntersectionObserver` com `rootMargin: "400px"`), para a home abrir rápido.

### 6.2 Séries (`/series`) e Filmes (`/filmes`)

Mesma estrutura, trocando o tipo:

- **Hero** com um destaque do tipo (`/trending/{tipo}/day`, item 1).
- **Barra de filtros fixa** abaixo da navbar: dropdown **Gêneros** · chips **Populares / Mais bem avaliados / Lançamentos / Em exibição** · dropdown **Ano** · alternância **Linhas | Grade**.
- **Modo Linhas (padrão):** carrosséis por gênero, na ordem dos gêneros mais populares do tipo.
- **Modo Grade:** grid infinito de pôsteres com `useDiscover` + virtualização. Ordenações:
  - Populares: `popularity.desc`
  - Mais bem avaliados: `vote_average.desc` com `vote_count.gte=300`
  - Lançamentos: `primary_release_date.desc` (filme) / `first_air_date.desc` (série) com `vote_count.gte=20`
- Filtros refletidos na URL (`/filmes?genero=28&ordem=avaliados&ano=2024`) para poder compartilhar e voltar.

Linhas extras específicas:
- Séries: “No ar esta semana” (`/tv/on_the_air`), “Novos episódios hoje” (`/tv/airing_today`).
- Filmes: “Em breve nos cinemas” (`/movie/upcoming?region=BR`).

### 6.3 Categorias (`/categorias`)

- Grid de cartões de gênero (16:9, `--radius-md`), unindo gêneros de filme e série pelo nome.
- Cada cartão usa como fundo o backdrop do título mais popular do gênero (buscado uma vez e cacheado por 24 h), com scrim e o nome em Unbounded 700.
- Paleta de destaque por cartão: uma borda inferior de 3 px alternando `--exu-red-500` e `--gold-400`.
- Coleções especiais no topo: **Brasileiros**, **Animes** (`with_genres=16&with_original_language=ja`), **Clássicos** (`primary_release_date.lte=1980-12-31`, ordenado por avaliação), **Curtos** (filmes com `with_runtime.lte=95`).

**Página de gênero** (`/categorias/filme/28-acao`): hero do gênero + chips “Filmes | Séries” (quando o gênero existir nos dois) + grade infinita.

Mapeamento de gêneros que diferem entre filme e série no TMDB (ex.: “Ação” = 28 em filme e 10759 “Action & Adventure” em série): manter uma tabela `genreMap.ts` para a página de categoria unificada.

### 6.4 Busca (`/busca?q=`)

- Campo com debounce de 300 ms, mínimo 2 caracteres.
- `/search/multi`, descartando `media_type: "person"` (ou, opcional, mostrando a pessoa e seus títulos via `known_for`).
- Resultado em grade de pôsteres; separação opcional “Séries” e “Filmes”.
- Sem termo: mostra **Buscas recentes** (localStorage, máx. 8) e **Em alta** como sugestões.
- Atalho: `/` foca a busca em qualquer página.

### 6.5 Minha lista (`/minha-lista`)

- Grade de pôsteres em ordem de adição (mais recente primeiro), com filtro “Tudo | Filmes | Séries”.
- Dados vêm do snapshot salvo (seção 10.4), então a página abre sem nenhuma chamada à API.

### 6.6 Detalhes (`/titulo/:tipo/:id`)

Conforme 3.5. O botão principal muda de acordo com o estado salvo:

| Estado | Rótulo | Destino |
|---|---|---|
| Tem fonte, nunca assistido | **Assistir** | player do início (série: T1:E1) |
| Tem fonte, em andamento | **Continuar** (filme) / **Continuar T2:E5** (série) | posição salva |
| Filme concluído | **Assistir de novo** | início |
| Série com episódio concluído | **Assistir T2:E6** | próximo episódio |
| Sem fonte | **Trailer** como principal + bloco “Onde assistir” | modal do YouTube |

---

## 7. Fontes de vídeo

O TMDB não fornece vídeos de filmes, só metadados e trailers. A Exuflix separa os dois mundos com um **registro de fontes**: só títulos com fonte cadastrada ganham botão “Assistir”.

**Fontes válidas:** vídeos que você produziu ou licenciou, obras em domínio público, filmes com licença aberta (Creative Commons) e streams de teste. Hospedagem: seu próprio storage/CDN (Cloudflare R2/Stream, Bunny Stream, Mux) ou arquivos de domínio público do Internet Archive.

**Para desenvolver:** os filmes abertos da Blender Foundation (*Big Buck Bunny*, *Sintel*, *Tears of Steel*, licença CC-BY) existem no TMDB e têm arquivos públicos; servem para testar todo o fluxo de filme. Para série, monte uma “série de teste” no registro com vários episódios apontando para curtas abertos. Stream HLS público de teste: `https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8`.

### 7.1 Formato do `public/sources.json`

```json
{
  "version": 1,
  "movies": {
    "10378": {
      "kind": "hls",
      "url": "https://cdn.seudominio.com/filmes/big-buck-bunny/master.m3u8",
      "subtitles": [
        { "lang": "pt-BR", "label": "Português", "url": "https://cdn.seudominio.com/filmes/big-buck-bunny/pt.vtt" }
      ],
      "markers": { "creditsStart": 560 }
    }
  },
  "series": {
    "123456": {
      "seasons": {
        "1": {
          "1": { "kind": "mp4", "url": "https://cdn.seudominio.com/series/minha-serie/s01e01.mp4", "markers": { "introStart": 5, "introEnd": 62, "creditsStart": 1290 } },
          "2": { "kind": "mp4", "url": "https://cdn.seudominio.com/series/minha-serie/s01e02.mp4" }
        }
      }
    }
  }
}
```

- Chaves são IDs do TMDB (confira cada ID no themoviedb.org antes de cadastrar).
- `kind`: `"hls"` (`.m3u8`) ou `"mp4"`.
- `markers` (opcional, em segundos): `introStart`/`introEnd` habilitam “Pular abertura”; `creditsStart` antecipa o card de próximo episódio e a marcação de concluído.

### 7.2 Resolvedor

```ts
// src/player/sources.ts
export interface VideoSource {
  kind: "hls" | "mp4";
  url: string;
  subtitles?: { lang: string; label: string; url: string }[];
  markers?: { introStart?: number; introEnd?: number; creditsStart?: number };
}

let registry: Promise<any> | null = null;
const load = () => (registry ??= fetch("/sources.json").then(r => r.json()));

export async function resolveMovie(id: number): Promise<VideoSource | null> {
  return (await load()).movies?.[id] ?? null;
}

export async function resolveEpisode(id: number, s: number, e: number): Promise<VideoSource | null> {
  return (await load()).series?.[id]?.seasons?.[s]?.[e] ?? null;
}

export async function hasSource(type: "movie" | "tv", id: number) {
  const r = await load();
  return type === "movie" ? !!r.movies?.[id] : !!r.series?.[id];
}
```

Quando o catálogo crescer, troque o JSON estático por um endpoint (`GET /api/sources/movie/10378`) sem mudar a interface.

---

## 8. Player de filme

Rota: `/assistir/filme/:id`. Tela cheia da janela, fundo `#000`, sem navbar.

### 8.1 Layout

```
┌─────────────────────────────────────────────────────────┐
│ ←  Big Buck Bunny                                   ⚑   │  topo: voltar + título
│                                                         │
│                      [ vídeo ]                          │
│                                                         │
│            ⟲10        ▶︎ (central, 72px)       10⟳       │  só ao pausar / toque mobile
│                                                         │
│ ━━━━━━━━━━━━━━━●───────────────────────  1:02:13 / 1:48:00
│ ▶︎  ⟲10  10⟳  🔊━━━         CC   1x   ⧉PiP   ⛶          │  barra de controles
└─────────────────────────────────────────────────────────┘
```

- Overlay `--scrim-player` aparece junto com os controles.
- Barra de progresso: 4 px, cresce para 8 px no hover; trilha `rgba(255,255,255,.25)`, buffer `rgba(255,255,255,.45)`, progresso `--exu-red-500`, bolinha 14 px vermelha. Hover mostra o tempo em tooltip.
- Mobile: toque único mostra/esconde controles; toque duplo na metade esquerda/direita = −10 s/+10 s (com animação de ondas).

### 8.2 Funcionalidades

| Recurso | Implementação |
|---|---|
| Play/pause | `video.play()` / `video.pause()`; clique no vídeo alterna |
| Pular ±10 s | `video.currentTime += 10` |
| Volume / mudo | `video.volume`, `video.muted`; salvos em preferências |
| Velocidade | 0.5, 0.75, 1, 1.25, 1.5, 2 → `video.playbackRate` |
| Legendas | `<track kind="subtitles" src=... srclang=...>`; ativar via `textTracks[i].mode = "showing"`; idioma salvo |
| Áudio (HLS multi-áudio) | `hls.audioTracks` / `hls.audioTrack = i` |
| Qualidade (HLS) | Automático por padrão; menu com `hls.levels` / `hls.currentLevel` |
| Tela cheia | `container.requestFullscreen()` (no container, para manter os controles customizados) |
| Picture-in-Picture | `video.requestPictureInPicture()` quando `document.pictureInPictureEnabled` |
| Retomar | Diálogo “Continuar de 42:13 / Começar do início” (seção 10.5) |
| Erro | Overlay com “Tentar de novo” (recria o hls) e “Voltar” |
| Buffering | Spinner com o símbolo “X” girando, após 400 ms de `waiting` |
| Media Session | `navigator.mediaSession.metadata` com título e pôster, ações play/pause/seek (controles do sistema e fones) |

### 8.3 Atalhos de teclado

| Tecla | Ação |
|---|---|
| Espaço / K | Play/pause |
| ← / → | −10 s / +10 s |
| J / L | −10 s / +10 s |
| ↑ / ↓ | Volume ±10% |
| M | Mudo |
| F | Tela cheia |
| C | Liga/desliga legenda |
| P | Picture-in-Picture |
| 0–9 | Pula para 0%–90% |
| Esc | Sai da tela cheia; segundo Esc volta para detalhes |
| N | (série) Próximo episódio |
| S | (série) Pular abertura, quando o botão estiver visível |

### 8.4 Núcleo `VideoPlayer`

Componente compartilhado entre filme e série.

```tsx
// src/player/VideoPlayer.tsx
import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import type { VideoSource } from "./sources";
import { usePreferences } from "../storage/preferences";

interface Props {
  source: VideoSource;
  startAt?: number;              // segundos, vindo do progresso salvo
  autoPlay?: boolean;
  onTime?: (t: number, d: number) => void;
  onEnded?: () => void;
  onPause?: (t: number, d: number) => void;
}

export const VideoPlayer = forwardRef<HTMLVideoElement, Props>(function VideoPlayer(
  { source, startAt = 0, autoPlay = true, onTime, onEnded, onPause }, ref
) {
  const videoRef = useRef<HTMLVideoElement>(null);
  useImperativeHandle(ref, () => videoRef.current!);
  const [prefs] = usePreferences();
  const [error, setError] = useState<string | null>(null);

  // Carrega a fonte (HLS nativo no Safari, hls.js no resto)
  useEffect(() => {
    const video = videoRef.current!;
    let hls: import("hls.js").default | null = null;
    let cancelled = false;
    setError(null);

    (async () => {
      if (source.kind === "hls" && !video.canPlayType("application/vnd.apple.mpegurl")) {
        const { default: Hls } = await import("hls.js");
        if (cancelled) return;
        if (!Hls.isSupported()) return setError("Seu navegador não suporta este vídeo.");
        hls = new Hls({ startPosition: startAt > 0 ? startAt : -1 });
        hls.on(Hls.Events.ERROR, (_e, data) => {
          if (data.fatal) setError("A conexão tropeçou. Tentar de novo?");
        });
        hls.loadSource(source.url);
        hls.attachMedia(video);
      } else {
        video.src = source.url;
        const seek = () => { if (startAt > 0) video.currentTime = startAt; };
        video.addEventListener("loadedmetadata", seek, { once: true });
      }
      video.volume = prefs.volume;
      video.muted = prefs.muted;
      video.playbackRate = prefs.playbackRate;
      if (autoPlay) video.play().catch(() => { /* autoplay bloqueado: mostra botão play */ });
    })();

    return () => { cancelled = true; hls?.destroy(); video.removeAttribute("src"); video.load(); };
  }, [source.url]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="player-stage">
      <video
        ref={videoRef}
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={e => onTime?.(e.currentTarget.currentTime, e.currentTarget.duration)}
        onPause={e => onPause?.(e.currentTarget.currentTime, e.currentTarget.duration)}
        onEnded={onEnded}
        onError={() => setError("Não foi possível carregar o vídeo.")}
      >
        {source.subtitles?.map(s => (
          <track key={s.lang} kind="subtitles" src={s.url} srcLang={s.lang} label={s.label}
                 default={s.lang === prefs.subtitleLang} />
        ))}
      </video>
      {error && <PlayerError message={error} onRetry={() => location.reload()} />}
      {/* <Controls videoRef={videoRef} ... /> */}
    </div>
  );
});
```

### 8.5 Página do player de filme

```tsx
// src/player/MoviePlayerPage.tsx (resumo)
export default function MoviePlayerPage() {
  const id = Number(useParams().id);
  const { data: title } = useTitle("movie", id);
  const { data: source } = useQuery({ queryKey: ["src", "movie", id], queryFn: () => resolveMovie(id) });
  const saved = useMovieProgress(id);           // seção 10
  const [startAt, setStartAt] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const tracker = useProgressTracker({
    kind: "movie",
    id,
    meta: title && { title: title.title, poster: title.poster, backdrop: title.backdrop },
    creditsStart: source?.markers?.creditsStart,
  });

  if (source === null) return <Navigate to={`/titulo/filme/${id}`} replace />;
  if (!source || !title) return <PlayerSkeleton />;

  // Pergunta se deve retomar antes de montar o player
  if (startAt === null && saved && shouldOfferResume(saved)) {
    return <ResumeDialog position={saved.position} backdrop={title.backdrop}
                         onResume={() => setStartAt(saved.position)} onRestart={() => setStartAt(0)} />;
  }

  return (
    <VideoPlayer
      ref={videoRef}
      source={source}
      startAt={startAt ?? 0}
      onTime={tracker.onTime}
      onPause={tracker.onPause}
      onEnded={tracker.onEnded}
    />
  );
}
```

Ao terminar o filme: overlay com **“Assistir de novo”** e 3 recomendações (`title.recommendations` que tenham fonte).

---

## 9. Player de série

Rota: `/assistir/serie/:id/:temporada/:episodio`. Usa o mesmo `VideoPlayer` e adiciona navegação de episódios.

### 9.1 Diferenças em relação ao filme

- Topo: “**Nome da Série** · T2:E5 · Nome do episódio”.
- Barra de controles ganha: **⏭ Próximo episódio** e **☰ Episódios** (abre o painel).
- Botão **Pular abertura** (pílula branca, canto inferior direito) visível entre `introStart` e `introEnd`, some sozinho 5 s depois de aparecer se não for usado.
- **Card de próximo episódio** nos créditos.
- Troca de episódio **não recarrega a página**: muda a URL com `navigate(..., { replace: true })` e só a fonte do `VideoPlayer` muda.

### 9.2 Próximo episódio

```ts
// src/player/nextEpisode.ts
export function nextEpisode(
  seasons: { number: number; episodeCount: number }[],
  s: number, e: number
): { season: number; episode: number } | null {
  const current = seasons.find(x => x.number === s);
  if (current && e < current.episodeCount) return { season: s, episode: e + 1 };
  const next = seasons.filter(x => x.number > s && x.episodeCount > 0).sort((a, b) => a.number - b.number)[0];
  return next ? { season: next.number, episode: 1 } : null;
}
```

Só avança para episódios que tenham fonte em `sources.json`; se o próximo não tiver, o card mostra “Próximo episódio ainda não disponível”.

**Card de próximo episódio** (canto inferior direito, `--surface-2`, 360 px):
- Aparece em `markers.creditsStart` ou, sem marcador, nos últimos **30 s**.
- Mostra still do próximo episódio, “T2:E6 · Nome”, anel de contagem regressiva de **10 s** em vermelho, botões **Assistir agora** e **Ver créditos**.
- Contagem só roda se `prefs.autoplayNext` for `true`; se o usuário clicar em “Ver créditos”, cancela.
- **Proteção contra maratona esquecida:** após 3 episódios seguidos em autoplay sem nenhuma interação, pausa e pergunta “Você ainda está assistindo?”.

### 9.3 Painel de episódios

- Drawer lateral direito (desktop, 420 px) ou bottom sheet (mobile, 80vh), `--surface-2`, `--radius-lg`.
- Topo: seletor de temporada (dropdown “Temporada 2 · 10 episódios”).
- Cada episódio: still 16:9 (w300) com barra de progresso salva · número grande (Unbounded) · título · duração · sinopse em 2 linhas. Episódio atual com borda `--exu-red-500` e rótulo “Assistindo”. Episódios concluídos mostram ✓ no canto do still.
- Episódios sem fonte aparecem com opacidade 50% e rótulo “Em breve”.
- Abre já rolado até o episódio atual (`scrollIntoView({ block: "center" })`).
- Dados via `useSeason(id, temporada)`, com prefetch da temporada seguinte quando o usuário está no último episódio.

### 9.4 Página do player de série (resumo)

```tsx
export default function SeriesPlayerPage() {
  const { id: idStr, temporada, episodio } = useParams();
  const id = Number(idStr), s = Number(temporada), e = Number(episodio);
  const navigate = useNavigate();
  const { data: show } = useTitle("tv", id);
  const { data: episodes } = useSeason(id, s);
  const { data: source } = useQuery({ queryKey: ["src", "tv", id, s, e], queryFn: () => resolveEpisode(id, s, e) });
  const saved = useEpisodeProgress(id, s, e);
  const ep = episodes?.find(x => x.episode === e);

  const tracker = useProgressTracker({
    kind: "episode",
    id, season: s, episode: e,
    meta: show && { title: show.title, poster: show.poster, backdrop: show.backdrop,
                    episodeTitle: ep?.title, still: ep?.still },
    creditsStart: source?.markers?.creditsStart,
  });

  const goTo = (season: number, episode: number) =>
    navigate(`/assistir/serie/${id}/${season}/${episode}`, { replace: true });

  const next = show?.seasons ? nextEpisode(show.seasons, s, e) : null;

  // ...mesma lógica de ResumeDialog do filme...
  return (
    <>
      <VideoPlayer key={`${s}-${e}`} source={source!} startAt={/* posição */ 0}
                   onTime={tracker.onTime} onPause={tracker.onPause}
                   onEnded={() => { tracker.onEnded(); if (next) goTo(next.season, next.episode); }} />
      {/* <SkipIntroButton markers={source.markers} /> */}
      {/* <NextEpisodeCard next={next} ... /> */}
      {/* <EpisodePanel seasons={show.seasons} current={{ s, e }} onPick={goTo} /> */}
    </>
  );
}
```

`key={`${s}-${e}`}` força o `VideoPlayer` a reiniciar limpo a cada episódio.

### 9.5 Entrada pela rota curta

`/assistir/serie/:id` lê o progresso da série e redireciona:

1. Tem `current` salvo e o episódio atual não está concluído → vai para ele.
2. Episódio atual concluído → vai para o próximo (`nextEpisode`).
3. Nada salvo → T1:E1 (primeira temporada > 0 que tenha fonte).

---

## 10. Persistência no localStorage

### 10.1 Chaves

Todas com namespace e versão, para poder migrar no futuro.

| Chave | Conteúdo |
|---|---|
| `exuflix:v1:progress` | Progresso de filmes e séries |
| `exuflix:v1:watchlist` | Minha lista |
| `exuflix:v1:prefs` | Volume, mudo, velocidade, legenda, autoplay |
| `exuflix:v1:searches` | Buscas recentes |
| `exuflix:v1:hidden` | Itens removidos de “Continuar assistindo” |
| `exuflix:schema` | Número da versão do schema (para migrações) |

### 10.2 Schema

```ts
// src/storage/progress.ts (tipos)
export interface MetaSnapshot {          // permite renderizar cards sem chamar a API
  title: string;
  poster: string | null;
  backdrop: string | null;
}

export interface MovieProgress {
  type: "movie";
  id: number;
  position: number;      // segundos
  duration: number;      // segundos
  completed: boolean;
  updatedAt: number;     // Date.now()
  meta: MetaSnapshot;
}

export interface EpisodeProgress {
  position: number;
  duration: number;
  completed: boolean;
  updatedAt: number;
  title?: string;        // nome do episódio
  still?: string | null;
}

export interface SeriesProgress {
  type: "tv";
  id: number;
  current: { season: number; episode: number };   // último episódio tocado
  episodes: Record<string, EpisodeProgress>;      // chave "s2e5"
  updatedAt: number;
  meta: MetaSnapshot;
}

export interface ProgressStore {
  items: Record<string, MovieProgress | SeriesProgress>; // chave "movie:10378" | "tv:1399"
}
```

**Exemplo real do que fica salvo**

```json
{
  "items": {
    "movie:10378": {
      "type": "movie",
      "id": 10378,
      "position": 312.4,
      "duration": 596.5,
      "completed": false,
      "updatedAt": 1760920000000,
      "meta": { "title": "Big Buck Bunny", "poster": "/abc.jpg", "backdrop": "/def.jpg" }
    },
    "tv:123456": {
      "type": "tv",
      "id": 123456,
      "current": { "season": 1, "episode": 3 },
      "episodes": {
        "s1e1": { "position": 1310, "duration": 1320, "completed": true, "updatedAt": 1760830000000 },
        "s1e2": { "position": 1298, "duration": 1305, "completed": true, "updatedAt": 1760833000000 },
        "s1e3": { "position": 842.7, "duration": 1340, "completed": false, "updatedAt": 1760920100000,
                  "title": "O Cruzamento", "still": "/still3.jpg" }
      },
      "updatedAt": 1760920100000,
      "meta": { "title": "Minha Série", "poster": "/p.jpg", "backdrop": "/b.jpg" }
    }
  }
}
```

### 10.3 Camada de armazenamento reativa

Um módulo único com leitura segura, escrita segura e assinatura de mudanças, ligado ao React por `useSyncExternalStore`. Sincroniza a mesma aba (evento customizado) e outras abas (evento `storage`).

```ts
// src/storage/store.ts
const NS = "exuflix:v1:";
const EVENT = "exuflix:storage";
const cache = new Map<string, unknown>();

export function read<T>(key: string, fallback: T): T {
  if (cache.has(key)) return cache.get(key) as T;
  let value = fallback;
  try {
    const raw = localStorage.getItem(NS + key);
    if (raw) value = JSON.parse(raw) as T;
  } catch { /* storage bloqueado ou JSON corrompido: usa fallback */ }
  cache.set(key, value);
  return value;
}

export function write<T>(key: string, value: T) {
  cache.set(key, value);                       // sempre atualiza a memória (funciona mesmo sem storage)
  try {
    localStorage.setItem(NS + key, JSON.stringify(value));
  } catch (err) {
    if ((err as DOMException)?.name === "QuotaExceededError") pruneAndRetry(key, value);
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: key }));
}

export function update<T>(key: string, fallback: T, fn: (prev: T) => T) {
  write(key, fn(read(key, fallback)));
}

export function subscribe(key: string, cb: () => void) {
  const local = (e: Event) => { if ((e as CustomEvent).detail === key) cb(); };
  const cross = (e: StorageEvent) => {
    if (e.key === NS + key) { cache.delete(key); cb(); }   // outra aba gravou: invalida cache
  };
  window.addEventListener(EVENT, local);
  window.addEventListener("storage", cross);
  return () => { window.removeEventListener(EVENT, local); window.removeEventListener("storage", cross); };
}

function pruneAndRetry(key: string, value: unknown) {
  // Remove os itens de progresso mais antigos e tenta de novo
  if (key === "progress") {
    const store = value as { items: Record<string, { updatedAt: number }> };
    const entries = Object.entries(store.items).sort((a, b) => b[1].updatedAt - a[1].updatedAt);
    store.items = Object.fromEntries(entries.slice(0, Math.floor(entries.length * 0.7)));
    try { localStorage.setItem(NS + key, JSON.stringify(store)); } catch { /* desiste em silêncio */ }
  }
}
```

```ts
// src/storage/useStored.ts
import { useSyncExternalStore, useCallback } from "react";
import { read, write, subscribe } from "./store";

export function useStored<T>(key: string, fallback: T) {
  const value = useSyncExternalStore(
    cb => subscribe(key, cb),
    () => read(key, fallback),
    () => fallback,
  );
  const set = useCallback((v: T | ((p: T) => T)) =>
    write(key, typeof v === "function" ? (v as (p: T) => T)(read(key, fallback)) : v), [key]);
  return [value, set] as const;
}
```

> Importante: `read` retorna sempre a mesma referência do cache até haver escrita, o que o `useSyncExternalStore` exige para não entrar em loop.

### 10.4 Minha lista e preferências

```ts
// src/storage/watchlist.ts
export interface WatchlistItem { key: string; type: "movie" | "tv"; id: number; addedAt: number; meta: MetaSnapshot }

export const useWatchlist = () => {
  const [list, setList] = useStored<WatchlistItem[]>("watchlist", []);
  const has = (key: string) => list.some(i => i.key === key);
  const toggle = (item: Omit<WatchlistItem, "addedAt">) =>
    setList(prev => prev.some(i => i.key === item.key)
      ? prev.filter(i => i.key !== item.key)
      : [{ ...item, addedAt: Date.now() }, ...prev].slice(0, 500));
  return { list, has, toggle };
};

// src/storage/preferences.ts
export interface Prefs {
  volume: number;            // 0–1
  muted: boolean;
  playbackRate: number;
  subtitleLang: string | null; // "pt-BR" | null (desligada)
  audioLang: string | null;
  autoplayNext: boolean;
  autoplayPreviews: boolean;
}
export const DEFAULT_PREFS: Prefs = {
  volume: 1, muted: false, playbackRate: 1, subtitleLang: null, audioLang: null,
  autoplayNext: true, autoplayPreviews: true,
};
export const usePreferences = () => useStored<Prefs>("prefs", DEFAULT_PREFS);
```

Volume é salvo no evento `volumechange` do vídeo (com debounce de 300 ms). Velocidade **não** é reaproveitada entre títulos diferentes se você preferir; a escolha padrão aqui é manter.

### 10.5 Rastreador de progresso (quando e como salvar)

**Quando gravar**

| Momento | Por quê |
|---|---|
| A cada **5 s** durante `timeupdate` (throttle) | Garante pouca perda se o navegador fechar |
| `pause` | Ponto exato onde a pessoa parou |
| `seeked` | Pulos manuais |
| `ended` | Marca como concluído |
| `visibilitychange` (aba oculta) e `pagehide` | Fechar aba, trocar de app no celular |
| Desmontagem do componente (sair do player) | Botão voltar |

`beforeunload` não é confiável no mobile; `pagehide` + `visibilitychange` cobrem os casos. Como `localStorage` é síncrono, a escrita nesses eventos sempre conclui.

**Regras**

- **Não salva** antes de 10 s de reprodução (evita poluir “Continuar assistindo” com cliques acidentais).
- **Concluído** quando qualquer um for verdadeiro:
  - evento `ended`;
  - passou de `markers.creditsStart`;
  - `position / duration ≥ 0.95`;
  - faltam ≤ **180 s** (filme) ou ≤ **60 s** (episódio).
- **Oferecer retomar** quando `position > 30 s` e não concluído.
- Ao retomar, volta **5 s** antes do ponto salvo, para dar contexto.

```ts
// src/hooks/useProgressTracker.ts
import { useEffect, useRef, useCallback } from "react";
import { update } from "../storage/store";
import type { ProgressStore, MovieProgress, SeriesProgress } from "../storage/progress";

type Target =
  | { kind: "movie"; id: number; meta?: { title: string; poster: string | null; backdrop: string | null }; creditsStart?: number }
  | { kind: "episode"; id: number; season: number; episode: number;
      meta?: { title: string; poster: string | null; backdrop: string | null; episodeTitle?: string; still?: string | null };
      creditsStart?: number };

const EMPTY: ProgressStore = { items: {} };
const SAVE_EVERY_MS = 5000;
const MIN_WATCHED = 10;

export function isCompleted(pos: number, dur: number, kind: Target["kind"], creditsStart?: number) {
  if (!dur || !isFinite(dur)) return false;
  if (creditsStart && pos >= creditsStart) return true;
  if (pos / dur >= 0.95) return true;
  return dur - pos <= (kind === "movie" ? 180 : 60);
}

export function useProgressTracker(target: Target) {
  const last = useRef({ pos: 0, dur: 0, savedAt: 0 });
  const targetRef = useRef(target);
  targetRef.current = target;

  const save = useCallback((force = false, ended = false) => {
    const t = targetRef.current;
    const { pos, dur } = last.current;
    if (!t.meta || !dur || pos < MIN_WATCHED) return;
    if (!force && Date.now() - last.current.savedAt < SAVE_EVERY_MS) return;
    last.current.savedAt = Date.now();

    const completed = ended || isCompleted(pos, dur, t.kind, t.creditsStart);
    const now = Date.now();

    update<ProgressStore>("progress", EMPTY, store => {
      const items = { ...store.items };
      if (t.kind === "movie") {
        const entry: MovieProgress = {
          type: "movie", id: t.id, position: completed ? 0 : pos, duration: dur,
          completed, updatedAt: now, meta: t.meta!,
        };
        items[`movie:${t.id}`] = entry;
      } else {
        const key = `tv:${t.id}`;
        const prev = items[key] as SeriesProgress | undefined;
        const epKey = `s${t.season}e${t.episode}`;
        items[key] = {
          type: "tv",
          id: t.id,
          current: { season: t.season, episode: t.episode },
          episodes: {
            ...(prev?.episodes ?? {}),
            [epKey]: {
              position: completed ? dur : pos, duration: dur, completed, updatedAt: now,
              title: t.meta!.episodeTitle, still: t.meta!.still ?? null,
            },
          },
          updatedAt: now,
          meta: { title: t.meta!.title, poster: t.meta!.poster, backdrop: t.meta!.backdrop },
        };
      }
      return { items: pruneOld(items) };
    });
  }, []);

  // Salva ao esconder a aba / fechar a página / sair do player
  useEffect(() => {
    const flush = () => save(true);
    const onVis = () => { if (document.visibilityState === "hidden") flush(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pagehide", flush);
    return () => {
      flush();
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pagehide", flush);
    };
  }, [save]);

  return {
    onTime: (pos: number, dur: number) => { last.current.pos = pos; last.current.dur = dur; save(false); },
    onPause: (pos: number, dur: number) => { last.current.pos = pos; last.current.dur = dur; save(true); },
    onSeeked: (pos: number, dur: number) => { last.current.pos = pos; last.current.dur = dur; save(true); },
    onEnded: () => { last.current.pos = last.current.dur; save(true, true); },
  };
}

/** Mantém no máximo 300 títulos, descartando os mais antigos */
function pruneOld(items: ProgressStore["items"]) {
  const entries = Object.entries(items);
  if (entries.length <= 300) return items;
  return Object.fromEntries(entries.sort((a, b) => b[1].updatedAt - a[1].updatedAt).slice(0, 300));
}
```

Detalhe do filme concluído: a posição volta para 0 e `completed: true`; assim “Assistir de novo” começa do início e o título sai de “Continuar assistindo”.

**Leitura para o player**

```ts
export const shouldOfferResume = (p: { position: number; completed: boolean }) =>
  !p.completed && p.position > 30;

export const resumePoint = (p: { position: number }) => Math.max(0, p.position - 5);
```

**Diálogo de retomar:** backdrop desfocado, título, barra mostrando o progresso, botões **Continuar de 42:13** (primário, foco inicial) e **Começar do início**. Se nada for escolhido em 8 s, continua de onde parou.

### 10.6 Linha “Continuar assistindo”

Derivada do `progress`, sem chamar a API:

```ts
// src/storage/continueWatching.ts
export interface ContinueItem {
  key: string;
  type: "movie" | "tv";
  id: number;
  title: string;
  backdrop: string | null;
  subtitle: string;          // "Faltam 38 min" | "T1:E3 · O Cruzamento" | "Próximo: T1:E4"
  progress: number;          // 0–1 para a barra
  href: string;              // rota do player
  updatedAt: number;
}

export function buildContinueWatching(
  store: ProgressStore,
  hidden: string[],
  seasonsOf: (tvId: number) => { number: number; episodeCount: number }[] | undefined,
): ContinueItem[] {
  const out: ContinueItem[] = [];

  for (const item of Object.values(store.items)) {
    const key = `${item.type}:${item.id}`;
    if (hidden.includes(key)) continue;

    if (item.type === "movie") {
      if (item.completed) continue;
      out.push({
        key, type: "movie", id: item.id, title: item.meta.title, backdrop: item.meta.backdrop,
        subtitle: `Faltam ${Math.ceil((item.duration - item.position) / 60)} min`,
        progress: item.position / item.duration,
        href: `/assistir/filme/${item.id}`,
        updatedAt: item.updatedAt,
      });
      continue;
    }

    const { season, episode } = item.current;
    const ep = item.episodes[`s${season}e${episode}`];
    if (ep && !ep.completed) {
      out.push({
        key, type: "tv", id: item.id, title: item.meta.title, backdrop: ep.still ?? item.meta.backdrop,
        subtitle: `T${season}:E${episode}${ep.title ? ` · ${ep.title}` : ""}`,
        progress: ep.position / ep.duration,
        href: `/assistir/serie/${item.id}/${season}/${episode}`,
        updatedAt: item.updatedAt,
      });
    } else {
      const seasons = seasonsOf(item.id);
      const next = seasons ? nextEpisode(seasons, season, episode) : null;
      if (!next) continue; // terminou a série
      out.push({
        key, type: "tv", id: item.id, title: item.meta.title, backdrop: item.meta.backdrop,
        subtitle: `Próximo: T${next.season}:E${next.episode}`,
        progress: 0,
        href: `/assistir/serie/${item.id}/${next.season}/${next.episode}`,
        updatedAt: item.updatedAt,
      });
    }
  }
  return out.sort((a, b) => b.updatedAt - a.updatedAt).slice(0, 20);
}
```

`seasonsOf` lê do cache do TanStack Query (`queryClient.getQueryData(["title", "tv", id])`); se ainda não houver, a linha faz um prefetch em segundo plano dos detalhes dessas séries.

O “×” do card adiciona a chave em `exuflix:v1:hidden`. Se a pessoa voltar a assistir aquele título, a chave sai de `hidden` (o tracker remove ao salvar).

### 10.7 Uso no restante da interface

- **Card de título:** selo “Novo episódio” quando `air_date` do último episódio da série é mais recente que `updatedAt` do progresso salvo.
- **Lista de episódios:** barra de progresso por episódio e ✓ para concluídos, lidos de `episodes["sXeY"]`.
- **Botão principal dos detalhes:** tabela da seção 6.6.
- **Sincronia entre abas:** se a pessoa assiste em uma aba, a home aberta em outra atualiza sozinha (evento `storage`).

### 10.8 Migrações e limpeza

```ts
// src/storage/migrate.ts
const CURRENT = 1;
export function migrate() {
  try {
    const v = Number(localStorage.getItem("exuflix:schema") ?? 0);
    if (v === CURRENT) return;
    // if (v < 2) { ...transformar exuflix:v1:* em exuflix:v2:* ... }
    localStorage.setItem("exuflix:schema", String(CURRENT));
  } catch { /* storage indisponível: app funciona só em memória */ }
}
```

Chamado uma vez no `main.tsx` antes de renderizar. Em navegação privada ou com storage bloqueado, tudo funciona em memória (o `cache` do `store.ts`) e simplesmente não persiste.

Opcional em configurações: **“Limpar histórico”** e **“Exportar/Importar meus dados”** (baixa/carrega um JSON com as chaves `exuflix:v1:*`), útil enquanto não há login.

---

## 11. Performance, acessibilidade e SEO

**Performance**

- Imagens: sempre `srcset` + `sizes`, `loading="lazy"` e `decoding="async"` fora do hero; hero com `fetchpriority="high"`.
- `<link rel="preconnect" href="https://image.tmdb.org">` no `index.html`.
- Linhas da home sob demanda (IntersectionObserver) e prefetch de detalhes no hover/foco do card (após 300 ms).
- Grids infinitos virtualizados.
- Players e hls.js em chunks separados.
- TanStack Query com `staleTime` (listas 1 h, detalhes 6 h, gêneros 24 h) e persistência opcional do cache em `sessionStorage` para voltar à home instantaneamente.
- Meta: LCP < 2.5 s em 4G, CLS < 0.05 (todos os cards com `aspect-ratio` fixo).

**Acessibilidade**

- Navegação completa por teclado (rows com setas, modais com focus trap, Esc fecha).
- `aria-label` em todos os botões só com ícone (“Adicionar à Minha lista”, “Pular abertura”).
- Barra de progresso do player com `role="slider"`, `aria-valuemin/max/now` e `aria-valuetext="42 minutos de 1 hora e 48"`.
- Legendas com estilo configurável (tamanho e fundo) via `::cue`.
- Respeitar `prefers-reduced-motion` (sem hero automático, sem preview de trailer).

**SEO / compartilhamento**

- SPA com títulos dinâmicos (`document.title = "Nome do Filme · Exuflix"`).
- Para links compartilháveis com prévia (Open Graph), considerar prerender das páginas de detalhes ou migrar para um framework com SSR (Next.js/Remix) no futuro.
- PWA: `manifest.webmanifest` com o símbolo “X”, `theme_color: #0B0A0A`, `display: standalone`.

---

## 12. Atribuições e regras de conteúdo

- **TMDB:** obrigatório exibir o logo do TMDB e o aviso “Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.” (rodapé e página “Sobre”). A API é gratuita para uso não comercial; uso comercial exige acordo com o TMDB.
- **Trailers:** reproduzidos pelo player oficial do YouTube (`youtube-nocookie.com/embed/{key}`), sem baixar ou re-hospedar.
- **Vídeos completos:** somente de fontes no `sources.json` com direito de exibição (produção própria, licenciada, domínio público ou licença aberta, respeitando a atribuição exigida, como CC-BY).
- **Onde assistir:** dados de provedores vêm do TMDB (fonte JustWatch); exibir “Dados de disponibilidade: JustWatch” junto ao bloco.

---

## 13. Roadmap

| Fase | Entregas |
|---|---|
| **1. Fundação** | Tokens, tipografia, navbar, cliente TMDB + proxy, normalizador, home com 5 linhas |
| **2. Catálogo** | Abas Filmes/Séries com filtros, Categorias, Busca, modal de detalhes, Minha lista |
| **3. Players** | `VideoPlayer`, player de filme, player de série com painel e próximo episódio, `sources.json` com títulos abertos de teste |
| **4. Memória** | Tracker de progresso, Continuar assistindo, retomar, preferências, sincronia entre abas |
| **5. Polimento** | Skeletons, animações, PWA, atalhos, acessibilidade, testes (Vitest para `normalize`, `nextEpisode`, `isCompleted`, `buildContinueWatching`; Playwright para o fluxo home → play → retomar) |
| **6. Futuro** | Perfis e login (migrar `exuflix:v1:*` para o servidor no primeiro login), sincronização entre dispositivos, catálogo de fontes via API, painel admin para cadastrar fontes e marcadores de abertura/créditos |
