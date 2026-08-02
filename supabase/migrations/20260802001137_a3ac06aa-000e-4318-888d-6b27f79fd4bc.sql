CREATE TYPE public.wa_campaign_status AS ENUM ('rascunho','em_andamento','pausada','concluida');
CREATE TYPE public.wa_target_status AS ENUM ('fila','enviado','pulado','erro');

CREATE TABLE public.wa_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  name text NOT NULL,
  message text NOT NULL,
  status public.wa_campaign_status NOT NULL DEFAULT 'rascunho',
  min_interval_seconds integer NOT NULL DEFAULT 25,
  max_interval_seconds integer NOT NULL DEFAULT 60,
  daily_limit integer NOT NULL DEFAULT 80,
  batch_size integer NOT NULL DEFAULT 20,
  batch_pause_minutes integer NOT NULL DEFAULT 15,
  sent_today integer NOT NULL DEFAULT 0,
  last_sent_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_campaigns TO authenticated;
GRANT ALL ON public.wa_campaigns TO service_role;
ALTER TABLE public.wa_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own campaigns select" ON public.wa_campaigns FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own campaigns insert" ON public.wa_campaigns FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own campaigns update" ON public.wa_campaigns FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own campaigns delete" ON public.wa_campaigns FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.wa_campaign_targets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.wa_campaigns(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL DEFAULT auth.uid(),
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_name text,
  phone text NOT NULL,
  message text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  status public.wa_target_status NOT NULL DEFAULT 'fila',
  sent_at timestamptz,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.wa_campaign_targets TO authenticated;
GRANT ALL ON public.wa_campaign_targets TO service_role;
ALTER TABLE public.wa_campaign_targets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own targets select" ON public.wa_campaign_targets FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "own targets insert" ON public.wa_campaign_targets FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own targets update" ON public.wa_campaign_targets FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own targets delete" ON public.wa_campaign_targets FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE INDEX idx_wa_targets_campaign ON public.wa_campaign_targets (campaign_id, position);

CREATE TRIGGER update_wa_campaigns_updated_at BEFORE UPDATE ON public.wa_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_wa_targets_updated_at BEFORE UPDATE ON public.wa_campaign_targets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();