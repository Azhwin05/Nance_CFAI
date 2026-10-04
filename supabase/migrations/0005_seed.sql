-- ============================================================================
-- Clickfield OS — 0005 seed (defaults + clearly-labelled demo data)
-- ============================================================================
-- Safe to run multiple times. Demo rows carry is_demo = true and can be purged
-- from Settings. Lookups use ON CONFLICT to stay idempotent.
-- ----------------------------------------------------------------------------

insert into public.company_settings (id) values (true)
  on conflict (id) do nothing;

-- Payment methods ------------------------------------------------------------
insert into public.payment_methods (name, is_system) values
  ('Bank Transfer', true), ('UPI', true), ('Cash', true),
  ('Credit Card', true), ('Debit Card', true), ('Company Card', true),
  ('Other', true)
on conflict (name) do nothing;

-- Expense categories ---------------------------------------------------------
insert into public.expense_categories (name, parent, is_system) values
  ('Rent','Office',true), ('Electricity','Office',true), ('Internet','Office',true),
  ('Telephone','Office',true), ('Office Supplies','Office',true), ('Maintenance','Office',true),
  ('AWS','Cloud',true), ('Azure','Cloud',true), ('Supabase','Cloud',true),
  ('Cloudflare','Cloud',true), ('Vercel','Cloud',true), ('Other Cloud','Cloud',true),
  ('GitHub','Software',true), ('Google Workspace','Software',true), ('Microsoft','Software',true),
  ('Adobe','Software',true), ('SaaS','Software',true), ('Other Software','Software',true),
  ('Salary','People',true), ('Freelancer','People',true), ('Contractor','People',true),
  ('Advertising','Marketing',true), ('Events','Marketing',true),
  ('Sponsorship','Marketing',true), ('Design','Marketing',true),
  ('Travel','Travel',true), ('Accommodation','Travel',true),
  ('Transport','Travel',true), ('Food','Travel',true),
  ('Legal','Business',true), ('Accounting','Business',true), ('Banking','Business',true),
  ('Registration','Business',true), ('Other','Business',true)
on conflict (name, parent) do nothing;

-- Demo data (guarded) --------------------------------------------------------
do $$
declare
  c_nk  uuid := '11111111-1111-1111-1111-111111111101';
  c_a   uuid := '11111111-1111-1111-1111-111111111102';
  c_b   uuid := '11111111-1111-1111-1111-111111111103';
  p_web uuid := '22222222-2222-2222-2222-222222222201';
  p_erp uuid := '22222222-2222-2222-2222-222222222202';
  p_ai  uuid := '22222222-2222-2222-2222-222222222203';
  inv1  uuid := '33333333-3333-3333-3333-333333333301';
  inv2  uuid := '33333333-3333-3333-3333-333333333302';
  cat_supabase uuid;
  cat_vercel   uuid;
  cat_rent     uuid;
  cat_internet uuid;
  cat_gworkspace uuid;
  pm_bank uuid;
  pm_upi  uuid;
