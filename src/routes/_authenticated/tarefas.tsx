import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { CheckSquare, Clock, Flag, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  TASK_PRIORITIES,
  TASK_STATUSES,
  useDeleteTask,
  useSaveTask,
  useTasks,
  type Task,
} from "@/features/platform/api";
import { useLeads } from "@/features/leads/api";
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

export const Route = createFileRoute("/_authenticated/tarefas")({
  head: () => ({
    meta: [
      { title: "Central de tarefas — Prospecta CRM" },
      {
        name: "description",
        content: "Kanban, lista e calendário de tarefas comerciais com prioridade, prazo e responsável.",
      },
      { property: "og:title", content: "Central de tarefas — Prospecta CRM" },
      {
        property: "og:description",
        content: "Kanban, lista e calendário de tarefas comerciais com prioridade, prazo e responsável.",
      },
    ],
  }),
  component: TasksPage,
});

type Draft = {
  id?: string;
  title: string;
  description: string;
  status: Task["status"];
  priority: Task["priority"];
  due_at: string;
  lead_id: string;
};

const emptyDraft: Draft = {
  title: "",
  description: "",
  status: "pendente",
  priority: "media",
  due_at: "",
  lead_id: "",
};

const PRIORITY_TONE: Record<Task["priority"], string> = {
  baixa: "bg-muted text-muted-foreground",
  media: "bg-info/10 text-info",
  alta: "bg-warning/10 text-warning",
  urgente: "bg-destructive/10 text-destructive",
};

