-- Lock down internal/definer functions from being called directly via the API
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.log_entity_change() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- Role helpers: only signed-in users need them (used by RLS policies); never anon
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_manager(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_manager(uuid) TO authenticated;

-- Public signing flow: token-scoped definer functions stay callable, but nothing else
REVOKE ALL ON FUNCTION public.get_signature_by_token(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sign_document(text, text, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.decline_document(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_signature_by_token(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_document(text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decline_document(text, text, text, text) TO anon, authenticated;