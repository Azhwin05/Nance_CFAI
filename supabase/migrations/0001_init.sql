-- ============================================================================
-- Clickfield OS — 0001 init: extensions, enums, shared helper functions
-- ============================================================================
-- Money is always NUMERIC(14,2). Primary keys are UUID. Every table carries
-- created_at/updated_at; financial & ownership tables also carry created_by.
-- ----------------------------------------------------------------------------

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";        -- fuzzy global search

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type public.user_role as enum (
  'super_admin', 'admin', 'finance', 'project_manager', 'employee', 'viewer'
);

create type public.client_status as enum (
  'lead', 'prospect', 'active', 'inactive', 'archived'
);

create type public.lead_stage as enum (
  'lead', 'discussion', 'proposal_sent', 'negotiation',
  'won', 'agreement_pending', 'active', 'lost'
);

create type public.project_status as enum (
  'draft', 'agreement_pending', 'active', 'on_hold',
  'completed', 'closure_pending', 'closed', 'cancelled'
);

create type public.document_type as enum (
  'agreement', 'quotation', 'invoice', 'purchase_order',
  'client_approval', 'final_acceptance',
  'client_document', 'project_document',
  'payment_proof', 'expense_proof', 'other'
);

create type public.income_type as enum (
  'one_time', 'recurring', 'advance', 'milestone', 'final_payment', 'other'
);

create type public.payment_status as enum (
  'pending', 'partially_paid', 'paid', 'overdue', 'cancelled', 'refunded'
);

create type public.invoice_status as enum (
  'draft', 'sent', 'partially_paid', 'paid', 'overdue', 'cancelled'
);

create type public.expense_status as enum (
  'draft', 'pending_approval', 'approved', 'rejected',
  'changes_requested', 'paid', 'void'
);

create type public.approval_action as enum (
  'approved', 'rejected', 'changes_requested'
);

create type public.recurrence_frequency as enum (
  'weekly', 'monthly', 'quarterly', 'yearly'
);

-- State of a financial record distinct from workflow status (spec §47).
create type public.transaction_state as enum (
  'expected', 'pending', 'approved', 'paid', 'cancelled'
);

create type public.notification_type as enum (
  'expense_submitted', 'expense_approved', 'expense_rejected',
  'expense_changes_requested',
  'invoice_overdue', 'payment_received', 'agreement_uploaded',
  'project_closure_ready', 'project_closure_blocked',
  'recurring_expense_due', 'lead_converted', 'generic'
);

-- ---------------------------------------------------------------------------
-- Shared trigger function: keep updated_at fresh
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
