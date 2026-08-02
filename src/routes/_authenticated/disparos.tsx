import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  Pause,
  Play,
  Plus,
  QrCode,
  Send,
  ShieldCheck,
  SkipForward,
  Trash2,
  Users,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { EmptyState, ListSkeleton, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLeads } from "@/features/leads/api";
import { formatPhone, toWhatsappNumber } from "@/features/leads/constants";
import {
  CAMPAIGN_STATUS_LABEL,
  TARGET_STATUS_LABEL,
  useAddTargets,
  useCampaigns,
  useCampaignTargets,
  useCreateCampaign,
  useDeleteCampaign,
  useDeleteTarget,
  useUpdateCampaign,
  useUpdateTarget,
  type WaCampaign,
} from "@/features/whatsapp/campaigns";

export const Route = createFileRoute("/_authenticated/disparos")({
  head: () => ({
    meta: [
      { title: "Disparos WhatsApp — Prospecta CRM" },
      {
        name: "description",
        content:
          "Fila semi-automática de mensagens no WhatsApp, com intervalo aleatório, limite diário e pausas para proteger o número.",
      },
      { property: "og:title", content: "Disparos WhatsApp — Prospecta CRM" },
      {
        property: "og:description",
        content:
          "Envie mensagens uma a uma de forma semi-automática, com limites de segurança contra bloqueio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: DisparosPage,
});

const DEFAULT_MESSAGE =
  "Olá {{nome}}, tudo bem? Vi a {{empresa}} aqui em {{cidade}} e queria te mostrar como um site profissional pode trazer mais clientes. Posso te enviar algumas ideias?";

function applyVars(template: string, row: { name: string | null; company: string; city: string | null }) {
  return template
    .replaceAll("{{nome}}", row.name || row.company)
    .replaceAll("{{empresa}}", row.company)
    .replaceAll("{{cidade}}", row.city || "sua região");
}

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function DisparosPage() {
  const { data: campaigns, isLoading } = useCampaigns();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [pickOpen, setPickOpen] = useState(false);

  const list = campaigns ?? [];
  const selected = list.find((c) => c.id === selectedId) ?? list[0] ?? null;

  const { data: targets } = useCampaignTargets(selected?.id ?? null);
  const updateCampaign = useUpdateCampaign();
  const deleteCampaign = useDeleteCampaign();
  const updateTarget = useUpdateTarget();
  const deleteTarget = useDeleteTarget();

  const queue = useMemo(() => (targets ?? []).filter((t) => t.status === "fila"), [targets]);
  const sent = (targets ?? []).filter((t) => t.status === "enviado").length;
  const total = (targets ?? []).length;

  // ---- motor semi-automático ----
  const [running, setRunning] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const timerRef = useRef<number | null>(null);

  const sentToday = selected && selected.last_sent_date === todayISO() ? selected.sent_today : 0;
  const dailyReached = selected ? sentToday >= selected.daily_limit : false;
  const current = queue[0] ?? null;

  useEffect(() => {
    if (!running) return;
    if (countdown <= 0) return;
    timerRef.current = window.setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    };
  }, [running, countdown]);

  useEffect(() => {
    if (!running) setCountdown(0);
  }, [running]);

  useEffect(() => {
    if (running && (!current || dailyReached)) setRunning(false);
  }, [running, current, dailyReached]);

  function nextInterval(campaign: WaCampaign) {
    const min = Math.max(5, campaign.min_interval_seconds);
    const max = Math.max(min, campaign.max_interval_seconds);
    const base = min + Math.floor(Math.random() * (max - min + 1));
    const nextCount = sentToday + 1;
    if (campaign.batch_size > 0 && nextCount % campaign.batch_size === 0) {
      return base + campaign.batch_pause_minutes * 60;
    }
    return base;
  }

  async function handleSend() {
    if (!selected || !current) return;
    const number = toWhatsappNumber(current.phone);
    if (!number) {
      toast.error("Telefone inválido — contato marcado como erro.");
      updateTarget.mutate({ id: current.id, status: "erro", note: "Telefone inválido" });
      return;
    }

    window.open(
      `https://wa.me/${number}?text=${encodeURIComponent(current.message)}`,
      "_blank",
      "noopener,noreferrer",
    );

    updateTarget.mutate({ id: current.id, status: "enviado", sent_at: new Date().toISOString() });

    const isNewDay = selected.last_sent_date !== todayISO();
    updateCampaign.mutate({
      id: selected.id,
      sent_today: isNewDay ? 1 : selected.sent_today + 1,
      last_sent_date: todayISO(),
      status: "em_andamento",
    });

    if (current.lead_id) {
      const now = new Date().toISOString();
      const { data: userData } = await supabase.auth.getUser();
      void supabase.from("leads").update({ last_contact_at: now }).eq("id", current.lead_id);
      void supabase.from("lead_events").insert({
        lead_id: current.lead_id,
        actor_id: userData.user?.id ?? null,
        type: "whatsapp",
        title: `Disparo: ${selected.name}`,
        body: current.message,
      });
    }

    if (running) setCountdown(nextInterval(selected));
  }

  function handleSkip() {
    if (!current) return;
    updateTarget.mutate({ id: current.id, status: "pulado" });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Disparos WhatsApp"
        description="Fila semi-automática: o sistema prepara a mensagem, respeita o intervalo e o limite diário — você só confirma o envio."
        icon={Zap}
        actions={
          <Button onClick={() => setNewOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nova campanha
          </Button>
        }
      />

      <SectionCard title="Conexão do WhatsApp" description="Como o envio funciona por aqui">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-border p-4">
            <QrCode className="mb-2 size-5 text-primary" />
            <p className="text-sm font-semibold">1. Entre no WhatsApp Web</p>
            <p className="text-xs text-muted-foreground">
              Abra o WhatsApp Web no navegador e leia o QR Code com o celular. Mantenha a aba aberta.
            </p>
            <Button asChild variant="outline" size="sm" className="mt-3">
              <a href="https://web.whatsapp.com" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 size-4" />
                Abrir WhatsApp Web
              </a>
            </Button>
          </div>
          <div className="rounded-lg border border-border p-4">
            <Send className="mb-2 size-5 text-primary" />
            <p className="text-sm font-semibold">2. Monte a fila</p>
            <p className="text-xs text-muted-foreground">
              Escolha os leads, a mensagem com variáveis e os limites. Cada contato recebe a mensagem já
              personalizada.
            </p>
          </div>
          <div className="rounded-lg border border-border p-4">
            <ShieldCheck className="mb-2 size-5 text-primary" />
            <p className="text-sm font-semibold">3. Envie com segurança</p>
            <p className="text-xs text-muted-foreground">
              Um contato por vez, com intervalo aleatório, pausa a cada lote e limite diário — reduz muito o
              risco de bloqueio do número.
            </p>
          </div>
        </div>
      </SectionCard>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Zap}
          title="Nenhuma campanha de disparo"
          description="Crie uma campanha, defina a mensagem e os limites de segurança para começar."
          action={<Button onClick={() => setNewOpen(true)}>Criar campanha</Button>}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-4">
            <StatCard label="Campanhas" value={list.length} icon={Zap} index={0} />
            <StatCard label="Na fila" value={queue.length} icon={Users} accent="info" index={1} />
            <StatCard label="Enviados" value={sent} icon={CheckCircle2} accent="success" index={2} />
            <StatCard
              label="Hoje / limite"
              value={selected ? `${sentToday}/${selected.daily_limit}` : "—"}
              icon={ShieldCheck}
              accent={dailyReached ? "warning" : undefined}
              index={3}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
            <SectionCard title="Campanhas">
              <div className="space-y-2">
                {list.map((campaign) => (
                  <button
                    key={campaign.id}
                    onClick={() => {
                      setSelectedId(campaign.id);
                      setRunning(false);
                    }}
                    className={`hover-lift w-full rounded-lg border p-3 text-left ${
                      selected?.id === campaign.id ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate text-sm font-semibold">{campaign.name}</p>
                      <Badge variant="secondary" className="text-[10px]">
                        {CAMPAIGN_STATUS_LABEL[campaign.status]}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {campaign.min_interval_seconds}s–{campaign.max_interval_seconds}s · {campaign.daily_limit}
                      /dia · pausa {campaign.batch_pause_minutes}min a cada {campaign.batch_size}
                    </p>
                  </button>
                ))}
              </div>
            </SectionCard>

            {selected ? (
              <div className="space-y-6">
                <SectionCard
                  title="Painel de envio"
                  description={`${sent} de ${total} contatos concluídos`}
                  actions={
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setPickOpen(true)}>
                        <Plus className="mr-2 size-4" />
                        Adicionar leads
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm("Excluir esta campanha e sua fila?")) {
                            deleteCampaign.mutate(selected.id);
                            setSelectedId(null);
                          }
                        }}
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  }
                >
                  <Progress value={total ? (sent / total) * 100 : 0} className="mb-4" />

                  {dailyReached ? (
                    <div className="rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm">
                      Limite diário de {selected.daily_limit} envios atingido. Continue amanhã para manter o
                      número seguro.
                    </div>
                  ) : current ? (
                    <div className="space-y-4 rounded-lg border border-border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold">
                            {current.contact_name || formatPhone(current.phone)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatPhone(current.phone)}</p>
                        </div>
                        <Badge variant="secondary">Próximo da fila</Badge>
                      </div>

                      <Textarea
                        rows={4}
                        value={current.message}
                        maxLength={4000}
                        onChange={(e) =>
                          updateTarget.mutate({ id: current.id, message: e.target.value })
                        }
                      />

                      <div className="flex flex-wrap items-center gap-2">
                        <Button onClick={handleSend} disabled={countdown > 0}>
                          <Send className="mr-2 size-4" />
                          {countdown > 0 ? `Aguarde ${countdown}s` : "Enviar no WhatsApp"}
                        </Button>
                        <Button variant="outline" onClick={handleSkip}>
                          <SkipForward className="mr-2 size-4" />
                          Pular
                        </Button>
                        <Button
                          variant={running ? "secondary" : "outline"}
                          onClick={() => setRunning((value) => !value)}
                        >
                          {running ? (
                            <>
                              <Pause className="mr-2 size-4" />
                              Parar modo automático
                            </>
                          ) : (
                            <>
                              <Play className="mr-2 size-4" />
                              Modo semi-automático
                            </>
                          )}
                        </Button>
                        {running ? (
                          <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="size-3" />
                            {countdown > 0
                              ? `próximo contato em ${countdown}s`
                              : "pronto para o próximo envio"}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={CheckCircle2}
                      title="Fila vazia"
                      description="Adicione leads à campanha para continuar os disparos."
                      action={<Button onClick={() => setPickOpen(true)}>Adicionar leads</Button>}
                    />
                  )}
                </SectionCard>

                <SectionCard title="Fila da campanha">
                  <ScrollArea className="h-[360px] pr-2">
                    <div className="space-y-2">
                      {(targets ?? []).map((target) => (
                        <div
                          key={target.id}
                          className="flex items-center justify-between gap-3 rounded-lg border border-border p-3"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">
                              {target.contact_name || formatPhone(target.phone)}
                            </p>
                            <p className="truncate text-xs text-muted-foreground">{target.message}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <Badge
                              variant={target.status === "enviado" ? "default" : "secondary"}
                              className="text-[10px]"
                            >
                              {TARGET_STATUS_LABEL[target.status]}
                            </Badge>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                deleteTarget.mutate({ id: target.id, campaignId: selected.id })
                              }
                            >
                              <Trash2 className="size-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {(targets ?? []).length === 0 ? (
                        <p className="py-8 text-center text-sm text-muted-foreground">
                          Nenhum contato nesta campanha ainda.
                        </p>
                      ) : null}
                    </div>
                  </ScrollArea>
                </SectionCard>
              </div>
            ) : null}
          </div>
        </>
      )}

      <NewCampaignDialog open={newOpen} onOpenChange={setNewOpen} onCreated={setSelectedId} />
      {selected ? (
        <PickLeadsDialog open={pickOpen} onOpenChange={setPickOpen} campaign={selected} />
      ) : null}
    </div>
  );
}

function NewCampaignDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (id: string) => void;
}) {
  const create = useCreateCampaign();
  const [form, setForm] = useState({
    name: "",
    message: DEFAULT_MESSAGE,
    min_interval_seconds: 25,
    max_interval_seconds: 60,
    daily_limit: 80,
    batch_size: 20,
    batch_pause_minutes: 15,
  });

  function handleCreate() {
    if (!form.name.trim()) {
      toast.error("Dê um nome para a campanha.");
      return;
    }
    if (form.max_interval_seconds < form.min_interval_seconds) {
      toast.error("O intervalo máximo deve ser maior que o mínimo.");
      return;
    }
    create.mutate(
      { ...form, name: form.name.trim() },
      {
        onSuccess: (data) => {
          toast.success("Campanha criada.");
          onCreated(data.id);
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova campanha de disparo</DialogTitle>
          <DialogDescription>
            Variáveis disponíveis: {"{{nome}}"}, {"{{empresa}}"}, {"{{cidade}}"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="camp-name">Nome</Label>
            <Input
              id="camp-name"
              maxLength={120}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="camp-msg">Mensagem</Label>
            <Textarea
              id="camp-msg"
              rows={5}
              maxLength={4000}
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="camp-min">Intervalo mínimo (s)</Label>
              <Input
                id="camp-min"
                type="number"
                min={5}
                value={form.min_interval_seconds}
                onChange={(e) => setForm({ ...form, min_interval_seconds: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-max">Intervalo máximo (s)</Label>
              <Input
                id="camp-max"
                type="number"
                min={5}
                value={form.max_interval_seconds}
                onChange={(e) => setForm({ ...form, max_interval_seconds: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-daily">Limite por dia</Label>
              <Input
                id="camp-daily"
                type="number"
                min={1}
                value={form.daily_limit}
                onChange={(e) => setForm({ ...form, daily_limit: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-batch">Envios por lote</Label>
              <Input
                id="camp-batch"
                type="number"
                min={0}
                value={form.batch_size}
                onChange={(e) => setForm({ ...form, batch_size: Number(e.target.value) })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="camp-pause">Pausa entre lotes (min)</Label>
              <Input
                id="camp-pause"
                type="number"
                min={0}
                value={form.batch_pause_minutes}
                onChange={(e) => setForm({ ...form, batch_pause_minutes: Number(e.target.value) })}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleCreate} disabled={create.isPending}>
            Criar campanha
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PickLeadsDialog({
  open,
  onOpenChange,
  campaign,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: WaCampaign;
}) {
  const [search, setSearch] = useState("");
  const { data: leads } = useLeads({ search: search || undefined });
  const { data: targets } = useCampaignTargets(campaign.id);
  const addTargets = useAddTargets();
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const existing = new Set((targets ?? []).map((t) => t.lead_id).filter(Boolean) as string[]);
  const options = (leads ?? []).filter(
    (lead) => !existing.has(lead.id) && toWhatsappNumber(lead.whatsapp ?? lead.phone),
  );
  const selectedIds = Object.keys(checked).filter((id) => checked[id]);

  function handleAdd() {
    const rows = options
      .filter((lead) => checked[lead.id])
      .map((lead) => ({
        lead_id: lead.id,
        contact_name: lead.contact_name ?? lead.company_name,
        phone: (lead.whatsapp ?? lead.phone) as string,
        message: applyVars(campaign.message, {
          name: lead.contact_name,
          company: lead.company_name,
          city: lead.city,
        }),
      }));
    if (rows.length === 0) {
      toast.error("Selecione ao menos um lead.");
      return;
    }
    addTargets.mutate(
      { campaignId: campaign.id, rows },
      {
        onSuccess: () => {
          toast.success(`${rows.length} contatos adicionados à fila.`);
          setChecked({});
          onOpenChange(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Adicionar leads à fila</DialogTitle>
          <DialogDescription>
            Só aparecem leads com telefone válido e que ainda não estão nesta campanha.
          </DialogDescription>
        </DialogHeader>
        <Input
          placeholder="Buscar por empresa, cidade, telefone…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <ScrollArea className="h-[360px] pr-2">
          <div className="space-y-2">
            {options.map((lead) => (
              <label
                key={lead.id}
                className="flex cursor-pointer items-center gap-3 rounded-lg border border-border p-3"
              >
                <Checkbox
                  checked={Boolean(checked[lead.id])}
                  onCheckedChange={(value) =>
                    setChecked((prev) => ({ ...prev, [lead.id]: Boolean(value) }))
                  }
                />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{lead.company_name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatPhone(lead.whatsapp ?? lead.phone)} · {lead.city ?? "—"}
                  </p>
                </div>
              </label>
            ))}
            {options.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Nenhum lead disponível com telefone válido.
              </p>
            ) : null}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button onClick={handleAdd} disabled={addTargets.isPending}>
            Adicionar {selectedIds.length ? `(${selectedIds.length})` : ""}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
