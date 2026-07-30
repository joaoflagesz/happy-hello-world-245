import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Task = Tables<"tasks">;
export type Notification = Tables<"notifications">;
export type Company = Tables<"companies">;
export type Contact = Tables<"contacts">;
export type FinanceEntry = Tables<"finance_entries">;
export type Automation = Tables<"automations">;
export type ActivityLog = Tables<"activity_log">;
export type Goal = Tables<"goals">;
export type WaConversation = Tables<"whatsapp_conversations">;
export type WaMessage = Tables<"whatsapp_messages">;

export const TASK_STATUSES = [
  { value: "pendente", label: "Pendente" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
] as const;

export const TASK_PRIORITIES = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
  { value: "urgente", label: "Urgente" },
] as const;

export const FINANCE_STATUSES = [
  { value: "previsto", label: "Previsto" },
  { value: "pago", label: "Pago" },
  { value: "atrasado", label: "Em atraso" },
  { value: "cancelado", label: "Cancelado" },
] as const;

export const AUTOMATION_TRIGGERS = [
  { value: "lead_criado", label: "Quando um lead é criado" },
  { value: "etapa_alterada", label: "Quando a etapa do lead muda" },
  { value: "sem_resposta", label: "Quando o lead fica sem resposta" },
  { value: "proposta_enviada", label: "Quando uma proposta é enviada" },
  { value: "negocio_ganho", label: "Quando um negócio é ganho" },
  { value: "agendado", label: "Em uma data/hora agendada" },
] as const;

export const AUTOMATION_ACTIONS = [
  { value: "enviar_whatsapp", label: "Enviar WhatsApp" },
  { value: "enviar_email", label: "Enviar e-mail" },
  { value: "criar_tarefa", label: "Criar tarefa" },
  { value: "mover_etapa", label: "Mover etapa do funil" },
  { value: "criar_proposta", label: "Criar proposta" },
  { value: "notificar_gerente", label: "Notificar gerente" },
  { value: "criar_lembrete", label: "Criar lembrete na agenda" },
] as const;

export type AutomationAction = { type: string; config?: Record<string, string> };
export type AutomationCondition = { field: string; operator: string; value: string };

export function actionsFrom(value: Automation["actions"]): AutomationAction[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return { type: String(item.type ?? ""), config: (item.config ?? {}) as Record<string, string> };
  });
}

export function conditionsFrom(value: Automation["conditions"]): AutomationCondition[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      field: String(item.field ?? ""),
      operator: String(item.operator ?? "igual"),
      value: String(item.value ?? ""),
    };
  });
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada");
  return data.user.id;
}

/* --------------------------------- tarefas -------------------------------- */

export function useTasks(filters: { status?: string; leadId?: string } = {}) {
  return useQuery({
    queryKey: ["tasks", filters],
    queryFn: async (): Promise<Task[]> => {
      let query = supabase.from("tasks").select("*").order("due_at", { ascending: true, nullsFirst: false });
      if (filters.status) query = query.eq("status", filters.status as Task["status"]);
      if (filters.leadId) query = query.eq("lead_id", filters.leadId);
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Omit<TablesInsert<"tasks">, "owner_id"> }) => {
      if (id) {
        const { error } = await supabase.from("tasks").update(values as TablesUpdate<"tasks">).eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("tasks").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

/* ------------------------------ notificações ------------------------------ */

export function useNotifications() {
  return useQuery({
    queryKey: ["notifications"],
    refetchInterval: 60_000,
    queryFn: async (): Promise<Notification[]> => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<"notifications">, "user_id">) => {
      const user_id = await currentUserId();
      const { error } = await supabase.from("notifications").insert({ ...values, user_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

export function useMarkNotifications() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: string[] | "all") => {
      const now = new Date().toISOString();
      let query = supabase.from("notifications").update({ read_at: now }).is("read_at", null);
      if (ids !== "all") query = query.in("id", ids);
      const { error } = await query;
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });
}

/* -------------------------------- empresas -------------------------------- */

export function useCompanies(search?: string) {
  return useQuery({
    queryKey: ["companies", search ?? ""],
    queryFn: async (): Promise<Company[]> => {
      let query = supabase.from("companies").select("*").order("created_at", { ascending: false });
      if (search) query = query.ilike("name", `%${search}%`);
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<TablesInsert<"companies">, "owner_id">;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("companies")
          .update(values as TablesUpdate<"companies">)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("companies").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["companies"] }),
  });
}

export function useDeleteCompany() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("companies").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["companies"] }),
  });
}

/* -------------------------------- contatos -------------------------------- */

export function useContacts(companyId?: string) {
  return useQuery({
    queryKey: ["contacts", companyId ?? "all"],
    queryFn: async (): Promise<Contact[]> => {
      let query = supabase.from("contacts").select("*").order("created_at", { ascending: false });
      if (companyId) query = query.eq("company_id", companyId);
      const { data, error } = await query.limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<TablesInsert<"contacts">, "owner_id">;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("contacts")
          .update(values as TablesUpdate<"contacts">)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("contacts").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["contacts"] }),
  });
}

