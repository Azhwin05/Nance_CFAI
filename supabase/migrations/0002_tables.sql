-- ============================================================================
-- Clickfield OS — 0002 tables
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Identity: profiles extend auth.users; user_roles is the authorization source
-- ---------------------------------------------------------------------------
create table public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text not null default '',
  email       text not null,
  avatar_url  text,
  phone       text,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table public.user_roles (
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        public.user_role not null,
  assigned_by uuid references public.profiles(id),
  created_at  timestamptz not null default now(),
  primary key (user_id, role)
);
create index idx_user_roles_user on public.user_roles(user_id);

-- ---------------------------------------------------------------------------
-- Company settings (single row) + flexible key/value app settings
-- ---------------------------------------------------------------------------
create table public.company_settings (
  id             boolean primary key default true check (id),  -- singleton
  company_name   text not null default 'Clickfield AI',
  logo_url       text,
  address        text,
  gstin          text,
  currency       text not null default 'INR',
  fy_start_month smallint not null default 4 check (fy_start_month between 1 and 12),
  onboarded      boolean not null default false,
  require_expense_proof boolean not null default true,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table public.app_settings (
  key        text primary key,
  value      jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id),
  updated_at timestamptz not null default now()
);

create table public.payment_methods (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  is_active  boolean not null default true,
  is_system  boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Clients & contacts
-- ---------------------------------------------------------------------------
create table public.clients (
  id               uuid primary key default gen_random_uuid(),
  code             text unique,                       -- e.g. CLI-001
  company_name     text not null,
  contact_person   text,
  email            text,
  phone            text,
  alt_phone        text,
  gstin            text,
  address          text,
  website          text,
  industry         text,
  status           public.client_status not null default 'active',
  notes            text,
  assigned_manager uuid references public.profiles(id),
  is_demo          boolean not null default false,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_clients_status on public.clients(status);
create index idx_clients_manager on public.clients(assigned_manager);
create index idx_clients_name_trgm on public.clients using gin (company_name gin_trgm_ops);

create table public.client_contacts (
  id         uuid primary key default gen_random_uuid(),
  client_id  uuid not null references public.clients(id) on delete cascade,
  name       text not null,
  role       text,
  email      text,
  phone      text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_client_contacts_client on public.client_contacts(client_id);

-- ---------------------------------------------------------------------------
-- Leads (sales pipeline) & activities
-- ---------------------------------------------------------------------------
create table public.leads (
  id               uuid primary key default gen_random_uuid(),
  code             text unique,                       -- LEAD-001
  company          text not null,
  contact_name     text,
  contact_email    text,
  contact_phone    text,
  requirement      text,
  estimated_value  numeric(14,2) not null default 0,
  expected_mrr     numeric(14,2) not null default 0,
  probability      smallint not null default 0 check (probability between 0 and 100),
  expected_close   date,
  stage            public.lead_stage not null default 'lead',
  notes            text,
  owner_id         uuid references public.profiles(id),
  converted_client_id uuid references public.clients(id),
  is_demo          boolean not null default false,
  created_by       uuid references public.profiles(id),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_leads_stage on public.leads(stage);
create index idx_leads_owner on public.leads(owner_id);

create table public.lead_activities (
  id         uuid primary key default gen_random_uuid(),
  lead_id    uuid not null references public.leads(id) on delete cascade,
  note       text not null,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);
create index idx_lead_activities_lead on public.lead_activities(lead_id);

-- ---------------------------------------------------------------------------
-- Projects, members, milestones
-- ---------------------------------------------------------------------------
create table public.projects (
  id              uuid primary key default gen_random_uuid(),
  code            text unique,                        -- PRJ-001
  name            text not null,
  client_id       uuid not null references public.clients(id) on delete restrict,
  owner_id        uuid references public.profiles(id),
  description     text,
  start_date      date,
  expected_end    date,
  status          public.project_status not null default 'draft',
  contract_value  numeric(14,2) not null default 0,
  one_time_value  numeric(14,2) not null default 0,
  mrr             numeric(14,2) not null default 0,
  payment_terms   text,
  notes           text,
  closure_notes   text,
  closed_at       timestamptz,
  is_demo         boolean not null default false,
  created_by      uuid references public.profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_projects_client on public.projects(client_id);
create index idx_projects_status on public.projects(status);
create index idx_projects_owner on public.projects(owner_id);
create index idx_projects_name_trgm on public.projects using gin (name gin_trgm_ops);

create table public.project_members (
  project_id uuid not null references public.projects(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  added_by   uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  primary key (project_id, user_id)
);
create index idx_project_members_user on public.project_members(user_id);

create table public.project_milestones (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references public.projects(id) on delete cascade,
  title       text not null,
  description text,
  due_date    date,
  amount      numeric(14,2) not null default 0,
  is_done     boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index idx_milestones_project on public.project_milestones(project_id);

-- ---------------------------------------------------------------------------
-- Documents (centralized store; agreements are documents with type=agreement)
-- ---------------------------------------------------------------------------
create table public.documents (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  doc_type      public.document_type not null default 'other',
  bucket        text not null default 'documents',
  storage_path  text not null,                 -- path within the private bucket
  mime_type     text,
  size_bytes    bigint,
  version       int not null default 1,
  client_id     uuid references public.clients(id) on delete set null,
  project_id    uuid references public.projects(id) on delete set null,
  uploaded_by   uuid references public.profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_documents_project on public.documents(project_id);
create index idx_documents_client on public.documents(client_id);
create index idx_documents_type on public.documents(doc_type);

-- ---------------------------------------------------------------------------
-- Invoices & line items
-- ---------------------------------------------------------------------------
create table public.invoices (
  id             uuid primary key default gen_random_uuid(),
  number         text not null unique,               -- INV-001
  client_id      uuid not null references public.clients(id) on delete restrict,
  project_id     uuid references public.projects(id) on delete set null,
  issue_date     date not null default current_date,
  due_date       date,
  subtotal       numeric(14,2) not null default 0,
  tax_amount     numeric(14,2) not null default 0,
  total          numeric(14,2) not null default 0,
  amount_paid    numeric(14,2) not null default 0,    -- maintained by trigger
  status         public.invoice_status not null default 'draft',
  payment_status public.payment_status not null default 'pending',
  document_id    uuid references public.documents(id) on delete set null,
  notes          text,
  is_demo        boolean not null default false,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_invoices_client on public.invoices(client_id);
create index idx_invoices_project on public.invoices(project_id);
create index idx_invoices_status on public.invoices(payment_status);
create index idx_invoices_due on public.invoices(due_date);

create table public.invoice_items (
  id          uuid primary key default gen_random_uuid(),
  invoice_id  uuid not null references public.invoices(id) on delete cascade,
  description text not null,
  quantity    numeric(12,2) not null default 1,
  unit_price  numeric(14,2) not null default 0,
  amount      numeric(14,2) not null default 0,
  sort_order  int not null default 0
);
create index idx_invoice_items_invoice on public.invoice_items(invoice_id);

-- ---------------------------------------------------------------------------
-- Income transactions & payments
-- ---------------------------------------------------------------------------
create table public.income_transactions (
  id             uuid primary key default gen_random_uuid(),
  code           text unique,                         -- INC-001
  client_id      uuid references public.clients(id) on delete set null,
  project_id     uuid references public.projects(id) on delete set null,
  invoice_id     uuid references public.invoices(id) on delete set null,
  amount         numeric(14,2) not null check (amount >= 0),
  currency       text not null default 'INR',
  txn_date       date not null default current_date,
  income_type    public.income_type not null default 'one_time',
  payment_method_id uuid references public.payment_methods(id),
  reference      text,
  description    text,
  state          public.transaction_state not null default 'paid',
  proof_document_id uuid references public.documents(id) on delete set null,
  notes          text,
  voided         boolean not null default false,       -- soft delete
  voided_reason  text,
  is_demo        boolean not null default false,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_income_client on public.income_transactions(client_id);
create index idx_income_project on public.income_transactions(project_id);
create index idx_income_date on public.income_transactions(txn_date);
create index idx_income_invoice on public.income_transactions(invoice_id);

-- Payments applied against invoices (cash received). Separate from "income"
-- so invoice-issued vs cash-received stay distinguishable (spec §31).
create table public.payments (
  id             uuid primary key default gen_random_uuid(),
  invoice_id     uuid references public.invoices(id) on delete cascade,
  client_id      uuid references public.clients(id) on delete set null,
  amount         numeric(14,2) not null check (amount > 0),
  paid_on        date not null default current_date,
  payment_method_id uuid references public.payment_methods(id),
  reference      text,
  proof_document_id uuid references public.documents(id) on delete set null,
  notes          text,
  voided         boolean not null default false,
  is_demo        boolean not null default false,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_payments_invoice on public.payments(invoice_id);
create index idx_payments_client on public.payments(client_id);
create index idx_payments_date on public.payments(paid_on);

-- ---------------------------------------------------------------------------
-- Expense categories & expenses & approvals
-- ---------------------------------------------------------------------------
create table public.expense_categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  parent      text,                                    -- grouping label (Office, Cloud...)
  is_active   boolean not null default true,
  is_system   boolean not null default false,
  created_at  timestamptz not null default now(),
  unique (name, parent)
);

create table public.expenses (
  id             uuid primary key default gen_random_uuid(),
  code           text unique,                          -- EXP-001
  category_id    uuid references public.expense_categories(id) on delete set null,
  vendor         text,
  amount         numeric(14,2) not null check (amount >= 0),
  currency       text not null default 'INR',
  txn_date       date not null default current_date,
  payment_method_id uuid references public.payment_methods(id),
  description    text,
  project_id     uuid references public.projects(id) on delete set null,  -- null = company-wide
  is_recurring   boolean not null default false,
  recurring_expense_id uuid,                            -- FK added after table below
  frequency      public.recurrence_frequency,
  status         public.expense_status not null default 'pending_approval',
  state          public.transaction_state not null default 'pending',
  proof_document_id uuid references public.documents(id) on delete set null,
  invoice_document_id uuid references public.documents(id) on delete set null,
  submitted_by   uuid references public.profiles(id),
  approved_by    uuid references public.profiles(id),
  approved_at    timestamptz,
  voided         boolean not null default false,
  voided_reason  text,
  is_demo        boolean not null default false,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_expenses_category on public.expenses(category_id);
create index idx_expenses_project on public.expenses(project_id);
create index idx_expenses_status on public.expenses(status);
create index idx_expenses_date on public.expenses(txn_date);
create index idx_expenses_submitter on public.expenses(submitted_by);

create table public.expense_approvals (
  id          uuid primary key default gen_random_uuid(),
  expense_id  uuid not null references public.expenses(id) on delete cascade,
  action      public.approval_action not null,
  comment     text,
  acted_by    uuid references public.profiles(id),
  created_at  timestamptz not null default now()
);
create index idx_expense_approvals_expense on public.expense_approvals(expense_id);

-- ---------------------------------------------------------------------------
-- Recurring revenue (MRR) & recurring expenses
-- ---------------------------------------------------------------------------
create table public.recurring_revenues (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients(id) on delete cascade,
  project_id     uuid references public.projects(id) on delete set null,
  name           text,
  amount         numeric(14,2) not null check (amount >= 0),   -- monthly-normalized MRR
  frequency      public.recurrence_frequency not null default 'monthly',
  start_date     date not null default current_date,
  end_date       date,
  next_billing   date,
  is_active      boolean not null default true,
  is_demo        boolean not null default false,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_recurring_rev_client on public.recurring_revenues(client_id);
create index idx_recurring_rev_active on public.recurring_revenues(is_active);

create table public.recurring_expenses (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  vendor         text,
  category_id    uuid references public.expense_categories(id) on delete set null,
  amount         numeric(14,2) not null check (amount >= 0),
  frequency      public.recurrence_frequency not null default 'monthly',
  start_date     date not null default current_date,
  end_date       date,
  next_due       date,
  auto_create    boolean not null default true,
  require_approval boolean not null default true,
  is_active      boolean not null default true,
  is_demo        boolean not null default false,
  created_by     uuid references public.profiles(id),
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
create index idx_recurring_exp_active on public.recurring_expenses(is_active);
create index idx_recurring_exp_due on public.recurring_expenses(next_due);

alter table public.expenses
  add constraint fk_expenses_recurring
  foreign key (recurring_expense_id)
  references public.recurring_expenses(id) on delete set null;

-- ---------------------------------------------------------------------------
-- Notifications & audit log
-- ---------------------------------------------------------------------------
create table public.notifications (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  type        public.notification_type not null default 'generic',
  title       text not null,
  body        text,
  link        text,
  is_read     boolean not null default false,
  created_at  timestamptz not null default now()
);
create index idx_notifications_user on public.notifications(user_id, is_read);

create table public.audit_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.profiles(id),
  action      text not null,                 -- e.g. 'expense.approved'
  entity      text not null,                 -- table/entity name
  entity_id   uuid,
  summary     text,                          -- human-readable one-liner
  old_values  jsonb,
  new_values  jsonb,
  created_at  timestamptz not null default now()
);
create index idx_audit_entity on public.audit_logs(entity, entity_id);
create index idx_audit_actor on public.audit_logs(actor_id);
create index idx_audit_created on public.audit_logs(created_at desc);

-- ---------------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'profiles','company_settings','app_settings','clients','client_contacts',
    'leads','projects','project_milestones','documents','invoices',
    'income_transactions','payments','expenses','recurring_revenues',
    'recurring_expenses'
  ]
  loop
    execute format(
      'create trigger trg_%1$s_updated_at before update on public.%1$s
       for each row execute function public.set_updated_at();', t);
  end loop;
end $$;
