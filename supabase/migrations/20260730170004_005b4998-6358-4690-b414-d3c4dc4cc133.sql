-- ============ ENUMS ============
DO $$ BEGIN CREATE TYPE public.task_status AS ENUM ('pendente','em_andamento','concluida','cancelada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.task_priority AS ENUM ('baixa','media','alta','urgente'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.finance_kind AS ENUM ('receita','despesa'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.finance_status AS ENUM ('previsto','pago','atrasado','cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.goal_metric AS ENUM ('receita','leads','negocios','reunioes','propostas'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.automation_status AS ENUM ('ativa','pausada','rascunho'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.wa_direction AS ENUM ('entrada','saida'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.wa_message_status AS ENUM ('pendente','enviada','entregue','lida','erro'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============ TEAMS ============
CREATE TABLE IF NOT EXISTS public.teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT '#6366f1',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teams TO authenticated;
GRANT ALL ON public.teams TO service_role;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
CREATE POLICY teams_select ON public.teams FOR SELECT TO authenticated USING (true);
CREATE POLICY teams_insert ON public.teams FOR INSERT TO authenticated WITH CHECK (is_manager(auth.uid()) AND created_by = auth.uid());
CREATE POLICY teams_update ON public.teams FOR UPDATE TO authenticated USING (is_manager(auth.uid())) WITH CHECK (is_manager(auth.uid()));
CREATE POLICY teams_delete ON public.teams FOR DELETE TO authenticated USING (has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  is_leader boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (team_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_members TO authenticated;
GRANT ALL ON public.team_members TO service_role;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY team_members_select ON public.team_members FOR SELECT TO authenticated USING (true);
CREATE POLICY team_members_write ON public.team_members FOR ALL TO authenticated USING (is_manager(auth.uid())) WITH CHECK (is_manager(auth.uid()));

-- ============ COMPANIES / CONTACTS ============
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  legal_name text,
  document text,
  website text,
  industry text,
  size text,
  phone text,
  email text,
  city text,
  state text,
  address text,
  postal_code text,
  notes text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY companies_select ON public.companies FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY companies_insert ON public.companies FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY companies_update ON public.companies FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY companies_delete ON public.companies FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  role_title text,
  is_decision_maker boolean NOT NULL DEFAULT false,
  is_partner boolean NOT NULL DEFAULT false,
  email text,
  phone text,
  whatsapp text,
  linkedin text,
  instagram text,
  birthday date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY contacts_select ON public.contacts FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY contacts_insert ON public.contacts FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY contacts_update ON public.contacts FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY contacts_delete ON public.contacts FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ TASKS ============
CREATE TABLE IF NOT EXISTS public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  assigned_to uuid,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status public.task_status NOT NULL DEFAULT 'pendente',
  priority public.task_priority NOT NULL DEFAULT 'media',
  due_at timestamptz,
  completed_at timestamptz,
  created_by_ai boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY tasks_select ON public.tasks FOR SELECT TO authenticated USING (owner_id = auth.uid() OR assigned_to = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY tasks_insert ON public.tasks FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY tasks_update ON public.tasks FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR assigned_to = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR assigned_to = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY tasks_delete ON public.tasks FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ NOTIFICATIONS ============
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  kind text NOT NULL DEFAULT 'info',
  link text,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY notifications_insert ON public.notifications FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY notifications_delete ON public.notifications FOR DELETE TO authenticated USING (user_id = auth.uid());

-- ============ ACTIVITY LOG ============
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid,
  entity_type text NOT NULL,
  entity_id uuid,
  action text NOT NULL,
  summary text,
  changes jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.activity_log TO authenticated;
GRANT ALL ON public.activity_log TO service_role;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY activity_log_select ON public.activity_log FOR SELECT TO authenticated USING (actor_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY activity_log_insert ON public.activity_log FOR INSERT TO authenticated WITH CHECK (actor_id = auth.uid());

CREATE OR REPLACE FUNCTION public.log_entity_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $fn$
DECLARE act text; eid uuid;
BEGIN
  IF TG_OP = 'INSERT' THEN act := 'created'; eid := NEW.id;
  ELSIF TG_OP = 'UPDATE' THEN act := 'updated'; eid := NEW.id;
  ELSE act := 'deleted'; eid := OLD.id;
  END IF;
  INSERT INTO public.activity_log (actor_id, entity_type, entity_id, action, changes)
  VALUES (auth.uid(), TG_TABLE_NAME, eid, act,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END);
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $fn$;

CREATE TRIGGER leads_activity AFTER INSERT OR UPDATE OR DELETE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();
CREATE TRIGGER deals_activity AFTER INSERT OR UPDATE OR DELETE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();
CREATE TRIGGER proposals_activity AFTER INSERT OR UPDATE OR DELETE ON public.proposals FOR EACH ROW EXECUTE FUNCTION public.log_entity_change();

-- ============ TAGS / CUSTOM FIELDS ============
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  entity_type text NOT NULL DEFAULT 'lead',
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (name, entity_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tags TO authenticated;
GRANT ALL ON public.tags TO service_role;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY tags_select ON public.tags FOR SELECT TO authenticated USING (true);
CREATE POLICY tags_insert ON public.tags FOR INSERT TO authenticated WITH CHECK (created_by = auth.uid());
CREATE POLICY tags_update ON public.tags FOR UPDATE TO authenticated USING (created_by = auth.uid() OR is_manager(auth.uid())) WITH CHECK (created_by = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY tags_delete ON public.tags FOR DELETE TO authenticated USING (created_by = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.custom_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL DEFAULT 'lead',
  key text NOT NULL,
  label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (entity_type, key)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_fields TO authenticated;
GRANT ALL ON public.custom_fields TO service_role;
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY custom_fields_select ON public.custom_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY custom_fields_write ON public.custom_fields FOR ALL TO authenticated USING (is_manager(auth.uid())) WITH CHECK (is_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.custom_field_values (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field_id uuid NOT NULL REFERENCES public.custom_fields(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  owner_id uuid NOT NULL,
  value jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (field_id, entity_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.custom_field_values TO authenticated;
GRANT ALL ON public.custom_field_values TO service_role;
ALTER TABLE public.custom_field_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY cfv_select ON public.custom_field_values FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY cfv_insert ON public.custom_field_values FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY cfv_update ON public.custom_field_values FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY cfv_delete ON public.custom_field_values FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ PIPELINES ============
CREATE TABLE IF NOT EXISTS public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_default boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipelines TO authenticated;
GRANT ALL ON public.pipelines TO service_role;
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
CREATE POLICY pipelines_select ON public.pipelines FOR SELECT TO authenticated USING (true);
CREATE POLICY pipelines_write ON public.pipelines FOR ALL TO authenticated USING (is_manager(auth.uid())) WITH CHECK (is_manager(auth.uid()));

CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL,
  color text NOT NULL DEFAULT '#6366f1',
  position integer NOT NULL DEFAULT 0,
  probability integer NOT NULL DEFAULT 0,
  is_won boolean NOT NULL DEFAULT false,
  is_lost boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pipeline_stages TO authenticated;
GRANT ALL ON public.pipeline_stages TO service_role;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;
CREATE POLICY pipeline_stages_select ON public.pipeline_stages FOR SELECT TO authenticated USING (true);
CREATE POLICY pipeline_stages_write ON public.pipeline_stages FOR ALL TO authenticated USING (is_manager(auth.uid())) WITH CHECK (is_manager(auth.uid()));

-- ============ GOALS ============
CREATE TABLE IF NOT EXISTS public.goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  user_id uuid,
  team_id uuid REFERENCES public.teams(id) ON DELETE CASCADE,
  metric public.goal_metric NOT NULL DEFAULT 'receita',
  target numeric NOT NULL DEFAULT 0,
  period_start date NOT NULL,
  period_end date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.goals TO authenticated;
GRANT ALL ON public.goals TO service_role;
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_select ON public.goals FOR SELECT TO authenticated USING (owner_id = auth.uid() OR user_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY goals_insert ON public.goals FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY goals_update ON public.goals FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY goals_delete ON public.goals FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ FINANCE ============
CREATE TABLE IF NOT EXISTS public.finance_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  kind public.finance_kind NOT NULL DEFAULT 'receita',
  description text NOT NULL,
  category text,
  cost_center text,
  amount numeric NOT NULL DEFAULT 0,
  status public.finance_status NOT NULL DEFAULT 'previsto',
  due_date date,
  paid_at date,
  payment_method text,
  installment_number integer NOT NULL DEFAULT 1,
  installment_total integer NOT NULL DEFAULT 1,
  commission_rate numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.finance_entries TO authenticated;
GRANT ALL ON public.finance_entries TO service_role;
ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY finance_select ON public.finance_entries FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY finance_insert ON public.finance_entries FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY finance_update ON public.finance_entries FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY finance_delete ON public.finance_entries FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ AUTOMATIONS ============
CREATE TABLE IF NOT EXISTS public.automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  description text,
  status public.automation_status NOT NULL DEFAULT 'rascunho',
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  conditions jsonb NOT NULL DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,
  run_count integer NOT NULL DEFAULT 0,
  last_run_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.automations TO authenticated;
GRANT ALL ON public.automations TO service_role;
ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
CREATE POLICY automations_select ON public.automations FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY automations_insert ON public.automations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY automations_update ON public.automations FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY automations_delete ON public.automations FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.automation_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id uuid NOT NULL REFERENCES public.automations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'ok',
  detail text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.automation_runs TO authenticated;
GRANT ALL ON public.automation_runs TO service_role;
ALTER TABLE public.automation_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY automation_runs_select ON public.automation_runs FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY automation_runs_insert ON public.automation_runs FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());

-- ============ WHATSAPP ============
CREATE TABLE IF NOT EXISTS public.whatsapp_numbers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  label text NOT NULL,
  phone text NOT NULL,
  provider text NOT NULL DEFAULT 'manual',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_numbers TO authenticated;
GRANT ALL ON public.whatsapp_numbers TO service_role;
ALTER TABLE public.whatsapp_numbers ENABLE ROW LEVEL SECURITY;
CREATE POLICY wa_numbers_all ON public.whatsapp_numbers FOR ALL TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  number_id uuid REFERENCES public.whatsapp_numbers(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  contact_name text,
  contact_phone text NOT NULL,
  labels text[] NOT NULL DEFAULT '{}',
  unread_count integer NOT NULL DEFAULT 0,
  last_message text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_conversations TO authenticated;
GRANT ALL ON public.whatsapp_conversations TO service_role;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY wa_conv_select ON public.whatsapp_conversations FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY wa_conv_insert ON public.whatsapp_conversations FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY wa_conv_update ON public.whatsapp_conversations FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY wa_conv_delete ON public.whatsapp_conversations FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
  owner_id uuid NOT NULL,
  direction public.wa_direction NOT NULL DEFAULT 'saida',
  body text,
  media_url text,
  media_type text,
  status public.wa_message_status NOT NULL DEFAULT 'pendente',
  scheduled_for timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.whatsapp_messages TO authenticated;
GRANT ALL ON public.whatsapp_messages TO service_role;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY wa_msg_select ON public.whatsapp_messages FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY wa_msg_insert ON public.whatsapp_messages FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY wa_msg_update ON public.whatsapp_messages FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid())) WITH CHECK (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY wa_msg_delete ON public.whatsapp_messages FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ ATTACHMENTS ============
CREATE TABLE IF NOT EXISTS public.attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  file_name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attachments TO authenticated;
GRANT ALL ON public.attachments TO service_role;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY attachments_select ON public.attachments FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY attachments_insert ON public.attachments FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY attachments_update ON public.attachments FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY attachments_delete ON public.attachments FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ AI INSIGHTS ============
CREATE TABLE IF NOT EXISTS public.ai_insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  entity_type text NOT NULL DEFAULT 'lead',
  entity_id uuid,
  kind text NOT NULL DEFAULT 'resumo',
  content text NOT NULL,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_insights TO authenticated;
GRANT ALL ON public.ai_insights TO service_role;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_insights_select ON public.ai_insights FOR SELECT TO authenticated USING (owner_id = auth.uid() OR is_manager(auth.uid()));
CREATE POLICY ai_insights_insert ON public.ai_insights FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY ai_insights_update ON public.ai_insights FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY ai_insights_delete ON public.ai_insights FOR DELETE TO authenticated USING (owner_id = auth.uid() OR has_role(auth.uid(),'admin'));

-- ============ LEADS: NOVOS CAMPOS ============
ALTER TABLE public.leads
  ADD COLUMN IF NOT EXISTS campaign text,
  ADD COLUMN IF NOT EXISTS utm_source text,
  ADD COLUMN IF NOT EXISTS utm_medium text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS potential_value numeric,
  ADD COLUMN IF NOT EXISTS win_probability integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS next_action text,
  ADD COLUMN IF NOT EXISTS next_action_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_interaction_at timestamptz,
  ADD COLUMN IF NOT EXISTS health_score integer NOT NULL DEFAULT 50,
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS primary_contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pipeline_id uuid REFERENCES public.pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS ai_summary text,
  ADD COLUMN IF NOT EXISTS interests text[] NOT NULL DEFAULT '{}';

-- ============ UPDATED_AT TRIGGERS ============
CREATE TRIGGER teams_updated_at BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER companies_updated_at BEFORE UPDATE ON public.companies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER contacts_updated_at BEFORE UPDATE ON public.contacts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER tasks_updated_at BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER cfv_updated_at BEFORE UPDATE ON public.custom_field_values FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER pipelines_updated_at BEFORE UPDATE ON public.pipelines FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER goals_updated_at BEFORE UPDATE ON public.goals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER finance_updated_at BEFORE UPDATE ON public.finance_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER automations_updated_at BEFORE UPDATE ON public.automations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER wa_numbers_updated_at BEFORE UPDATE ON public.whatsapp_numbers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER wa_conv_updated_at BEFORE UPDATE ON public.whatsapp_conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_tasks_owner_due ON public.tasks(owner_id, due_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity ON public.activity_log(entity_type, entity_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_finance_owner_due ON public.finance_entries(owner_id, due_date);
CREATE INDEX IF NOT EXISTS idx_wa_msg_conv ON public.whatsapp_messages(conversation_id, created_at);
CREATE INDEX IF NOT EXISTS idx_contacts_company ON public.contacts(company_id);