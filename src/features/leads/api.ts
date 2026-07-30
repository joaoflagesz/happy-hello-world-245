import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesInsert, TablesUpdate } from "@/integrations/supabase/types";
import { calculateScore, temperatureFromScore, type Lead } from "./constants";

export type LeadFilters = {
  search?: string;
  stage?: string;
  siteStatus?: string;
  temperature?: string;
  city?: string;
  category?: string;
};

export const leadsKey = (filters: LeadFilters = {}) => ["leads", filters] as const;

export function useLeads(filters: LeadFilters = {}) {
  return useQuery({
    queryKey: leadsKey(filters),
    queryFn: async (): Promise<Lead[]> => {
      let query = supabase.from("leads").select("*").order("created_at", { ascending: false });

      if (filters.search) {
        const term = `%${filters.search}%`;
        query = query.or(
          `company_name.ilike.${term},contact_name.ilike.${term},phone.ilike.${term},city.ilike.${term},category.ilike.${term}`,
        );
      }
      if (filters.stage) query = query.eq("stage", filters.stage as Lead["stage"]);
      if (filters.siteStatus) query = query.eq("site_status", filters.siteStatus as Lead["site_status"]);
      if (filters.temperature)
        query = query.eq("temperature", filters.temperature as Lead["temperature"]);
      if (filters.city) query = query.eq("city", filters.city);
      if (filters.category) query = query.eq("category", filters.category);

      const { data, error } = await query.limit(1000);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useLeadEvents(leadId: string | null) {
  return useQuery({
    queryKey: ["lead-events", leadId],
    enabled: Boolean(leadId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("lead_events")
        .select("*")
        .eq("lead_id", leadId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

async function currentUserId() {
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) throw new Error("Sessão expirada");
  return data.user.id;
}

async function logEvent(leadId: string, type: string, title: string, body?: string) {
  const actorId = await currentUserId();
  await supabase.from("lead_events").insert({ lead_id: leadId, actor_id: actorId, type, title, body });
}

export type LeadInput = Omit<TablesInsert<"leads">, "owner_id" | "score" | "temperature">;

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LeadInput) => {
      const ownerId = await currentUserId();
      const score = calculateScore(input);
      const { data, error } = await supabase
        .from("leads")
        .insert({
          ...input,
          owner_id: ownerId,
          score,
          temperature: temperatureFromScore(score),
        })
        .select()
        .single();
      if (error) throw error;
      await logEvent(data.id, "created", "Lead criado", `Origem: ${data.source}`);
      return data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: TablesUpdate<"leads"> }) => {
      const payload = { ...values };
      if (
        "website" in values ||
        "reviews_count" in values ||
        "rating" in values ||
        "phone" in values ||
        "instagram" in values
      ) {
        const { data: current } = await supabase
          .from("leads")
          .select("website, reviews_count, rating, phone, whatsapp, instagram")
          .eq("id", id)
          .single();
        const score = calculateScore({ ...current, ...values });
        payload.score = score;
        payload.temperature = temperatureFromScore(score);
      }

      const { data, error } = await supabase
        .from("leads")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
      void queryClient.invalidateQueries({ queryKey: ["lead-events", variables.id] });
      return data;
    },
  });
}

export function useMoveStage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, stage, label }: { id: string; stage: Lead["stage"]; label: string }) => {
      const { error } = await supabase.from("leads").update({ stage }).eq("id", id);
      if (error) throw error;
      await logEvent(id, "stage_change", `Movido para ${label}`);
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("leads").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["leads"] });
    },
  });
}
