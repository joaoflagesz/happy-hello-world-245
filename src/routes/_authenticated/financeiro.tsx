import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownCircle, ArrowUpCircle, Plus, Trash2, Wallet } from "lucide-react";
import { toast } from "sonner";
import {
  FINANCE_STATUSES,
  useDeleteFinanceEntry,
  useFinanceEntries,
  useSaveFinanceEntry,
  type FinanceEntry,
} from "@/features/platform/api";
import { formatCurrency } from "@/features/crm/api";
import { EmptyState, ListSkeleton, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/financeiro")({
  head: () => ({
    meta: [
      { title: "Financeiro — Prospecta CRM" },
      {
        name: "description",
        content: "Contas a pagar e receber, fluxo de caixa, comissões, centro de custo e DRE simplificada.",
      },
      { property: "og:title", content: "Financeiro — Prospecta CRM" },
      {
        property: "og:description",
        content: "Contas a pagar e receber, fluxo de caixa, comissões, centro de custo e DRE simplificada.",
      },
    ],
  }),
  component: FinancePage,
});

type Draft = {
  id?: string;
  kind: FinanceEntry["kind"];
  description: string;
  category: string;
  cost_center: string;
  amount: string;
  status: FinanceEntry["status"];
  due_date: string;
  payment_method: string;
  installment_total: string;
  commission_rate: string;
  notes: string;
};

const emptyDraft: Draft = {
  kind: "receita",
  description: "",
  category: "",
  cost_center: "",
  amount: "",
  status: "previsto",
  due_date: new Date().toISOString().slice(0, 10),
  payment_method: "PIX",
  installment_total: "1",
  commission_rate: "0",
  notes: "",
};

