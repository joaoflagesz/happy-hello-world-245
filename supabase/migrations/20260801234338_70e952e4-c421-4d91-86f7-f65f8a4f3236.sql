CREATE TYPE public.visit_status AS ENUM ('agendada','em_andamento','concluida','cancelada');
CREATE TYPE public.visit_outcome AS ENUM ('sem_resultado','interessado','proposta','fechado','recusado');

CREATE TABLE public.visits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  title text NOT NULL,
  address text,
  city text,
  state text,
  status public.visit_status NOT NULL DEFAULT 'agendada',
  outcome public.visit_outcome NOT NULL DEFAULT 'sem_resultado',
  scheduled_for timestamptz,
  checked_in_at timestamptz,
  checkin_lat double precision,
  checkin_lng double precision,
  checked_out_at timestamptz,
  checkout_lat double precision,
  checkout_lng double precision,
  duration_minutes integer,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visits TO authenticated;
GRANT ALL ON public.visits TO service_role;
ALTER TABLE public.visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "visits_select" ON public.visits FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY "visits_insert" ON public.visits FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "visits_update" ON public.visits FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "visits_delete" ON public.visits FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER update_visits_updated_at BEFORE UPDATE ON public.visits FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  key_prefix text NOT NULL,
  key_hash text NOT NULL,
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.api_keys TO authenticated;
GRANT ALL ON public.api_keys TO service_role;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_select" ON public.api_keys FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "api_keys_insert" ON public.api_keys FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "api_keys_update" ON public.api_keys FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "api_keys_delete" ON public.api_keys FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON public.api_keys FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  url text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  secret text,
  is_active boolean NOT NULL DEFAULT true,
  delivery_count integer NOT NULL DEFAULT 0,
  last_status integer,
  last_delivery_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.webhooks TO authenticated;
GRANT ALL ON public.webhooks TO service_role;
ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhooks_select" ON public.webhooks FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "webhooks_insert" ON public.webhooks FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "webhooks_update" ON public.webhooks FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "webhooks_delete" ON public.webhooks FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE TRIGGER update_webhooks_updated_at BEFORE UPDATE ON public.webhooks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.webhooks(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  event text NOT NULL,
  status integer,
  response text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.webhook_deliveries TO authenticated;
GRANT ALL ON public.webhook_deliveries TO service_role;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "webhook_deliveries_select" ON public.webhook_deliveries FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "webhook_deliveries_insert" ON public.webhook_deliveries FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());