-- ============================================================================
-- Clickfield OS — 0007 harden functions (security advisor remediation)
-- ============================================================================

-- 1) Pin search_path on the two flagged functions.
alter function public.set_updated_at() set search_path = public;
alter function public.is_authenticated() set search_path = public;

-- 2) Read-only permission helpers: used inside RLS by authenticated; anon never
--    needs them. Keep authenticated EXECUTE (required for policy evaluation),
--    revoke anon.
revoke execute on function public.has_any_role(public.user_role[]) from anon;
revoke execute on function public.is_super_admin() from anon;
revoke execute on function public.is_admin() from anon;
revoke execute on function public.can_view_financials() from anon;
revoke execute on function public.can_manage_finance() from anon;
revoke execute on function public.can_approve_expenses() from anon;
revoke execute on function public.is_authenticated() from anon;
revoke execute on function public.my_project_ids() from anon;
revoke execute on function public.can_see_project(uuid) from anon;
revoke execute on function public.project_closure_blockers(uuid) from anon;
revoke execute on function public.write_audit(text, text, uuid, text, jsonb, jsonb) from anon;

-- 3) Internal / trigger-only functions: not meant to be called via the REST
--    RPC endpoint by anyone. Triggers still fire regardless of EXECUTE grants.
revoke execute on function public.set_updated_at() from anon, authenticated;
revoke execute on function public.handle_new_user() from anon, authenticated;
revoke execute on function public.recompute_invoice(uuid) from anon, authenticated;
revoke execute on function public.trg_payment_recompute() from anon, authenticated;
revoke execute on function public.trg_project_closure_guard() from anon, authenticated;
revoke execute on function public.trg_expense_notify() from anon, authenticated;
revoke execute on function public.notify_roles(public.user_role[], public.notification_type, text, text, text) from anon, authenticated;
revoke execute on function public.generate_due_recurring_expenses() from anon, authenticated;
