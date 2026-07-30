import type { Tables } from "@/integrations/supabase/types";

export type Lead = Tables<"leads">;
export type LeadEvent = Tables<"lead_events">;

export type LeadStage = Lead["stage"];
export type SiteStatus = Lead["site_status"];
export type LeadTemperature = Lead["temperature"];
export type LeadPriority = Lead["priority"];

export const STAGES: { value: LeadStage; label: string }[] = [
  { value: "novo_lead", label: "Novo Lead" },
  { value: "analisado", label: "Analisado" },
  { value: "sem_site", label: "Sem Site" },
  { value: "possui_site", label: "Possui Site" },
  { value: "mensagem_enviada", label: "Mensagem Enviada" },
  { value: "respondeu", label: "Respondeu" },
  { value: "negociacao", label: "Negociação" },
  { value: "proposta_enviada", label: "Proposta Enviada" },
  { value: "reuniao", label: "Reunião" },
  { value: "aguardando", label: "Aguardando" },
  { value: "cliente", label: "Cliente" },
  { value: "perdido", label: "Perdido" },
];

export const STAGE_LABEL = Object.fromEntries(STAGES.map((s) => [s.value, s.label])) as Record<
  LeadStage,
  string
>;

export const SITE_STATUSES: { value: SiteStatus; label: string }[] = [
  { value: "sem_site", label: "Sem site" },
  { value: "possui_site", label: "Possui site" },
  { value: "site_ruim", label: "Site ruim" },
  { value: "site_desatualizado", label: "Site desatualizado" },
  { value: "site_lento", label: "Site lento" },
  { value: "site_moderno", label: "Site moderno" },
];

export const SITE_STATUS_LABEL = Object.fromEntries(
  SITE_STATUSES.map((s) => [s.value, s.label]),
) as Record<SiteStatus, string>;

export const TEMPERATURES: { value: LeadTemperature; label: string }[] = [
  { value: "frio", label: "Frio" },
  { value: "morno", label: "Morno" },
  { value: "quente", label: "Quente" },
];

export const PRIORITIES: { value: LeadPriority; label: string }[] = [
  { value: "baixa", label: "Baixa" },
  { value: "media", label: "Média" },
  { value: "alta", label: "Alta" },
];

/**
 * Critérios de pontuação — ficam centralizados aqui para poderem virar
 * configuração editável no banco em uma etapa futura sem mudar a UI.
 */
export const SCORE_RULES = {
  noWebsite: 50,
  manyReviews: { threshold: 300, points: 20 },
  highRating: { threshold: 4.6, points: 15 },
  hasPhone: 10,
  hasInstagram: 5,
} as const;

export type ScorableLead = {
  website?: string | null;
  reviews_count?: number | null;
  rating?: number | null;
  phone?: string | null;
  whatsapp?: string | null;
  instagram?: string | null;
};

export function calculateScore(lead: ScorableLead): number {
  let score = 0;
  if (!lead.website?.trim()) score += SCORE_RULES.noWebsite;
  if ((lead.reviews_count ?? 0) > SCORE_RULES.manyReviews.threshold)
    score += SCORE_RULES.manyReviews.points;
  if ((lead.rating ?? 0) > SCORE_RULES.highRating.threshold) score += SCORE_RULES.highRating.points;
  if (lead.phone?.trim() || lead.whatsapp?.trim()) score += SCORE_RULES.hasPhone;
  if (lead.instagram?.trim()) score += SCORE_RULES.hasInstagram;
  return Math.min(100, score);
}

export function temperatureFromScore(score: number): LeadTemperature {
  if (score >= 61) return "quente";
  if (score >= 31) return "morno";
  return "frio";
}

/** Normaliza um telefone brasileiro para o formato aceito pelo wa.me. */
export function toWhatsappNumber(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 10) return null;
  if (digits.startsWith("55")) return digits;
  return `55${digits}`;
}

export function formatPhone(raw: string | null | undefined): string {
  if (!raw) return "—";
  const digits = raw.replace(/\D/g, "").replace(/^55/, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  return raw;
}
