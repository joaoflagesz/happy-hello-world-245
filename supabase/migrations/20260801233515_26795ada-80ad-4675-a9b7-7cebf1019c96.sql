-- ============================ E-MAIL ============================
CREATE TABLE public.email_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  content text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_signatures TO authenticated;
GRANT ALL ON public.email_signatures TO service_role;
ALTER TABLE public.email_signatures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_signatures_select" ON public.email_signatures FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "email_signatures_insert" ON public.email_signatures FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "email_signatures_update" ON public.email_signatures FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "email_signatures_delete" ON public.email_signatures FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  subject text NOT NULL,
  body text NOT NULL,
  category text NOT NULL DEFAULT 'geral',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_templates TO authenticated;
GRANT ALL ON public.email_templates TO service_role;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_templates_select" ON public.email_templates FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "email_templates_insert" ON public.email_templates FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "email_templates_update" ON public.email_templates FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "email_templates_delete" ON public.email_templates FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TYPE public.email_direction AS ENUM ('entrada', 'saida');
CREATE TYPE public.email_status AS ENUM ('rascunho', 'agendado', 'enviado', 'recebido', 'erro');

CREATE TABLE public.email_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  direction public.email_direction NOT NULL DEFAULT 'saida',
  status public.email_status NOT NULL DEFAULT 'rascunho',
  from_address text,
  to_address text NOT NULL,
  cc_address text,
  subject text NOT NULL,
  body text NOT NULL DEFAULT '',
  is_starred boolean NOT NULL DEFAULT false,
  is_read boolean NOT NULL DEFAULT true,
  labels text[] NOT NULL DEFAULT '{}',
  scheduled_for timestamptz,
  sent_at timestamptz,
  replied_at timestamptz,
  error_detail text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.email_messages TO authenticated;
GRANT ALL ON public.email_messages TO service_role;
ALTER TABLE public.email_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "email_messages_select" ON public.email_messages FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "email_messages_insert" ON public.email_messages FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "email_messages_update" ON public.email_messages FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "email_messages_delete" ON public.email_messages FOR DELETE TO authenticated USING (owner_id = auth.uid());
CREATE INDEX email_messages_owner_created_idx ON public.email_messages (owner_id, created_at DESC);

-- ========================== DOCUMENTOS ==========================
CREATE TABLE public.doc_folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  parent_id uuid REFERENCES public.doc_folders(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_folders TO authenticated;
GRANT ALL ON public.doc_folders TO service_role;
ALTER TABLE public.doc_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_folders_select" ON public.doc_folders FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "doc_folders_insert" ON public.doc_folders FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "doc_folders_update" ON public.doc_folders FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "doc_folders_delete" ON public.doc_folders FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.doc_files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  folder_id uuid REFERENCES public.doc_folders(id) ON DELETE SET NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  name text NOT NULL,
  file_path text NOT NULL,
  mime_type text,
  size_bytes bigint NOT NULL DEFAULT 0,
  version integer NOT NULL DEFAULT 1,
  replaces_id uuid REFERENCES public.doc_files(id) ON DELETE SET NULL,
  is_shared boolean NOT NULL DEFAULT false,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.doc_files TO authenticated;
GRANT ALL ON public.doc_files TO service_role;
ALTER TABLE public.doc_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_files_select" ON public.doc_files FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "doc_files_insert" ON public.doc_files FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "doc_files_update" ON public.doc_files FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "doc_files_delete" ON public.doc_files FOR DELETE TO authenticated USING (owner_id = auth.uid());

-- ====================== ASSINATURA DIGITAL ======================
CREATE TYPE public.signature_status AS ENUM ('rascunho', 'enviado', 'assinado', 'recusado', 'expirado');

CREATE TABLE public.signature_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE SET NULL,
  proposal_id uuid REFERENCES public.proposals(id) ON DELETE SET NULL,
  title text NOT NULL,
  content text NOT NULL,
  signer_name text NOT NULL,
  signer_email text,
  signer_phone text,
  status public.signature_status NOT NULL DEFAULT 'rascunho',
  public_token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(24), 'hex'),
  signed_name text,
  signed_at timestamptz,
  signed_ip text,
  signed_user_agent text,
  declined_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.signature_requests TO authenticated;
