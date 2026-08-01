import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "motion/react";
import { ArrowDown, Plus, Trash2, Workflow, Zap } from "lucide-react";
import { toast } from "sonner";
import {
  AUTOMATION_ACTIONS,
  AUTOMATION_TRIGGERS,
  actionsFrom,
  conditionsFrom,
  useAutomations,
  useDeleteAutomation,
  useSaveAutomation,
  type Automation,
  type AutomationAction,
  type AutomationCondition,
} from "@/features/platform/api";
import { EmptyState, ListSkeleton, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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

export const Route = createFileRoute("/_authenticated/automacoes")({
  head: () => ({
    meta: [
      { title: "Automações — Prospecta CRM" },
      {
        name: "description",
        content: "Construtor visual de automações no formato Quando → Se → Então para o seu funil de vendas.",
      },
      { property: "og:title", content: "Automações — Prospecta CRM" },
      {
        property: "og:description",
        content: "Construtor visual de automações no formato Quando → Se → Então para o seu funil de vendas.",
      },
    ],
  }),
  component: AutomationsPage,
});

type Draft = {
  id?: string;
  name: string;
  description: string;
  status: Automation["status"];
  trigger_type: string;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
};

const emptyDraft: Draft = {
  name: "",
  description: "",
  status: "rascunho",
  trigger_type: "lead_criado",
  conditions: [],
  actions: [{ type: "criar_tarefa", config: { valor: "" } }],
};

const CONDITION_FIELDS = [
  { value: "stage", label: "Etapa do funil" },
  { value: "temperature", label: "Temperatura" },
  { value: "site_status", label: "Status do site" },
  { value: "city", label: "Cidade" },
  { value: "score", label: "Score" },
  { value: "source", label: "Origem" },
];

const OPERATORS = [
  { value: "igual", label: "é igual a" },
  { value: "diferente", label: "é diferente de" },
  { value: "contem", label: "contém" },
  { value: "maior", label: "é maior que" },
  { value: "menor", label: "é menor que" },
];

function AutomationsPage() {
  const { data: automations, isLoading } = useAutomations();
  const save = useSaveAutomation();
  const remove = useDeleteAutomation();
  const [draft, setDraft] = useState<Draft | null>(null);

  const list = automations ?? [];
  const active = list.filter((a) => a.status === "ativa").length;
  const runs = list.reduce((acc, a) => acc + (a.run_count ?? 0), 0);

  function submit() {
    if (!draft) return;
    if (!draft.name.trim()) {
      toast.error("Dê um nome à automação.");
      return;
    }
    if (draft.actions.length === 0) {
      toast.error("Adicione pelo menos uma ação.");
      return;
    }
    save.mutate(
      {
        id: draft.id,
        values: {
          name: draft.name.trim(),
          description: draft.description.trim() || null,
          status: draft.status,
          trigger_type: draft.trigger_type,
          trigger_config: {},
          conditions: draft.conditions,
          actions: draft.actions,
        },
      },
      {
        onSuccess: () => {
          toast.success(draft.id ? "Automação atualizada." : "Automação criada.");
          setDraft(null);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  function toggleStatus(automation: Automation) {
    save.mutate({
      id: automation.id,
      values: {
        name: automation.name,
        trigger_type: automation.trigger_type,
        trigger_config: automation.trigger_config,
        conditions: automation.conditions,
        actions: automation.actions,
        status: automation.status === "ativa" ? "pausada" : "ativa",
      },
    });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Automações"
        description="Construtor visual: Quando acontecer isso → se a condição bater → então execute."
        icon={Workflow}
        actions={
          <Button onClick={() => setDraft({ ...emptyDraft, actions: [{ type: "criar_tarefa", config: {} }] })}>
            <Plus className="mr-2 size-4" />
            Nova automação
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="Automações" value={list.length} icon={Workflow} index={0} />
        <StatCard label="Ativas" value={active} icon={Zap} accent="success" index={1} />
        <StatCard label="Execuções" value={runs} icon={Zap} accent="info" index={2} />
      </div>

      {isLoading ? (
        <ListSkeleton rows={3} />
      ) : list.length === 0 ? (
        <EmptyState
          icon={Workflow}
          title="Nenhuma automação criada"
          description="Crie fluxos como: novo lead → criar tarefa → notificar vendedor → mudar etapa."
          action={<Button onClick={() => setDraft({ ...emptyDraft })}>Criar automação</Button>}
        />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {list.map((automation, index) => {
            const flowActions = actionsFrom(automation.actions);
            const flowConditions = conditionsFrom(automation.conditions);
            return (
              <motion.div
                key={automation.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.04 }}
              >
                <SectionCard
                  title={automation.name}
                  description={automation.description ?? undefined}
                  actions={
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={automation.status === "ativa"}
                        onCheckedChange={() => toggleStatus(automation)}
                        aria-label="Ativar automação"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setDraft({
                            id: automation.id,
                            name: automation.name,
                            description: automation.description ?? "",
                            status: automation.status,
                            trigger_type: automation.trigger_type,
                            conditions: flowConditions,
                            actions: flowActions,
                          })
                        }
                      >
                        Editar
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        aria-label="Excluir automação"
                        onClick={() => remove.mutate(automation.id)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  }
                >
                  <div className="space-y-2">
                    <FlowNode
                      tone="trigger"
                      label="Quando"
                      text={
                        AUTOMATION_TRIGGERS.find((t) => t.value === automation.trigger_type)?.label ??
                        automation.trigger_type
                      }
                    />
                    {flowConditions.map((condition, i) => (
                      <FlowNode
                        key={`${condition.field}-${i}`}
                        tone="condition"
                        label="Se"
                        text={`${CONDITION_FIELDS.find((f) => f.value === condition.field)?.label ?? condition.field} ${
                          OPERATORS.find((o) => o.value === condition.operator)?.label ?? condition.operator
                        } "${condition.value}"`}
                      />
                    ))}
                    {flowActions.map((action, i) => (
                      <FlowNode
                        key={`${action.type}-${i}`}
                        tone="action"
                        label="Então"
                        text={AUTOMATION_ACTIONS.find((a) => a.value === action.type)?.label ?? action.type}
                      />
                    ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <Badge variant={automation.status === "ativa" ? "default" : "secondary"}>
                      {automation.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {automation.run_count ?? 0} execuções
                    </span>
                  </div>
                </SectionCard>
              </motion.div>
            );
          })}
        </div>
      )}

      <Dialog open={Boolean(draft)} onOpenChange={(open) => !open && setDraft(null)}>
        <DialogContent className="max-h-[88vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft?.id ? "Editar automação" : "Nova automação"}</DialogTitle>
          </DialogHeader>
          {draft ? (
            <div className="space-y-5">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="auto-name">Nome</Label>
                  <Input
                    id="auto-name"
                    value={draft.name}
                    maxLength={120}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={draft.status}
                    onValueChange={(value) => setDraft({ ...draft, status: value as Automation["status"] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="rascunho">Rascunho</SelectItem>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="pausada">Pausada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="auto-desc">Descrição</Label>
                <Textarea
                  id="auto-desc"
                  rows={2}
                  maxLength={500}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Quando (gatilho)</Label>
                <Select
                  value={draft.trigger_type}
                  onValueChange={(value) => setDraft({ ...draft, trigger_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {AUTOMATION_TRIGGERS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Se (condições)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDraft({
                        ...draft,
                        conditions: [...draft.conditions, { field: "stage", operator: "igual", value: "" }],
                      })
                    }
                  >
                    <Plus className="mr-1 size-3" />
                    Condição
                  </Button>
                </div>
                {draft.conditions.map((condition, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <Select
                      value={condition.field}
                      onValueChange={(value) => {
                        const next = [...draft.conditions];
                        next[index] = { ...condition, field: value };
                        setDraft({ ...draft, conditions: next });
                      }}
                    >
                      <SelectTrigger className="w-44">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CONDITION_FIELDS.map((f) => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={condition.operator}
                      onValueChange={(value) => {
                        const next = [...draft.conditions];
                        next[index] = { ...condition, operator: value };
                        setDraft({ ...draft, conditions: next });
                      }}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {OPERATORS.map((o) => (
                          <SelectItem key={o.value} value={o.value}>
                            {o.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="w-40"
                      value={condition.value}
                      maxLength={120}
                      placeholder="Valor"
                      onChange={(e) => {
                        const next = [...draft.conditions];
                        next[index] = { ...condition, value: e.target.value };
                        setDraft({ ...draft, conditions: next });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover condição"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          conditions: draft.conditions.filter((_, i) => i !== index),
                        })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Então (ações)</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setDraft({ ...draft, actions: [...draft.actions, { type: "criar_tarefa", config: {} }] })
                    }
                  >
                    <Plus className="mr-1 size-3" />
                    Ação
                  </Button>
                </div>
                {draft.actions.map((action, index) => (
                  <div key={index} className="flex flex-wrap items-center gap-2">
                    <Select
                      value={action.type}
                      onValueChange={(value) => {
                        const next = [...draft.actions];
                        next[index] = { ...action, type: value };
                        setDraft({ ...draft, actions: next });
                      }}
                    >
                      <SelectTrigger className="w-56">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AUTOMATION_ACTIONS.map((a) => (
                          <SelectItem key={a.value} value={a.value}>
                            {a.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      className="min-w-48 flex-1"
                      placeholder="Detalhe (mensagem, etapa, título da tarefa…)"
                      maxLength={400}
                      value={action.config?.valor ?? ""}
                      onChange={(e) => {
                        const next = [...draft.actions];
                        next[index] = { ...action, config: { ...action.config, valor: e.target.value } };
                        setDraft({ ...draft, actions: next });
                      }}
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover ação"
                      onClick={() =>
                        setDraft({ ...draft, actions: draft.actions.filter((_, i) => i !== index) })
                      }
                    >
                      <Trash2 className="size-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button onClick={submit} disabled={save.isPending}>
              Salvar automação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FlowNode({
  tone,
  label,
  text,
}: {
  tone: "trigger" | "condition" | "action";
  label: string;
  text: string;
}) {
  const toneClass = {
    trigger: "border-primary/40 bg-primary/5",
    condition: "border-warning/40 bg-warning/5",
    action: "border-success/40 bg-success/5",
  }[tone];

  return (
    <div>
      <div className={`rounded-lg border px-3 py-2 ${toneClass}`}>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="text-sm">{text}</p>
      </div>
      <div className="flex justify-center py-1 text-muted-foreground">
        <ArrowDown className="size-3" />
      </div>
    </div>
  );
}
