import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

type LeadStage = Tables<"leads">["stage"];

/** Estágios que devem avançar automaticamente ao enviar a primeira mensagem. */
const PROMOTE_FROM: LeadStage[] = ["novo_lead", "analisado", "sem_site", "possui_site"];

export type LeadContactChannel = "whatsapp" | "email" | "ligacao" | "visita";

export type RegisterLeadContactInput = {
  leadId: string;
  channel?: LeadContactChannel;
  title: string;
  message?: string;
  /** Telefone usado no contato (para criar/atualizar a conversa do inbox). */
  phone?: string | null;
  /** Quando o registro já foi criado por outra tela (ex.: inbox do WhatsApp). */
  skipConversation?: boolean;
};

/**
 * Ponto único de verdade: registra um contato com o lead e propaga o efeito
 * para todas as telas (lead, timeline, pipeline, inbox, auditoria, dashboard).
 */
export async function registerLeadContact(input: RegisterLeadContactInput) {
  const { leadId, channel = "whatsapp", title, message, phone, skipConversation } = input;
  const now = new Date().toISOString();

  const { data: userData } = await supabase.auth.getUser();
  const userId = userData.user?.id ?? null;

  const { data: lead } = await supabase
    .from("leads")
    .select("id, stage, first_contact_at, phone, whatsapp, contact_name, company_name")
    .eq("id", leadId)
    .maybeSingle();

  if (!lead) return null;

  const nextStage: LeadStage = PROMOTE_FROM.includes(lead.stage)
    ? "mensagem_enviada"
    : lead.stage;

  await supabase
    .from("leads")
    .update({
      last_contact_at: now,
      last_interaction_at: now,
      first_contact_at: lead.first_contact_at ?? now,
      stage: nextStage,
    })
    .eq("id", leadId);

  await supabase.from("lead_events").insert({
    lead_id: leadId,
    actor_id: userId,
    type: channel,
    title,
    body: message ?? null,
  });

  if (!skipConversation && channel === "whatsapp" && userId) {
    const contactPhone = phone ?? lead.whatsapp ?? lead.phone;
    if (contactPhone) {
      const { data: existing } = await supabase
        .from("whatsapp_conversations")
        .select("id")
        .eq("lead_id", leadId)
        .maybeSingle();

      let conversationId = existing?.id ?? null;
      if (!conversationId) {
        const { data: created } = await supabase
          .from("whatsapp_conversations")
          .insert({
            owner_id: userId,
            lead_id: leadId,
            contact_name: lead.contact_name ?? lead.company_name,
            contact_phone: contactPhone,
            labels: [],
            unread_count: 0,
            last_message: message ?? title,
            last_message_at: now,
          })
          .select("id")
          .maybeSingle();
        conversationId = created?.id ?? null;
      } else {
        await supabase
          .from("whatsapp_conversations")
          .update({ last_message: message ?? title, last_message_at: now })
          .eq("id", conversationId);
      }

      if (conversationId && message) {
        await supabase.from("whatsapp_messages").insert({
          conversation_id: conversationId,
          owner_id: userId,
          direction: "saida",
          body: message,
          status: "enviada",
          sent_at: now,
        });
      }
    }
  }

  return { leadId, stage: nextStage };
}

/** Invalida tudo que exibe estado do lead. */
export function invalidateLeadSurfaces(queryClient: QueryClient, leadId?: string) {
  const keys = [
    ["leads"],
    ["lead-events"],
    ["wa-conversations"],
    ["wa-messages"],
    ["activity-log"],
    ["tasks"],
    ["notifications"],
    ["deals"],
  ];
  for (const key of keys) void queryClient.invalidateQueries({ queryKey: key });
  if (leadId) {
    void queryClient.invalidateQueries({ queryKey: ["lead", leadId] });
    void queryClient.invalidateQueries({ queryKey: ["lead-events", leadId] });
  }
}

export function useRegisterLeadContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: registerLeadContact,
    onSuccess: (_data, variables) => invalidateLeadSurfaces(queryClient, variables.leadId),
  });
}
