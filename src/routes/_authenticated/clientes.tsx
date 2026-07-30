import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { useLeads } from "@/features/leads/api";
import {
  DEAL_STATUSES,
  DEAL_STATUS_LABEL,
  formatCurrency,
  useDeals,
  useDeleteDeal,
  useSaveDeal,
  type Deal,
} from "@/features/crm/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const title = "Clientes e vendas — Prospecta CRM";
const description =
  "Controle das vendas fechadas, negociações em aberto e receita gerada pela prospecção.";

export const Route = createFileRoute("/_authenticated/clientes")({
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
  component: ClientesPage,
});

function ClientesPage() {
  const { data: deals, isLoading } = useDeals();
  const { data: leads } = useLeads();
  const save = useSaveDeal();
  const remove = useDeleteDeal();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Deal | null>(null);

  const kpis = useMemo(() => {
    const list = deals ?? [];
    const won = list.filter((d) => d.status === "ganha");
    const openDeals = list.filter((d) => d.status === "aberta");
    const revenue = won.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
    const pipeline = openDeals.reduce((sum, d) => sum + Number(d.amount ?? 0), 0);
    const closed = list.filter((d) => d.status !== "aberta").length;
    return {
      revenue,
      pipeline,
      clients: won.length,
      conversion: closed ? Math.round((won.length / closed) * 100) : 0,
      ticket: won.length ? revenue / won.length : 0,
    };
  }, [deals]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const leadId = String(form.get("lead_id") ?? "");
    const status = form.get("status") as Deal["status"];
    const closedAt = String(form.get("closed_at") ?? "");
    save.mutate(
      {
        id: editing?.id,
        values: {
          title: String(form.get("title") ?? "").trim(),
          amount: Number(form.get("amount") ?? 0),
          status,
          notes: String(form.get("notes") ?? "").trim() || null,
          lead_id: leadId && leadId !== "none" ? leadId : null,
          closed_at: closedAt
            ? new Date(closedAt).toISOString()
            : status !== "aberta"
              ? new Date().toISOString()
              : null,
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Venda atualizada" : "Venda registrada");
          setOpen(false);
          setEditing(null);
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Clientes e vendas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Registre negociações, acompanhe receita e taxa de conversão.
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(next) => {
            setOpen(next);
            if (!next) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button onClick={() => setEditing(null)}>
              <Plus className="mr-2 size-4" /> Nova venda
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar venda" : "Nova venda"}</DialogTitle>
              <DialogDescription>Vincule ao lead de origem para medir o funil.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Descrição</Label>
                <Input id="title" name="title" required defaultValue={editing?.title ?? ""} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="amount">Valor (R$)</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    min={0}
                    required
                    defaultValue={editing?.amount ?? 0}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editing?.status ?? "aberta"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DEAL_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Lead</Label>
                <Select name="lead_id" defaultValue={editing?.lead_id ?? "none"}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sem lead" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Sem lead</SelectItem>
                    {(leads ?? []).map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="closed_at">Data de fechamento</Label>
                <Input
                  id="closed_at"
                  name="closed_at"
                  type="date"
                  defaultValue={editing?.closed_at ? editing.closed_at.slice(0, 10) : ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Observações</Label>
                <Textarea id="notes" name="notes" defaultValue={editing?.notes ?? ""} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={save.isPending}>
                  {save.isPending ? "Salvando…" : "Salvar"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi label="Receita fechada" value={formatCurrency(kpis.revenue)} />
        <Kpi label="Em negociação" value={formatCurrency(kpis.pipeline)} />
        <Kpi label="Clientes" value={String(kpis.clients)} />
        <Kpi label="Conversão" value={`${kpis.conversion}%`} hint={`Ticket ${formatCurrency(kpis.ticket)}`} />
      </div>

      <div className="glass overflow-hidden rounded-2xl border border-border">
        {isLoading ? (
          <div className="space-y-2 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 rounded-lg" />
            ))}
          </div>
        ) : (deals ?? []).length === 0 ? (
          <p className="p-10 text-center text-sm text-muted-foreground">
            Nenhuma venda registrada ainda.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Venda</TableHead>
                <TableHead>Lead</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(deals ?? []).map((deal) => {
                const lead = (leads ?? []).find((l) => l.id === deal.lead_id);
                return (
                  <TableRow
                    key={deal.id}
                    className="cursor-pointer"
                    onClick={() => {
                      setEditing(deal);
                      setOpen(true);
                    }}
                  >
                    <TableCell className="font-medium">{deal.title}</TableCell>
                    <TableCell className="text-muted-foreground">{lead?.company_name ?? "—"}</TableCell>
                    <TableCell className="font-mono">{formatCurrency(Number(deal.amount))}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          deal.status === "ganha"
                            ? "default"
                            : deal.status === "perdida"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {DEAL_STATUS_LABEL[deal.status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir"
                        onClick={(event) => {
                          event.stopPropagation();
                          remove.mutate(deal.id, { onSuccess: () => toast.success("Venda removida") });
                        }}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}

function Kpi({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="glass rounded-2xl border border-border p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
        <TrendingUp className="size-4 text-primary" />
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
