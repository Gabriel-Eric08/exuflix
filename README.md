# Exuflix

> Toda história passa por aqui.

Plataforma de streaming (catálogo + players) feita em React + TypeScript + Vite, com dados do TMDB e estado do usuário no `localStorage`, sem login. A especificação completa está em [`exuflix-spec.md`](./exuflix-spec.md).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha TMDB_TOKEN com o Read Access Token (v4) do TMDB
npm run dev
```

O token nunca vai para o bundle: em desenvolvimento o proxy do Vite injeta o header `Authorization`; em produção a Vercel Function `api/tmdb.ts` faz o mesmo e adiciona cache de CDN (1 h).

## Deploy na Vercel

1. Importe o repositório na Vercel (framework detectado: Vite).
2. Em **Settings → Environment Variables**, crie `TMDB_TOKEN` com o seu token.
3. Deploy. O `vercel.json` já configura o proxy `/api/tmdb/*` e o fallback da SPA.

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Typecheck + build de produção |
| `npm run preview` | Serve o build localmente |
| `npm test` | Testes unitários (Vitest): normalizador, próximo episódio, conclusão, progresso, “Continuar assistindo” |
| `npm run test:e2e` | Testes de ponta a ponta (Playwright, usa o Chrome instalado; TMDB mockado): home, detalhes, minha lista, play → retomar |

## Fontes de vídeo

Só títulos cadastrados em [`public/sources.json`](./public/sources.json) ganham o botão **Assistir**; o resto mostra trailer e “Onde assistir”. O arquivo vem com os filmes abertos da Blender Foundation (CC BY): *Big Buck Bunny*, *Sintel*, *Tears of Steel* e *Elephants Dream*.

Para testar o player de série, troque a chave `_exemplo` em `series` pelo ID TMDB de uma série e aponte os episódios para vídeos com direito de exibição. Marcadores opcionais (em segundos): `introStart`/`introEnd` habilitam “Pular abertura” e `creditsStart` antecipa o card de próximo episódio.

## Estrutura

```
api/tmdb.ts          Vercel Function (proxy do TMDB)
public/sources.json  registro de fontes assistíveis
src/api/             cliente TMDB, endpoints, normalizador, imagens, gêneros
src/components/      Navbar, Hero, Row, TitleCard, DetailsView, Modal...
src/pages/           Início, Filmes/Séries, Categorias, Busca, Minha lista, Sobre
src/player/          VideoPlayer, controles, players de filme e série
src/storage/         localStorage reativo (progresso, lista, preferências)
e2e/                 testes Playwright
```

---

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
