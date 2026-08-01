CREATE TABLE public.team_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  role public.app_role NOT NULL DEFAULT 'vendedor',
  team_id uuid REFERENCES public.teams(id) ON DELETE SET NULL,
  invited_by uuid NOT NULL,
  status text NOT NULL DEFAULT 'pendente',
  message text,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 days'),
  accepted_at timestamptz,
  accepted_user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX team_invitations_pending_email_idx
  ON public.team_invitations (lower(email)) WHERE status = 'pendente';

GRANT SELECT, INSERT, UPDATE, DELETE ON public.team_invitations TO authenticated;
GRANT ALL ON public.team_invitations TO service_role;

ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY team_invitations_select ON public.team_invitations
  FOR SELECT TO authenticated USING (public.is_manager(auth.uid()));
CREATE POLICY team_invitations_insert ON public.team_invitations
  FOR INSERT TO authenticated WITH CHECK (public.is_manager(auth.uid()) AND invited_by = auth.uid());
CREATE POLICY team_invitations_update ON public.team_invitations
  FOR UPDATE TO authenticated USING (public.is_manager(auth.uid())) WITH CHECK (public.is_manager(auth.uid()));
CREATE POLICY team_invitations_delete ON public.team_invitations
  FOR DELETE TO authenticated USING (public.is_manager(auth.uid()));

CREATE TRIGGER team_invitations_updated_at
  BEFORE UPDATE ON public.team_invitations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Admins gerenciam papéis
CREATE POLICY user_roles_insert_admin ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_delete_admin ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND user_id <> auth.uid());

-- Novo usuário consome convite pendente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_count INTEGER;
  inv public.team_invitations%ROWTYPE;
BEGIN
  INSERT INTO public.profiles (id, full_name, email, avatar_url)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'full_name', NEW.email, NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  SELECT * INTO inv FROM public.team_invitations
  WHERE lower(email) = lower(NEW.email) AND status = 'pendente' AND expires_at > now()
  ORDER BY created_at DESC LIMIT 1;

  IF inv.id IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, inv.role)
    ON CONFLICT (user_id, role) DO NOTHING;

    IF inv.team_id IS NOT NULL THEN
      INSERT INTO public.team_members (team_id, user_id) VALUES (inv.team_id, NEW.id)
      ON CONFLICT DO NOTHING;
    END IF;

    UPDATE public.team_invitations
    SET status = 'aceito', accepted_at = now(), accepted_user_id = NEW.id, updated_at = now()
    WHERE id = inv.id;

    RETURN NEW;
  END IF;

  SELECT count(*) INTO user_count FROM public.user_roles;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN user_count = 0 THEN 'admin'::public.app_role ELSE 'vendedor'::public.app_role END)
  ON CONFLICT (user_id, role) DO NOTHING;

  RETURN NEW;
END; $function$;