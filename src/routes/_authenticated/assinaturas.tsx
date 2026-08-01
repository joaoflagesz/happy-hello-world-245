import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Clock,
  Copy,
  FileSignature,
  Plus,
  Send,
  Trash2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState, SectionCard, StatCard, StaggerItem, StaggerList } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import { useLeads } from "@/features/leads/api";
import {
  SIGNATURE_STATUSES,
  useDeleteSignatureRequest,
  useSaveSignatureRequest,
  useSignatureEvents,
  useSignatureRequests,
  type SignatureRequest,
} from "@/features/office/api";

const DESCRIPTION =
  "Envie contratos para aceite online com assinatura digital, registro de data, IP e dispositivo do signatário.";

export const Route = createFileRoute("/_authenticated/assinaturas")({
  head: () => ({
    meta: [
      { title: "Assinatura digital — Prospecta CRM" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "Assinatura digital — Prospecta CRM" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SignaturesPage,
});

const emptyForm = {
  title: "",
  content: "",
  signer_name: "",
  signer_email: "",
  signer_phone: "",
  lead_id: "",
  expires_at: "",
};

function tone(status: string) {
  if (status === "assinado") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (status === "enviado") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (status === "recusado" || status === "expirado") return "bg-destructive/10 text-destructive";
  return "bg-muted text-muted-foreground";
}

function SignaturesPage() {
  const { data: requests, isLoading } = useSignatureRequests();
  const { data: leads } = useLeads();
  const save = useSaveSignatureRequest();
  const remove = useDeleteSignatureRequest();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<SignatureRequest | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [detail, setDetail] = useState<SignatureRequest | null>(null);
  const { data: events } = useSignatureEvents(detail?.id ?? null);

  const stats = useMemo(() => {
    const rows = requests ?? [];
    return {
      total: rows.length,
      pendentes: rows.filter((r) => r.status === "enviado").length,
      assinados: rows.filter((r) => r.status === "assinado").length,
      recusados: rows.filter((r) => r.status === "recusado").length,
    };
  }, [requests]);

  function start(request?: SignatureRequest) {
    setEditing(request ?? null);
    setForm({
      title: request?.title ?? "",
      content: request?.content ?? "",
      signer_name: request?.signer_name ?? "",
      signer_email: request?.signer_email ?? "",
      signer_phone: request?.signer_phone ?? "",
      lead_id: request?.lead_id ?? "",
      expires_at: request?.expires_at ? request.expires_at.slice(0, 10) : "",
    });
    setOpen(true);
  }

  async function submit(status: "rascunho" | "enviado") {
    if (!form.title.trim() || !form.content.trim() || !form.signer_name.trim()) {
      toast.error("Preencha título, conteúdo e nome do signatário");
      return;
    }
    try {
      await save.mutateAsync({
        id: editing?.id,
        title: form.title.trim(),
        content: form.content,
        signer_name: form.signer_name.trim(),
        signer_email: form.signer_email.trim() || null,
        signer_phone: form.signer_phone.trim() || null,
        lead_id: form.lead_id || null,
        expires_at: form.expires_at ? new Date(`${form.expires_at}T23:59:59`).toISOString() : null,
        status,
      });
      setOpen(false);
      setForm(emptyForm);
      setEditing(null);
      toast.success(status === "enviado" ? "Contrato liberado para assinatura" : "Rascunho salvo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    }
  }

  async function copyLink(request: SignatureRequest) {
    const url = `${window.location.origin}/assinar/${request.public_token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link de assinatura copiado");
    } catch {
      toast.message(url);
    }
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="Assinatura digital"
        description={DESCRIPTION}
        icon={FileSignature}
        actions={
          <Button onClick={() => start()}>
            <Plus className="mr-2 size-4" /> Novo contrato
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Contratos" value={stats.total} icon={FileSignature} index={0} />
        <StatCard label="Aguardando" value={stats.pendentes} icon={Clock} accent="warning" index={1} />
        <StatCard label="Assinados" value={stats.assinados} icon={CheckCircle2} accent="success" index={2} />
        <StatCard label="Recusados" value={stats.recusados} icon={XCircle} accent="danger" index={3} />
      </div>

      <SectionCard title="Contratos" description="Acompanhe o aceite online em tempo real">
        {isLoading ? (
          <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
        ) : (requests ?? []).length === 0 ? (
          <EmptyState
            icon={FileSignature}
            title="Nenhum contrato criado"
            description="Crie um contrato, envie o link e receba o aceite com validade jurídica registrada."
            action={
              <Button onClick={() => start()}>
                <Plus className="mr-2 size-4" /> Criar contrato
              </Button>
            }
          />
        ) : (
          <StaggerList className="divide-y divide-border">
            {(requests ?? []).map((request) => (
              <StaggerItem key={request.id}>
                <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium">{request.title}</p>
                      <Badge variant="secondary" className={tone(request.status)}>
                        {SIGNATURE_STATUSES.find((s) => s.value === request.status)?.label ?? request.status}
                      </Badge>
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {request.signer_name}
                      {request.signed_at
                        ? ` · assinado em ${new Date(request.signed_at).toLocaleString("pt-BR")}`
                        : request.expires_at
                          ? ` · válido até ${new Date(request.expires_at).toLocaleDateString("pt-BR")}`
                          : ""}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {request.status === "rascunho" ? (
                      <Button
                        size="sm"
                        onClick={() => save.mutate({ id: request.id, status: "enviado" })}
                      >
                        <Send className="mr-2 size-4" /> Liberar
                      </Button>
                    ) : (
                      <Button size="sm" variant="ghost" onClick={() => void copyLink(request)}>
                        <Copy className="mr-2 size-4" /> Link
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setDetail(request)}>
                      Detalhes
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => start(request)}>
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                      onClick={() => remove.mutate(request.id)}
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                </div>
              </StaggerItem>
            ))}
          </StaggerList>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar contrato" : "Novo contrato"}</DialogTitle>
            <DialogDescription>
              Ao liberar, um link exclusivo é gerado para o cliente assinar online.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Título</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Contrato de criação de site"
              />
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Lead vinculado</Label>
                <Select
                  value={form.lead_id || "none"}
                  onValueChange={(v) => {
                    const lead = leads?.find((l) => l.id === v);
                    setForm((prev) => ({
                      ...prev,
                      lead_id: v === "none" ? "" : v,
                      signer_name: prev.signer_name || lead?.contact_name || lead?.company_name || "",
                      signer_email: prev.signer_email || lead?.email || "",
                    }));
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Nenhum" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    {(leads ?? []).slice(0, 200).map((lead) => (
                      <SelectItem key={lead.id} value={lead.id}>
                        {lead.company_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Validade</Label>
                <Input
                  type="date"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                />
              </div>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <div>
                <Label>Signatário</Label>
                <Input
                  value={form.signer_name}
                  onChange={(e) => setForm({ ...form, signer_name: e.target.value })}
                />
              </div>
              <div>
                <Label>E-mail</Label>
                <Input
                  value={form.signer_email}
                  onChange={(e) => setForm({ ...form, signer_email: e.target.value })}
                />
              </div>
              <div>
                <Label>Telefone</Label>
                <Input
                  value={form.signer_phone}
                  onChange={(e) => setForm({ ...form, signer_phone: e.target.value })}
                />
              </div>
            </div>
            <div>
              <Label>Conteúdo do contrato</Label>
              <Textarea
                rows={10}
                value={form.content}
                onChange={(e) => setForm({ ...form, content: e.target.value })}
                placeholder="Cláusulas, escopo, prazos e valores…"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => submit("rascunho")}>
              Salvar rascunho
            </Button>
            <Button onClick={() => submit("enviado")}>
              <Send className="mr-2 size-4" /> Liberar para assinatura
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(detail)} onOpenChange={(v) => !v && setDetail(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{detail?.title}</DialogTitle>
            <DialogDescription>Trilha de auditoria da assinatura</DialogDescription>
          </DialogHeader>
          {detail ? (
            <div className="space-y-3 text-sm">
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs text-muted-foreground">Link público</p>
                <div className="mt-1 flex items-center gap-2">
                  <code className="truncate text-xs">/assinar/{detail.public_token}</code>
                  <Button size="sm" variant="ghost" onClick={() => void copyLink(detail)}>
                    <Copy className="size-4" />
                  </Button>
                </div>
                <Link
                  to="/assinar/$token"
                  params={{ token: detail.public_token }}
                  target="_blank"
                  className="mt-2 inline-block text-xs text-primary underline"
                >
                  Abrir página de assinatura
                </Link>
              </div>
              {detail.signed_at ? (
                <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                  <p className="font-medium text-emerald-600 dark:text-emerald-400">
                    Assinado por {detail.signed_name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(detail.signed_at).toLocaleString("pt-BR")} · IP {detail.signed_ip ?? "—"}
                  </p>
                  <p className="mt-1 break-all text-[11px] text-muted-foreground">
                    {detail.signed_user_agent}
                  </p>
                </div>
              ) : null}
              <div className="space-y-2">
                {(events ?? []).map((event) => (
                  <div key={event.id} className="rounded-lg border border-border p-3 text-xs">
                    <p className="font-medium capitalize">{event.action}</p>
                    <p className="text-muted-foreground">
                      {new Date(event.created_at).toLocaleString("pt-BR")}
                      {event.detail ? ` · ${event.detail}` : ""}
                    </p>
                  </div>
                ))}
                {(events ?? []).length === 0 ? (
                  <p className="text-xs text-muted-foreground">Nenhum evento registrado ainda.</p>
                ) : null}
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
