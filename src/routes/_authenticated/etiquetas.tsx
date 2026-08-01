import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Tag as TagIcon, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { PageHeader, EmptyState, SectionCard, StaggerItem, StaggerList } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import {
  TAG_ENTITY_TYPES,
  TAG_PALETTE,
  useDeleteTag,
  useSaveTag,
  useTags,
  type Tag,
} from "@/features/platform/api";

export const Route = createFileRoute("/_authenticated/etiquetas")({
  head: () => ({
    meta: [
      { title: "Etiquetas — Prospecta CRM" },
      {
        name: "description",
        content: "Crie e organize etiquetas coloridas para classificar leads, empresas, contatos e negócios.",
      },
      { property: "og:title", content: "Etiquetas — Prospecta CRM" },
      {
        property: "og:description",
        content: "Crie e organize etiquetas coloridas para classificar leads, empresas, contatos e negócios.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TagsPage,
});

const SUGGESTIONS: { name: string; color: string; entity_type: string }[] = [
  { name: "Cliente VIP", color: "#f59e0b", entity_type: "lead" },
  { name: "Urgente", color: "#ef4444", entity_type: "lead" },
  { name: "Sem site", color: "#22c55e", entity_type: "lead" },
  { name: "Site ruim", color: "#f97316", entity_type: "lead" },
  { name: "Google Ads", color: "#3b82f6", entity_type: "lead" },
  { name: "Instagram", color: "#ec4899", entity_type: "lead" },
  { name: "Facebook", color: "#6366f1", entity_type: "lead" },
  { name: "Indicação", color: "#10b981", entity_type: "lead" },
  { name: "Frio", color: "#06b6d4", entity_type: "lead" },
  { name: "Morno", color: "#f59e0b", entity_type: "lead" },
  { name: "Quente", color: "#ef4444", entity_type: "lead" },
  { name: "Prioritário", color: "#a855f7", entity_type: "lead" },
  { name: "Recorrente", color: "#64748b", entity_type: "deal" },
  { name: "Renovação", color: "#0f172a", entity_type: "deal" },
];

const emptyForm = { name: "", color: TAG_PALETTE[0] as string, entity_type: "lead" };

function TagsPage() {
  const { data: tags, isLoading } = useTags();
  const save = useSaveTag();
  const remove = useDeleteTag();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [form, setForm] = useState(emptyForm);

  const grouped = useMemo(() => {
    return TAG_ENTITY_TYPES.map((type) => ({
      ...type,
      tags: (tags ?? []).filter((tag) => tag.entity_type === type.value),
    }));
  }, [tags]);

  const missingSuggestions = useMemo(() => {
    const existing = new Set((tags ?? []).map((tag) => `${tag.entity_type}:${tag.name.toLowerCase()}`));
    return SUGGESTIONS.filter((s) => !existing.has(`${s.entity_type}:${s.name.toLowerCase()}`));
  }, [tags]);

  function openNew() {
    setEditing(null);
    setForm(emptyForm);
    setOpen(true);
  }

  function openEdit(tag: Tag) {
    setEditing(tag);
    setForm({ name: tag.name, color: tag.color, entity_type: tag.entity_type });
    setOpen(true);
  }

  function submit() {
    if (!form.name.trim()) {
      toast.error("Dê um nome para a etiqueta.");
      return;
    }
    save.mutate(
      { id: editing?.id, values: { ...form, name: form.name.trim() } },
      {
        onSuccess: () => {
          toast.success(editing ? "Etiqueta atualizada." : "Etiqueta criada.");
          setOpen(false);
        },
        onError: (error) => toast.error(error.message),
      },
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Etiquetas"
        description="Classifique leads, empresas, contatos e negócios com etiquetas coloridas reutilizáveis."
        actions={
          <Button onClick={openNew}>
            <Plus className="mr-2 size-4" />
            Nova etiqueta
          </Button>
        }
      />

      {missingSuggestions.length ? (
        <SectionCard
          title="Sugestões rápidas"
          description="Clique para criar as etiquetas mais usadas em prospecção."
        >
          <div className="flex flex-wrap gap-2">
            {missingSuggestions.map((suggestion) => (
              <button
                key={`${suggestion.entity_type}-${suggestion.name}`}
                type="button"
                onClick={() =>
                  save.mutate(
                    { values: suggestion },
                    {
                      onSuccess: () => toast.success(`Etiqueta "${suggestion.name}" criada.`),
                      onError: (error) => toast.error(error.message),
                    },
                  )
                }
                className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs font-medium transition-colors hover:bg-accent"
              >
                <span className="size-2.5 rounded-full" style={{ background: suggestion.color }} />
                {suggestion.name}
                <Plus className="size-3 opacity-60" />
              </button>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {!isLoading && !(tags ?? []).length ? (
        <EmptyState
          icon={TagIcon}
          title="Nenhuma etiqueta criada"
          description="Crie etiquetas para segmentar sua base e filtrar rapidamente em qualquer módulo."
          action={
            <Button onClick={openNew}>
              <Plus className="mr-2 size-4" />
              Criar primeira etiqueta
            </Button>
          }
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          {grouped.map((group) => (
            <SectionCard key={group.value} title={group.label} description={`${group.tags.length} etiqueta(s)`}>
              {group.tags.length ? (
                <StaggerList className="flex flex-wrap gap-2">
                  {group.tags.map((tag) => (
                    <StaggerItem key={tag.id}>
                      <span
                        className="group inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold text-white shadow-sm"
                        style={{ background: tag.color }}
                      >
                        <button type="button" onClick={() => openEdit(tag)} className="hover:underline">
                          {tag.name}
                        </button>
                        <button
                          type="button"
                          aria-label={`Remover ${tag.name}`}
                          onClick={() =>
                            remove.mutate(tag.id, {
                              onSuccess: () => toast.success("Etiqueta removida."),
                              onError: (error) => toast.error(error.message),
                            })
                          }
                          className="opacity-70 transition-opacity hover:opacity-100"
                        >
                          <Trash2 className="size-3" />
                        </button>
                      </span>
                    </StaggerItem>
                  ))}
                </StaggerList>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhuma etiqueta neste grupo ainda.</p>
              )}
            </SectionCard>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Editar etiqueta" : "Nova etiqueta"}</DialogTitle>
            <DialogDescription>Nome, cor e onde ela pode ser aplicada.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tag-name">Nome</Label>
              <Input
                id="tag-name"
                value={form.name}
                maxLength={40}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Ex.: Cliente VIP"
              />
            </div>

            <div className="space-y-2">
              <Label>Aplicável a</Label>
              <Select
                value={form.entity_type}
                onValueChange={(value) => setForm((prev) => ({ ...prev, entity_type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TAG_ENTITY_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Cor</Label>
              <div className="flex flex-wrap gap-2">
                {TAG_PALETTE.map((color) => (
                  <button
                    key={color}
                    type="button"
                    aria-label={`Cor ${color}`}
                    onClick={() => setForm((prev) => ({ ...prev, color }))}
                    className={`size-7 rounded-full transition-transform hover:scale-110 ${
                      form.color === color ? "ring-2 ring-ring ring-offset-2 ring-offset-background" : ""
                    }`}
                    style={{ background: color }}
                  />
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-border p-3">
              <p className="text-xs text-muted-foreground">Pré-visualização</p>
              <span
                className="mt-2 inline-flex rounded-full px-3 py-1 text-xs font-semibold text-white"
                style={{ background: form.color }}
              >
                {form.name || "Etiqueta"}
              </span>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Salvando…" : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