begin
  if exists (select 1 from public.clients where is_demo = true) then
    return; -- already seeded
  end if;

  select id into cat_supabase from public.expense_categories where name='Supabase';
  select id into cat_vercel   from public.expense_categories where name='Vercel';
  select id into cat_rent      from public.expense_categories where name='Rent';
  select id into cat_internet  from public.expense_categories where name='Internet';
  select id into cat_gworkspace from public.expense_categories where name='Google Workspace';
  select id into pm_bank from public.payment_methods where name='Bank Transfer';
  select id into pm_upi  from public.payment_methods where name='UPI';

  -- Clients
  insert into public.clients (id, code, company_name, contact_person, email, phone, industry, status, is_demo)
  values
    (c_nk,'CLI-001','NK Hospital','Dr. Nair','contact@nkhospital.example','+91 98400 00001','Healthcare','active',true),
    (c_a,'CLI-002','Client A','Arun Kumar','hello@clienta.example','+91 98400 00002','Technology','active',true),
    (c_b,'CLI-003','Client B','Priya Rao','hello@clientb.example','+91 98400 00003','Retail','active',true);

  -- Projects
  insert into public.projects (id, code, name, client_id, description, start_date, status, contract_value, one_time_value, mrr, is_demo)
  values
    (p_web,'PRJ-001','Hospital Website',c_nk,'Website development for NK Hospital', current_date - 90,'active',120000,120000,0,true),
    (p_erp,'PRJ-002','ERP Development',c_a,'Internal ERP build', current_date - 60,'active',350000,300000,25000,true),
    (p_ai,'PRJ-003','AI Lead Intelligence',c_b,'Lead scoring platform', current_date - 30,'active',200000,120000,30000,true);

  -- Recurring revenue (MRR)
  insert into public.recurring_revenues (client_id, project_id, name, amount, frequency, start_date, next_billing, is_active, is_demo)
  values
    (c_a, p_erp, 'ERP Support Retainer', 25000, 'monthly', current_date - 60, date_trunc('month', current_date)::date + interval '1 month', true, true),
    (c_b, p_ai,  'AI Platform Subscription', 30000, 'monthly', current_date - 30, date_trunc('month', current_date)::date + interval '1 month', true, true),
    (c_nk, p_web,'Website Maintenance', 15000, 'monthly', current_date - 20, date_trunc('month', current_date)::date + interval '1 month', true, true);

  -- Invoices
  insert into public.invoices (id, number, client_id, project_id, issue_date, due_date, subtotal, tax_amount, total, status, is_demo)
  values
    (inv1,'INV-001',c_nk,p_web, current_date - 40, current_date - 10, 120000, 0, 120000, 'sent', true),
    (inv2,'INV-002',c_a, p_erp, current_date - 20, current_date + 10, 150000, 0, 150000, 'sent', true);

  -- Payments (partial on INV-001, triggers recompute balances)
  insert into public.payments (invoice_id, client_id, amount, paid_on, payment_method_id, reference, is_demo)
  values
    (inv1, c_nk, 80000, current_date - 20, pm_bank, 'NEFT-0001', true);

  -- Income transactions (cash received recorded as income)
  insert into public.income_transactions (code, client_id, project_id, invoice_id, amount, txn_date, income_type, payment_method_id, description, state, is_demo)
  values
    ('INC-001', c_nk, p_web, inv1, 80000, current_date - 20, 'advance', pm_bank, 'Advance against website', 'paid', true),
    ('INC-002', c_b,  p_ai,  null, 35000, current_date - 10, 'milestone', pm_upi, 'Milestone 1 - AI platform', 'paid', true),
    ('INC-003', c_a,  p_erp, null, 50000, current_date - 5,  'advance', pm_bank, 'ERP advance', 'paid', true);

  -- Expenses (mix of approved + pending)
  insert into public.expenses (code, category_id, vendor, amount, txn_date, payment_method_id, description, project_id, is_recurring, frequency, status, state, is_demo)
  values
    ('EXP-001', cat_supabase, 'Supabase', 8500, current_date - 3, pm_bank, 'Production database subscription', null, true, 'monthly', 'approved', 'paid', true),
    ('EXP-002', cat_vercel,   'Vercel',   2000, current_date - 3, pm_bank, 'Hosting', null, true, 'monthly', 'approved', 'paid', true),
    ('EXP-003', cat_rent,     'Landlord', 35000, current_date - 4, pm_bank, 'Office rent', null, true, 'monthly', 'approved', 'paid', true),
    ('EXP-004', cat_internet, 'ISP',      3000, current_date - 4, pm_bank, 'Office internet', null, true, 'monthly', 'approved', 'paid', true),
    ('EXP-005', cat_gworkspace,'Google',  1800, current_date - 2, pm_upi,  'Google Workspace', null, true, 'monthly', 'pending_approval', 'pending', true);

  -- Recurring expenses
  insert into public.recurring_expenses (name, vendor, category_id, amount, frequency, start_date, next_due, is_active, is_demo)
  values
    ('Office Rent','Landlord', cat_rent, 35000, 'monthly', current_date - 120, (date_trunc('month', current_date) + interval '1 month')::date, true, true),
    ('Supabase Pro','Supabase', cat_supabase, 8500, 'monthly', current_date - 120, (date_trunc('month', current_date) + interval '1 month' + interval '11 days')::date, true, true),
    ('Google Workspace','Google', cat_gworkspace, 1800, 'monthly', current_date - 120, (date_trunc('month', current_date) + interval '1 month' + interval '4 days')::date, true, true);

end $$;
