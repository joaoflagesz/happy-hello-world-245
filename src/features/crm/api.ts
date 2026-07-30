import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type Appointment = Tables<"appointments">;
export type Deal = Tables<"deals">;
export type Proposal = Tables<"proposals">;

export type ProposalItem = { description: string; quantity: number; unit_price: number };

export const APPOINTMENT_TYPES: { value: Appointment["type"]; label: string }[] = [
  { value: "reuniao", label: "Reunião" },
  { value: "visita", label: "Visita" },
  { value: "ligacao", label: "Ligação" },
  { value: "follow_up", label: "Follow-up" },
  { value: "outro", label: "Outro" },
];

export const APPOINTMENT_STATUSES: { value: Appointment["status"]; label: string }[] = [
  { value: "agendado", label: "Agendado" },
  { value: "concluido", label: "Concluído" },
  { value: "cancelado", label: "Cancelado" },
];

export const DEAL_STATUSES: { value: Deal["status"]; label: string }[] = [
  { value: "aberta", label: "Em aberto" },
  { value: "ganha", label: "Ganha" },
  { value: "perdida", label: "Perdida" },
];

export const PROPOSAL_STATUSES: { value: Proposal["status"]; label: string }[] = [
  { value: "rascunho", label: "Rascunho" },
  { value: "enviada", label: "Enviada" },
  { value: "aceita", label: "Aceita" },
  { value: "recusada", label: "Recusada" },
];

export const APPOINTMENT_TYPE_LABEL = Object.fromEntries(
  APPOINTMENT_TYPES.map((t) => [t.value, t.label]),
) as Record<Appointment["type"], string>;
export const DEAL_STATUS_LABEL = Object.fromEntries(
  DEAL_STATUSES.map((t) => [t.value, t.label]),
) as Record<Deal["status"], string>;
export const PROPOSAL_STATUS_LABEL = Object.fromEntries(
  PROPOSAL_STATUSES.map((t) => [t.value, t.label]),
) as Record<Proposal["status"], string>;

export function formatCurrency(value: number | null | undefined) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value ?? 0);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada");
  return data.user.id;
}

/* ---------------------------------- agenda --------------------------------- */

export function useAppointments() {
  return useQuery({
    queryKey: ["appointments"],
    queryFn: async (): Promise<Appointment[]> => {
      const { data, error } = await supabase
        .from("appointments")
        .select("*")
        .order("starts_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<TablesInsert<"appointments">, "owner_id">;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("appointments")
          .update(values as TablesUpdate<"appointments">)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("appointments").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

export function useDeleteAppointment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["appointments"] }),
  });
}

/* ---------------------------------- vendas --------------------------------- */

export function useDeals() {
  return useQuery({
    queryKey: ["deals"],
    queryFn: async (): Promise<Deal[]> => {
      const { data, error } = await supabase
        .from("deals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Omit<TablesInsert<"deals">, "owner_id"> }) => {
      if (id) {
        const { error } = await supabase.from("deals").update(values as TablesUpdate<"deals">).eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("deals").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["deals"] }),
  });
}

export function useDeleteDeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["deals"] }),
  });
}

/* -------------------------------- propostas -------------------------------- */

export function useProposals() {
  return useQuery({
    queryKey: ["proposals"],
    queryFn: async (): Promise<Proposal[]> => {
      const { data, error } = await supabase
        .from("proposals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id?: string;
      values: Omit<TablesInsert<"proposals">, "owner_id">;
    }) => {
      if (id) {
        const { error } = await supabase
          .from("proposals")
          .update(values as TablesUpdate<"proposals">)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      const owner_id = await currentUserId();
      const { error } = await supabase.from("proposals").insert({ ...values, owner_id });
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });
}

export function useDeleteProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("proposals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void queryClient.invalidateQueries({ queryKey: ["proposals"] }),
  });
}

export function proposalItemsFrom(value: Proposal["items"]): ProposalItem[] {
  if (!Array.isArray(value)) return [];
  return value.map((raw) => {
    const item = (raw ?? {}) as Record<string, unknown>;
    return {
      description: String(item.description ?? ""),
      quantity: Number(item.quantity ?? 1),
      unit_price: Number(item.unit_price ?? 0),
    };
  });
}

export function proposalTotal(items: ProposalItem[], discount: number) {
  const gross = items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  return Math.max(0, gross - (discount || 0));
}
