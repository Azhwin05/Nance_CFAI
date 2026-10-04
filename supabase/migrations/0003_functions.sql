-- ============================================================================
-- Clickfield OS — 0003 functions & triggers (server-enforced business rules)
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Authorization helpers (SECURITY DEFINER to avoid recursive RLS on user_roles)
-- ---------------------------------------------------------------------------
create or replace function public.has_any_role(variadic roles public.user_role[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = any(roles)
  );
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role('super_admin');
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role('super_admin', 'admin');
$$;

-- Can see company-wide financial data (spec Rule 5).
create or replace function public.can_view_financials()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role('super_admin', 'admin', 'finance');
$$;

create or replace function public.can_manage_finance()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role('super_admin', 'admin', 'finance');
$$;

-- Can approve expenses (spec Rule 2).
create or replace function public.can_approve_expenses()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_any_role('super_admin', 'admin', 'finance');
$$;

create or replace function public.is_authenticated()
returns boolean language sql stable as $$
  select auth.uid() is not null;
$$;

-- Projects the current user is attached to (owner or member). Used by RLS so
-- employees/PMs only see relevant projects (spec Rule 6).
create or replace function public.my_project_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select p.id from public.projects p where p.owner_id = auth.uid()
  union
  select pm.project_id from public.project_members pm where pm.user_id = auth.uid();
$$;

create or replace function public.can_see_project(pid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.can_view_financials()
      or public.is_admin()
      or exists (select 1 from public.my_project_ids() mp where mp = pid)
      or exists (
           select 1 from public.projects p
           join public.clients c on c.id = p.client_id
           where p.id = pid and c.assigned_manager = auth.uid()
         );
$$;

-- ---------------------------------------------------------------------------
-- New auth user -> profile (first user becomes super_admin & completes onboarding)
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_count int;
begin
  insert into public.profiles (id, email, full_name)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(coalesce(new.email,''), '@', 1))
  )
  on conflict (id) do nothing;

  select count(*) into user_count from public.profiles;
  if user_count = 1 then
    insert into public.user_roles (user_id, role) values (new.id, 'super_admin')
      on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'employee')
      on conflict do nothing;
  end if;

  return new;
end;
$$;

