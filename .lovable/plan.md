## Sistema de Prospecção (CRM) — plano de construção

Vou substituir o site atual por um CRM de prospecção completo. Uma observação técnica importante: **Next.js não é suportado aqui** — o ambiente usa TanStack Start (React 19 + TypeScript + Vite, com SSR e Server Functions). Todo o resto da stack pedida é usada como está: Tailwind, shadcn/ui, Framer Motion, Lucide, React Hook Form, Zod, TanStack Table, Recharts, PapaParse, XLSX, React Dropzone. Banco, Auth e Storage via Lovable Cloud (Postgres + RLS + Storage gerenciados).

Dado o tamanho, entrego em fases. Cada fase é funcional de verdade — sem dados fictícios.

### Fase 1 — Fundação (esta entrega)
- Ativar backend (banco, auth, storage).
- Design system premium: dark/light, glassmorfismo, tipografia, espaçamentos, microinterações.
- Auth completo: cadastro, login, recuperação de senha, confirmação por email, sessão persistente, Google.
- Perfis + papéis (admin, gerente, vendedor, funcionário) em tabela separada `user_roles` com RLS. Cada usuário vê seus leads; admin vê tudo.
- Shell do app: sidebar moderna, topbar, busca, tema, avatar/perfil, responsivo (desktop → mobile).
- Schema base: `profiles`, `user_roles`, `leads`, `lead_events` (timeline), `pipeline_stages`, `tags`.
- Página de Leads com TanStack Table: colunas completas, busca, filtros, paginação, ações.

### Fase 2 — Importação + Score
- Upload drag-and-drop (CSV/Excel/export do Apify Google Maps) com mapeamento automático de colunas (nome, telefone, site, Instagram, categoria, cidade, estado, CEP, avaliações, nota, lat/long, horário…).
- Detecção de site (tem/não tem) + coluna `site_status` editável (sem site, ruim, desatualizado, lento, moderno).
- Algoritmo de score configurável (critérios editáveis em Configurações) → frio/morno/quente.

### Fase 3 — CRM + WhatsApp
- Kanban drag-and-drop com as 12 etapas, cada movimento gravado no histórico.
- Página do lead: dados, mapa, timeline, observações, checklist, arquivos, responsável.
- Modelos de mensagem com variáveis `{{empresa}}`, `{{cidade}}` etc.; botão "Abrir no WhatsApp" via `wa.me`, registrando contato, mudando etapa e salvando a mensagem no histórico.

### Fase 4 — Dashboard, Agenda, Financeiro, Propostas, Relatórios
- Dashboard com todos os KPIs e gráficos Recharts.
- Agenda/calendário com reuniões, visitas, follow-ups e lembretes.
- Clientes, vendas, propostas (com PDF), arquivos no Storage.
- Relatórios com exportação CSV/Excel/PDF.

### Detalhes técnicos
- Segurança: RLS em todas as tabelas, papéis via função `has_role` security-definer (sem escalada de privilégio), grants explícitos.
- Dados: TanStack Query + server functions; skeletons de carregamento, paginação no servidor e virtualização na tabela de leads.
- Organização: `src/routes/_authenticated/*` para rotas protegidas, `src/features/<domínio>/` para componentes e lógica, `*.functions.ts` para acesso ao banco.

Começo pela Fase 1 assim que aprovar; se preferir outra ordem (ex.: importação antes do auth completo), é só dizer.