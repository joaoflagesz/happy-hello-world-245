import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables, TablesInsert, TablesUpdate } from "@/integrations/supabase/types";

export type EmailMessage = Tables<"email_messages">;
export type EmailTemplate = Tables<"email_templates">;
export type EmailSignature = Tables<"email_signatures">;
export type DocFolder = Tables<"doc_folders">;
export type DocFile = Tables<"doc_files">;
export type SignatureRequest = Tables<"signature_requests">;
export type SignatureEvent = Tables<"signature_events">;

export const DOCS_BUCKET = "documentos";

export const EMAIL_STATUSES = [
  { value: "rascunho", label: "Rascunho" },
  { value: "agendado", label: "Agendado" },
  { value: "enviado", label: "Enviado" },
  { value: "recebido", label: "Recebido" },
  { value: "erro", label: "Falhou" },
] as const;

export const EMAIL_CATEGORIES = [
  { value: "geral", label: "Geral" },
  { value: "prospeccao", label: "Prospecção" },
  { value: "follow_up", label: "Follow-up" },
  { value: "proposta", label: "Proposta" },
  { value: "pos_venda", label: "Pós-venda" },
] as const;

export const SIGNATURE_STATUSES = [
  { value: "rascunho", label: "Rascunho" },
  { value: "enviado", label: "Aguardando assinatura" },
  { value: "assinado", label: "Assinado" },
  { value: "recusado", label: "Recusado" },
  { value: "expirado", label: "Expirado" },
] as const;

async function uid() {
  const { data } = await supabase.auth.getUser();
  const id = data.user?.id;
  if (!id) throw new Error("Sessão expirada. Entre novamente.");
  return id;
}

/** Replaces {{variavel}} placeholders with real values. */
export function applyVariables(text: string, vars: Record<string, string | null | undefined>) {
  return text.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_m, key: string) => vars[key] ?? "");
}

/* --------------------------------- e-mail --------------------------------- */

export function useEmails() {
  return useQuery({
    queryKey: ["email_messages"],
    queryFn: async (): Promise<EmailMessage[]> => {
      const { data, error } = await supabase
        .from("email_messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EmailMessage> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("email_messages")
          .update(rest as TablesUpdate<"email_messages">)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const payload = { ...rest, owner_id: await uid() } as TablesInsert<"email_messages">;
      const { data, error } = await supabase.from("email_messages").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_messages"] }),
  });
}

export function useDeleteEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_messages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_messages"] }),
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ["email_templates"],
    queryFn: async (): Promise<EmailTemplate[]> => {
      const { data, error } = await supabase
        .from("email_templates")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EmailTemplate> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("email_templates")
          .update(rest as TablesUpdate<"email_templates">)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const payload = { ...rest, owner_id: await uid() } as TablesInsert<"email_templates">;
      const { data, error } = await supabase.from("email_templates").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_templates"] }),
  });
}

export function useDeleteEmailTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_templates"] }),
  });
}

export function useEmailSignatures() {
  return useQuery({
    queryKey: ["email_signatures"],
    queryFn: async (): Promise<EmailSignature[]> => {
      const { data, error } = await supabase
        .from("email_signatures")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveEmailSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<EmailSignature> & { id?: string }) => {
      const owner = await uid();
      const { id, ...rest } = input;
      if (rest.is_default) {
        await supabase.from("email_signatures").update({ is_default: false }).eq("owner_id", owner);
      }
      if (id) {
        const { error } = await supabase
          .from("email_signatures")
          .update(rest as TablesUpdate<"email_signatures">)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const payload = { ...rest, owner_id: owner } as TablesInsert<"email_signatures">;
      const { data, error } = await supabase.from("email_signatures").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_signatures"] }),
  });
}

export function useDeleteEmailSignature() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("email_signatures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["email_signatures"] }),
  });
}

/* ------------------------------- documentos ------------------------------- */

