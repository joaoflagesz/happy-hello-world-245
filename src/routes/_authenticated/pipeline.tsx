import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "motion/react";
import { GripVertical } from "lucide-react";
import { toast } from "sonner";
import { useLeads, useMoveStage } from "@/features/leads/api";
import { STAGES, formatPhone, type Lead, type LeadStage } from "@/features/leads/constants";
import { Skeleton } from "@/components/ui/skeleton";

const title = "Pipeline — Prospecta CRM";
const description = "Funil de vendas em kanban: arraste os leads entre etapas e acompanhe a negociação.";

export const Route = createFileRoute("/_authenticated/pipeline")({
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
  component: PipelinePage,
});

function PipelinePage() {
  const { data: leads, isLoading } = useLeads();
  const moveStage = useMoveStage();
  const [dragging, setDragging] = useState<Lead | null>(null);
  const [hovered, setHovered] = useState<LeadStage | null>(null);

  function handleDrop(stage: LeadStage, label: string) {
    setHovered(null);
    if (!dragging || dragging.stage === stage) return;
    moveStage.mutate(
      { id: dragging.id, stage, label },
      { onSuccess: () => toast.success(`${dragging.company_name} → ${label}`) },
    );
    setDragging(null);
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Pipeline</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Arraste os cards entre as etapas — cada movimentação fica registrada no histórico.
        </p>
      </header>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-96 w-72 shrink-0 rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {STAGES.map((stage) => {
            const items = (leads ?? []).filter((lead) => lead.stage === stage.value);
            return (
              <div
                key={stage.value}
                onDragOver={(event) => {
                  event.preventDefault();
                  setHovered(stage.value);
                }}
                onDragLeave={() => setHovered((prev) => (prev === stage.value ? null : prev))}
                onDrop={() => handleDrop(stage.value, stage.label)}
                className={`flex w-72 shrink-0 flex-col rounded-2xl border p-3 transition-colors ${
                  hovered === stage.value
                    ? "border-primary bg-primary/5"
                    : "border-border bg-muted/30"
                }`}
              >
                <div className="mb-3 flex items-center justify-between px-1">
                  <h2 className="text-sm font-semibold tracking-tight">{stage.label}</h2>
                  <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>

                <div className="flex flex-1 flex-col gap-2">
                  {items.map((lead) => (
                    <motion.article
                      key={lead.id}
                      layout
                      draggable
                      onDragStart={() => setDragging(lead)}
                      onDragEnd={() => setDragging(null)}
                      className="surface-card group cursor-grab rounded-xl p-3 active:cursor-grabbing"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium leading-tight">{lead.company_name}</p>
                        <GripVertical className="size-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lead.city ?? "—"} · {lead.category ?? "Sem categoria"}
                      </p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {formatPhone(lead.phone)}
                        </span>
                        <span
                          className={`rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${
                            lead.temperature === "quente"
                              ? "bg-destructive/10 text-destructive"
                              : lead.temperature === "morno"
                                ? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                                : "bg-sky-500/10 text-sky-600 dark:text-sky-400"
                          }`}
                        >
                          {lead.score}
                        </span>
                      </div>
                    </motion.article>
                  ))}

                  {items.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/70 p-4 text-center text-xs text-muted-foreground">
                      Solte um lead aqui
                    </p>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
