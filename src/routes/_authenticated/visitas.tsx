import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  MapPinned,
  Plus,
  LogIn,
  LogOut,
  Trash2,
  Navigation,
  CheckCircle2,
} from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState, SectionCard, ListSkeleton, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  VISIT_OUTCOMES,
  VISIT_STATUSES,
  getCurrentPosition,
  useDeleteVisit,
  useSaveVisit,
  useVisits,
  type Visit,
} from "@/features/field/api";
import { useLeads } from "@/features/leads/api";

const DESC =
  "Planeje visitas em campo, faça check-in com GPS e registre o resultado de cada atendimento presencial.";

export const Route = createFileRoute("/_authenticated/visitas")({
  head: () => ({
    meta: [
      { title: "Visitas em campo — Prospecta CRM" },
      { name: "description", content: DESC },
      { property: "og:title", content: "Visitas em campo — Prospecta CRM" },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: VisitsPage,
});

const STATUS_LABEL = Object.fromEntries(VISIT_STATUSES.map((s) => [s.value, s.label])) as Record<string, string>;
const OUTCOME_LABEL = Object.fromEntries(VISIT_OUTCOMES.map((s) => [s.value, s.label])) as Record<string, string>;

function fmt(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

function VisitsPage() {
  const [tab, setTab] = useState("all");
  const { data: visits = [], isLoading } = useVisits(tab);
  const { data: leads = [] } = useLeads();
  const save = useSaveVisit();
  const remove = useDeleteVisit();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Partial<Visit>>({ title: "", status: "agendada" });

  const stats = useMemo(() => {
    const done = visits.filter((v) => v.status === "concluida");
    return {
      total: visits.length,
      scheduled: visits.filter((v) => v.status === "agendada").length,
      done: done.length,
      closed: visits.filter((v) => v.outcome === "fechado").length,
    };
  }, [visits]);

  async function handleSave() {
    if (!form.title?.trim()) {
      toast.error("Informe um título para a visita.");
      return;
    }
    try {
      await save.mutateAsync(form);
      toast.success("Visita salva.");
      setOpen(false);
      setForm({ title: "", status: "agendada" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao salvar visita.");
    }
  }

  async function checkIn(visit: Visit) {
    try {
      const { lat, lng } = await getCurrentPosition();
      await save.mutateAsync({
        id: visit.id,
        status: "em_andamento",
        checked_in_at: new Date().toISOString(),
        checkin_lat: lat,
        checkin_lng: lng,
      });
      toast.success("Check-in registrado com sua localização.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no check-in.");
    }
  }

  async function checkOut(visit: Visit) {
    try {
      const { lat, lng } = await getCurrentPosition();
      const now = new Date();
      const started = visit.checked_in_at ? new Date(visit.checked_in_at) : now;
      await save.mutateAsync({
        id: visit.id,
        status: "concluida",
        checked_out_at: now.toISOString(),
        checkout_lat: lat,
        checkout_lng: lng,
        duration_minutes: Math.max(1, Math.round((now.getTime() - started.getTime()) / 60000)),
      });
      toast.success("Check-out registrado. Visita concluída.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Falha no check-out.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Visitas em campo"
        description="Roteiro de visitas com check-in e check-out por GPS."
        icon={MapPinned}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 size-4" />
            Nova visita
          </Button>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total de visitas" value={stats.total} icon={MapPinned} index={0} />
        <StatCard label="Agendadas" value={stats.scheduled} icon={Navigation} index={1} />
        <StatCard label="Concluídas" value={stats.done} icon={CheckCircle2} index={2} />
        <StatCard label="Negócios fechados" value={stats.closed} icon={CheckCircle2} accent="success" index={3} />
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mb-4">
        <TabsList>
          <TabsTrigger value="all">Todas</TabsTrigger>
          {VISIT_STATUSES.map((s) => (
            <TabsTrigger key={s.value} value={s.value}>
              {s.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <SectionCard title="Agenda de campo" description={`${visits.length} visita(s)`}>
        {isLoading ? (
          <ListSkeleton rows={5} />
        ) : visits.length === 0 ? (
          <EmptyState
            icon={MapPinned}
            title="Nenhuma visita registrada"
            description="Crie a primeira visita e registre o check-in quando chegar no cliente."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus className="mr-2 size-4" />
                Nova visita
              </Button>
            }
          />
        ) : (
          <ul className="space-y-3">
            {visits.map((visit) => (
              <li
                key={visit.id}
                className="flex flex-col gap-3 rounded-xl border border-border p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold">{visit.title}</span>
                    <Badge variant="secondary">{STATUS_LABEL[visit.status]}</Badge>
                    <Badge variant="outline">{OUTCOME_LABEL[visit.outcome]}</Badge>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {[visit.address, visit.city].filter(Boolean).join(", ") || "Sem endereço"} • Agendada:{" "}
                    {fmt(visit.scheduled_for)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Check-in: {fmt(visit.checked_in_at)} • Check-out: {fmt(visit.checked_out_at)}
                    {visit.duration_minutes ? ` • ${visit.duration_minutes} min` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {visit.checkin_lat && visit.checkin_lng ? (
                    <Button variant="outline" size="sm" asChild>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${visit.checkin_lat},${visit.checkin_lng}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Navigation className="mr-2 size-4" />
                        Local
                      </a>
                    </Button>
                  ) : null}
                  {visit.status === "agendada" ? (
                    <Button size="sm" onClick={() => checkIn(visit)}>
                      <LogIn className="mr-2 size-4" />
                      Check-in
                    </Button>
                  ) : null}
                  {visit.status === "em_andamento" ? (
                    <Button size="sm" onClick={() => checkOut(visit)}>
                      <LogOut className="mr-2 size-4" />
                      Check-out
                    </Button>
                  ) : null}
                  <Select
                    value={visit.outcome}
                    onValueChange={(value) =>
                      save.mutate({ id: visit.id, outcome: value as Visit["outcome"] })
                    }
                  >
                    <SelectTrigger className="h-9 w-[170px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {VISIT_OUTCOMES.map((o) => (
                        <SelectItem key={o.value} value={o.value}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Excluir visita"
                    onClick={() => remove.mutate(visit.id)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova visita</DialogTitle>
            <DialogDescription>Programe uma visita presencial e vincule ao lead.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="visit-title">Título</Label>
              <Input
                id="visit-title"
                value={form.title ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Visita comercial — Padaria Central"
              />
            </div>
            <div>
              <Label>Lead vinculado</Label>
              <Select
                value={form.lead_id ?? "none"}
                onValueChange={(value) => {
                  const lead = leads.find((l) => l.id === value);
                  setForm((f) => ({
                    ...f,
                    lead_id: value === "none" ? null : value,
                    address: lead?.address ?? f.address ?? null,
                    city: lead?.city ?? f.city ?? null,
                    state: lead?.state ?? f.state ?? null,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sem vínculo</SelectItem>
                  {leads.slice(0, 200).map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="visit-address">Endereço</Label>
                <Input
                  id="visit-address"
                  value={form.address ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="visit-city">Cidade</Label>
                <Input
                  id="visit-city"
                  value={form.city ?? ""}
                  onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="visit-date">Data e hora</Label>
              <Input
                id="visit-date"
                type="datetime-local"
                value={form.scheduled_for ? String(form.scheduled_for).slice(0, 16) : ""}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    scheduled_for: e.target.value ? new Date(e.target.value).toISOString() : null,
                  }))
                }
              />
            </div>
            <div>
              <Label htmlFor="visit-notes">Observações</Label>
              <Textarea
                id="visit-notes"
                rows={3}
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={save.isPending}>
              Salvar visita
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
