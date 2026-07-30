import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
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
  Flame,
  Globe,
  MessageSquare,
  Snowflake,
  Target,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import { useLeads } from "@/features/leads/api";
import { STAGE_LABEL, STAGES } from "@/features/leads/constants";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — Prospecta CRM" },
      {
        name: "description",
        content: "Indicadores de prospecção, funil de vendas e receita da sua operação comercial.",
      },
      { property: "og:title", content: "Dashboard — Prospecta CRM" },
      {
        property: "og:description",
        content: "Indicadores de prospecção, funil de vendas e receita da sua operação comercial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DashboardPage,
});

const currency = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function DashboardPage() {
  const { data: leads, isLoading } = useLeads();

  const stats = useMemo(() => {
    const list = leads ?? [];
    const byStage = (stage: string) => list.filter((l) => l.stage === stage).length;
    const clients = list.filter((l) => l.stage === "cliente");
    const soldValue = clients.reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0);
    const forecast = list
      .filter((l) => ["negociacao", "proposta_enviada", "reuniao"].includes(l.stage))
      .reduce((sum, l) => sum + Number(l.deal_value ?? 0), 0);

    return {
      total: list.length,
      novos: byStage("novo_lead"),
      semSite: list.filter((l) => l.site_status === "sem_site").length,
      comSite: list.filter((l) => l.site_status !== "sem_site").length,
      quentes: list.filter((l) => l.temperature === "quente").length,
      mornos: list.filter((l) => l.temperature === "morno").length,
      frios: list.filter((l) => l.temperature === "frio").length,
      mensagens: list.filter((l) => l.last_contact_at).length,
      pendentes: list.filter((l) => !l.last_contact_at).length,
      propostas: byStage("proposta_enviada"),
      clientes: clients.length,
      perdidos: byStage("perdido"),
      soldValue,
      forecast,
      conversion: list.length ? (clients.length / list.length) * 100 : 0,
    };
  }, [leads]);

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
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Visão geral da sua prospecção em tempo real.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Users} label="Total de leads" value={stats.total} hint={`${stats.novos} novos`} />
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
          icon={MessageSquare}
          label="Mensagens enviadas"
          value={stats.mensagens}
          hint={`${stats.pendentes} pendentes`}
        />
        <Kpi icon={Target} label="Propostas enviadas" value={stats.propostas} hint={`${stats.perdidos} perdidos`} />
        <Kpi
          icon={Wallet}
          label="Valor vendido"
          value={currency.format(stats.soldValue)}
          hint={`Previsto ${currency.format(stats.forecast)}`}
          tone="success"
        />
        <Kpi
          icon={TrendingUp}
          label="Taxa de conversão"
          value={`${stats.conversion.toFixed(1)}%`}
          hint={`${stats.clientes} clientes fechados`}
        />
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
