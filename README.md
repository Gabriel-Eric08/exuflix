# Exuflix

> Toda história passa por aqui.

Plataforma de streaming (catálogo + players) feita em React + TypeScript + Vite, com dados do TMDB e estado do usuário no `localStorage`. A especificação completa está em [`exuflix-spec.md`](./exuflix-spec.md).

## Rodando localmente

```bash
npm install
cp .env.example .env   # preencha TMDB_TOKEN com o Read Access Token (v4) do TMDB
npm run dev
```

O token nunca vai para o bundle: em desenvolvimento o proxy do Vite injeta o header `Authorization`; em produção a Vercel Function `api/tmdb.ts` faz o mesmo.

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
| `npm test` | Testes unitários (Vitest) |

---

Este produto usa a API do TMDB, mas não é endossado nem certificado pelo TMDB.
