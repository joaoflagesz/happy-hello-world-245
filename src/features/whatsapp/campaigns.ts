import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type WaCampaign = Tables<"wa_campaigns">;
export type WaTarget = Tables<"wa_campaign_targets">;

export const CAMPAIGN_STATUS_LABEL: Record<WaCampaign["status"], string> = {
  rascunho: "Rascunho",
  em_andamento: "Em andamento",
  pausada: "Pausada",
  concluida: "Concluída",
};

export const TARGET_STATUS_LABEL: Record<WaTarget["status"], string> = {
  fila: "Na fila",
  enviado: "Enviado",
  pulado: "Pulado",
  erro: "Erro",
};

export function useCampaigns() {
  return useQuery({
    queryKey: ["wa-campaigns"],
    queryFn: async (): Promise<WaCampaign[]> => {
      const { data, error } = await supabase
        .from("wa_campaigns")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCampaignTargets(campaignId: string | null) {
  return useQuery({
    queryKey: ["wa-campaign-targets", campaignId],
    enabled: Boolean(campaignId),
    queryFn: async (): Promise<WaTarget[]> => {
      const { data, error } = await supabase
        .from("wa_campaign_targets")
        .select("*")
        .eq("campaign_id", campaignId!)
        .order("position", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<TablesInsert<"wa_campaigns">, "owner_id">) => {
      const { data: userData } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from("wa_campaigns")
        .insert({ ...payload, owner_id: userData.user!.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<"wa_campaigns"> & { id: string }) => {
      const { data, error } = await supabase
        .from("wa_campaigns")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("wa_campaigns").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: ["wa-campaigns"] }),
  });
}

export function useAddTargets() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      campaignId,
      rows,
    }: {
      campaignId: string;
      rows: { lead_id: string | null; contact_name: string | null; phone: string; message: string }[];
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      const { count } = await supabase
        .from("wa_campaign_targets")
        .select("id", { count: "exact", head: true })
        .eq("campaign_id", campaignId);
      const base = count ?? 0;
      const { error } = await supabase.from("wa_campaign_targets").insert(
        rows.map((row, index) => ({
          ...row,
          campaign_id: campaignId,
          owner_id: userData.user!.id,
          position: base + index,
        })),
      );
      if (error) throw error;
    },
    onSuccess: (_data, variables) => {
      void qc.invalidateQueries({ queryKey: ["wa-campaign-targets", variables.campaignId] });
    },
  });
}

export function useUpdateTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: TablesUpdate<"wa_campaign_targets"> & { id: string }) => {
      const { data, error } = await supabase
        .from("wa_campaign_targets")
        .update(patch)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["wa-campaign-targets", data.campaign_id] });
    },
  });
}

export function useDeleteTarget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id }: { id: string; campaignId: string }) => {
      const { error } = await supabase.from("wa_campaign_targets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, variables) => {
      void qc.invalidateQueries({ queryKey: ["wa-campaign-targets", variables.campaignId] });
    },
  });
}