export function useDocFolders() {
  return useQuery({
    queryKey: ["doc_folders"],
    queryFn: async (): Promise<DocFolder[]> => {
      const { data, error } = await supabase.from("doc_folders").select("*").order("name");
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveDocFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<DocFolder> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("doc_folders")
          .update(rest as TablesUpdate<"doc_folders">)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const payload = { ...rest, owner_id: await uid() } as TablesInsert<"doc_folders">;
      const { data, error } = await supabase.from("doc_folders").insert(payload).select("id").single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc_folders"] }),
  });
}

export function useDeleteDocFolder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("doc_folders").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["doc_folders"] });
      qc.invalidateQueries({ queryKey: ["doc_files"] });
    },
  });
}

export function useDocFiles(folderId: string | null) {
  return useQuery({
    queryKey: ["doc_files", folderId],
    queryFn: async (): Promise<DocFile[]> => {
      let query = supabase.from("doc_files").select("*").order("created_at", { ascending: false });
      if (folderId) query = query.eq("folder_id", folderId);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useUploadDocs() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ files, folderId }: { files: File[]; folderId: string | null }) => {
      const owner = await uid();
      for (const file of files) {
        const safe = file.name.replace(/[^\w.\-]+/g, "_");
        const path = `${owner}/${crypto.randomUUID()}-${safe}`;
        const { error: upErr } = await supabase.storage.from(DOCS_BUCKET).upload(path, file, {
          cacheControl: "3600",
          upsert: false,
        });
        if (upErr) throw upErr;

        const { data: previous } = await supabase
          .from("doc_files")
          .select("id, version")
          .eq("owner_id", owner)
          .eq("name", file.name)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle();

        const { error } = await supabase.from("doc_files").insert({
          owner_id: owner,
          folder_id: folderId,
          name: file.name,
          file_path: path,
          mime_type: file.type || null,
          size_bytes: file.size,
          version: (previous?.version ?? 0) + 1,
          replaces_id: previous?.id ?? null,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc_files"] }),
  });
}

export function useUpdateDocFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...rest }: Partial<DocFile> & { id: string }) => {
      const { error } = await supabase
        .from("doc_files")
        .update(rest as TablesUpdate<"doc_files">)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc_files"] }),
  });
}

export function useDeleteDocFile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: DocFile) => {
      await supabase.storage.from(DOCS_BUCKET).remove([file.file_path]);
      const { error } = await supabase.from("doc_files").delete().eq("id", file.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["doc_files"] }),
  });
}

export async function docSignedUrl(path: string) {
  const { data, error } = await supabase.storage.from(DOCS_BUCKET).createSignedUrl(path, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

export function formatBytes(bytes: number) {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

/* --------------------------- assinatura digital --------------------------- */

export function useSignatureRequests() {
  return useQuery({
    queryKey: ["signature_requests"],
    queryFn: async (): Promise<SignatureRequest[]> => {
      const { data, error } = await supabase
        .from("signature_requests")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSignatureEvents(requestId: string | null) {
  return useQuery({
    queryKey: ["signature_events", requestId],
    enabled: Boolean(requestId),
    queryFn: async (): Promise<SignatureEvent[]> => {
      const { data, error } = await supabase
        .from("signature_events")
        .select("*")
        .eq("request_id", requestId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSaveSignatureRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: Partial<SignatureRequest> & { id?: string }) => {
      const { id, ...rest } = input;
      if (id) {
        const { error } = await supabase
          .from("signature_requests")
          .update(rest as TablesUpdate<"signature_requests">)
          .eq("id", id);
        if (error) throw error;
        return id;
      }
      const payload = { ...rest, owner_id: await uid() } as TablesInsert<"signature_requests">;
      const { data, error } = await supabase
        .from("signature_requests")
        .insert(payload)
        .select("id")
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signature_requests"] }),
  });
}

export function useDeleteSignatureRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("signature_requests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["signature_requests"] }),
  });
}