GRANT ALL ON public.signature_requests TO service_role;
ALTER TABLE public.signature_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signature_requests_select" ON public.signature_requests FOR SELECT TO authenticated USING (owner_id = auth.uid());
CREATE POLICY "signature_requests_insert" ON public.signature_requests FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "signature_requests_update" ON public.signature_requests FOR UPDATE TO authenticated USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());
CREATE POLICY "signature_requests_delete" ON public.signature_requests FOR DELETE TO authenticated USING (owner_id = auth.uid());

CREATE TABLE public.signature_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.signature_requests(id) ON DELETE CASCADE,
  action text NOT NULL,
  detail text,
  ip text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.signature_events TO authenticated;
GRANT ALL ON public.signature_events TO service_role;
ALTER TABLE public.signature_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "signature_events_select" ON public.signature_events FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.signature_requests r WHERE r.id = request_id AND r.owner_id = auth.uid()));

-- Public (token-based) access for the online signing page
CREATE OR REPLACE FUNCTION public.get_signature_by_token(_token text)
RETURNS TABLE (
  id uuid, title text, content text, signer_name text,
  status public.signature_status, signed_name text, signed_at timestamptz, expires_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT r.id, r.title, r.content, r.signer_name, r.status, r.signed_name, r.signed_at, r.expires_at
  FROM public.signature_requests r
  WHERE r.public_token = _token AND r.status <> 'rascunho'
$$;
REVOKE ALL ON FUNCTION public.get_signature_by_token(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_signature_by_token(text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sign_document(_token text, _signed_name text, _ip text, _user_agent text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE rec public.signature_requests%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.signature_requests WHERE public_token = _token;
  IF rec.id IS NULL THEN RETURN false; END IF;
  IF rec.status <> 'enviado' THEN RETURN false; END IF;
  IF rec.expires_at IS NOT NULL AND rec.expires_at < now() THEN RETURN false; END IF;
  IF coalesce(trim(_signed_name), '') = '' THEN RETURN false; END IF;

  UPDATE public.signature_requests
  SET status = 'assinado', signed_name = trim(_signed_name), signed_at = now(),
      signed_ip = _ip, signed_user_agent = _user_agent, updated_at = now()
  WHERE id = rec.id;

  INSERT INTO public.signature_events (request_id, action, detail, ip, user_agent)
  VALUES (rec.id, 'assinado', trim(_signed_name), _ip, _user_agent);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.sign_document(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sign_document(text, text, text, text) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.decline_document(_token text, _reason text, _ip text, _user_agent text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE rec public.signature_requests%ROWTYPE;
BEGIN
  SELECT * INTO rec FROM public.signature_requests WHERE public_token = _token;
  IF rec.id IS NULL OR rec.status <> 'enviado' THEN RETURN false; END IF;

  UPDATE public.signature_requests
  SET status = 'recusado', declined_at = now(), updated_at = now()
  WHERE id = rec.id;

  INSERT INTO public.signature_events (request_id, action, detail, ip, user_agent)
  VALUES (rec.id, 'recusado', _reason, _ip, _user_agent);
  RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.decline_document(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.decline_document(text, text, text, text) TO anon, authenticated;

-- updated_at triggers
CREATE TRIGGER email_signatures_updated_at BEFORE UPDATE ON public.email_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER email_templates_updated_at BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER email_messages_updated_at BEFORE UPDATE ON public.email_messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER doc_folders_updated_at BEFORE UPDATE ON public.doc_folders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER doc_files_updated_at BEFORE UPDATE ON public.doc_files
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER signature_requests_updated_at BEFORE UPDATE ON public.signature_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();