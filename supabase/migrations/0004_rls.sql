-- ============================================================================
-- Clickfield OS — 0004 Row-Level Security policies
-- ============================================================================
-- Authorization is enforced here, in the database. Server actions mirror these
-- checks for good UX, but RLS is the real boundary.
-- ----------------------------------------------------------------------------

-- Audit writer (definer) so clients can append audit rows without direct
-- INSERT rights on the immutable audit table.
create or replace function public.write_audit(
  p_action text, p_entity text, p_entity_id uuid, p_summary text,
  p_old jsonb default null, p_new jsonb default null
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.audit_logs (actor_id, action, entity, entity_id, summary, old_values, new_values)
  values (auth.uid(), p_action, p_entity, p_entity_id, p_summary, p_old, p_new);
end;
$$;

-- Enable RLS on every table
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','user_roles','company_settings','app_settings','payment_methods',
    'clients','client_contacts','leads','lead_activities',
    'projects','project_members','project_milestones','documents',
    'invoices','invoice_items','income_transactions','payments',
    'expense_categories','expenses','expense_approvals',
    'recurring_revenues','recurring_expenses','notifications','audit_logs'
  ]
  loop
    execute format('alter table public.%I enable row level security;', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- profiles & roles
-- ---------------------------------------------------------------------------
create policy profiles_select on public.profiles
  for select to authenticated using (true);
create policy profiles_update_self on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all on public.profiles
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy user_roles_select on public.user_roles
  for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
create policy user_roles_write on public.user_roles
  for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------------------------------------------------------------------------
-- settings & lookups
-- ---------------------------------------------------------------------------
create policy settings_select on public.company_settings
  for select to authenticated using (true);
create policy settings_write on public.company_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy app_settings_select on public.app_settings
  for select to authenticated using (true);
create policy app_settings_write on public.app_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

create policy pm_select on public.payment_methods
  for select to authenticated using (true);
create policy pm_write on public.payment_methods
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

create policy ecat_select on public.expense_categories
  for select to authenticated using (true);
create policy ecat_write on public.expense_categories
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

-- ---------------------------------------------------------------------------
-- clients & contacts (basic info readable by all authenticated; managed by admin/PM)
-- ---------------------------------------------------------------------------
create policy clients_select on public.clients
  for select to authenticated using (true);
create policy clients_write on public.clients
  for all to authenticated
  using (public.has_any_role('super_admin','admin','project_manager'))
  with check (public.has_any_role('super_admin','admin','project_manager'));

create policy contacts_select on public.client_contacts
  for select to authenticated using (true);
create policy contacts_write on public.client_contacts
  for all to authenticated
  using (public.has_any_role('super_admin','admin','project_manager'))
  with check (public.has_any_role('super_admin','admin','project_manager'));

-- ---------------------------------------------------------------------------
-- leads
-- ---------------------------------------------------------------------------
create policy leads_select on public.leads
  for select to authenticated
  using (public.is_admin() or public.has_any_role('project_manager','finance') or owner_id = auth.uid());
create policy leads_write on public.leads
  for all to authenticated
  using (public.has_any_role('super_admin','admin','project_manager'))
  with check (public.has_any_role('super_admin','admin','project_manager'));

create policy lead_activities_select on public.lead_activities
  for select to authenticated
  using (public.is_admin() or public.has_any_role('project_manager','finance')
         or exists (select 1 from public.leads l where l.id = lead_id and l.owner_id = auth.uid()));
create policy lead_activities_write on public.lead_activities
  for all to authenticated
  using (public.has_any_role('super_admin','admin','project_manager'))
  with check (public.has_any_role('super_admin','admin','project_manager'));

-- ---------------------------------------------------------------------------
-- projects, members, milestones
-- ---------------------------------------------------------------------------
create policy projects_select on public.projects
  for select to authenticated using (public.can_see_project(id));
create policy projects_write on public.projects
  for all to authenticated
  using (public.is_admin() or owner_id = auth.uid() or public.has_any_role('project_manager'))
  with check (public.is_admin() or owner_id = auth.uid() or public.has_any_role('project_manager'));

create policy members_select on public.project_members
  for select to authenticated using (public.can_see_project(project_id));
create policy members_write on public.project_members
  for all to authenticated
  using (public.is_admin() or public.has_any_role('project_manager'))
  with check (public.is_admin() or public.has_any_role('project_manager'));

create policy milestones_select on public.project_milestones
  for select to authenticated using (public.can_see_project(project_id));
create policy milestones_write on public.project_milestones
  for all to authenticated
  using (public.is_admin() or public.has_any_role('project_manager')
         or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check (public.is_admin() or public.has_any_role('project_manager')
         or exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- documents (project/client scoped)
-- ---------------------------------------------------------------------------
create policy documents_select on public.documents
  for select to authenticated
  using (
    public.can_view_financials()
    or (project_id is not null and public.can_see_project(project_id))
    or (project_id is null)                 -- general/client docs visible to authenticated
  );
create policy documents_write on public.documents
  for all to authenticated
  using (public.has_any_role('super_admin','admin','finance','project_manager'))
  with check (public.has_any_role('super_admin','admin','finance','project_manager'));

-- ---------------------------------------------------------------------------
-- invoices / income / payments (financial confidentiality — spec Rule 5)
-- ---------------------------------------------------------------------------
create policy invoices_select on public.invoices
  for select to authenticated
  using (public.can_view_financials() or (project_id is not null and public.can_see_project(project_id)));
create policy invoices_write on public.invoices
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

create policy invoice_items_select on public.invoice_items
  for select to authenticated
  using (exists (select 1 from public.invoices i where i.id = invoice_id
         and (public.can_view_financials() or (i.project_id is not null and public.can_see_project(i.project_id)))));
create policy invoice_items_write on public.invoice_items
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

create policy income_select on public.income_transactions
  for select to authenticated
  using (public.can_view_financials() or (project_id is not null and public.can_see_project(project_id)));
create policy income_write on public.income_transactions
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

create policy payments_select on public.payments
  for select to authenticated using (public.can_view_financials());
create policy payments_write on public.payments
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

-- ---------------------------------------------------------------------------
-- expenses & approvals
-- ---------------------------------------------------------------------------
create policy expenses_select on public.expenses
  for select to authenticated
  using (
    public.can_view_financials()
    or submitted_by = auth.uid()
    or (project_id is not null and public.can_see_project(project_id))
  );
-- Submit: any non-viewer may create an expense they own.
create policy expenses_insert on public.expenses
  for insert to authenticated
  with check (
    submitted_by = auth.uid()
    and public.has_any_role('super_admin','admin','finance','project_manager','employee')
  );
-- Update: approvers always; submitter only while not yet finalized.
create policy expenses_update on public.expenses
  for update to authenticated
  using (
    public.can_approve_expenses()
    or (submitted_by = auth.uid()
        and status in ('draft','pending_approval','changes_requested'))
  )
  with check (
    public.can_approve_expenses()
    or (submitted_by = auth.uid()
        and status in ('draft','pending_approval','changes_requested'))
  );

create policy expense_approvals_select on public.expense_approvals
  for select to authenticated
  using (public.can_view_financials()
         or exists (select 1 from public.expenses e where e.id = expense_id and e.submitted_by = auth.uid()));
create policy expense_approvals_write on public.expense_approvals
  for all to authenticated
  using (public.can_approve_expenses()) with check (public.can_approve_expenses());

-- ---------------------------------------------------------------------------
-- recurring
-- ---------------------------------------------------------------------------
create policy rrev_select on public.recurring_revenues
  for select to authenticated using (public.can_view_financials());
create policy rrev_write on public.recurring_revenues
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

create policy rexp_select on public.recurring_expenses
  for select to authenticated using (public.can_view_financials());
create policy rexp_write on public.recurring_expenses
  for all to authenticated using (public.can_manage_finance()) with check (public.can_manage_finance());

-- ---------------------------------------------------------------------------
-- notifications (own only) & audit (admins read; immutable)
-- ---------------------------------------------------------------------------
create policy notifications_select on public.notifications
  for select to authenticated using (user_id = auth.uid());
create policy notifications_update on public.notifications
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy audit_select on public.audit_logs
  for select to authenticated using (public.is_admin());
-- No insert/update/delete policies: only SECURITY DEFINER functions write here.