create trigger trg_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Invoice balance recompute from payments (spec Rule 7)
-- ---------------------------------------------------------------------------
create or replace function public.recompute_invoice(p_invoice uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_total numeric(14,2);
  v_paid  numeric(14,2);
  v_due   date;
  v_status public.payment_status;
begin
  if p_invoice is null then return; end if;

  select total, due_date into v_total, v_due
  from public.invoices where id = p_invoice;
  if not found then return; end if;

  select coalesce(sum(amount), 0) into v_paid
  from public.payments
  where invoice_id = p_invoice and voided = false;

  if v_paid <= 0 then
    if v_due is not null and v_due < current_date then
      v_status := 'overdue';
    else
      v_status := 'pending';
    end if;
  elsif v_paid < v_total then
    v_status := 'partially_paid';
  else
    v_status := 'paid';
  end if;

  update public.invoices
    set amount_paid = v_paid,
        payment_status = v_status,
        status = case
                   when status in ('draft','cancelled') then status
                   when v_status = 'paid' then 'paid'
                   when v_status = 'partially_paid' then 'partially_paid'
                   when v_status = 'overdue' then 'overdue'
                   else status
                 end
    where id = p_invoice;
end;
$$;

create or replace function public.trg_payment_recompute()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'DELETE' then
    perform public.recompute_invoice(old.invoice_id);
    return old;
  end if;
  perform public.recompute_invoice(new.invoice_id);
  if tg_op = 'UPDATE' and old.invoice_id is distinct from new.invoice_id then
    perform public.recompute_invoice(old.invoice_id);
  end if;
  return new;
end;
$$;

create trigger trg_payments_recompute
  after insert or update or delete on public.payments
  for each row execute function public.trg_payment_recompute();

-- ---------------------------------------------------------------------------
-- Project closure validation (spec §20, §21, Rule 1 & 10) — enforced in DB
-- ---------------------------------------------------------------------------
create or replace function public.project_closure_blockers(p_project uuid)
returns text[]
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  blockers text[] := array[]::text[];
  has_agreement boolean;
  open_milestones int;
  v_notes text;
begin
  select exists (
    select 1 from public.documents d
    where d.project_id = p_project and d.doc_type = 'agreement'
  ) into has_agreement;
  if not has_agreement then
    blockers := blockers || 'Agreement document is required';
  end if;

  select count(*) into open_milestones
  from public.project_milestones m
  where m.project_id = p_project and m.is_done = false;
  if open_milestones > 0 then
    blockers := blockers || format('%s milestone(s) not completed', open_milestones);
  end if;

  select closure_notes into v_notes from public.projects where id = p_project;
  if v_notes is null or length(trim(v_notes)) = 0 then
    blockers := blockers || 'Closure notes are required';
  end if;

  return blockers;
end;
$$;

-- Block the transition to 'closed' unless all requirements are satisfied.
create or replace function public.trg_project_closure_guard()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  blockers text[];
begin
  if new.status = 'closed' and old.status is distinct from 'closed' then
    blockers := public.project_closure_blockers(new.id);
    if array_length(blockers, 1) > 0 then
      raise exception 'PROJECT_CLOSURE_BLOCKED: %', array_to_string(blockers, '; ')
        using errcode = 'check_violation';
    end if;
    new.closed_at := now();
  end if;
  return new;
end;
$$;

create trigger trg_projects_closure_guard
  before update on public.projects
  for each row execute function public.trg_project_closure_guard();

-- ---------------------------------------------------------------------------
-- Generate expected expense transactions from due recurring expenses (spec §29)
-- Does NOT mark anything paid — creates 'expected'/'pending_approval' rows.
-- ---------------------------------------------------------------------------
create or replace function public.generate_due_recurring_expenses()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  created int := 0;
  step interval;
begin
  for r in
    select * from public.recurring_expenses
    where is_active = true and auto_create = true
      and next_due is not null and next_due <= current_date
      and (end_date is null or next_due <= end_date)
  loop
    -- avoid duplicates for the same due date
    if not exists (
      select 1 from public.expenses e
      where e.recurring_expense_id = r.id and e.txn_date = r.next_due
    ) then
      insert into public.expenses (
        category_id, vendor, amount, txn_date, description, is_recurring,
        recurring_expense_id, frequency, status, state
      ) values (
        r.category_id, r.vendor, r.amount, r.next_due,
        r.name, true, r.id, r.frequency,
        case when r.require_approval then 'pending_approval' else 'approved' end,
        'expected'
      );
      created := created + 1;
    end if;

    step := case r.frequency
      when 'weekly' then interval '1 week'
      when 'monthly' then interval '1 month'
      when 'quarterly' then interval '3 months'
      when 'yearly' then interval '1 year'
    end;
    update public.recurring_expenses
      set next_due = (r.next_due + step)::date
      where id = r.id;
  end loop;
  return created;
end;
$$;

-- ---------------------------------------------------------------------------
-- Notification helper + a few event triggers
-- ---------------------------------------------------------------------------
create or replace function public.notify_roles(
  p_roles public.user_role[], p_type public.notification_type,
  p_title text, p_body text, p_link text
) returns void
language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (user_id, type, title, body, link)
  select distinct ur.user_id, p_type, p_title, p_body, p_link
  from public.user_roles ur
  where ur.role = any(p_roles);
end;
$$;

create or replace function public.trg_expense_notify()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' and new.status = 'pending_approval' then
    perform public.notify_roles(
      array['super_admin','admin','finance']::public.user_role[],
      'expense_submitted',
      'New expense submitted',
      coalesce(new.vendor,'Expense') || ' — ' || new.amount::text,
      '/finance/expenses/' || new.id::text);
  elsif tg_op = 'UPDATE' and old.status is distinct from new.status then
    if new.status = 'approved' and new.submitted_by is not null then
      insert into public.notifications (user_id, type, title, body, link)
      values (new.submitted_by, 'expense_approved', 'Expense approved',
        coalesce(new.vendor,'Expense') || ' — ' || new.amount::text,
        '/finance/expenses/' || new.id::text);
    elsif new.status = 'rejected' and new.submitted_by is not null then
      insert into public.notifications (user_id, type, title, body, link)
      values (new.submitted_by, 'expense_rejected', 'Expense rejected',
        coalesce(new.vendor,'Expense') || ' — ' || new.amount::text,
        '/finance/expenses/' || new.id::text);
    end if;
  end if;
  return new;
end;
$$;

create trigger trg_expenses_notify
  after insert or update on public.expenses
  for each row execute function public.trg_expense_notify();
