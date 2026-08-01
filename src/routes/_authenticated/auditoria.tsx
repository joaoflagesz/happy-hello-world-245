import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { History, Search } from "lucide-react";
import { PageHeader, EmptyState, ListSkeleton, StatCard } from "@/components/ui-kit";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useActivityLog, type ActivityLog } from "@/features/platform/api";

export const Route = createFileRoute("/_authenticated/auditoria")({
  head: () => ({
    meta: [
      { title: "Auditoria — Prospecta CRM" },
      {
        name: "description",
        content: "Histórico completo de alterações do CRM: quem alterou, quando e o que mudou em cada registro.",
      },
      { property: "og:title", content: "Auditoria — Prospecta CRM" },
      {
        property: "og:description",
        content: "Histórico completo de alterações do CRM: quem alterou, quando e o que mudou em cada registro.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AuditPage,
});

const ACTION_LABEL: Record<string, string> = {
  created: "Criado",
  updated: "Atualizado",
  deleted: "Excluído",
};

const ENTITY_LABEL: Record<string, string> = {
  leads: "Lead",
  companies: "Empresa",
  contacts: "Contato",
  deals: "Negócio",
  proposals: "Proposta",
  tasks: "Tarefa",
  appointments: "Compromisso",
  finance_entries: "Financeiro",
  automations: "Automação",
};

function actionTone(action: string) {
  if (action === "created") return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400";
  if (action === "deleted") return "bg-destructive/15 text-destructive";
  return "bg-primary/15 text-primary";
}

function AuditPage() {
  const { data: logs, isLoading } = useActivityLog();
  const [query, setQuery] = useState("");
  const [action, setAction] = useState("todas");
  const [entity, setEntity] = useState("todas");
  const [expanded, setExpanded] = useState<string | null>(null);

  const entities = useMemo(
    () => [...new Set((logs ?? []).map((log) => log.entity_type))].sort(),
    [logs],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return (logs ?? []).filter((log) => {
      if (action !== "todas" && log.action !== action) return false;
      if (entity !== "todas" && log.entity_type !== entity) return false;
      if (!term) return true;
      return JSON.stringify(log.changes ?? {}).toLowerCase().includes(term) ||
        log.entity_type.toLowerCase().includes(term) ||
        (log.summary ?? "").toLowerCase().includes(term);
    });
  }, [logs, query, action, entity]);

  const stats = useMemo(() => {
    const list = logs ?? [];
    const today = new Date().toDateString();
    return {
      total: list.length,
      hoje: list.filter((log) => new Date(log.created_at).toDateString() === today).length,
      criados: list.filter((log) => log.action === "created").length,
      excluidos: list.filter((log) => log.action === "deleted").length,
    };
  }, [logs]);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Auditoria"
        description="Cada criação, alteração e exclusão registrada automaticamente pelo banco de dados."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Registros" value={stats.total} />
        <StatCard label="Eventos hoje" value={stats.hoje} />
        <StatCard label="Criações" value={stats.criados} />
        <StatCard label="Exclusões" value={stats.excluidos} />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-56 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar no histórico…"
            className="pl-9"
          />
        </div>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Ação" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as ações</SelectItem>
            <SelectItem value="created">Criado</SelectItem>
            <SelectItem value="updated">Atualizado</SelectItem>
            <SelectItem value="deleted">Excluído</SelectItem>
          </SelectContent>
        </Select>
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="Registro" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todos os registros</SelectItem>
            {entities.map((item) => (
              <SelectItem key={item} value={item}>
                {ENTITY_LABEL[item] ?? item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <ListSkeleton rows={8} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={History}
          title="Nenhum registro de auditoria"
          description="Assim que você criar ou editar dados no CRM, tudo aparece aqui com data, autor e valores."
        />
      ) : (
        <div className="surface-card divide-y divide-border rounded-2xl">
          {filtered.map((log) => (
            <AuditRow
              key={log.id}
              log={log}
              expanded={expanded === log.id}
              onToggle={() => setExpanded(expanded === log.id ? null : log.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function AuditRow({
  log,
  expanded,
  onToggle,
}: {
  log: ActivityLog;
  expanded: boolean;
  onToggle: () => void;
}) {
  const changes = (log.changes ?? {}) as Record<string, unknown>;
  const preview = Object.keys(changes).slice(0, 4);

  return (
    <div className="p-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${actionTone(log.action)}`}>
          {ACTION_LABEL[log.action] ?? log.action}
        </span>
        <Badge variant="secondary">{ENTITY_LABEL[log.entity_type] ?? log.entity_type}</Badge>
        <span className="text-sm text-muted-foreground">
          {new Date(log.created_at).toLocaleString("pt-BR")}
        </span>
        {log.summary ? <span className="text-sm">{log.summary}</span> : null}
        <Button variant="ghost" size="sm" className="ml-auto" onClick={onToggle}>
          {expanded ? "Ocultar detalhes" : "Ver detalhes"}
        </Button>
      </div>

      {!expanded && preview.length ? (
        <p className="mt-2 truncate text-xs text-muted-foreground">
          Campos: {preview.join(", ")}
          {Object.keys(changes).length > preview.length ? "…" : ""}
        </p>
      ) : null}

      {expanded ? (
        <div className="mt-3 space-y-1 rounded-lg bg-muted/50 p-3">
          <p className="text-xs text-muted-foreground">
            ID do registro: <span className="font-mono">{log.entity_id ?? "—"}</span>
          </p>
          <p className="text-xs text-muted-foreground">
            Autor: <span className="font-mono">{log.actor_id ?? "sistema"}</span>
          </p>
          <div className="mt-2 grid gap-1 md:grid-cols-2">
            {Object.entries(changes).map(([field, value]) => (
              <div key={field} className="rounded-md bg-background/60 px-2 py-1 text-xs">
                <span className="font-medium">{field}: </span>
                <span className="break-all text-muted-foreground">
                  {value === null || value === undefined
                    ? "—"
                    : typeof value === "object"
                      ? JSON.stringify(value)
                      : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