function FinancePage() {
  const { data: entries, isLoading } = useFinanceEntries();
  const save = useSaveFinanceEntry();
  const remove = useDeleteFinanceEntry();
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = entries ?? [];

  const stats = useMemo(() => {
    const sum = (rows: FinanceEntry[]) => rows.reduce((acc, r) => acc + Number(r.amount ?? 0), 0);
    const receitas = list.filter((e) => e.kind === "receita");
    const despesas = list.filter((e) => e.kind === "despesa");
    const recebido = sum(receitas.filter((e) => e.status === "pago"));
    const pago = sum(despesas.filter((e) => e.status === "pago"));
    return {
      receber: sum(receitas.filter((e) => e.status !== "pago" && e.status !== "cancelado")),
      pagar: sum(despesas.filter((e) => e.status !== "pago" && e.status !== "cancelado")),
      recebido,
      pago,
      lucro: recebido - pago,
      atrasado: sum(list.filter((e) => e.status === "atrasado")),
      comissoes: receitas.reduce(
        (acc, r) => acc + (Number(r.amount ?? 0) * Number(r.commission_rate ?? 0)) / 100,
        0,
      ),
    };
  }, [list]);

  const monthly = useMemo(() => {
    const map = new Map<string, { mes: string; receitas: number; despesas: number; saldo: number }>();
    for (const entry of list) {
      const base = entry.due_date ?? entry.created_at.slice(0, 10);
      const key = base.slice(0, 7);
      const row = map.get(key) ?? { mes: key, receitas: 0, despesas: 0, saldo: 0 };
      const value = Number(entry.amount ?? 0);
      if (entry.kind === "receita") row.receitas += value;
      else row.despesas += value;
      row.saldo = row.receitas - row.despesas;
      map.set(key, row);
    }
    return [...map.values()].sort((a, b) => a.mes.localeCompare(b.mes));
  }, [list]);

  const byCategory = useMemo(() => {
    const map = new Map<string, number>();
    for (const entry of list.filter((e) => e.kind === "despesa")) {
      const key = entry.category || entry.cost_center || "Sem categoria";
      map.set(key, (map.get(key) ?? 0) + Number(entry.amount ?? 0));
    }
    return [...map.entries()].map(([categoria, total]) => ({ categoria, total }));
  }, [list]);

  function submit() {
    if (!draft) return;
    const amount = Number(draft.amount.replace(",", "."));
    if (!draft.description.trim() || !Number.isFinite(amount) || amount <= 0) {
      toast.error("Informe descrição e valor válido.");
      return;
    }
    save.mutate(
      {
        id: draft.id,
        values: {
          kind: draft.kind,
          description: draft.description.trim(),
          category: draft.category.trim() || null,
          cost_center: draft.cost_center.trim() || null,
          amount,
          status: draft.status,
          due_date: draft.due_date || null,
          payment_method: draft.payment_method.trim() || null,
          installment_total: Math.max(1, Number(draft.installment_total) || 1),
          commission_rate: Number(draft.commission_rate.replace(",", ".")) || 0,
          notes: draft.notes.trim() || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(draft.id ? "Lançamento atualizado." : "Lançamento criado.");
          setDraft(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  const tooltipStyle = {
    background: "var(--popover)",
    border: "1px solid var(--border)",
    borderRadius: "0.75rem",
    color: "var(--popover-foreground)",
    fontSize: 12,
  } as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Financeiro"
        description="Fluxo de caixa, contas a pagar e receber, comissões e DRE simplificada."
        icon={Wallet}
        actions={
          <Button onClick={() => setDraft({ ...emptyDraft })}>
            <Plus className="mr-2 size-4" />
            Novo lançamento
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="A receber" value={formatCurrency(stats.receber)} icon={ArrowUpCircle} accent="success" index={0} />
        <StatCard label="A pagar" value={formatCurrency(stats.pagar)} icon={ArrowDownCircle} accent="destructive" index={1} />
        <StatCard label="Lucro realizado" value={formatCurrency(stats.lucro)} icon={Wallet} accent="info" index={2} />
        <StatCard label="Comissões previstas" value={formatCurrency(stats.comissoes)} icon={Wallet} accent="warning" index={3} />
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Wallet}
          title="Sem lançamentos financeiros"
          description="Registre receitas e despesas para acompanhar o fluxo de caixa e a DRE."
          action={<Button onClick={() => setDraft({ ...emptyDraft })}>Criar lançamento</Button>}
        />
      ) : (
        <Tabs defaultValue="fluxo">
          <TabsList>
            <TabsTrigger value="fluxo">Fluxo de caixa</TabsTrigger>
            <TabsTrigger value="lancamentos">Lançamentos</TabsTrigger>
            <TabsTrigger value="dre">DRE</TabsTrigger>
          </TabsList>

          <TabsContent value="fluxo" className="mt-4 space-y-6">
            <SectionCard title="Evolução mensal">
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthly}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="mes" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  <Legend />
                  <Line type="monotone" dataKey="receitas" stroke="var(--chart-3)" strokeWidth={2} />
                  <Line type="monotone" dataKey="despesas" stroke="var(--chart-5)" strokeWidth={2} />
                  <Line type="monotone" dataKey="saldo" stroke="var(--chart-1)" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </SectionCard>

            <SectionCard title="Despesas por categoria / centro de custo">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={byCategory}>
                  <CartesianGrid strokeDasharray="4 4" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="categoria" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="total" fill="var(--chart-5)" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </SectionCard>
          </TabsContent>

          <TabsContent value="lancamentos" className="mt-4">
            <SectionCard>
              <div className="divide-y divide-border">
                {list.map((entry) => (
                  <div key={entry.id} className="flex flex-wrap items-center gap-3 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        entry.kind === "receita" ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"
                      }`}
                    >
                      {entry.kind === "receita" ? "Receita" : "Despesa"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{entry.description}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[
                          entry.category,
                          entry.cost_center,
                          entry.due_date ? new Date(`${entry.due_date}T12:00:00`).toLocaleDateString("pt-BR") : null,
                          entry.installment_total > 1
                            ? `Parcela ${entry.installment_number}/${entry.installment_total}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    </div>
                    <Badge variant="outline">{FINANCE_STATUSES.find((s) => s.value === entry.status)?.label}</Badge>
                    <span className="tabular text-sm font-semibold">{formatCurrency(Number(entry.amount))}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setDraft({
                          id: entry.id,
                          kind: entry.kind,
                          description: entry.description,
                          category: entry.category ?? "",
                          cost_center: entry.cost_center ?? "",
                          amount: String(entry.amount),
                          status: entry.status,
                          due_date: entry.due_date ?? "",
                          payment_method: entry.payment_method ?? "",
                          installment_total: String(entry.installment_total),
                          commission_rate: String(entry.commission_rate),
                          notes: entry.notes ?? "",
                        })
                      }
                    >
                      Editar
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir lançamento"
                      onClick={() => remove.mutate(entry.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="dre" className="mt-4">
            <SectionCard title="DRE simplificada" description="Resultado consolidado do período">
              <dl className="divide-y divide-border">
                <Row label="Receita bruta realizada" value={stats.recebido} />
                <Row label="Receita prevista" value={stats.receber} muted />
                <Row label="Despesas pagas" value={-stats.pago} />
                <Row label="Despesas previstas" value={-stats.pagar} muted />
                <Row label="Comissões previstas" value={-stats.comissoes} muted />
                <Row label="Resultado líquido" value={stats.lucro - stats.comissoes} strong />
              </dl>
            </SectionCard>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar lançamento" : "Novo lançamento"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select
                  value={draft.kind}
                  onValueChange={(value) => setDraft({ ...draft, kind: value as FinanceEntry["kind"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="receita">Receita</SelectItem>
                    <SelectItem value="despesa">Despesa</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={draft.status}
                  onValueChange={(value) => setDraft({ ...draft, status: value as FinanceEntry["status"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FINANCE_STATUSES.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fin-desc">Descrição</Label>
                <Input
                  id="fin-desc"
                  value={draft.description}
                  maxLength={200}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-amount">Valor (R$)</Label>
                <Input
                  id="fin-amount"
                  inputMode="decimal"
                  value={draft.amount}
                  onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-due">Vencimento</Label>
                <Input
                  id="fin-due"
                  type="date"
                  value={draft.due_date}
                  onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-cat">Categoria</Label>
                <Input
                  id="fin-cat"
                  value={draft.category}
                  maxLength={80}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-cc">Centro de custo</Label>
                <Input
                  id="fin-cc"
                  value={draft.cost_center}
                  maxLength={80}
                  onChange={(e) => setDraft({ ...draft, cost_center: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-pay">Forma de pagamento</Label>
                <Input
                  id="fin-pay"
                  value={draft.payment_method}
                  maxLength={40}
                  placeholder="PIX, boleto, cartão…"
                  onChange={(e) => setDraft({ ...draft, payment_method: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-inst">Parcelas</Label>
                <Input
                  id="fin-inst"
                  type="number"
                  min={1}
                  max={60}
                  value={draft.installment_total}
                  disabled={Boolean(draft.id)}
                  onChange={(e) => setDraft({ ...draft, installment_total: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fin-comm">Comissão (%)</Label>
                <Input
                  id="fin-comm"
                  inputMode="decimal"
                  value={draft.commission_rate}
                  onChange={(e) => setDraft({ ...draft, commission_rate: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="fin-notes">Observações</Label>
                <Textarea
                  id="fin-notes"
                  rows={3}
                  maxLength={2000}
                  value={draft.notes}
                  onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={submit} disabled={save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Row({
  label,
  value,
  muted,
  strong,
}: {
  label: string;
  value: number;
  muted?: boolean;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between py-3">
      <dt className={`text-sm ${muted ? "text-muted-foreground" : ""} ${strong ? "font-semibold" : ""}`}>
        {label}
      </dt>
      <dd
        className={`tabular text-sm ${strong ? "font-semibold" : ""} ${
          value < 0 ? "text-destructive" : "text-success"
        }`}
      >
        {formatCurrency(value)}
      </dd>
    </div>
  );
}
