# Histórico de Conversas - Spotted Anônimo

## Sessão: 12/06/2026

### Contexto Inicial
- Usuário reportou erro ao enviar mensagens no spotted
- URL principal: https://spotted2.vercel.app
- Repositório: https://github.com/Motonaga-san/spotted-anonimo

### Problemas Encontrados e Corrigidos

#### 1. Erro 400 ao enviar mensagens
- **Causa**: Código tentava inserir colunas inexistentes no Supabase
- **Colunas removidas do código**:
  - `spotteds`: `author_ip`, `author_fingerprint`, `views`, `reports_count`
  - `page_views`: `country`
  - `comments`: `author_fingerprint`
- **Arquivos modificados**:
  - `src/components/SpottedForm.tsx`
  - `src/lib/supabase.ts`
  - `src/components/SpottedList.tsx`
  - `src/app/admin/page.tsx`

#### 2. Deploy não automático no Vercel
- **Causa**: Webhook GitHub-Vercel não configurado
- **Solução**: Deploy manual via CLI, configurado alias spotted2.vercel.app

#### 3. Exclusão de mensagens no admin não funcionava
- **Causa**: RLS (Row Level Security) bloqueando operações com anon key
- **Solução**: Criada API route `/api/admin` usando `SUPABASE_SERVICE_ROLE_KEY`
- **Variável adicionada no Vercel**: `SUPABASE_SERVICE_ROLE_KEY`

### Variáveis de Ambiente Necessárias
- `NEXT_PUBLIC_SUPABASE_URL`: https://bwptnrusiafwajoynchk.supabase.co
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- `SUPABASE_SERVICE_ROLE_KEY`: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (service_role)

### URLs do Projeto
- Principal: https://spotted2.vercel.app
- Alternativa: https://spotted-anonimo.vercel.app
- Admin: https://spotted2.vercel.app/admin
- Estatísticas: https://spotted2.vercel.app/stats

### Estrutura de Arquivos Principal
```
src/
├── app/
│   ├── page.tsx          # Página principal
│   ├── layout.tsx        # Layout global
│   ├── globals.css       # Estilos globais
│   ├── admin/page.tsx    # Painel admin
│   ├── stats/page.tsx    # Estatísticas
│   └── api/
│       ├── ip/route.ts   # API para capturar IP
│       └── admin/route.ts # API para operações admin
├── components/
│   ├── SpottedForm.tsx   # Formulário de envio
│   ├── SpottedList.tsx   # Lista de spotteds
│   └── ThemeToggle.tsx   # Toggle dark/light mode
├── lib/
│   ├── supabase.ts       # Cliente Supabase e tipos
│   └── moderacao.ts      # Filtro de palavras proibidas
└── context/
    └── ThemeContext.tsx  # Contexto de tema
```

### Erro Conhecido (Não Crítico)
- `page_views` retorna 400 por coluna `country` faltando
- Não afeta envio de mensagens, apenas tracking de visitas

### Incidente de Perda de Dados (12/06/2026)
- 7 spotteds foram excluídos acidentalmente ao testar botão "Reiniciar Contador"
- Plano gratuito do Supabase não tem backup
- Dados perdidos permanentemente

### Próximas Numerações
- Próximo spotted será #11 (sequência atual)
- Para resetar para #1: `ALTER SEQUENCE spotteds_number_seq RESTART WITH 1;`

### Contas/Serviços
- GitHub: Motonaga-san/spotted-anonimo
- Vercel: motonaga-s-projects/spotted-anonimo
- Supabase: bwptnrusiafwajoynchk
- Senha admin: admin123 (definida em código)

---

## Sessão: 12/06/2026 (parte 2) - Implementação de Analytics

### Objetivo
- Corrigir problemas de funcionalidade
- Implementar sistema de coleta de informações de uso para segurança e fins comerciais

### Alterações Realizadas

#### 1. Sistema de Analytics Implementado
- **Novos arquivos criados**:
  - `src/app/api/analytics/route.ts`: API para registrar eventos e buscar estatísticas
  - `supabase/analytics-setup.sql`: Script SQL para criar tabelas de analytics

- **Tabelas criadas no Supabase** (executar script SQL manualmente):
  - `analytics_events`: Registra todos os eventos (pageviews, likes, comments, etc.)
  - `user_sessions`: Rastreia sessões de usuários

- **Informações coletadas**:
  - IP do visitante
  - Fingerprint do navegador
  - País, cidade (via headers Vercel/Cloudflare)
  - User agent, dispositivo, navegador, OS
  - Página visitada, referrer
  - Ações: likes, comments, reports, shares

#### 2. Correções de Funcionalidade
- **Variáveis não utilizadas corrigidas**:
  - `fingerprint` e `visitorInfo` agora são usados ao criar spotteds e comments
  - Dados de IP e fingerprint são salvos para segurança

- **Race conditions corrigidas**:
  - useEffects agora usam `useCallback` para evitar re-renders desnecessários
  - Funções memoizadas corretamente

#### 3. Melhorias de Performance
- Links `<a>` substituídos por `<Link>` do Next.js para navegação interna
- Arquivos modificados: `page.tsx`, `admin/page.tsx`, `stats/page.tsx`

