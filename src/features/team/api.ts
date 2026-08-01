import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole } from "@/features/auth/use-session";

/* ---------------------------------- teams --------------------------------- */

export type Team = {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string;
  created_at: string;
};

export type TeamMemberLink = {
  id: string;
  team_id: string;
  user_id: string;
  is_leader: boolean;
};

export function useTeams() {
  return useQuery({
    queryKey: ["teams"],
    queryFn: async (): Promise<Team[]> => {
      const { data, error } = await supabase
        .from("teams")
        .select("id, name, description, color, created_by, created_at")
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useTeamMembers() {
  return useQuery({
    queryKey: ["team_members"],
    queryFn: async (): Promise<TeamMemberLink[]> => {
      const { data, error } = await supabase
        .from("team_members")
        .select("id, team_id, user_id, is_leader");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id?: string; name: string; description?: string | null; color?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      if (input.id) {
        const { error } = await supabase
          .from("teams")
          .update({ name: input.name, description: input.description ?? null, color: input.color ?? "#6366f1" })
          .eq("id", input.id);
        if (error) throw error;
        return input.id;
      }
      const { data, error } = await supabase
        .from("teams")
        .insert({
          name: input.name,
          description: input.description ?? null,
          color: input.color ?? "#6366f1",
          created_by: uid,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["teams"] });
    },
  });
}

export function useDeleteTeam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("teams").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["teams"] });
      void qc.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
}

export function useSetTeamMembership() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; teamId: string | null }) => {
      const { error: delErr } = await supabase.from("team_members").delete().eq("user_id", input.userId);
      if (delErr) throw delErr;
      if (input.teamId) {
        const { error } = await supabase
          .from("team_members")
          .insert({ team_id: input.teamId, user_id: input.userId });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
}

export function useToggleLeader() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { id: string; is_leader: boolean }) => {
      const { error } = await supabase
        .from("team_members")
        .update({ is_leader: input.is_leader })
        .eq("id", input.id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team_members"] });
    },
  });
}

/* -------------------------------- invitations ------------------------------ */

export type Invitation = {
  id: string;
  email: string;
  role: AppRole;
  team_id: string | null;
  status: string;
  message: string | null;
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
};

export function useInvitations() {
  return useQuery({
    queryKey: ["team_invitations"],
    queryFn: async (): Promise<Invitation[]> => {
      const { data, error } = await supabase
        .from("team_invitations")
        .select("id, email, role, team_id, status, message, expires_at, accepted_at, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Invitation[];
    },
  });
}

export function useCreateInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { email: string; role: AppRole; team_id: string | null; message?: string }) => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sessão expirada.");
      const { data, error } = await supabase
        .from("team_invitations")
        .insert({
          email: input.email.trim().toLowerCase(),
          role: input.role,
          team_id: input.team_id,
          message: input.message?.trim() || null,
          invited_by: uid,
        })
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team_invitations"] });
    },
  });
}

export function useCancelInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("team_invitations")
        .update({ status: "cancelado" })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team_invitations"] });
    },
  });
}

export function useDeleteInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("team_invitations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["team_invitations"] });
    },
  });
}

/* ----------------------------------- roles --------------------------------- */

export function useSetUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; role: AppRole }) => {
      const { error: delErr } = await supabase.from("user_roles").delete().eq("user_id", input.userId);
      if (delErr) throw delErr;
      const { error } = await supabase
        .from("user_roles")
        .insert({ user_id: input.userId, role: input.role });
      if (error) throw error;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["org_members"] });
      void qc.invalidateQueries({ queryKey: ["roles"] });
    },
  });
}
