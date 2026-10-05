-- ============================================================================
-- 0008 — Daily reminders for upcoming recurring expenses
-- ============================================================================
-- From 2 days before a recurring expense's next due date until the due day
-- itself, notify every super_admin / admin / finance user once per day.
-- Idempotent: running it several times on the same day never duplicates.
-- Scheduled with pg_cron at 09:00 IST (03:30 UTC).
-- ----------------------------------------------------------------------------

create extension if not exists pg_cron;

create or replace function public.notify_upcoming_recurring_expenses()
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  r      record;
  u      record;
  today  date := (now() at time zone 'Asia/Kolkata')::date;
  days   int;
  ttl    text;
  bdy    text;
  n      int := 0;
begin
  for r in
    select id, name, amount, next_due
    from public.recurring_expenses
    where is_active
      and next_due is not null
      and next_due between today and today + 2
      and (end_date is null or next_due <= end_date)
  loop
    days := r.next_due - today;
    ttl := case days
      when 0 then r.name || ' is due today'
      when 1 then r.name || ' is due tomorrow'
      else r.name || ' is due in ' || days || ' days'
    end;
    bdy := '₹' || r.amount::text || ' · due ' || to_char(r.next_due, 'DD Mon YYYY');

    for u in
      select distinct user_id from public.user_roles
      where role in ('super_admin', 'admin', 'finance')
    loop
      if not exists (
        select 1 from public.notifications x
        where x.user_id = u.user_id
          and x.type = 'recurring_expense_due'
          and x.title = ttl
          and (x.created_at at time zone 'Asia/Kolkata')::date = today
      ) then
        insert into public.notifications (user_id, type, title, body, link)
        values (u.user_id, 'recurring_expense_due', ttl, bdy, '/finance/recurring');
        n := n + 1;
      end if;
    end loop;
  end loop;
  return n;
end;
$$;

-- Only the scheduler (postgres) runs this; keep it off the public API.
revoke all on function public.notify_upcoming_recurring_expenses() from public, anon, authenticated;

select cron.schedule(
  'recurring-expense-reminders',
  '30 3 * * *',
  $cron$select public.notify_upcoming_recurring_expenses();$cron$
);
