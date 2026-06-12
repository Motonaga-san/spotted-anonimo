# Spotted 2.0

> Because true love never dies

Sistema de mensagens anônimas moderno e seguro.

## URL

**Produção:** https://spotted2.vercel.app

## Funcionalidades

- Posts anônimos com numeração automática
- Sistema de denúncias comunitárias
- Moderação automática (após 3 denúncias)
- Comentários em cada spotted
- Sistema de curtidas
- Editor de texto com **negrito** e *itálico*
- Estatísticas completas
- Detecção de conteúdo tóxico

## Tech Stack

- **Frontend:** Next.js 16 + TypeScript + Tailwind CSS
- **Backend:** Vercel Serverless Functions
- **Banco de dados:** Supabase (PostgreSQL)
- **Hospedagem:** Vercel

## Desenvolvimento

```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## Páginas

| Página | URL | Descrição |
|--------|-----|-----------|
| Home | `/` | Página principal |
| Admin | `/admin` | Painel de moderação |
| Stats | `/stats` | Estatísticas do site |

## Variáveis de Ambiente

Crie um arquivo `.env.local` com:

```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
ADMIN_PASSWORD=your-admin-password
```

## Deploy

O deploy é automático via GitHub → Vercel a cada push na branch `main`.

## Licença

MIT
