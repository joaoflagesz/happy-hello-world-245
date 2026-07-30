CREATE TYPE public.appointment_type AS ENUM ('reuniao','visita','ligacao','follow_up','outro');
CREATE TYPE public.appointment_status AS ENUM ('agendado','concluido','cancelado');
CREATE TYPE public.deal_status AS ENUM ('aberta','ganha','perdida');
CREATE TYPE public.proposal_status AS ENUM ('rascunho','enviada','aceita','recusada');

CREATE TABLE public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  type public.appointment_type NOT NULL DEFAULT 'reuniao',
  description text,
  location text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  status public.appointment_status NOT NULL DEFAULT 'agendado',
  remind_minutes_before integer DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE POLICY appointments_select ON public.appointments FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY appointments_insert ON public.appointments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY appointments_update ON public.appointments FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY appointments_delete ON public.appointments FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX appointments_owner_starts_idx ON public.appointments (owner_id, starts_at);

CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  title text NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  status public.deal_status NOT NULL DEFAULT 'aberta',
  closed_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_select ON public.deals FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY deals_insert ON public.deals FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY deals_update ON public.deals FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY deals_delete ON public.deals FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.proposals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  number text NOT NULL,
  title text NOT NULL,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  discount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  valid_until date,
  status public.proposal_status NOT NULL DEFAULT 'rascunho',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proposals TO authenticated;
GRANT ALL ON public.proposals TO service_role;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY proposals_select ON public.proposals FOR SELECT TO authenticated USING (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY proposals_insert ON public.proposals FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY proposals_update ON public.proposals FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR public.is_manager(auth.uid()));
CREATE POLICY proposals_delete ON public.proposals FOR DELETE TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();