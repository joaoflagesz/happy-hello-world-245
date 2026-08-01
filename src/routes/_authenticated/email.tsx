import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Clock,
  Inbox,
  Mail,
  PenLine,
  Plus,
  Send,
  Signature,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState, SectionCard, StatCard, StaggerItem, StaggerList } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  EMAIL_CATEGORIES,
  EMAIL_STATUSES,
  applyVariables,
  useDeleteEmail,
  useDeleteEmailSignature,
  useDeleteEmailTemplate,
  useEmailSignatures,
  useEmailTemplates,
  useEmails,
  useSaveEmail,
  useSaveEmailSignature,
  useSaveEmailTemplate,
  type EmailMessage,
  type EmailSignature,
  type EmailTemplate,
} from "@/features/office/api";

const DESCRIPTION =
  "Central de e-mail do Prospecta: escreva, agende, use modelos com variáveis e mantenha assinaturas padronizadas.";

export const Route = createFileRoute("/_authenticated/email")({
  head: () => ({
    meta: [
      { title: "E-mail — Prospecta CRM" },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: "E-mail — Prospecta CRM" },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmailPage,
});

const VARIABLES = [
  "{{empresa}}",
  "{{contato}}",
  "{{cidade}}",
  "{{categoria}}",
  "{{telefone}}",
  "{{meu_nome}}",
];

const emptyDraft = {
  to_address: "",
  cc_address: "",
  subject: "",
  body: "",
  lead_id: "",
  scheduled_for: "",
};

function statusLabel(value: string) {
  return EMAIL_STATUSES.find((s) => s.value === value)?.label ?? value;
}

function statusTone(value: string) {
  if (value === "enviado") return "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400";
  if (value === "agendado") return "bg-amber-500/10 text-amber-600 dark:text-amber-400";
  if (value === "erro") return "bg-destructive/10 text-destructive";
  if (value === "recebido") return "bg-sky-500/10 text-sky-600 dark:text-sky-400";
  return "bg-muted text-muted-foreground";
}

function EmailPage() {
  const { data: emails, isLoading } = useEmails();
  const { data: templates } = useEmailTemplates();
  const { data: signatures } = useEmailSignatures();
  const { data: leads } = useLeads();

  const saveEmail = useSaveEmail();
  const deleteEmail = useDeleteEmail();

  const [composeOpen, setComposeOpen] = useState(false);
  const [draft, setDraft] = useState(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>("todos");

  const list = useMemo(() => {
    const rows = emails ?? [];
    if (filter === "todos") return rows;
    if (filter === "favoritos") return rows.filter((e) => e.is_starred);
    return rows.filter((e) => e.status === filter);
  }, [emails, filter]);

  const stats = useMemo(() => {
    const rows = emails ?? [];
    return {
      total: rows.length,
      enviados: rows.filter((e) => e.status === "enviado").length,
      agendados: rows.filter((e) => e.status === "agendado").length,
      rascunhos: rows.filter((e) => e.status === "rascunho").length,
    };
  }, [emails]);

  function openCompose(base?: Partial<EmailMessage>) {
    setEditingId(base?.id ?? null);
    setDraft({
      to_address: base?.to_address ?? "",
      cc_address: base?.cc_address ?? "",
      subject: base?.subject ?? "",
      body: base?.body ?? "",
      lead_id: base?.lead_id ?? "",
      scheduled_for: base?.scheduled_for ? base.scheduled_for.slice(0, 16) : "",
    });
    setComposeOpen(true);
  }

  function applyTemplate(template: EmailTemplate) {
    const lead = leads?.find((l) => l.id === draft.lead_id);
    const vars = {
      empresa: lead?.company_name ?? "",
      contato: lead?.contact_name ?? "",
      cidade: lead?.city ?? "",
      categoria: lead?.category ?? "",
      telefone: lead?.phone ?? "",
      meu_nome: "",
    };
    const defaultSignature = signatures?.find((s) => s.is_default);
    setDraft((prev) => ({
      ...prev,
      subject: applyVariables(template.subject, vars),
      body:
        applyVariables(template.body, vars) +
        (defaultSignature ? `\n\n--\n${defaultSignature.content}` : ""),
    }));
    toast.success(`Modelo "${template.name}" aplicado`);
  }

  async function persist(status: "rascunho" | "agendado" | "enviado") {
    if (!draft.to_address.trim()) {
      toast.error("Informe o destinatário");
      return;
    }
    if (!draft.subject.trim()) {
      toast.error("Informe o assunto");
      return;
    }
    if (status === "agendado" && !draft.scheduled_for) {
      toast.error("Escolha data e hora do agendamento");
      return;
    }
    try {
      await saveEmail.mutateAsync({
        id: editingId ?? undefined,
        to_address: draft.to_address.trim(),
        cc_address: draft.cc_address.trim() || null,
        subject: draft.subject.trim(),
        body: draft.body,
        lead_id: draft.lead_id || null,
        direction: "saida",
        status,
        scheduled_for: draft.scheduled_for ? new Date(draft.scheduled_for).toISOString() : null,
        sent_at: status === "enviado" ? new Date().toISOString() : null,
      });
      setComposeOpen(false);
      setDraft(emptyDraft);
      setEditingId(null);
      toast.success(
        status === "enviado"
          ? "E-mail registrado como enviado"
          : status === "agendado"
            ? "E-mail agendado"
            : "Rascunho salvo",
      );
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar");
    }
  }

  function openMailClient(email: EmailMessage) {
    const params = new URLSearchParams({ subject: email.subject, body: email.body });
    if (email.cc_address) params.set("cc", email.cc_address);
    window.open(`mailto:${email.to_address}?${params.toString()}`, "_blank");
  }

  return (
    <div className="mx-auto w-full max-w-7xl">
      <PageHeader
        title="E-mail"
        description={DESCRIPTION}
        icon={Mail}
        actions={
          <Button onClick={() => openCompose()}>
            <PenLine className="mr-2 size-4" /> Escrever
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Mensagens" value={stats.total} icon={Inbox} index={0} />
        <StatCard label="Enviados" value={stats.enviados} icon={Send} accent="success" index={1} />
        <StatCard label="Agendados" value={stats.agendados} icon={Clock} accent="warning" index={2} />
        <StatCard label="Rascunhos" value={stats.rascunhos} icon={PenLine} index={3} />
      </div>

      <Tabs defaultValue="caixa" className="space-y-4">
        <TabsList>
          <TabsTrigger value="caixa">Caixa</TabsTrigger>
          <TabsTrigger value="modelos">Modelos</TabsTrigger>
          <TabsTrigger value="assinaturas">Assinaturas</TabsTrigger>
        </TabsList>

        <TabsContent value="caixa">
          <SectionCard
            title="Mensagens"
            description="Histórico de e-mails do seu funil"
            actions={
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger className="w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="favoritos">Favoritos</SelectItem>
                  {EMAIL_STATUSES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            }
          >
            {isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Carregando…</p>
            ) : list.length === 0 ? (
              <EmptyState
                icon={Mail}
                title="Nenhum e-mail por aqui"
                description="Escreva a primeira mensagem ou crie modelos para agilizar sua prospecção."
                action={
                  <Button onClick={() => openCompose()}>
                    <Plus className="mr-2 size-4" /> Escrever e-mail
                  </Button>
                }
              />
            ) : (
              <StaggerList className="divide-y divide-border">
                {list.map((email) => (
                  <StaggerItem key={email.id}>
                    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <button
                            aria-label="Favoritar"
                            onClick={() =>
                              saveEmail.mutate({ id: email.id, is_starred: !email.is_starred })
                            }
                            className="text-muted-foreground transition-colors hover:text-amber-500"
                          >
                            <Star
                              className={`size-4 ${email.is_starred ? "fill-amber-400 text-amber-500" : ""}`}
                            />
                          </button>
                          <p className="truncate text-sm font-medium">{email.subject}</p>
                          <Badge variant="secondary" className={statusTone(email.status)}>
                            {statusLabel(email.status)}
                          </Badge>
                        </div>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          Para {email.to_address}
                          {email.scheduled_for
                            ? ` · agendado para ${new Date(email.scheduled_for).toLocaleString("pt-BR")}`
                            : ` · ${new Date(email.created_at).toLocaleString("pt-BR")}`}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openMailClient(email)}>
                          <Send className="mr-2 size-4" /> Abrir
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openCompose(email)}>
                          <PenLine className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteEmail.mutate(email.id)}
                          className="text-destructive"
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
        </TabsContent>

        <TabsContent value="modelos">
          <TemplatesPanel templates={templates ?? []} onUse={(t) => { openCompose(); applyTemplate(t); }} />
        </TabsContent>

        <TabsContent value="assinaturas">
          <SignaturesPanel signatures={signatures ?? []} />
        </TabsContent>
      </Tabs>

      <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar e-mail" : "Novo e-mail"}</DialogTitle>
            <DialogDescription>
              Use modelos e variáveis para personalizar automaticamente a mensagem.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-3">
            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Para</Label>
                <Input
                  value={draft.to_address}
                  onChange={(e) => setDraft({ ...draft, to_address: e.target.value })}
                  placeholder="contato@empresa.com.br"
                />
              </div>
              <div>
                <Label>Cópia (opcional)</Label>
                <Input
                  value={draft.cc_address}
                  onChange={(e) => setDraft({ ...draft, cc_address: e.target.value })}
                />
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2">
              <div>
                <Label>Lead vinculado</Label>
                <Select
                  value={draft.lead_id || "none"}
                  onValueChange={(v) => {
                    const lead = leads?.find((l) => l.id === v);
                    setDraft((prev) => ({
                      ...prev,
                      lead_id: v === "none" ? "" : v,
                      to_address: prev.to_address || lead?.email || "",
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
                <Label>Agendar para</Label>
                <Input
                  type="datetime-local"
                  value={draft.scheduled_for}
                  onChange={(e) => setDraft({ ...draft, scheduled_for: e.target.value })}
                />
              </div>
            </div>

            {(templates ?? []).length > 0 ? (
              <div>
                <Label>Modelo</Label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(templates ?? []).map((t) => (
                    <Button key={t.id} type="button" variant="outline" size="sm" onClick={() => applyTemplate(t)}>
                      {t.name}
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            <div>
              <Label>Assunto</Label>
              <Input
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
              />
            </div>

            <div>
              <Label>Mensagem</Label>
              <Textarea
                rows={9}
                value={draft.body}
                onChange={(e) => setDraft({ ...draft, body: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Variáveis disponíveis: {VARIABLES.join(" ")}
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => persist("rascunho")}>
              Salvar rascunho
            </Button>
            <Button variant="secondary" onClick={() => persist("agendado")}>
              <Clock className="mr-2 size-4" /> Agendar
            </Button>
            <Button onClick={() => persist("enviado")}>
              <Send className="mr-2 size-4" /> Registrar envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TemplatesPanel({
  templates,
  onUse,
}: {
  templates: EmailTemplate[];
  onUse: (template: EmailTemplate) => void;
}) {
  const save = useSaveEmailTemplate();
  const remove = useDeleteEmailTemplate();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmailTemplate | null>(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "", category: "geral" });

  function start(template?: EmailTemplate) {
    setEditing(template ?? null);
    setForm({
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      body: template?.body ?? "",
      category: template?.category ?? "geral",
    });
    setOpen(true);
  }

  async function submit() {
    if (!form.name.trim() || !form.subject.trim()) {
      toast.error("Nome e assunto são obrigatórios");
      return;
    }
    try {
      await save.mutateAsync({ id: editing?.id, ...form });
      setOpen(false);
      toast.success("Modelo salvo");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    }
  }

  return (
    <SectionCard
      title="Modelos de e-mail"
      description="Textos prontos com variáveis automáticas"
      actions={
        <Button size="sm" onClick={() => start()}>
          <Plus className="mr-2 size-4" /> Novo modelo
        </Button>
      }
    >
      {templates.length === 0 ? (
        <EmptyState
          icon={PenLine}
          title="Nenhum modelo criado"
          description="Crie modelos de prospecção, follow-up e envio de proposta."
        />
      ) : (
        <StaggerList className="grid gap-3 md:grid-cols-2">
          {templates.map((t) => (
            <StaggerItem key={t.id}>
              <div className="rounded-xl border border-border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{t.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{t.subject}</p>
                  </div>
                  <Badge variant="secondary">
                    {EMAIL_CATEGORIES.find((c) => c.value === t.category)?.label ?? t.category}
                  </Badge>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-muted-foreground">
                  {t.body}
                </p>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" onClick={() => onUse(t)}>
                    Usar
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => start(t)}>
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => remove.mutate(t.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
            </StaggerItem>
          ))}
        </StaggerList>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar modelo" : "Novo modelo"}</DialogTitle>
            <DialogDescription>Use variáveis como {"{{empresa}}"} e {"{{contato}}"}.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Categoria</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EMAIL_CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Assunto</Label>
              <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            </div>
            <div>
              <Label>Mensagem</Label>
              <Textarea rows={8} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}

function SignaturesPanel({ signatures }: { signatures: EmailSignature[] }) {
  const save = useSaveEmailSignature();
  const remove = useDeleteEmailSignature();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmailSignature | null>(null);
  const [form, setForm] = useState({ name: "", content: "", is_default: false });

  function start(signature?: EmailSignature) {
    setEditing(signature ?? null);
    setForm({
      name: signature?.name ?? "",
      content: signature?.content ?? "",
      is_default: signature?.is_default ?? false,
    });
    setOpen(true);
  }

  async function submit() {
    if (!form.name.trim() || !form.content.trim()) {
      toast.error("Preencha nome e conteúdo");
      return;
    }
    try {
      await save.mutateAsync({ id: editing?.id, ...form });
      setOpen(false);
      toast.success("Assinatura salva");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erro ao salvar");
    }
  }

  return (
    <SectionCard
      title="Assinaturas"
      description="Rodapé aplicado automaticamente nos modelos"
      actions={
        <Button size="sm" onClick={() => start()}>
          <Plus className="mr-2 size-4" /> Nova assinatura
        </Button>
      }
    >
      {signatures.length === 0 ? (
        <EmptyState
          icon={Signature}
          title="Nenhuma assinatura"
          description="Crie sua assinatura profissional para padronizar os envios."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {signatures.map((s) => (
            <div key={s.id} className="rounded-xl border border-border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{s.name}</p>
                {s.is_default ? <Badge>Padrão</Badge> : null}
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-sans text-xs text-muted-foreground">
                {s.content}
              </pre>
              <div className="mt-3 flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => start(s)}>
                  Editar
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={() => remove.mutate(s.id)}
                >
                  <Trash2 className="size-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar assinatura" : "Nova assinatura"}</DialogTitle>
            <DialogDescription>Nome, cargo, telefone e site da sua empresa.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-3">
            <div>
              <Label>Nome</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <Label>Conteúdo</Label>
              <Textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border border-border p-3">
              <div>
                <p className="text-sm font-medium">Usar como padrão</p>
                <p className="text-xs text-muted-foreground">Aplicada automaticamente nos modelos</p>
              </div>
              <Switch
                checked={form.is_default}
                onCheckedChange={(v) => setForm({ ...form, is_default: v })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={submit}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SectionCard>
  );
}
