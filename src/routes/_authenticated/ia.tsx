import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation } from "@tanstack/react-query";
import { Bot, Copy, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generateAi, type AiKind } from "@/lib/ai.functions";
import { useLeads } from "@/features/leads/api";
import { useAiInsights, useSaveAiInsight } from "@/features/platform/api";
import { STAGE_LABEL } from "@/features/leads/constants";
import { EmptyState, PageHeader, SectionCard, StatCard } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/ia")({
  head: () => ({
    meta: [
      { title: "Inteligência artificial — Prospecta CRM" },
      {
        name: "description",
        content: "IA que analisa leads, prevê chance de venda, cria mensagens, e-mails, propostas e insights.",
      },
      { property: "og:title", content: "Inteligência artificial — Prospecta CRM" },
      {
        property: "og:description",
        content: "IA que analisa leads, prevê chance de venda, cria mensagens, e-mails, propostas e insights.",
      },
    ],
  }),
  component: AiPage,
});

const KINDS: { value: AiKind; label: string; hint: string }[] = [
  { value: "analise", label: "Analisar lead", hint: "Nota, motivos, oportunidades e próximos passos" },
  { value: "mensagem", label: "Criar mensagem WhatsApp", hint: "Copy curta e humana com CTA" },
  { value: "email", label: "Criar e-mail", hint: "Assunto + corpo persuasivo" },
  { value: "proposta", label: "Criar proposta", hint: "Escopo, entregáveis e investimento" },
  { value: "resumo", label: "Resumir histórico", hint: "Status atual e próximo passo" },
  { value: "insight", label: "Insights da carteira", hint: "Padrões, gargalos e previsão" },
];

function AiPage() {
  const { data: leads } = useLeads();
  const { data: insights } = useAiInsights();
  const saveInsight = useSaveAiInsight();
  const run = useServerFn(generateAi);

  const [kind, setKind] = useState<AiKind>("analise");
  const [leadId, setLeadId] = useState<string>("none");
  const [extra, setExtra] = useState("");
  const [result, setResult] = useState("");

  const list = leads ?? [];
  const selected = list.find((l) => l.id === leadId) ?? null;

  const portfolio = useMemo(() => {
    const total = list.length;
    const clientes = list.filter((l) => l.stage === "cliente").length;
    return {
      total,
      clientes,
      quentes: list.filter((l) => l.temperature === "quente").length,
      conversao: total ? ((clientes / total) * 100).toFixed(1) : "0.0",
    };
  }, [list]);

  const mutation = useMutation({
    mutationFn: async () => {
      const context = selected
        ? [
            `Empresa: ${selected.company_name}`,
            `Contato: ${selected.contact_name ?? "—"}`,
            `Cidade/UF: ${selected.city ?? "—"}/${selected.state ?? "—"}`,
            `Categoria: ${selected.category ?? "—"}`,
            `Situação do site: ${selected.site_status}`,
            `Etapa: ${STAGE_LABEL[selected.stage]}`,
            `Score atual: ${selected.score}`,
            `Temperatura: ${selected.temperature}`,
            `Avaliação Google: ${selected.rating ?? "—"} (${selected.reviews_count ?? 0} avaliações)`,
            `Último contato: ${selected.last_contact_at ?? "nunca"}`,
            `Observações: ${selected.notes ?? "—"}`,
          ].join("\n")
        : [
            "Carteira consolidada:",
            `Total de leads: ${portfolio.total}`,
            `Clientes fechados: ${portfolio.clientes}`,
            `Leads quentes: ${portfolio.quentes}`,
            `Taxa de conversão: ${portfolio.conversao}%`,
          ].join("\n");

      const prompt = `${context}\n\nInstrução adicional do usuário: ${extra || "nenhuma"}`;
      return run({ data: { kind, prompt } });
    },
    onSuccess: (data) => {
      setResult(data.content);
      saveInsight.mutate({
        entity_type: selected ? "lead" : "carteira",
        entity_id: selected?.id ?? null,
        kind,
        content: data.content,
        metadata: {},
      });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inteligência artificial"
        description="Análises, previsões e conteúdos gerados a partir dos seus próprios dados."
        icon={Bot}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Leads analisáveis" value={portfolio.total} icon={Sparkles} index={0} />
        <StatCard label="Leads quentes" value={portfolio.quentes} icon={Sparkles} accent="warning" index={1} />
        <StatCard label="Conversão" value={`${portfolio.conversao}%`} icon={Sparkles} accent="success" index={2} />
        <StatCard label="Insights salvos" value={(insights ?? []).length} icon={Bot} accent="info" index={3} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        <SectionCard title="Gerar com IA" description="Escolha o que a IA deve produzir">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>O que fazer</Label>
              <Select value={kind} onValueChange={(value) => setKind(value as AiKind)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {KINDS.map((k) => (
                    <SelectItem key={k.value} value={k.value}>
                      {k.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {KINDS.find((k) => k.value === kind)?.hint}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Lead (opcional)</Label>
              <Select value={leadId} onValueChange={setLeadId}>
                <SelectTrigger>
                  <SelectValue placeholder="Carteira inteira" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Carteira inteira</SelectItem>
                  {list.slice(0, 200).map((lead) => (
                    <SelectItem key={lead.id} value={lead.id}>
                      {lead.company_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-extra">Contexto extra</Label>
              <Textarea
                id="ai-extra"
                rows={4}
                maxLength={2000}
                placeholder="Ex.: foco em criação de site, orçamento até R$ 5.000…"
                value={extra}
                onChange={(e) => setExtra(e.target.value)}
              />
            </div>

            <Button className="w-full" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
              {mutation.isPending ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 size-4" />
              )}
              Gerar com IA
            </Button>
          </div>
        </SectionCard>

        <div className="space-y-6">
          <SectionCard
            title="Resultado"
            actions={
              result ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    void navigator.clipboard.writeText(result);
                    toast.success("Copiado.");
                  }}
                >
                  <Copy className="mr-2 size-4" />
                  Copiar
                </Button>
              ) : null
            }
          >
            {mutation.isPending ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-muted" />
                <div className="h-4 w-full animate-pulse rounded bg-muted" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-muted" />
              </div>
            ) : result ? (
              <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-relaxed">{result}</pre>
            ) : (
              <EmptyState
                icon={Bot}
                title="Nada gerado ainda"
                description="Escolha uma ação à esquerda e clique em Gerar com IA."
              />
            )}
          </SectionCard>

          <SectionCard title="Histórico de insights">
            {(insights ?? []).length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                Os insights gerados ficam salvos aqui.
              </p>
            ) : (
              <div className="space-y-3">
                {(insights ?? []).slice(0, 10).map((insight) => (
                  <div key={insight.id} className="rounded-lg border border-border p-3">
                    <div className="mb-1 flex items-center gap-2">
                      <Badge variant="secondary">{insight.kind}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(insight.created_at).toLocaleString("pt-BR")}
                      </span>
                    </div>
                    <p className="line-clamp-4 whitespace-pre-wrap text-sm text-muted-foreground">
                      {insight.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
