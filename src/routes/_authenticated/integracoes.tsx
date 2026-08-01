import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plug, Plus, Copy, Trash2, Send, KeyRound, Webhook as WebhookIcon, Download } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, SectionCard, EmptyState, ListSkeleton, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  WEBHOOK_EVENTS,
  useApiKeys,
  useCreateApiKey,
  useDeleteApiKey,
  useDeleteWebhook,
  useRevokeApiKey,
  useSaveWebhook,
  useTestWebhook,
  useWebhookDeliveries,
  useWebhooks,
} from "@/features/field/api";
import { useLeads } from "@/features/leads/api";
import { useCompanies, useTasks, useFinanceEntries } from "@/features/platform/api";
import { cn } from "@/lib/utils";

const DESC =
  "Integrações do Prospecta: chaves de API, webhooks de eventos em tempo real e backup completo dos dados.";

export const Route = createFileRoute("/_authenticated/integracoes")({
  head: () => ({
    meta: [
      { title: "Integrações e API — Prospecta CRM" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Integrações e API — Prospecta CRM" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: IntegrationsPage,
});

function download(filename: string, content: string, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escape(r[h])).join(","))].join("\n");
}

function IntegrationsPage() {
  const keys = useApiKeys();
  const createKey = useCreateApiKey();
  const revokeKey = useRevokeApiKey();
  const deleteKey = useDeleteApiKey();
  const hooks = useWebhooks();
  const saveHook = useSaveWebhook();
  const deleteHook = useDeleteWebhook();
  const testHook = useTestWebhook();
  const deliveries = useWebhookDeliveries();

  const { data: leads = [] } = useLeads();
  const { data: companies = [] } = useCompanies();
  const { data: tasks = [] } = useTasks();
  const { data: finance = [] } = useFinanceEntries();

  const [keyName, setKeyName] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [hookOpen, setHookOpen] = useState(false);
  const [hookForm, setHookForm] = useState<{ name: string; url: string; events: string[] }>({
    name: "",
    url: "",
    events: [],
  });

  async function handleCreateKey() {
    if (!keyName.trim()) return toast.error("Dê um nome para a chave.");
    try {
      const raw = await createKey.mutateAsync(keyName.trim());
      setNewKey(raw);
      setKeyName("");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao criar chave.");
    }
  }

  async function handleSaveHook() {
    if (!hookForm.name.trim() || !hookForm.url.trim()) return toast.error("Informe nome e URL.");
    try {
      await saveHook.mutateAsync(hookForm);
      toast.success("Webhook criado.");
      setHookOpen(false);
      setHookForm({ name: "", url: "", events: [] });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar webhook.");
    }
  }

  function exportBackup() {
    const payload = {
      exported_at: new Date().toISOString(),
      leads,
      companies,
      tasks,
      finance_entries: finance,
    };
    download(`prospecta-backup-${new Date().toISOString().slice(0, 10)}.json`, JSON.stringify(payload, null, 2));
    toast.success("Backup completo exportado.");
  }

  return (
    <div>
      <PageHeader
        title="Integrações e API"
        description="Conecte o Prospecta a outras ferramentas e mantenha seus dados seguros."
        icon={Plug}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Chaves ativas" value={(keys.data ?? []).filter((k) => !k.revoked_at).length} icon={KeyRound} index={0} />
        <StatCard label="Webhooks" value={hooks.data?.length ?? 0} icon={WebhookIcon} accent="info" index={1} />
        <StatCard label="Disparos registrados" value={deliveries.data?.length ?? 0} icon={Send} accent="warning" index={2} />
        <StatCard label="Registros exportáveis" value={leads.length + companies.length + tasks.length + finance.length} icon={Download} accent="success" index={3} />
      </div>

      <Tabs defaultValue="keys">
        <TabsList className="mb-4">
          <TabsTrigger value="keys">Chaves de API</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="backup">Backup e exportação</TabsTrigger>
        </TabsList>

        <TabsContent value="keys">
          <SectionCard title="Chaves de API" description="Autentique integrações externas. A chave completa é exibida uma única vez.">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row">
              <Input
                placeholder="Nome da chave (ex.: Integração n8n)"
                value={keyName}
                onChange={(e) => setKeyName(e.target.value)}
              />
              <Button onClick={handleCreateKey} disabled={createKey.isPending}>
                <Plus className="mr-2 size-4" />
                Gerar chave
              </Button>
            </div>

            {keys.isLoading ? (
              <ListSkeleton rows={3} />
            ) : (keys.data ?? []).length === 0 ? (
              <EmptyState icon={KeyRound} title="Nenhuma chave criada" description="Gere uma chave para integrar sistemas externos." />
            ) : (
              <ul className="space-y-2">
                {(keys.data ?? []).map((k) => (
                  <li key={k.id} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{k.name}</p>
                        {k.revoked_at ? <Badge variant="destructive">revogada</Badge> : <Badge variant="secondary">ativa</Badge>}
                      </div>
                      <p className="truncate font-mono text-xs text-muted-foreground">{k.key_prefix}••••••••••••</p>
                    </div>
                    {!k.revoked_at ? (
                      <Button variant="outline" size="sm" onClick={() => revokeKey.mutate(k.id)}>
                        Revogar
                      </Button>
                    ) : null}
                    <Button variant="ghost" size="icon" aria-label="Excluir chave" onClick={() => deleteKey.mutate(k.id)}>
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="webhooks">
          <SectionCard
            title="Webhooks"
            description="Receba eventos do CRM em tempo real no n8n, Make, Zapier ou no seu servidor."
            actions={
              <Button onClick={() => setHookOpen(true)}>
                <Plus className="mr-2 size-4" />
                Novo webhook
              </Button>
            }
          >
            {hooks.isLoading ? (
              <ListSkeleton rows={3} />
            ) : (hooks.data ?? []).length === 0 ? (
              <EmptyState icon={WebhookIcon} title="Nenhum webhook configurado" description="Cadastre uma URL para receber eventos." />
            ) : (
              <ul className="space-y-2">
                {(hooks.data ?? []).map((h) => (
                  <li key={h.id} className="flex flex-col gap-3 rounded-xl border border-border p-3 md:flex-row md:items-center">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium">{h.name}</p>
                        <Badge variant={h.is_active ? "secondary" : "outline"}>{h.is_active ? "ativo" : "pausado"}</Badge>
                        {typeof h.last_status === "number" ? (
                          <Badge variant="outline">HTTP {h.last_status}</Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-xs text-muted-foreground">{h.url}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {h.events.length ? h.events.join(", ") : "Todos os eventos"} • {h.delivery_count} disparo(s)
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Switch
                        checked={h.is_active}
                        onCheckedChange={(checked) => saveHook.mutate({ id: h.id, is_active: checked })}
                        aria-label="Ativar webhook"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          void navigator.clipboard.writeText(h.secret ?? "");
                          toast.success("Segredo copiado.");
                        }}
                      >
                        <Copy className="mr-2 size-4" />
                        Segredo
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => testHook.mutate(h)} disabled={testHook.isPending}>
                        <Send className="mr-2 size-4" />
                        Testar
                      </Button>
                      <Button variant="ghost" size="icon" aria-label="Excluir webhook" onClick={() => deleteHook.mutate(h.id)}>
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>

          <SectionCard className="mt-4" title="Histórico de disparos" description="Últimos 100 envios registrados.">
            {(deliveries.data ?? []).length === 0 ? (
              <EmptyState icon={Send} title="Nenhum disparo ainda" description="Use o botão Testar para validar seu endpoint." />
            ) : (
              <ul className="space-y-2">
                {(deliveries.data ?? []).map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-3 rounded-lg border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{d.event}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {new Date(d.created_at).toLocaleString("pt-BR")} • {d.response}
                      </p>
                    </div>
                    <Badge variant={d.status && d.status >= 200 && d.status < 300 ? "secondary" : "destructive"}>
                      {d.status ?? "—"}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </TabsContent>

        <TabsContent value="backup">
          <SectionCard title="Backup e exportação" description="Exporte seus dados a qualquer momento, sem travas de fornecedor.">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={exportBackup} className="justify-start">
                <Download className="mr-2 size-4" />
                Backup completo (JSON)
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  download("leads.csv", toCsv(leads as unknown as Record<string, unknown>[]), "text/csv");
                  toast.success("Leads exportados em CSV.");
                }}
              >
                <Download className="mr-2 size-4" />
                Leads (CSV)
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  download("empresas.csv", toCsv(companies as unknown as Record<string, unknown>[]), "text/csv");
                  toast.success("Empresas exportadas em CSV.");
                }}
              >
                <Download className="mr-2 size-4" />
                Empresas (CSV)
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => {
                  download("financeiro.csv", toCsv(finance as unknown as Record<string, unknown>[]), "text/csv");
                  toast.success("Financeiro exportado em CSV.");
                }}
              >
                <Download className="mr-2 size-4" />
                Financeiro (CSV)
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Os arquivos são gerados no seu navegador com os dados que você tem permissão de acessar.
            </p>
          </SectionCard>
        </TabsContent>
      </Tabs>

      <Dialog open={hookOpen} onOpenChange={setHookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo webhook</DialogTitle>
            <DialogDescription>Escolha os eventos que serão enviados para a sua URL.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="hook-name">Nome</Label>
              <Input
                id="hook-name"
                value={hookForm.name}
                onChange={(e) => setHookForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Automação n8n"
              />
            </div>
            <div>
              <Label htmlFor="hook-url">URL de destino</Label>
              <Input
                id="hook-url"
                value={hookForm.url}
                onChange={(e) => setHookForm((f) => ({ ...f, url: e.target.value }))}
                placeholder="https://seu-servidor.com/webhook"
              />
            </div>
            <div>
              <Label>Eventos</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {WEBHOOK_EVENTS.map((ev) => {
                  const active = hookForm.events.includes(ev.value);
                  return (
                    <button
                      key={ev.value}
                      type="button"
                      onClick={() =>
                        setHookForm((f) => ({
                          ...f,
                          events: active ? f.events.filter((e) => e !== ev.value) : [...f.events, ev.value],
                        }))
                      }
                      className={cn(
                        "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                        active ? "border-primary bg-primary/10 text-primary" : "hover:bg-accent",
                      )}
                    >
                      {ev.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setHookOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveHook} disabled={saveHook.isPending}>
              Criar webhook
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(newKey)} onOpenChange={(o) => !o && setNewKey(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Chave criada</DialogTitle>
            <DialogDescription>Copie agora — ela não será exibida novamente.</DialogDescription>
          </DialogHeader>
          <code className="block break-all rounded-lg border border-border bg-muted p-3 font-mono text-xs">
            {newKey}
          </code>
          <DialogFooter>
            <Button
              onClick={() => {
                void navigator.clipboard.writeText(newKey ?? "");
                toast.success("Chave copiada.");
                setNewKey(null);
              }}
            >
              <Copy className="mr-2 size-4" />
              Copiar e fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
