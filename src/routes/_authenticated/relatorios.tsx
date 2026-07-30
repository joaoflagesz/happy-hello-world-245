import { useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { Download } from "lucide-react";
import {
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
import { useLeads } from "@/features/leads/api";
import { STAGE_LABEL } from "@/features/leads/constants";
import { formatCurrency, useDeals, useProposals } from "@/features/crm/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const title = "Relatórios — Prospecta CRM";
const description =
  "Relatórios de prospecção: leads por etapa, origem, cidade e receita, com exportação em CSV e Excel.";

export const Route = createFileRoute("/_authenticated/relatorios")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: RelatoriosPage,
});

const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ec4899", "#06b6d4", "#a855f7"];

function RelatoriosPage() {
  const { data: leads, isLoading } = useLeads();
  const { data: deals } = useDeals();
  const { data: proposals } = useProposals();

  const byStage = useMemo(() => {
    const map = new Map<string, number>();
    (leads ?? []).forEach((lead) => {
      const label = STAGE_LABEL[lead.stage];
      map.set(label, (map.get(label) ?? 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [leads]);

  const byCity = useMemo(() => {
    const map = new Map<string, number>();
    (leads ?? []).forEach((lead) => {
      const key = lead.city?.trim() || "Sem cidade";
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return [...map.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [leads]);

  const bySource = useMemo(() => {
    const map = new Map<string, number>();
    (leads ?? []).forEach((lead) => {
      map.set(lead.source, (map.get(lead.source) ?? 0) + 1);
    });
    return [...map.entries()].map(([name, value]) => ({ name, value }));
  }, [leads]);

  const revenue = (deals ?? [])
    .filter((d) => d.status === "ganha")
    .reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
  const proposalsValue = (proposals ?? []).reduce((sum, p) => sum + Number(p.total ?? 0), 0);

  function buildRows() {
    return (leads ?? []).map((lead) => ({
      Empresa: lead.company_name,
      Contato: lead.contact_name ?? "",
      Telefone: lead.phone ?? "",
      Cidade: lead.city ?? "",
      Estado: lead.state ?? "",
      Categoria: lead.category ?? "",
      Site: lead.website ?? "",
      Etapa: STAGE_LABEL[lead.stage],
      Score: lead.score,
      Temperatura: lead.temperature,
      Origem: lead.source,
      Criado: new Date(lead.created_at).toLocaleDateString("pt-BR"),
    }));
  }

  function exportXlsx() {
    const sheet = XLSX.utils.json_to_sheet(buildRows());
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, "Leads");
    XLSX.writeFile(book, `relatorio-${new Date().toISOString().slice(0, 10)}.xlsx`);
  }

  function exportCsv() {
    const sheet = XLSX.utils.json_to_sheet(buildRows());
    const csv = XLSX.utils.sheet_to_csv(sheet);
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `relatorio-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Relatórios</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visão consolidada da prospecção com exportação para CSV e Excel.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCsv}>
            <Download className="mr-2 size-4" /> CSV
          </Button>
          <Button onClick={exportXlsx}>
            <Download className="mr-2 size-4" /> Excel
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            Imprimir / PDF
          </Button>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Leads" value={String((leads ?? []).length)} />
        <Kpi label="Propostas" value={String((proposals ?? []).length)} hint={formatCurrency(proposalsValue)} />
        <Kpi label="Vendas ganhas" value={String((deals ?? []).filter((d) => d.status === "ganha").length)} />
        <Kpi label="Receita" value={formatCurrency(revenue)} />
      </div>

      {isLoading ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-80 rounded-2xl" />
          <Skeleton className="h-80 rounded-2xl" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel title="Leads por etapa">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byStage}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-25} height={70} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Top cidades">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCity} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} fill="#22c55e" />
              </BarChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Origem dos leads">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie data={bySource} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100}>
                  {bySource.map((entry, index) => (
                    <Cell key={entry.name} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Panel>

          <Panel title="Resumo financeiro">
            <ul className="divide-y divide-border text-sm">
              <Row label="Valor total em propostas" value={formatCurrency(proposalsValue)} />
              <Row
                label="Propostas aceitas"
                value={String((proposals ?? []).filter((p) => p.status === "aceita").length)}
              />
              <Row
                label="Negociações em aberto"
                value={formatCurrency(
                  (deals ?? [])
                    .filter((d) => d.status === "aberta")
                    .reduce((sum, d) => sum + Number(d.amount ?? 0), 0),
                )}
              />
              <Row label="Receita fechada" value={formatCurrency(revenue)} />
            </ul>
          </Panel>
        </div>
      )}
    </div>
  );
}

function Panel({ title: panelTitle, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="glass rounded-2xl border border-border p-5">
      <h2 className="mb-4 text-sm font-semibold">{panelTitle}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between py-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </li>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-2xl border border-border p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
