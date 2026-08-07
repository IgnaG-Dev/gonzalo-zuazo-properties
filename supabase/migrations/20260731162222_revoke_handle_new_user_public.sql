-- El revoke anterior apuntó a anon/authenticated, pero el EXECUTE por
-- defecto se otorga al pseudo-rol PUBLIC al crear la función — hay que
-- revocarlo ahí para que deje de ser invocable vía /rest/v1/rpc.
revoke execute on function public.handle_new_user() from public;
