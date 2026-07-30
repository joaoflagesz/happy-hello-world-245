import { useEffect, useState } from "react";
import { Link, createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Building2,
  Clock,
  Globe,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Save,
  Star,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAddLeadEvent,
  useLead,
  useLeadEvents,
  useUpdateLead,
} from "@/features/leads/api";
import {
  PRIORITIES,
  SITE_STATUSES,
  SITE_STATUS_LABEL,
  STAGES,
  STAGE_LABEL,
  formatPhone,
  toWhatsappNumber,
  type Lead,
} from "@/features/leads/constants";
import { WhatsappDialog } from "@/features/leads/whatsapp-dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const title = "Detalhe do lead — Prospecta CRM";
const description =
  "Ficha completa do lead: dados de contato, mapa, score, etapa do funil e histórico de interações.";

export const Route = createFileRoute("/_authenticated/leads/$id")({
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
  component: LeadDetailPage,
  errorComponent: () => (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">Não foi possível carregar este lead</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Ele pode ter sido removido ou pertencer a outro usuário.
      </p>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/leads">Voltar para leads</Link>
      </Button>
    </div>
  ),
  notFoundComponent: () => (
    <div className="py-16 text-center">
      <h1 className="text-xl font-semibold">Lead não encontrado</h1>
      <Button asChild variant="outline" className="mt-6">
        <Link to="/leads">Voltar para leads</Link>
      </Button>
    </div>
  ),
});

function LeadDetailPage() {
  const { id } = Route.useParams();
  const { data: lead, isLoading, error } = useLead(id);
  const { data: events } = useLeadEvents(id);
  const updateLead = useUpdateLead();
  const addEvent = useAddLeadEvent();
  const [whatsappLead, setWhatsappLead] = useState<Lead | null>(null);
  const [note, setNote] = useState("");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-40" />
        <Skeleton className="h-28 w-full" />
        <div className="grid gap-4 lg:grid-cols-3">
          <Skeleton className="h-96 lg:col-span-2" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-xl font-semibold">Lead não encontrado</h1>
        <Button asChild variant="outline" className="mt-6">
          <Link to="/leads">Voltar para leads</Link>
        </Button>
      </div>
    );
  }

  function patch(values: Parameters<typeof updateLead.mutate>[0]["values"]) {
    updateLead.mutate(
      { id, values },
      {
        onSuccess: () => toast.success("Lead atualizado."),
        onError: () => toast.error("Não foi possível salvar."),
      },
    );
  }

  function saveNote() {
    if (!note.trim()) return;
    addEvent.mutate(
      { leadId: id, type: "note", title: "Observação adicionada", body: note.trim() },
      {
        onSuccess: () => {
          setNote("");
          toast.success("Observação registrada no histórico.");
        },
        onError: () => toast.error("Não foi possível registrar a observação."),
      },
    );
  }

  const temperatureTone =
    lead.temperature === "quente"
      ? "bg-destructive/10 text-destructive"
      : lead.temperature === "morno"
        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
        : "bg-sky-500/10 text-sky-600 dark:text-sky-400";

  return (
    <div className="space-y-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link to="/leads">
          <ArrowLeft className="mr-2 size-4" />
          Leads
        </Link>
      </Button>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass flex flex-wrap items-start justify-between gap-4 rounded-2xl border border-border p-6"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Building2 className="size-3.5" />
            {lead.category ?? "Sem categoria"}
          </div>
          <h1 className="mt-1 truncate text-2xl font-semibold tracking-tight">
            {lead.company_name}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className={`rounded-lg px-2 py-1 text-xs font-semibold ${temperatureTone}`}>
              Score {lead.score} · {lead.temperature}
            </span>
            <Badge variant="secondary">{STAGE_LABEL[lead.stage]}</Badge>
            <Badge variant="outline">{SITE_STATUS_LABEL[lead.site_status]}</Badge>
            {lead.rating ? (
              <Badge variant="outline" className="gap-1">
                <Star className="size-3" />
                {lead.rating} ({lead.reviews_count ?? 0})
              </Badge>
            ) : null}
          </div>
        </div>

        <Button
          className="shrink-0"
          onClick={() => {
            if (!toWhatsappNumber(lead.whatsapp ?? lead.phone)) {
              toast.error("Este lead não tem telefone válido.");
              return;
            }
            setWhatsappLead(lead);
          }}
        >
          <MessageCircle className="mr-2 size-4" />
          WhatsApp
        </Button>
      </motion.div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <LeadForm lead={lead} onSave={patch} saving={updateLead.isPending} />
          <MapCard lead={lead} />
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <ContactRow icon={Phone} value={formatPhone(lead.phone)} />
              <ContactRow icon={MessageCircle} value={formatPhone(lead.whatsapp ?? lead.phone)} />
              <ContactRow icon={Mail} value={lead.email ?? "—"} href={lead.email ? `mailto:${lead.email}` : undefined} />
              <ContactRow icon={Globe} value={lead.website ?? "Sem site"} href={lead.website ?? undefined} />
              <ContactRow icon={Instagram} value={lead.instagram ?? "—"} href={lead.instagram ?? undefined} />
              <ContactRow
                icon={MapPin}
                value={[lead.address, lead.city, lead.state].filter(Boolean).join(", ") || "—"}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Histórico</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Textarea
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Registrar uma observação…"
                  rows={3}
                  maxLength={2000}
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={saveNote}
                  disabled={!note.trim() || addEvent.isPending}
                >
                  Adicionar ao histórico
                </Button>
              </div>

              <ol className="relative space-y-4 border-l border-border pl-4">
                {events?.length ? (
                  events.map((event) => (
                    <li key={event.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2 rounded-full bg-primary" />
                      <p className="text-sm font-medium">{event.title}</p>
                      {event.body ? (
                        <p className="mt-1 whitespace-pre-wrap text-xs text-muted-foreground">
                          {event.body}
                        </p>
                      ) : null}
                      <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="size-3" />
                        {new Date(event.created_at).toLocaleString("pt-BR")}
                      </p>
                    </li>
                  ))
                ) : (
                  <li className="text-sm text-muted-foreground">Nenhum evento ainda.</li>
                )}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      <WhatsappDialog lead={whatsappLead} onOpenChange={() => setWhatsappLead(null)} />
    </div>
  );
}