function TasksPage() {
  const { data: tasks, isLoading } = useTasks();
  const { data: leads } = useLeads();
  const save = useSaveTask();
  const remove = useDeleteTask();
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = tasks ?? [];
  const today = new Date().toISOString().slice(0, 10);

  const stats = useMemo(() => {
    const open = list.filter((t) => t.status !== "concluida" && t.status !== "cancelada");
    return {
      total: list.length,
      hoje: open.filter((t) => (t.due_at ?? "").slice(0, 10) === today).length,
      atrasadas: open.filter((t) => t.due_at && t.due_at < new Date().toISOString()).length,
      concluidas: list.filter((t) => t.status === "concluida").length,
    };
  }, [list, today]);

  const byDay = useMemo(() => {
    const map = new Map<string, Task[]>();
    for (const task of list) {
      const key = task.due_at ? task.due_at.slice(0, 10) : "sem-data";
      map.set(key, [...(map.get(key) ?? []), task]);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [list]);

  function submit() {
    if (!draft) return;
    if (!draft.title.trim()) {
      toast.error("Informe um título para a tarefa.");
      return;
    }
    save.mutate(
      {
        id: draft.id,
        values: {
          title: draft.title.trim(),
          description: draft.description.trim() || null,
          status: draft.status,
          priority: draft.priority,
          due_at: draft.due_at ? new Date(draft.due_at).toISOString() : null,
          lead_id: draft.lead_id || null,
        },
      },
      {
        onSuccess: () => {
          toast.success(draft.id ? "Tarefa atualizada." : "Tarefa criada.");
          setDraft(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function move(task: Task, status: Task["status"]) {
    save.mutate({
      id: task.id,
      values: {
        title: task.title,
        status,
        completed_at: status === "concluida" ? new Date().toISOString() : null,
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de tarefas"
        description="Kanban, lista e calendário para nunca perder um follow-up."
        icon={CheckSquare}
        actions={
          <Button onClick={() => setDraft({ ...emptyDraft })}>
            <Plus className="mr-2 size-4" />
            Nova tarefa
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Tarefas" value={stats.total} icon={CheckSquare} index={0} />
        <StatCard label="Para hoje" value={stats.hoje} icon={Clock} accent="info" index={1} />
        <StatCard label="Atrasadas" value={stats.atrasadas} icon={Flag} accent="destructive" index={2} />
        <StatCard label="Concluídas" value={stats.concluidas} icon={CheckSquare} accent="success" index={3} />
      </div>

      {isLoading ? (
        <ListSkeleton rows={4} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="Nenhuma tarefa ainda"
          description="Crie tarefas de follow-up, ligações e visitas para organizar o dia da equipe."
          action={<Button onClick={() => setDraft({ ...emptyDraft })}>Criar primeira tarefa</Button>}
        />
      ) : (
        <Tabs defaultValue="kanban">
          <TabsList>
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="calendario">Calendário</TabsTrigger>
          </TabsList>

          <TabsContent value="kanban" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {TASK_STATUSES.map((status) => {
                const column = list.filter((t) => t.status === status.value);
                return (
                  <div key={status.value} className="rounded-xl border border-border bg-card/50 p-3">
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-sm font-semibold">{status.label}</p>
                      <Badge variant="secondary">{column.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {column.map((task) => (
                        <motion.button
                          key={task.id}
                          layout
                          onClick={() =>
                            setDraft({
                              id: task.id,
                              title: task.title,
                              description: task.description ?? "",
                              status: task.status,
                              priority: task.priority,
                              due_at: task.due_at ? task.due_at.slice(0, 16) : "",
                              lead_id: task.lead_id ?? "",
                            })
                          }
                          className="hover-lift w-full rounded-lg border border-border bg-card p-3 text-left"
                        >
                          <p className="text-sm font-medium leading-tight">{task.title}</p>
                          <div className="mt-2 flex flex-wrap items-center gap-1.5">
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_TONE[task.priority]}`}
                            >
                              {TASK_PRIORITIES.find((p) => p.value === task.priority)?.label}
                            </span>
                            {task.due_at ? (
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(task.due_at).toLocaleString("pt-BR", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </span>
                            ) : null}
                          </div>
                        </motion.button>
                      ))}
                      {column.length === 0 ? (
                        <p className="py-6 text-center text-xs text-muted-foreground">Vazio</p>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="lista" className="mt-4">
            <SectionCard>
              <div className="divide-y divide-border">
                {list.map((task) => (
                  <div key={task.id} className="flex flex-wrap items-center gap-3 py-3">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{task.title}</p>
                      {task.description ? (
                        <p className="truncate text-xs text-muted-foreground">{task.description}</p>
                      ) : null}
                    </div>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${PRIORITY_TONE[task.priority]}`}
                    >
                      {TASK_PRIORITIES.find((p) => p.value === task.priority)?.label}
                    </span>
                    <Select value={task.status} onValueChange={(value) => move(task, value as Task["status"])}>
                      <SelectTrigger className="h-8 w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TASK_STATUSES.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            {s.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Excluir tarefa"
                      onClick={() => remove.mutate(task.id)}
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </SectionCard>
          </TabsContent>

          <TabsContent value="calendario" className="mt-4">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {byDay.map(([day, items]) => (
                <SectionCard
                  key={day}
                  title={
                    day === "sem-data"
                      ? "Sem data definida"
                      : new Date(`${day}T12:00:00`).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          day: "2-digit",
                          month: "long",
                        })
                  }
                >
                  <ul className="space-y-2">
                    {items.map((task) => (
                      <li key={task.id} className="rounded-lg border border-border p-2 text-sm">
                        {task.title}
                      </li>
                    ))}
                  </ul>
                </SectionCard>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar tarefa" : "Nova tarefa"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="task-title">Título</Label>
                <Input
                  id="task-title"
                  value={draft.title}
                  maxLength={160}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="task-desc">Descrição</Label>
                <Textarea
                  id="task-desc"
                  rows={3}
                  maxLength={2000}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(value) => setDraft({ ...draft, status: value as Task["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Prioridade</Label>
                  <Select
                    value={draft.priority}
                    onValueChange={(value) => setDraft({ ...draft, priority: value as Task["priority"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TASK_PRIORITIES.map((p) => (
                        <SelectItem key={p.value} value={p.value}>
                          {p.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="task-due">Prazo</Label>
                  <Input
                    id="task-due"
                    type="datetime-local"
                    value={draft.due_at}
                    onChange={(e) => setDraft({ ...draft, due_at: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Lead vinculado</Label>
                  <Select
                    value={draft.lead_id || "none"}
                    onValueChange={(value) => setDraft({ ...draft, lead_id: value === "none" ? "" : value })}
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
              </div>
            </div>
          ) : null}
          <DialogFooter>
            {draft?.id ? (
              <Button
                variant="outline"
                onClick={() => {
                  remove.mutate(draft.id!);
                  setDraft(null);
                }}
              >
                Excluir
              </Button>
            ) : null}
            <Button onClick={submit} disabled={save.isPending}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
