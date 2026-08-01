import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Visit = Tables<"visits">;
export type ApiKey = Tables<"api_keys">;
export type Webhook = Tables<"webhooks">;
export type WebhookDelivery = Tables<"webhook_deliveries">;

export const VISIT_STATUSES = [
  { value: "agendada", label: "Agendada" },
  { value: "em_andamento", label: "Em andamento" },
  { value: "concluida", label: "Concluída" },
  { value: "cancelada", label: "Cancelada" },
] as const;

export const VISIT_OUTCOMES = [
  { value: "sem_resultado", label: "Sem resultado" },
  { value: "interessado", label: "Interessado" },
  { value: "proposta", label: "Proposta enviada" },
  { value: "fechado", label: "Negócio fechado" },
  { value: "recusado", label: "Recusado" },
] as const;

export const WEBHOOK_EVENTS = [
  { value: "lead.created", label: "Lead criado" },
  { value: "lead.updated", label: "Lead atualizado" },
  { value: "lead.stage_changed", label: "Lead mudou de etapa" },
  { value: "deal.won", label: "Negócio ganho" },
  { value: "deal.lost", label: "Negócio perdido" },
  { value: "task.completed", label: "Tarefa concluída" },
  { value: "proposal.sent", label: "Proposta enviada" },
  { value: "signature.signed", label: "Documento assinado" },
  { value: "visit.checked_in", label: "Check-in de visita" },
] as const;

async function uid() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Sessão expirada. Entre novamente.");
  return id;
}

/* --------------------------------- visitas -------------------------------- */

export function useVisits(status?: string) {
  return useQuery({
    queryKey: ["visits", status ?? "all"],
    queryFn: async (): Promise<Visit[]> => {
      let query = supabase.from("visits").select("*").order("scheduled_for", { ascending: false }).limit(500);
      if (status && status !== "all") query = query.eq("status", status as Visit["status"]);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Visit> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from("visits").update(rest as TablesUpdate<"visits">).eq("id", id);
        if (error) throw error;
        return id;
      }
      const owner_id = await uid();
      const { data, error } = await supabase
        .from("visits")
        .insert({ ...(rest as TablesInsert<"visits">), owner_id })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["visits"] }),
  });
}

export function useDeleteVisit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("visits").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["visits"] }),
  });
}

export function getCurrentPosition(): Promise<{ lat: number; lng: number }> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      reject(new Error("Geolocalização não suportada neste dispositivo."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => reject(new Error("Não foi possível obter sua localização. Autorize o acesso ao GPS.")),
      { enableHighAccuracy: true, timeout: 12000 },
    );
  });
}

/* -------------------------------- api keys -------------------------------- */

function randomToken(length = 32) {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

async function sha256(value: string) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(buf), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function useApiKeys() {
  return useQuery({
    queryKey: ["api_keys"],
    queryFn: async (): Promise<ApiKey[]> => {
      const { data, error } = await supabase
        .from("api_keys")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Creates a key, returns the plaintext once — only the hash is stored. */
export function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const owner_id = await uid();
      const raw = `pk_live_${randomToken(24)}`;
      const key_hash = await sha256(raw);
      const { error } = await supabase.from("api_keys").insert({
        owner_id,
        name,
        key_prefix: raw.slice(0, 14),
        key_hash,
      });
      if (error) throw error;
      return raw;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}

export function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("api_keys")
        .update({ revoked_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}

export function useDeleteApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("api_keys").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["api_keys"] }),
  });
}

/* -------------------------------- webhooks -------------------------------- */

export function useWebhooks() {
  return useQuery({
    queryKey: ["webhooks"],
    queryFn: async (): Promise<Webhook[]> => {
      const { data, error } = await supabase
        .from("webhooks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<Webhook> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase.from("webhooks").update(rest as TablesUpdate<"webhooks">).eq("id", id);
        if (error) throw error;
        return id;
      }
      const owner_id = await uid();
      const { data, error } = await supabase
        .from("webhooks")
        .insert({
          ...(rest as TablesInsert<"webhooks">),
          owner_id,
          secret: rest.secret ?? `whsec_${randomToken(16)}`,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("webhooks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useWebhookDeliveries() {
  return useQuery({
    queryKey: ["webhook_deliveries"],
    queryFn: async (): Promise<WebhookDelivery[]> => {
      const { data, error } = await supabase
        .from("webhook_deliveries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Sends a test payload to the endpoint and records the delivery. */
export function useTestWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (webhook: Webhook) => {
      const owner_id = await uid();
      const payload = {
        event: webhook.events[0] ?? "test.ping",
        sent_at: new Date().toISOString(),
        data: { message: "Disparo de teste do Prospecta CRM" },
      };
      let status: number | null = null;
      let response = "";
      try {
        const res = await fetch(webhook.url, {
          method: "POST",
          mode: "no-cors",
          headers: { "Content-Type": "application/json", "X-Prospecta-Secret": webhook.secret ?? "" },
          body: JSON.stringify(payload),
        });
        status = res.status || 200;
        response = "Disparo enviado";
      } catch (err) {
        status = 0;
        response = err instanceof Error ? err.message : "Falha ao enviar";
      }
      await supabase.from("webhook_deliveries").insert({
        webhook_id: webhook.id,
        owner_id,
        event: payload.event,
        status,
        response,
        payload,
      });
      await supabase
        .from("webhooks")
        .update({
          delivery_count: webhook.delivery_count + 1,
          last_status: status,
          last_delivery_at: new Date().toISOString(),
        })
        .eq("id", webhook.id);
      return { status, response };
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["webhooks"] });
      void qc.invalidateQueries({ queryKey: ["webhook_deliveries"] });
    },
  });
}

/* ---------------------------------- admin --------------------------------- */

export type TeamMemberRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  job_title: string | null;
  created_at: string;
  roles: string[];
};

export function useOrgMembers() {
  return useQuery({
    queryKey: ["org_members"],
    queryFn: async (): Promise<TeamMemberRow[]> => {
      const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email, avatar_url, job_title, created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pErr) throw pErr;
      if (rErr) throw rErr;
      const byUser = new Map<string, string[]>();
      for (const row of roles ?? []) {
        byUser.set(row.user_id, [...(byUser.get(row.user_id) ?? []), row.role]);
      }
      return (profiles ?? []).map((p) => ({ ...p, roles: byUser.get(p.id) ?? [] }));
    },
  });
}