/* ------------------------------- financeiro ------------------------------- */

export function useFinanceEntries() {
  return useQuery({
    queryKey: ["finance"],
    queryFn: async (): Promise<FinanceEntry[]> => {
      const { data, error } = await supabase
        .from("finance_entries")
        .select("*")
        .order("due_date", { ascending: false, nullsFirst: false })
        .limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<TablesInsert<"finance_entries">, "owner_id">;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("finance_entries")
          .update(values as TablesUpdate<"finance_entries">)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const total = Math.max(1, values.installment_total ?? 1);
      const rows = Array.from({ length: total }).map((_, index) => {
        const due = values.due_date ? new Date(values.due_date) : null;
        if (due) due.setMonth(due.getMonth() + index);
        return {
          ...values,
          owner_id,
          installment_number: index + 1,
          installment_total: total,
          due_date: due ? due.toISOString().slice(0, 10) : null,
        };
      });
      const { error } = await supabase.from("finance_entries").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["finance"] }),
  });
}

export function useDeleteFinanceEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("finance_entries").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["finance"] }),
  });
}

/* ------------------------------- automações ------------------------------- */

export function useAutomations() {
  return useQuery({
    queryKey: ["automations"],
    queryFn: async (): Promise<Automation[]> => {
      const { data, error } = await supabase
        .from("automations")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<TablesInsert<"automations">, "owner_id">;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("automations")
          .update(values as TablesUpdate<"automations">)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("automations").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });
}

export function useDeleteAutomation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("automations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["automations"] }),
  });
}

/* --------------------------------- whatsapp -------------------------------- */

export function useWaConversations() {
  return useQuery({
    queryKey: ["wa-conversations"],
    queryFn: async (): Promise<WaConversation[]> => {
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .select("*")
        .order("last_message_at", { ascending: false, nullsFirst: false })
        .limit(300);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useWaMessages(conversationId: string | null) {
  return useQuery({
    queryKey: ["wa-messages", conversationId],
    enabled: Boolean(conversationId),
    queryFn: async (): Promise<WaMessage[]> => {
      const { data, error } = await supabase
        .from("whatsapp_messages")
        .select("*")
        .eq("conversation_id", conversationId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<"whatsapp_conversations">, "owner_id">) => {
      const owner_id = await currentUserId();
      const { data, error } = await supabase
        .from("whatsapp_conversations")
        .insert({ ...values, owner_id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["wa-conversations"] }),
  });
}

export function useSendWaMessage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      conversationId,
      body,
      phone,
      scheduledFor,
    }: {
      conversationId: string;
      body: string;
      phone: string;
      scheduledFor?: string | null;
    }) => {
      const owner_id = await currentUserId();
      const scheduled = Boolean(scheduledFor);
      const { error } = await supabase.from("whatsapp_messages").insert({
        conversation_id: conversationId,
        owner_id,
        direction: "saida",
        body,
        status: scheduled ? "pendente" : "enviada",
        scheduled_for: scheduledFor ?? null,
        sent_at: scheduled ? null : new Date().toISOString(),
      });
      if (error) throw error;

      await supabase
        .from("whatsapp_conversations")
        .update({ last_message: body, last_message_at: new Date().toISOString() })
        .eq("id", conversationId);

      if (!scheduled && typeof window !== "undefined") {
        const digits = phone.replace(/\D/g, "");
        window.open(`https://wa.me/${digits}?text=${encodeURIComponent(body)}`, "_blank", "noopener");
      }
    },
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["wa-messages", variables.conversationId] });
      void queryClient.invalidateQueries({ queryKey: ["wa-conversations"] });
    },
  });
}

/* -------------------------------- auditoria ------------------------------- */

export function useActivityLog(entityId?: string) {
  return useQuery({
    queryKey: ["activity-log", entityId ?? "all"],
    queryFn: async (): Promise<ActivityLog[]> => {
      let query = supabase
        .from("activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      if (entityId) query = query.eq("entity_id", entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

/* ---------------------------------- metas --------------------------------- */

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: async (): Promise<Goal[]> => {
      const { data, error } = await supabase
        .from("goals")
        .select("*")
        .order("period_start", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Omit<TablesInsert<"goals">, "owner_id"> }) => {
      if (id) {
        const { error } = await supabase.from("goals").update(values as TablesUpdate<"goals">).eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("goals").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
}

export function useDeleteGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("goals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["goals"] }),
  });
}

/* ------------------------------- ai insights ------------------------------ */

export function useAiInsights(entityId?: string) {
  return useQuery({
    queryKey: ["ai-insights", entityId ?? "all"],
    queryFn: async () => {
      let query = supabase
        .from("ai_insights")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);
      if (entityId) query = query.eq("entity_id", entityId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveAiInsight() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: Omit<TablesInsert<"ai_insights">, "owner_id">) => {
      const owner_id = await currentUserId();
      const { error } = await supabase.from("ai_insights").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["ai-insights"] }),
  });
}
