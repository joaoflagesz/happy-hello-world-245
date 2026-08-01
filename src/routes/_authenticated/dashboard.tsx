import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlarmClock,
  Activity,
  CalendarClock,
  Clock,
  Flame,
  Globe,
  MessageSquare,
  PhoneCall,
  Snowflake,
  Target,
  TrendingUp,
  Trophy,
  UserX,
  Users,
  Wallet,
} from "lucide-react";
import { useLeads } from "@/features/leads/api";
import { STAGE_LABEL, STAGES } from "@/features/leads/constants";
import { useAppointments, useDeals, useProposals, formatCurrency } from "@/features/crm/api";
import { useActivityLog, useGoals, useTasks } from "@/features/platform/api";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "@/components/ui-kit";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Prospecta CRM" },
      {
        name: "description",
        content: "Indicadores de prospecção, metas, funil de vendas e receita da sua operação comercial.",
      },
      { property: "og:title", content: "Dashboard — Prospecta CRM" },
      {
        property: "og:description",
        content: "Indicadores de prospecção, metas, funil de vendas e receita da sua operação comercial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

const DAY = 24 * 60 * 60 * 1000;

function daysSince(value: string | null | undefined) {
  if (!value) return Infinity;
  return Math.floor((Date.now() - new Date(value).getTime()) / DAY);
}

function DashboardPage() {
  const { data: leads, isLoading } = useLeads();
  const { data: deals } = useDeals();
  const { data: proposals } = useProposals();
  const { data: appointments } = useAppointments();
  const { data: tasks } = useTasks();
  const { data: goals } = useGoals();
  const { data: activity } = useActivityLog();
  const [period, setPeriod] = useState<"dia" | "semana" | "mes" | "ano">("mes");

  const stats = useMemo(() => {
    const list = leads ?? [];
    const byStage = (stage: string) => list.filter((l) => l.stage === stage).length;
    const clients = list.filter((l) => l.stage === "cliente");
    const soldValue = clients.reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0);
    const forecast = list
      .filter((l) => ["negociacao", "proposta_enviada", "reuniao"].includes(l.stage))
      .reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0);
    const lost = list.filter((l) => l.stage === "perdido");
    const lostValue = lost.reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0);

    const contactTimes = list
      .filter((l) => l.first_contact_at)
      .map((l) => (new Date(l.first_contact_at!).getTime() - new Date(l.created_at).getTime()) / DAY);
    const closeTimes = clients.map(
      (l) => (new Date(l.updated_at).getTime() - new Date(l.created_at).getTime()) / DAY,
    );
    const avg = (values: number[]) =>
      values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    return {
      total: list.length,
      novos: byStage("novo_lead"),
      semSite: list.filter((l) => l.site_status === "sem_site").length,
      comSite: list.filter((l) => l.site_status !== "sem_site").length,
      quentes: list.filter((l) => l.temperature === "quente").length,
      mornos: list.filter((l) => l.temperature === "morno").length,
      frios: list.filter((l) => l.temperature === "frio").length,
      mensagens: list.filter((l) => l.last_contact_at).length,
      semAtendimento: list.filter((l) => !l.last_contact_at && !l.first_contact_at).length,
      semResponsavel: list.filter((l) => !l.owner_id).length,
      recemImportados: list.filter((l) => daysSince(l.created_at) <= 2).length,
      propostas: byStage("proposta_enviada"),
      clientes: clients.length,
      perdidos: lost.length,
      soldValue,
      forecast,
      lostValue,
      ticket: clients.length ? soldValue / clients.length : 0,
      conversion: list.length ? (clients.length / list.length) * 100 : 0,
      lossRate: list.length ? (lost.length / list.length) * 100 : 0,
      tempoContato: avg(contactTimes),
      tempoFechamento: avg(closeTimes),
      parados: {
        d3: list.filter((l) => daysSince(l.last_interaction_at ?? l.last_contact_at ?? l.created_at) >= 3).length,
        d7: list.filter((l) => daysSince(l.last_interaction_at ?? l.last_contact_at ?? l.created_at) >= 7).length,
        d15: list.filter((l) => daysSince(l.last_interaction_at ?? l.last_contact_at ?? l.created_at) >= 15).length,
        d30: list.filter((l) => daysSince(l.last_interaction_at ?? l.last_contact_at ?? l.created_at) >= 30).length,
      },
    };
  }, [leads]);

  const proposalStats = useMemo(() => {
    const list = proposals ?? [];
    return {
      total: list.length,
      aceitas: list.filter((p) => p.status === "aceita").length,
      recusadas: list.filter((p) => p.status === "recusada").length,
      enviadas: list.filter((p) => p.status === "enviada").length,
      valorAceito: list
        .filter((p) => p.status === "aceita")
        .reduce((sum, p) => sum + Number(p.total ?? 0), 0),
    };
  }, [proposals]);

  const today = useMemo(() => {
    const now = new Date();
    const isToday = (value: string | null | undefined) =>
      !!value && new Date(value).toDateString() === now.toDateString();

    const agendaHoje = (appointments ?? []).filter((a) => isToday(a.starts_at));
    return {
      agenda: agendaHoje,
      reunioes: agendaHoje.filter((a) => a.type === "reuniao" || a.type === "visita").length,
      ligacoes: agendaHoje.filter((a) => a.type === "ligacao" && a.status === "agendado").length,
      followUps: (tasks ?? []).filter(
        (t) => t.status !== "concluida" && t.status !== "cancelada" && isToday(t.due_at),
      ).length,
      atrasadas: (tasks ?? []).filter(
        (t) =>
          t.status !== "concluida" &&
          t.status !== "cancelada" &&
          t.due_at &&
          new Date(t.due_at).getTime() < now.getTime(),
      ).length,
    };
  }, [appointments, tasks]);

  const goalProgress = useMemo(() => {
    const now = new Date();
    const startOf = {
      dia: new Date(now.getFullYear(), now.getMonth(), now.getDate()),
      semana: new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay()),
      mes: new Date(now.getFullYear(), now.getMonth(), 1),
      ano: new Date(now.getFullYear(), 0, 1),
    } as const;

    return (["dia", "semana", "mes", "ano"] as const).map((key) => {
      const from = startOf[key].getTime();
      const receita = (deals ?? [])
        .filter((d) => d.status === "ganha" && new Date(d.closed_at ?? d.created_at).getTime() >= from)
        .reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
      const novosLeads = (leads ?? []).filter((l) => new Date(l.created_at).getTime() >= from).length;

      const goal = (goals ?? []).find(
        (g) =>
          g.metric === "receita" &&
          new Date(g.period_start).getTime() <= now.getTime() &&
          new Date(g.period_end).getTime() >= from,
      );
      const fallback = { dia: 1000, semana: 5000, mes: 20000, ano: 240000 }[key];
      const target = Number(goal?.target ?? fallback);

      return {
        key,
        label: { dia: "Meta diária", semana: "Meta semanal", mes: "Meta mensal", ano: "Meta anual" }[key],
        receita,
        novosLeads,
        target,
        percent: target ? Math.min(100, (receita / target) * 100) : 0,
      };
    });
  }, [deals, goals, leads]);

  const funnel = useMemo(
    () =>
      STAGES.map((stage) => ({
        stage: stage.label,
        total: (leads ?? []).filter((l) => l.stage === stage.value).length,
      })).filter((item) => item.total > 0),
    [leads],
  );

  const temperature = useMemo(
    () => [
      { name: "Quentes", value: stats.quentes, color: "var(--chart-1)" },
      { name: "Mornos", value: stats.mornos, color: "var(--chart-4)" },
      { name: "Frios", value: stats.frios, color: "var(--chart-2)" },
    ],
    [stats],
  );

  const monthly = useMemo(() => {
    const buckets = new Map<string, { month: string; leads: number; clientes: number }>();
    for (const lead of leads ?? []) {
      const date = new Date(lead.created_at);
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      const label = date.toLocaleDateString("pt-BR", { month: "short" });
      const entry = buckets.get(key) ?? { month: label, leads: 0, clientes: 0 };
      entry.leads += 1;
      if (lead.stage === "cliente") entry.clientes += 1;
      buckets.set(key, entry);
    }
    return [...buckets.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([, v]) => v);
  }, [leads]);

  const conversionBy = useMemo(() => {
    function group(getKey: (lead: NonNullable<typeof leads>[number]) => string | null | undefined) {
      const map = new Map<string, { key: string; total: number; clientes: number }>();
      for (const lead of leads ?? []) {
        const key = (getKey(lead) ?? "").trim() || "Não informado";
        const entry = map.get(key) ?? { key, total: 0, clientes: 0 };
        entry.total += 1;
        if (lead.stage === "cliente") entry.clientes += 1;
        map.set(key, entry);
      }
      return [...map.values()]
        .map((item) => ({ ...item, rate: item.total ? (item.clientes / item.total) * 100 : 0 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);
    }
    return {
      cidade: group((l) => l.city),
      categoria: group((l) => l.category),
      origem: group((l) => l.source),
    };
  }, [leads]);

  const heatmap = useMemo(() => {
    const grid = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => 0));
    for (const lead of leads ?? []) {
      const date = new Date(lead.last_interaction_at ?? lead.last_contact_at ?? lead.created_at);
      const row = grid[date.getDay()];
      if (row) row[date.getHours()] = (row[date.getHours()] ?? 0) + 1;
    }
    const max = Math.max(1, ...grid.flat());
    return { grid, max };
  }, [leads]);

  const ranking = useMemo(() => {
    const map = new Map<string, { owner: string; leads: number; clientes: number; receita: number }>();
    for (const lead of leads ?? []) {
      const owner = lead.owner_id ?? "sem-responsavel";
      const entry = map.get(owner) ?? { owner, leads: 0, clientes: 0, receita: 0 };
      entry.leads += 1;
      if (lead.stage === "cliente") {
        entry.clientes += 1;
        entry.receita += Number(lead.deal_value ?? 0);
      }
      map.set(owner, entry);
    }
    return [...map.values()].sort((a, b) => b.receita - a.receita).slice(0, 5);
  }, [leads]);

  const activePeriod = goalProgress.find((g) => g.key === period);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão geral da sua prospecção em tempo real.
          </p>
        </div>
        <div className="flex gap-1 rounded-lg border border-border p-1">
          {(["dia", "semana", "mes", "ano"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setPeriod(key)}
              className={`rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors ${
                period === key ? "bg-primary text-primary-foreground" : "hover:bg-accent"
              }`}
            >
              {key === "mes" ? "mês" : key}
            </button>
          ))}
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {goalProgress.map((goal) => (
          <div
            key={goal.key}
            className={`surface-card rounded-2xl p-5 ${goal.key === period ? "ring-1 ring-primary/40" : ""}`}
          >
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{goal.label}</p>
            <p className="mt-2 text-xl font-semibold tracking-tight">{currency.format(goal.receita)}</p>
            <p className="text-xs text-muted-foreground">de {currency.format(goal.target)}</p>
            <Progress value={goal.percent} className="mt-3 h-2" />
            <p className="mt-2 text-xs text-muted-foreground">
              {goal.percent.toFixed(0)}% da meta · {goal.novosLeads} novos leads
            </p>
          </div>
        ))}
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Total de leads" value={stats.total} hint={`${stats.novos} novos`} />
        <Kpi
          icon={Wallet}
          label="Valor vendido"
          value={currency.format(stats.soldValue)}
          hint={`Ticket médio ${currency.format(stats.ticket)}`}
          tone="success"
        />
        <Kpi
          icon={Target}
          label="Em negociação"
          value={currency.format(stats.forecast)}
          hint="Previsão de faturamento"
        />
        <Kpi
          icon={TrendingUp}
          label="Valor perdido"
          value={currency.format(stats.lostValue)}
          hint={`Taxa de perda ${stats.lossRate.toFixed(1)}%`}
          tone="warning"
        />
        <Kpi
          icon={Globe}
          label="Sem site"
          value={stats.semSite}
          hint={`${stats.comSite} possuem site`}
          tone="success"
        />
        <Kpi icon={Flame} label="Leads quentes" value={stats.quentes} hint={`${stats.mornos} mornos`} tone="warning" />
        <Kpi icon={Snowflake} label="Leads frios" value={stats.frios} hint="Requer nutrição" />
        <Kpi
          icon={TrendingUp}
          label="Taxa de conversão"
          value={`${stats.conversion.toFixed(1)}%`}
          hint={`${stats.clientes} clientes fechados`}
        />
        <Kpi
          icon={MessageSquare}
          label="Propostas"
          value={proposalStats.total}
          hint={`${proposalStats.aceitas} aceitas · ${proposalStats.recusadas} recusadas`}
        />
        <Kpi
          icon={CalendarClock}
          label="Reuniões hoje"
          value={today.reunioes}
          hint={`${today.agenda.length} compromissos no dia`}
        />
        <Kpi
          icon={PhoneCall}
          label="Ligações pendentes"
          value={today.ligacoes}
          hint={`${today.followUps} follow-ups hoje`}
        />
        <Kpi
          icon={Clock}
          label="Tempo médio até venda"
          value={`${stats.tempoFechamento.toFixed(1)} d`}
          hint={`Primeiro contato em ${stats.tempoContato.toFixed(1)} d`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Leads que precisam de atenção"
          description="Alertas calculados em tempo real sobre a sua base."
          className="xl:col-span-2"
        >
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Alert label="Parados há 3+ dias" value={stats.parados.d3} icon={AlarmClock} />
            <Alert label="Parados há 7+ dias" value={stats.parados.d7} icon={AlarmClock} />
            <Alert label="Parados há 15+ dias" value={stats.parados.d15} icon={AlarmClock} />
            <Alert label="Parados há 30+ dias" value={stats.parados.d30} icon={AlarmClock} tone="danger" />
            <Alert label="Sem atendimento" value={stats.semAtendimento} icon={UserX} tone="danger" />
            <Alert label="Sem responsável" value={stats.semResponsavel} icon={UserX} />
            <Alert label="Recém-importados" value={stats.recemImportados} icon={Users} tone="success" />
            <Alert label="Tarefas atrasadas" value={today.atrasadas} icon={AlarmClock} tone="danger" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button asChild size="sm" variant="outline">
              <Link to="/leads">Abrir leads</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/tarefas">Ver tarefas</Link>
            </Button>
            <Button asChild size="sm" variant="outline">
              <Link to="/pipeline">Abrir funil</Link>
            </Button>
          </div>
        </SectionCard>

        <SectionCard title="Agenda de hoje" description="Compromissos das próximas horas.">
          {today.agenda.length ? (
            <ul className="space-y-3">
              {today.agenda.slice(0, 6).map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-muted p-2 text-primary">
                    <CalendarClock className="size-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.starts_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}{" "}
                      · {item.type}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum compromisso para hoje.</p>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <Panel title="Evolução de leads" className="xl:col-span-2">
          {monthly.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={monthly}>
                <defs>
                  <linearGradient id="fillLeads" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Area type="monotone" dataKey="leads" stroke="var(--chart-1)" fill="url(#fillLeads)" strokeWidth={2} />
                <Area type="monotone" dataKey="clientes" stroke="var(--chart-3)" fill="transparent" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Panel>

        <Panel title="Temperatura dos leads">
          {stats.total ? (
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={temperature} dataKey="value" nameKey="name" innerRadius={64} outerRadius={100} paddingAngle={4}>
                  {temperature.map((item) => (
                    <Cell key={item.name} fill={item.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Panel>

        <Panel title="Funil de vendas" className="xl:col-span-3">
          {funnel.length ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={funnel} layout="vertical" margin={{ left: 40 }}>
                <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" stroke="var(--muted-foreground)" fontSize={12} allowDecimals={false} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="stage" stroke="var(--muted-foreground)" fontSize={12} width={140} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} cursor={{ fill: "var(--muted)" }} />
                <Bar dataKey="total" fill="var(--chart-1)" radius={[0, 8, 8, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart />
          )}
        </Panel>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <ConversionCard title="Conversão por cidade" rows={conversionBy.cidade} />
        <ConversionCard title="Conversão por categoria" rows={conversionBy.categoria} />
        <ConversionCard title="Conversão por origem" rows={conversionBy.origem} />
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Mapa de calor de interações"
          description="Melhores horários de contato por dia da semana."
          className="xl:col-span-2"
        >
          <div className="overflow-x-auto">
            <div className="min-w-[640px] space-y-1">
              {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day, rowIndex) => (
                <div key={day} className="flex items-center gap-1">
                  <span className="w-8 text-[10px] text-muted-foreground">{day}</span>
                  {(heatmap.grid[rowIndex] ?? []).map((value, hour) => (
                    <span
                      key={hour}
                      title={`${day} ${hour}h · ${value} interações`}
                      className="h-4 flex-1 rounded-[3px]"
                      style={{
                        background:
                          value === 0
                            ? "var(--muted)"
                            : `color-mix(in oklab, var(--primary) ${Math.round((value / heatmap.max) * 100)}%, transparent)`,
                      }}
                    />
                  ))}
                </div>
              ))}
              <div className="flex gap-1 pl-8 pt-1">
                {Array.from({ length: 24 }).map((_, hour) => (
                  <span key={hour} className="flex-1 text-center text-[9px] text-muted-foreground">
                    {hour % 3 === 0 ? hour : ""}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </SectionCard>

        <SectionCard title="Ranking de vendedores" description="Por receita fechada.">
          {ranking.length ? (
            <ol className="space-y-3">
              {ranking.map((item, index) => (
                <li key={item.owner} className="flex items-center gap-3">
                  <span
                    className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                      index === 0 ? "bg-amber-500/20 text-amber-600" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {index === 0 ? <Trophy className="size-3.5" /> : index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-mono text-xs">
                      {item.owner === "sem-responsavel" ? "Sem responsável" : item.owner.slice(0, 8)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.clientes} de {item.leads} leads ·{" "}
                      {item.leads ? ((item.clientes / item.leads) * 100).toFixed(0) : 0}% conversão
                    </p>
                  </div>
                  <span className="text-sm font-semibold">{currency.format(item.receita)}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Sem dados de vendedores ainda.</p>
          )}
        </SectionCard>
      </section>

      <section className="grid gap-6 xl:grid-cols-3">
        <SectionCard
          title="Feed de atividades"
          description="Últimas alterações registradas no sistema."
          className="xl:col-span-2"
          actions={
            <Button asChild size="sm" variant="ghost">
              <Link to="/auditoria">Ver auditoria</Link>
            </Button>
          }
        >
          {(activity ?? []).length ? (
            <ul className="space-y-3">
              {(activity ?? []).slice(0, 8).map((item) => (
                <li key={item.id} className="flex items-start gap-3">
                  <span className="mt-0.5 rounded-lg bg-muted p-2 text-primary">
                    <Activity className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm">
                      <Badge variant="secondary" className="mr-2 text-[10px]">
                        {item.action}
                      </Badge>
                      {item.summary ?? item.entity_type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma atividade registrada ainda.</p>
          )}
        </SectionCard>

        <SectionCard
          title={`Resumo ${period === "mes" ? "do mês" : period === "ano" ? "do ano" : period === "dia" ? "do dia" : "da semana"}`}
          description="Fechamento consolidado do período selecionado."
        >
          <dl className="space-y-3 text-sm">
            <Row label="Receita fechada" value={currency.format(activePeriod?.receita ?? 0)} />
            <Row label="Meta do período" value={currency.format(activePeriod?.target ?? 0)} />
            <Row label="Novos leads" value={String(activePeriod?.novosLeads ?? 0)} />
            <Row label="Propostas enviadas" value={String(proposalStats.enviadas)} />
            <Row label="Propostas aceitas" value={String(proposalStats.aceitas)} />
            <Row label="Valor aceito em propostas" value={formatCurrency(proposalStats.valorAceito)} />
            <Row label="Clientes fechados" value={String(stats.clientes)} />
            <Row label="Leads perdidos" value={String(stats.perdidos)} />
          </dl>
        </SectionCard>
      </section>
    </div>
  );
}

const tooltipStyle = {
  background: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: "0.75rem",
  color: "var(--popover-foreground)",
  fontSize: 12,
} as const;

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold">{value}</dd>
    </div>
  );
}

function ConversionCard({
  title,
  rows,
}: {
  title: string;
  rows: { key: string; total: number; clientes: number; rate: number }[];
}) {
  return (
    <SectionCard title={title} description="Top 6 por volume de leads.">
      {rows.length ? (
        <ul className="space-y-3">
          {rows.map((row) => (
            <li key={row.key}>
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="truncate">{row.key}</span>
                <span className="text-muted-foreground">
                  {row.clientes}/{row.total} · {row.rate.toFixed(0)}%
                </span>
              </div>
              <Progress value={row.rate} className="mt-1.5 h-1.5" />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">Sem dados suficientes.</p>
      )}
    </SectionCard>
  );
}

function Alert({
  label,
  value,
  icon: Icon,
  tone = "default",
}: {
  label: string;
  value: number;
  icon: typeof Users;
  tone?: "default" | "danger" | "success";
}) {
  const toneClass =
    tone === "danger"
      ? "text-destructive"
      : tone === "success"
        ? "text-emerald-500"
        : "text-primary";
  return (
    <div className="rounded-xl border border-border p-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        <Icon className={`size-3.5 ${toneClass}`} />
      </div>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: typeof Users;
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "success" | "warning";
}) {
  const toneClass =
    tone === "success"
      ? "text-emerald-500"
      : tone === "warning"
        ? "text-amber-500"
        : "text-primary";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="surface-card group rounded-2xl p-5 transition-shadow hover:shadow-lg"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        <span className={`rounded-xl bg-muted p-2 ${toneClass}`}>
          <Icon className="size-4" />
        </span>
      </div>
    </motion.div>
  );
}

function Panel({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`surface-card rounded-2xl p-5 ${className}`}>
      <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function EmptyChart() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-2 text-center">
      <p className="text-sm font-medium">Sem dados ainda</p>
      <p className="text-xs text-muted-foreground">
        Importe seus leads para ver os gráficos ganharem vida.
      </p>
    </div>
  );
}

export { STAGE_LABEL };
