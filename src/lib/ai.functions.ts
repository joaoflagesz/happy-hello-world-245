import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AiKind = "analise" | "mensagem" | "email" | "proposta" | "resumo" | "insight";

const SYSTEM: Record<AiKind, string> = {
  analise:
    "Você é um analista sênior de vendas B2B. Analise o lead, dê uma nota de 0 a 100, explique a nota, aponte oportunidades, riscos, melhor horário de contato, quando ligar, quando enviar proposta, quando fazer follow-up e quando desistir. Responda em markdown curto e objetivo, em português do Brasil.",
  mensagem:
    "Você é um copywriter de prospecção. Escreva uma mensagem de WhatsApp curta, humana, sem clichês, com CTA claro. Português do Brasil.",
  email:
    "Você é um copywriter B2B. Escreva um e-mail comercial com assunto e corpo, curto e persuasivo. Português do Brasil.",
  proposta:
    "Você é um consultor comercial. Estruture uma proposta comercial com escopo, entregáveis, prazos e faixa de investimento. Português do Brasil, markdown.",
  resumo:
    "Resuma o histórico do cliente em tópicos objetivos, destacando status atual e próximo passo. Português do Brasil.",
  insight:
    "Você é um head de vendas. A partir dos dados da carteira, gere insights acionáveis: padrões de sucesso, gargalos do funil, previsão de fechamento e prioridades da semana. Português do Brasil, markdown.",
};

type Input = { kind: AiKind; prompt: string };

export const generateAi = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Input) => {
    if (!input || typeof input.prompt !== "string" || input.prompt.trim().length === 0) {
      throw new Error("Prompt obrigatório");
    }
    if (!(input.kind in SYSTEM)) throw new Error("Tipo inválido");
    return { kind: input.kind, prompt: input.prompt.slice(0, 12000) };
  })
  .handler(async ({ data }): Promise<{ content: string }> => {
    const apiKey = process.env["LOVABLE_API_KEY"];
    if (!apiKey) throw new Error("IA indisponível: chave não configurada.");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-3.5-flash",
        messages: [
          { role: "system", content: SYSTEM[data.kind] },
          { role: "user", content: data.prompt },
        ],
      }),
    });

    if (response.status === 429) throw new Error("Limite de uso da IA atingido. Tente novamente em instantes.");
    if (response.status === 402) throw new Error("Créditos de IA esgotados. Adicione créditos no workspace.");
    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Falha na IA [${response.status}]: ${body.slice(0, 300)}`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    const content = json.choices?.[0]?.message?.content?.trim();
    return { content: content && content.length > 0 ? content : "A IA não retornou conteúdo." };
  });
