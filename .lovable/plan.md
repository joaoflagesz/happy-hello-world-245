## Prospecta CRM — evolução para SaaS premium

O que você pediu equivale a 1–2 anos de produto. Nada será removido: tudo que existe hoje (auth + RBAC, leads, importação Apify/CSV/XLSX, score, pipeline kanban, WhatsApp por template, agenda, clientes/vendas, propostas com PDF, relatórios, configurações) continua funcionando e vai sendo reescrito por cima, fase a fase.

Duas observações técnicas honestas:
- O ambiente é TanStack Start (React 19 + Vite + SSR + Server Functions). Não há Next.js/RSC — todo o resto da stack pedida é usada como está.
- "Múltiplos números de WhatsApp, caixa de entrada, disparo em massa, chatbot" exigem um provedor externo (Meta Cloud API ou Z-API/Evolution). Construo o módulo completo com a camada de provedor plugável; o envio real liga quando você fornecer as credenciais.

### Fase 1 — Fundação visual e de produto (entrega imediata)
- Design system v2: tokens OKLCH completos, escala tipográfica, elevação, blur, glass/neu refinados, dark e light impecáveis, Atomic Design em `src/components/ui-kit/`.
- App shell novo: sidebar colapsável com grupos, breadcrumbs, barra de comandos **Ctrl+K** (navegação, ações rápidas, busca global de leads/clientes/propostas), central de notificações, atalhos de teclado globais.
- Padrões de UX: skeletons por rota, estados vazios úteis com CTA, toasts de confirmação, diálogos de destruição, menus contextuais (clique direito) nas listas, multi-seleção com ações em lote.
- Motion: transições de rota, stagger em listas, microinterações em botões/cards, respeitando `prefers-reduced-motion`.

### Fase 2 — Núcleo de dados expandido
Novas tabelas com RLS e grants: `companies`, `contacts`, `teams`, `team_members`, `custom_fields`, `custom_field_values`, `tags`, `attachments`, `notes`, `tasks`, `activity_log`, `notifications`, `pipelines`, `pipeline_stages`, `goals`.
- Leads ganham: origem/campanha/UTM, valor potencial, probabilidade, próxima ação, última interação, health score, equipe, responsável.
- Detecção e mesclagem de duplicados, duplicar registro, histórico de alterações (auditoria por trigger).
- Storage: arquivos, fotos, documentos, áudios em bucket com políticas por dono.

### Fase 3 — Inteligência artificial
Server functions usando Lovable AI (sem chave sua):
- Score e resumo de lead, insights, priorização, detecção de frio/quente.
- Geração de mensagens de WhatsApp, e-mails, follow-ups e propostas.
- Sugestão de próximos passos e criação automática de tarefas.
- Painel "Insights da IA" no dashboard e no lead.

### Fase 4 — Comunicação e automações
- Módulo WhatsApp: inbox com conversas, etiquetas, respostas rápidas, templates, anexos, busca e filtros; camada de provedor plugável; campanhas, agendamento e follow-up automático.
- Editor visual de automações estilo n8n: gatilho (lead criado, etapa mudou, sem resposta em X dias, data) → condições → ações (WhatsApp, e-mail, tarefa, mover etapa, notificar, criar proposta). Execução por server function + cron.

### Fase 5 — BI, financeiro e propostas
- Dashboards por papel: executivo, comercial, financeiro, operacional, vendedor, gerente, admin — com filtros globais de período/equipe, comparativos, ranking, heatmap e metas.
- KPIs: receita prevista/recebida/atrasada, CAC, LTV, ROI, ticket médio, ciclo de vendas, tempo de resposta, follow-up, conversão por etapa, churn/renovação.
- Financeiro: fluxo de caixa, receitas, despesas, categorias, centro de custos, parcelas, comissões, DRE, gráficos.
- Propostas v2: templates, logo, PDF premium, versões, duplicar, aceite online por link público, envio por WhatsApp/e-mail, status.

### Fase 6 — Governança, agenda e polimento
- Agenda estilo Google Calendar: dia/semana/mês/ano, arrastar eventos, recorrência, lembretes.
- Usuários e equipes: hierarquia, grupos, permissões granulares, logs de auditoria.
- Configurações: empresa, integrações, API/webhooks/tokens, notificações, tema, idioma, backup, segurança.
- SEO (schema, OG, sitemap, robots, canonical), acessibilidade WCAG 2.2, virtualização de listas, code splitting, prefetch, responsividade mobile→ultrawide.

### Detalhes técnicos
- Rotas protegidas em `src/routes/_authenticated/`, domínios em `src/features/<domínio>/`, acesso a dados em `*.functions.ts` e hooks TanStack Query.
- Toda tabela nova: RLS + GRANT explícitos, papéis via `has_role`/`is_manager` (security definer), sem escalada de privilégio.
- Migrações incrementais e não destrutivas — nenhuma tabela ou coluna atual é removida.

Começo pela Fase 1 assim que você aprovar. Se quiser outra ordem (por exemplo IA e WhatsApp antes do BI), é só dizer.