#### 4. Tracking de Eventos
- `trackPageView()`: Registra visualização de página
- `trackEvent()`: Registra evento genérico
- `trackClick()`: Registra clique em elemento
- `trackSpottedCreated()`: Registra criação de spotted
- `trackCommentCreated()`: Registra criação de comentário
- `trackLike()`: Registra like
- `trackReport()`: Registra denúncia

### Script SQL para Executar no Supabase
```sql
-- Execute em Supabase SQL Editor
-- Arquivo: supabase/analytics-setup.sql
```

### Métricas Disponíveis via API
- `GET /api/analytics?action=get-stats&days=7`
- Retorna: total de eventos, sessões, spotteds, comments, visitantes únicos, taxa de conversão, países mais frequentes

### Commit Realizado
- Hash: c206dd0
- Mensagem: "feat: Implementar sistema de analytics e tracking de uso"

### Próximos Passos Recomendados
1. Executar script SQL no Supabase SQL Editor
2. Verificar se tabelas de analytics foram criadas
3. Implementar painel de analytics no admin (mostrar gráficos)
4. Corrigir vulnerabilidades de segurança (XSS, senha hardcoded, RLS)

---

## Sessão: 12/06/2026 (parte 3) - Correções de Segurança

### Objetivo
- Corrigir vulnerabilidades de segurança críticas identificadas

### Alterações Realizadas

#### 1. XSS Corrigido
- **Problema**: `dangerouslySetInnerHTML` sem sanitização permitia injeção de scripts
- **Solução**: Adicionado DOMPurify para sanitizar HTML antes de renderizar
- **Arquivos**: `src/lib/moderacao.ts`, `src/components/SpottedList.tsx`
- **Funções adicionadas**: `sanitizeHtml()`, `formatTextHtml()` agora sanitiza

#### 2. Senha Admin Segura
- **Problema**: Senha hardcoded e exposta no cliente (`NEXT_PUBLIC_`)
- **Solução**: Criada API `/api/admin/auth` para autenticação server-side
- **Variável de ambiente**: `ADMIN_PASSWORD` (server-side, não exposta)
- **Arquivos**: `src/app/api/admin/auth/route.ts`, `src/app/admin/page.tsx`

#### 3. RLS para Likes
- **Problema**: Qualquer um podia atualizar likes diretamente
- **Solução**: Criada API `/api/likes` com service_role
- **Arquivo**: `src/app/api/likes/route.ts`
- **SpottedList atualizado**: Usa API em vez de Supabase direto

#### 4. Vulnerabilidade npm Corrigida
- **Problema**: postcss <8.5.10 com vulnerabilidade XSS
- **Solução**: Adicionado override no package.json para forçar versão segura
- **Resultado**: 0 vulnerabilidades no npm audit

### Variáveis de Ambiente Necessárias (Vercel)
- `ADMIN_PASSWORD`: Senha para acessar o painel admin (server-side)

### Commits Realizados
1. `c206dd0`: feat: Implementar sistema de analytics e tracking de uso
2. `d3714c3`: fix: Corrigir vulnerabilidades de segurança

### Status de Segurança
| Item | Status |
|------|--------|
| XSS | ✅ Corrigido |
| Senha Admin | ✅ Server-side |
| Likes API | ✅ Seguro |
| npm audit | ✅ 0 vulnerabilidades |

---

## Sessão: 12/06/2026 (parte 4) - Sistema de Denúncias

### Objetivo
- Fazer denúncias removerem itens da visualização pública e enviar para admin

### Alterações Realizadas

#### 1. API de Denúncias
- **Arquivo**: `src/app/api/report/route.ts`
- **Função**: Recebe denúncia e atualiza status do item para 'reported'
- **Usa**: `SUPABASE_SERVICE_ROLE_KEY` para bypassar RLS

#### 2. Fluxo de Denúncia
1. Usuário clica em "Denunciar"
2. Modal abre com opções de razão
3. Ao enviar:
   - Insere registro na tabela `reports`
   - Atualiza status do spotted/comment para 'reported'
   - Item some da visualização pública (query filtra status='approved')
4. Admin vê no painel e decide aprovar/rejeitar

#### 3. Commits Realizados
- Hash: `2512bb4`
- Mensagem: "feat: API de denuncias e comentarios reportados no admin"

#### 4. Alias Vercel
- Comando: `vercel alias spotted-anonimo.vercel.app spotted2.vercel.app`
- URL principal: https://spotted2.vercel.app

### Arquitetura de Denúncias
```
┌─────────────┐    POST /api/report     ┌──────────────┐
│  Usuário    │ ─────────────────────► │  Supabase    │
│  (anon)     │                         │  (service)   │
└─────────────┘                         └──────────────┘
      │                                        │
      │                                        ├─► reports (insert)
      │                                        │
      │                                        └─► spotteds/comments
      │                                            (status = 'reported')
      │
      ▼
┌─────────────┐
│  Visualiza  │ ◄── Query: status = 'approved'
│  Pública    │     (itens reported não aparecem)
└─────────────┘
```

### Testado em 12/06/2026
- ✅ Denunciar comentário funciona
- ✅ Comentário removido da visualização pública
- ✅ Admin pode ver e gerenciar denúncias
