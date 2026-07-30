import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Loader2, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useProfile, useRoles, useSession } from "@/features/auth/use-session";
import { SCORE_RULES } from "@/features/leads/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const title = "Configurações — Prospecta CRM";
const description = "Gerencie seu perfil, modelos de mensagem e critérios de pontuação de leads.";

export const Route = createFileRoute("/_authenticated/configuracoes")({
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
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Perfil, modelos de mensagem e regras de qualificação.
        </p>
      </header>

      <Tabs defaultValue="perfil">
        <TabsList>
          <TabsTrigger value="perfil">Perfil</TabsTrigger>
          <TabsTrigger value="modelos">Modelos de mensagem</TabsTrigger>
          <TabsTrigger value="score">Score</TabsTrigger>
        </TabsList>

        <TabsContent value="perfil" className="mt-6">
          <ProfileSection />
        </TabsContent>
        <TabsContent value="modelos" className="mt-6">
          <TemplatesSection />
        </TabsContent>
        <TabsContent value="score" className="mt-6">
          <ScoreSection />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProfileSection() {
  const { user } = useSession();
  const { data: profile, isLoading } = useProfile(user);
  const { data: roles } = useRoles(user);
  const queryClient = useQueryClient();
  const [fullName, setFullName] = useState<string | null>(null);
  const [phone, setPhone] = useState<string | null>(null);

  const save = useMutation({
    mutationFn: async () => {
      if (!profile) return;
      const { error } = await supabase
        .from("profiles")
        .update({
          full_name: fullName ?? profile.full_name,
          phone: phone ?? profile.phone,
        })
        .eq("id", profile.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Perfil atualizado.");
      void queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
    onError: () => toast.error("Não foi possível salvar o perfil."),
  });

  if (isLoading) return <Skeleton className="h-64 rounded-2xl" />;

  return (
    <div className="surface-card max-w-xl space-y-4 rounded-2xl p-6">
      <div className="space-y-2">
        <Label>Nome completo</Label>
        <Input
          value={fullName ?? profile?.full_name ?? ""}
          onChange={(event) => setFullName(event.target.value)}
        />
      </div>
      <div className="space-y-2">
        <Label>Telefone</Label>
        <Input
          value={phone ?? profile?.phone ?? ""}
          onChange={(event) => setPhone(event.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>
      <div className="space-y-2">
        <Label>E-mail</Label>
        <Input value={profile?.email ?? ""} disabled />
      </div>
      <div className="space-y-2">
        <Label>Papéis</Label>
        <div className="flex flex-wrap gap-2">
          {(roles ?? ["vendedor"]).map((role) => (
            <span key={role} className="rounded-lg bg-muted px-2.5 py-1 text-xs font-medium capitalize">
              {role}
            </span>
          ))}
        </div>
      </div>
      <Button onClick={() => save.mutate()} disabled={save.isPending}>
        {save.isPending ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
        Salvar alterações
      </Button>
    </div>
  );
}

function TemplatesSection() {
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [content, setContent] = useState("");

  const { data: templates, isLoading } = useQuery({
    queryKey: ["message-templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("message_templates")
        .select("*")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Sessão expirada");
      const { error } = await supabase
        .from("message_templates")
        .insert({ name: name.trim(), content: content.trim(), owner_id: userData.user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      setName("");
      setContent("");
      toast.success("Modelo criado.");
      void queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
    onError: () => toast.error("Não foi possível criar o modelo."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("message_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Modelo excluído.");
      void queryClient.invalidateQueries({ queryKey: ["message-templates"] });
    },
  });

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <div className="surface-card space-y-4 rounded-2xl p-6">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">Novo modelo</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Variáveis disponíveis: {"{{empresa}}"}, {"{{cidade}}"}, {"{{categoria}}"}, {"{{nome}}"},{" "}
            {"{{telefone}}"}
          </p>
        </div>
        <div className="space-y-2">
          <Label>Nome do modelo</Label>
          <Input value={name} onChange={(event) => setName(event.target.value)} maxLength={80} />
        </div>
        <div className="space-y-2">
          <Label>Mensagem</Label>
          <Textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            rows={7}
            maxLength={2000}
            placeholder="Olá, equipe da {{empresa}}! ..."
          />
        </div>
        <Button
          onClick={() => create.mutate()}
          disabled={create.isPending || !name.trim() || !content.trim()}
        >
          {create.isPending ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Plus className="mr-2 size-4" />
          )}
          Criar modelo
        </Button>
      </div>

      <div className="space-y-3">
        {isLoading ? (
          <Skeleton className="h-40 rounded-2xl" />
        ) : templates?.length ? (
          templates.map((template) => (
            <article key={template.id} className="surface-card rounded-2xl p-5">
              <div className="flex items-start justify-between gap-3">
                <h3 className="text-sm font-semibold">{template.name}</h3>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setName(`${template.name} (cópia)`);
                      setContent(template.content);
                      toast.success("Modelo copiado para o formulário.");
                    }}
                  >
                    <Copy className="size-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => remove.mutate(template.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </div>
              </div>
              <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
                {template.content}
              </p>
            </article>
          ))
        ) : (
          <div className="surface-card rounded-2xl p-8 text-center text-sm text-muted-foreground">
            Nenhum modelo criado ainda.
          </div>
        )}
      </div>
    </div>
  );
}

function ScoreSection() {
  const rules = [
    { label: "Empresa sem site", points: `+${SCORE_RULES.noWebsite}` },
    {
      label: `Mais de ${SCORE_RULES.manyReviews.threshold} avaliações`,
      points: `+${SCORE_RULES.manyReviews.points}`,
    },
    {
      label: `Nota acima de ${SCORE_RULES.highRating.threshold}`,
      points: `+${SCORE_RULES.highRating.points}`,
    },
    { label: "Telefone disponível", points: `+${SCORE_RULES.hasPhone}` },
    { label: "Instagram encontrado", points: `+${SCORE_RULES.hasInstagram}` },
  ];

  return (
    <div className="surface-card max-w-xl rounded-2xl p-6">
      <h2 className="text-sm font-semibold tracking-tight">Critérios de pontuação</h2>
      <p className="mt-1 text-xs text-muted-foreground">
        O score é recalculado automaticamente na importação e em cada edição do lead.
      </p>
      <ul className="mt-4 divide-y divide-border">
        {rules.map((rule) => (
          <li key={rule.label} className="flex items-center justify-between py-3 text-sm">
            <span>{rule.label}</span>
            <span className="font-semibold text-primary">{rule.points}</span>
          </li>
        ))}
      </ul>
      <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
        <span className="rounded-lg bg-sky-500/10 py-2 font-medium text-sky-600 dark:text-sky-400">
          0–30 Frio
        </span>
        <span className="rounded-lg bg-amber-500/10 py-2 font-medium text-amber-600 dark:text-amber-400">
          31–60 Morno
        </span>
        <span className="rounded-lg bg-destructive/10 py-2 font-medium text-destructive">
          61–100 Quente
        </span>
      </div>
    </div>
  );
}
