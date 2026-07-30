import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { CalendarPlus, MapPin, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLeads } from "@/features/leads/api";
import {
  APPOINTMENT_STATUSES,
  APPOINTMENT_TYPES,
  APPOINTMENT_TYPE_LABEL,
  formatDateTime,
  useAppointments,
  useDeleteAppointment,
  useSaveAppointment,
  type Appointment,
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

const title = "Agenda — Prospecta CRM";
const description =
  "Agende reuniões, visitas e follow-ups com seus leads e acompanhe os próximos compromissos.";

export const Route = createFileRoute("/_authenticated/agenda")({
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
  component: AgendaPage,
});

function toLocalInput(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function AgendaPage() {
  const { data: appointments, isLoading } = useAppointments();
  const { data: leads } = useLeads();
  const save = useSaveAppointment();
  const remove = useDeleteAppointment();
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Appointment | null>(null);

  const groups = useMemo(() => {
    const now = Date.now();
    const list = appointments ?? [];
    return {
      upcoming: list.filter((a) => new Date(a.starts_at).getTime() >= now && a.status === "agendado"),
      past: list
        .filter((a) => new Date(a.starts_at).getTime() < now || a.status !== "agendado")
        .reverse(),
    };
  }, [appointments]);

  function openNew() {
    setEditing(null);
    setOpen(true);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const leadId = String(form.get("lead_id") ?? "");
    const endsAt = String(form.get("ends_at") ?? "");
    save.mutate(
      {
        id: editing?.id,
        values: {
          title: String(form.get("title") ?? "").trim(),
          type: form.get("type") as Appointment["type"],
          status: form.get("status") as Appointment["status"],
          description: String(form.get("description") ?? "").trim() || null,
          location: String(form.get("location") ?? "").trim() || null,
          lead_id: leadId && leadId !== "none" ? leadId : null,
          starts_at: new Date(String(form.get("starts_at"))).toISOString(),
          ends_at: endsAt ? new Date(endsAt).toISOString() : null,
          remind_minutes_before: Number(form.get("remind") ?? 30),
        },
      },
      {
        onSuccess: () => {
          toast.success(editing ? "Compromisso atualizado" : "Compromisso agendado");
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
          <h1 className="text-2xl font-semibold tracking-tight">Agenda</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Reuniões, visitas, ligações e follow-ups com lembrete.
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
            <Button onClick={openNew}>
              <CalendarPlus className="mr-2 size-4" /> Novo compromisso
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editing ? "Editar compromisso" : "Novo compromisso"}</DialogTitle>
              <DialogDescription>Vincule a um lead para manter o histórico completo.</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input id="title" name="title" required defaultValue={editing?.title ?? ""} />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select name="type" defaultValue={editing?.type ?? "reuniao"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_TYPES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editing?.status ?? "agendado"}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {APPOINTMENT_STATUSES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="starts_at">Início</Label>
                  <Input
                    id="starts_at"
                    name="starts_at"
                    type="datetime-local"
                    required
                    defaultValue={toLocalInput(editing?.starts_at) || toLocalInput(new Date().toISOString())}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ends_at">Fim</Label>
                  <Input
                    id="ends_at"
                    name="ends_at"
                    type="datetime-local"
                    defaultValue={toLocalInput(editing?.ends_at)}
                  />
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
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="location">Local</Label>
                  <Input id="location" name="location" defaultValue={editing?.location ?? ""} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="remind">Lembrete (min antes)</Label>
                  <Input
                    id="remind"
                    name="remind"
                    type="number"
                    min={0}
                    defaultValue={editing?.remind_minutes_before ?? 30}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Observações</Label>
                <Textarea id="description" name="description" defaultValue={editing?.description ?? ""} />
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
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Section
            title="Próximos"
            empty="Nenhum compromisso agendado."
            items={groups.upcoming}
            leads={leads ?? []}
            onEdit={(item) => {
              setEditing(item);
              setOpen(true);
            }}
            onDelete={(id) =>
              remove.mutate(id, { onSuccess: () => toast.success("Compromisso removido") })
            }
          />
          <Section
            title="Histórico"
            empty="Nada por aqui ainda."
            items={groups.past}
            leads={leads ?? []}
            onEdit={(item) => {
              setEditing(item);
              setOpen(true);
            }}
            onDelete={(id) =>
              remove.mutate(id, { onSuccess: () => toast.success("Compromisso removido") })
            }
          />
        </div>
      )}
    </div>
  );
}

function Section({
  title: sectionTitle,
  items,
  leads,
  empty,
  onEdit,
  onDelete,
}: {
  title: string;
  items: Appointment[];
  leads: { id: string; company_name: string }[];
  empty: string;
  onEdit: (item: Appointment) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
        {sectionTitle}
      </h2>
      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {empty}
        </p>
      ) : (
        <ul className="space-y-3">
          {items.map((item, index) => {
            const lead = leads.find((l) => l.id === item.lead_id);
            return (
              <motion.li
                key={item.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(index * 0.03, 0.3) }}
                className="glass rounded-2xl border border-border p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <button className="min-w-0 text-left" onClick={() => onEdit(item)}>
                    <p className="truncate text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(item.starts_at)}</p>
                    {lead ? (
                      <p className="mt-1 truncate text-xs text-muted-foreground">{lead.company_name}</p>
                    ) : null}
                    {item.location ? (
                      <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <MapPin className="size-3" /> {item.location}
                      </p>
                    ) : null}
                  </button>
                  <div className="flex shrink-0 items-center gap-2">
                    <Badge variant="secondary">{APPOINTMENT_TYPE_LABEL[item.type]}</Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir"
                      onClick={() => onDelete(item.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
