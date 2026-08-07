-- Endurecimiento de seguridad (ver advisors): search_path fijo para evitar
-- hijacking, y quitar la superficie RPC pública de una función que solo debe
-- ejecutarse como trigger.

alter function public.set_updated_at() set search_path = public;

revoke execute on function public.handle_new_user() from anon, authenticated;