function ContactRow({
  icon: Icon,
  value,
  href,
}: {
  icon: typeof Phone;
  value: string;
  href?: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer noopener"
          className="min-w-0 break-words underline-offset-4 hover:underline"
        >
          {value}
        </a>
      ) : (
        <span className="min-w-0 break-words">{value}</span>
      )}
    </div>
  );
}

function LeadForm({
  lead,
  onSave,
  saving,
}: {
  lead: Lead;
  onSave: (values: Record<string, unknown>) => void;
  saving: boolean;
}) {
  const [form, setForm] = useState({
    company_name: lead.company_name,
    contact_name: lead.contact_name ?? "",
    phone: lead.phone ?? "",
    whatsapp: lead.whatsapp ?? "",
    email: lead.email ?? "",
    website: lead.website ?? "",
    instagram: lead.instagram ?? "",
    category: lead.category ?? "",
    city: lead.city ?? "",
    state: lead.state ?? "",
    address: lead.address ?? "",
    notes: lead.notes ?? "",
    stage: lead.stage,
    site_status: lead.site_status,
    priority: lead.priority,
    deal_value: lead.deal_value?.toString() ?? "",
  });

  useEffect(() => {
    setForm({
      company_name: lead.company_name,
      contact_name: lead.contact_name ?? "",
      phone: lead.phone ?? "",
      whatsapp: lead.whatsapp ?? "",
      email: lead.email ?? "",
      website: lead.website ?? "",
      instagram: lead.instagram ?? "",
      category: lead.category ?? "",
      city: lead.city ?? "",
      state: lead.state ?? "",
      address: lead.address ?? "",
      notes: lead.notes ?? "",
      stage: lead.stage,
      site_status: lead.site_status,
      priority: lead.priority,
      deal_value: lead.deal_value?.toString() ?? "",
    });
  }, [lead]);

  function field(key: keyof typeof form) {
    return {
      value: form[key] as string,
      onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
        setForm((prev) => ({ ...prev, [key]: event.target.value })),
    };
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Dados do lead</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Labeled label="Empresa">
            <Input {...field("company_name")} />
          </Labeled>
          <Labeled label="Responsável">
            <Input {...field("contact_name")} />
          </Labeled>
          <Labeled label="Telefone">
            <Input {...field("phone")} />
          </Labeled>
          <Labeled label="WhatsApp">
            <Input {...field("whatsapp")} />
          </Labeled>
          <Labeled label="E-mail">
            <Input type="email" {...field("email")} />
          </Labeled>
          <Labeled label="Site">
            <Input {...field("website")} placeholder="https://" />
          </Labeled>
          <Labeled label="Instagram">
            <Input {...field("instagram")} />
          </Labeled>
          <Labeled label="Categoria">
            <Input {...field("category")} />
          </Labeled>
          <Labeled label="Cidade">
            <Input {...field("city")} />
          </Labeled>
          <Labeled label="Estado">
            <Input {...field("state")} maxLength={40} />
          </Labeled>
          <Labeled label="Endereço">
            <Input {...field("address")} />
          </Labeled>
          <Labeled label="Valor estimado (R$)">
            <Input type="number" min={0} step="0.01" {...field("deal_value")} />
          </Labeled>
          <Labeled label="Etapa">
            <Select
              value={form.stage}
              onValueChange={(value) => setForm((p) => ({ ...p, stage: value as Lead["stage"] }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((stage) => (
                  <SelectItem key={stage.value} value={stage.value}>
                    {stage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
          <Labeled label="Status do site">
            <Select
              value={form.site_status}
              onValueChange={(value) =>
                setForm((p) => ({ ...p, site_status: value as Lead["site_status"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SITE_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.value}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
          <Labeled label="Prioridade">
            <Select
              value={form.priority}
              onValueChange={(value) =>
                setForm((p) => ({ ...p, priority: value as Lead["priority"] }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((priority) => (
                  <SelectItem key={priority.value} value={priority.value}>
                    {priority.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Labeled>
        </div>

        <Labeled label="Observações">
          <Textarea {...field("notes")} rows={4} maxLength={4000} />
        </Labeled>

        <div className="flex justify-end">
          <Button
            disabled={saving}
            onClick={() =>
              onSave({
                company_name: form.company_name.trim(),
                contact_name: form.contact_name.trim() || null,
                phone: form.phone.trim() || null,
                whatsapp: form.whatsapp.trim() || null,
                email: form.email.trim() || null,
                website: form.website.trim() || null,
                instagram: form.instagram.trim() || null,
                category: form.category.trim() || null,
                city: form.city.trim() || null,
                state: form.state.trim() || null,
                address: form.address.trim() || null,
                notes: form.notes.trim() || null,
                stage: form.stage,
                site_status: form.site_status,
                priority: form.priority,
                deal_value: form.deal_value ? Number(form.deal_value) : null,
              })
            }
          >
            <Save className="mr-2 size-4" />
            Salvar alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function Labeled({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}

function MapCard({ lead }: { lead: Lead }) {
  const query =
    lead.latitude && lead.longitude
      ? `${lead.latitude},${lead.longitude}`
      : [lead.company_name, lead.address, lead.city, lead.state].filter(Boolean).join(", ");

  if (!query) return null;

  const bbox =
    lead.latitude && lead.longitude
      ? `${lead.longitude - 0.01}%2C${lead.latitude - 0.008}%2C${lead.longitude + 0.01}%2C${lead.latitude + 0.008}`
      : null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Localização</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {bbox ? (
          <iframe
            title={`Mapa de ${lead.company_name}`}
            loading="lazy"
            className="h-64 w-full rounded-xl border border-border"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lead.latitude}%2C${lead.longitude}`}
          />
        ) : (
          <p className="text-sm text-muted-foreground">
            Sem coordenadas importadas — abra no Google Maps pelo endereço.
          </p>
        )}
        <Button asChild variant="outline" size="sm">
          <a
            href={
              lead.google_maps_url ??
              `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
            }
            target="_blank"
            rel="noreferrer noopener"
          >
            <MapPin className="mr-2 size-4" />
            Abrir no Google Maps
          </a>
        </Button>
      </CardContent>
    </Card>
  );
}
