import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { FileText, Plus, Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLeads } from "@/features/leads/api";
import {
  PROPOSAL_STATUSES,
  PROPOSAL_STATUS_LABEL,
  formatCurrency,
  proposalItemsFrom,
  proposalTotal,
  useDeleteProposal,
  useProposals,
  useSaveProposal,
  type Proposal,
  type ProposalItem,
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

const title = "Propostas — Prospecta CRM";
const description = "Monte propostas comerciais com itens, desconto e validade, e gere o PDF em um clique.";

export const Route = createFileRoute("/_authenticated/propostas")({
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
  component: PropostasPage,
});

const emptyItem: ProposalItem = { description: "", quantity: 1, unit_price: 0 };

function PropostasPage() {
  const { data: proposals, isLoading } = useProposals();
  const { data: leads } = useLeads();
  const save = useSaveProposal();
  const remove = useDeleteProposal();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Proposal | null>(null);
  const [items, setItems] = useState<ProposalItem[]>([emptyItem]);
  const [discount, setDiscount] = useState(0);

  const total = proposalTotal(items, discount);

  function startNew() {
    setEditing(null);
    setItems([emptyItem]);
    setDiscount(0);
    setOpen(true);
  }

  function startEdit(proposal: Proposal) {
    setEditing(proposal);
    const parsed = proposalItemsFrom(proposal.items);
    setItems(parsed.length ? parsed : [emptyItem]);
    setDiscount(Number(proposal.discount ?? 0));
    setOpen(true);
  }

  function updateItem(index: number, patch: Partial<ProposalItem>) {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const leadId = String(form.get("lead_id") ?? "");
    const validUntil = String(form.get("valid_until") ?? "");
    const cleanItems = items.filter((item) => item.description.trim());
    if (cleanItems.length === 0) {
      toast.error("Adicione ao menos um item");
      return;
    }
    save.mutate(
      {
        id: editing?.id,
        values: {
          number: String(form.get("number") ?? "").trim(),
          title: String(form.get("title") ?? "").trim(),
          status: form.get("status") as Proposal["status"],
          notes: String(form.get("notes") ?? "").trim() || null,
          lead_id: leadId && leadId !== "none" ? leadId : null,
          valid_until: validUntil || null,
          discount,
          total: proposalTotal(cleanItems, discount),
          items: cleanItems,
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Proposta atualizada" : "Proposta criada");
          setOpen(false);
          setEditing(null);
        },
        onError: (error) => toast.error((error as Error).message),
      },
    );
  }

  function printProposal(proposal: Proposal) {
    const lead = (leads ?? []).find((l) => l.id === proposal.lead_id);
    const rows = proposalItemsFrom(proposal.items)
      .map(
        (item) =>
          `<tr><td>${escapeHtml(item.description)}</td><td style="text-align:center">${item.quantity}</td><td style="text-align:right">${formatCurrency(item.unit_price)}</td><td style="text-align:right">${formatCurrency(item.quantity * item.unit_price)}</td></tr>`,
      )
      .join("");
    const html = `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Proposta ${escapeHtml(proposal.number)}</title>
<style>
body{font-family:ui-sans-serif,system-ui,sans-serif;color:#111;margin:48px;}
h1{font-size:22px;margin:0 0 4px}
.muted{color:#666;font-size:13px}
table{width:100%;border-collapse:collapse;margin-top:28px;font-size:14px}
th,td{border-bottom:1px solid #e5e5e5;padding:10px 6px}
th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.06em;color:#666}
.total{margin-top:20px;text-align:right;font-size:18px;font-weight:600}
.notes{margin-top:28px;font-size:13px;color:#444;white-space:pre-wrap}
</style></head><body>
<h1>Proposta ${escapeHtml(proposal.number)}</h1>
<p class="muted">${escapeHtml(proposal.title)}</p>
<p class="muted">Cliente: ${escapeHtml(lead?.company_name ?? "—")}${proposal.valid_until ? ` · Válida até ${new Date(proposal.valid_until).toLocaleDateString("pt-BR")}` : ""}</p>
<table><thead><tr><th>Item</th><th style="text-align:center">Qtd</th><th style="text-align:right">Unitário</th><th style="text-align:right">Total</th></tr></thead><tbody>${rows}</tbody></table>
${Number(proposal.discount) > 0 ? `<p class="muted" style="text-align:right;margin-top:12px">Desconto: ${formatCurrency(Number(proposal.discount))}</p>` : ""}
<p class="total">Total: ${formatCurrency(Number(proposal.total))}</p>
${proposal.notes ? `<div class="notes">${escapeHtml(proposal.notes)}</div>` : ""}
</body></html>`;
    const win = window.open("", "_blank");
    if (!win) {
      toast.error("Permita pop-ups para gerar o PDF");
      return;
    }
    win.document.write(html);
    win.document.close();
    win.focus();
    win.print();
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Propostas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Itens, desconto, validade e geração de PDF pronta para enviar.
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
            <Button onClick={startNew}>
              <Plus className="mr-2 size-4" /> Nova proposta
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar proposta" : "Nova proposta"}</DialogTitle>
              <DialogDescription>O total é calculado automaticamente pelos itens.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    name="number"
                    required
                    defaultValue={editing?.number ?? `PROP-${new Date().getFullYear()}-${String(Date.now()).slice(-4)}`}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editing?.status ?? "rascunho"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROPOSAL_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required defaultValue={editing?.title ?? ""} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
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
                  <Label htmlFor="valid_until">Válida até</Label>
                  <Input
                    id="valid_until"
                    name="valid_until"
                    type="date"
                    defaultValue={editing?.valid_until ?? ""}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Itens</Label>
                <div className="space-y-2">
                  {items.map((item, index) => (
                    <div key={index} className="grid grid-cols-12 gap-2">
                      <Input
                        className="col-span-6"
                        placeholder="Descrição"
                        value={item.description}
                        onChange={(e) => updateItem(index, { description: e.target.value })}
                      />
                      <Input
                        className="col-span-2"
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(e) => updateItem(index, { quantity: Number(e.target.value) })}
                      />
                      <Input
                        className="col-span-3"
                        type="number"
                        min={0}
                        step="0.01"
                        value={item.unit_price}
                        onChange={(e) => updateItem(index, { unit_price: Number(e.target.value) })}
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="col-span-1"
                        aria-label="Remover item"
                        onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setItems((prev) => [...prev, { ...emptyItem }])}
                >
                  <Plus className="mr-2 size-4" /> Adicionar item
                </Button>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="discount">Desconto (R$)</Label>
                  <Input
                    id="discount"
                    type="number"
                    min={0}
                    step="0.01"
                    value={discount}
                    onChange={(e) => setDiscount(Number(e.target.value))}
                  />
                </div>
                <div className="flex items-end justify-end">
                  <p className="text-lg font-semibold">Total: {formatCurrency(total)}</p>
                </div>
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

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-40 rounded-2xl" />
          ))}
        </div>
      ) : (proposals ?? []).length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
          Nenhuma proposta criada ainda.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(proposals ?? []).map((proposal) => {
            const lead = (leads ?? []).find((l) => l.id === proposal.lead_id);
            return (
              <article key={proposal.id} className="glass rounded-2xl border border-border p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 text-xs font-mono text-muted-foreground">
                      <FileText className="size-3.5" /> {proposal.number}
                    </p>
                    <h2 className="mt-1 truncate text-sm font-semibold">{proposal.title}</h2>
                    <p className="truncate text-xs text-muted-foreground">{lead?.company_name ?? "—"}</p>
                  </div>
                  <Badge variant={proposal.status === "aceita" ? "default" : "secondary"}>
                    {PROPOSAL_STATUS_LABEL[proposal.status]}
                  </Badge>
                </div>
                <p className="mt-4 text-2xl font-semibold tracking-tight">
                  {formatCurrency(Number(proposal.total))}
                </p>
                <div className="mt-4 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(proposal)}>
                    Editar
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => printProposal(proposal)}>
                    <Printer className="mr-2 size-4" /> PDF
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    aria-label="Excluir"
                    onClick={() =>
                      remove.mutate(proposal.id, { onSuccess: () => toast.success("Proposta removida") })
                    }
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
