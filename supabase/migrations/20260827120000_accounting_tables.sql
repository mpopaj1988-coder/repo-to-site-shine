-- Internal accounting: transactions synced from Hospitable + uploaded from
-- Venmo CSV exports, categorized for a monthly Profit & Loss report.
-- Owner-only feature — accessed exclusively through service-role server
-- routes, so RLS is enabled with no policies (anon/authenticated get nothing).

create table if not exists accounting_transactions (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source in ('hospitable', 'venmo')),
  source_id text not null,
  transaction_date date not null,
  description text not null default '',
  counterparty text,
  amount numeric(12,2) not null, -- dollars; positive = income, negative = expense
  currency text not null default 'USD',
  category text not null default 'Uncategorized',
  include_in_pl boolean not null default true,
  category_overridden boolean not null default false,
  property_slug text,
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint accounting_transactions_source_id_unique unique (source, source_id)
);

create index if not exists accounting_transactions_date_idx on accounting_transactions(transaction_date);
create index if not exists accounting_transactions_source_idx on accounting_transactions(source);

alter table accounting_transactions enable row level security;

-- Snapshot of each month's computed P&L, so the dashboard doesn't have to
-- recompute history and so we know whether/when the email went out.
create table if not exists accounting_monthly_reports (
  id uuid primary key default gen_random_uuid(),
  month date not null unique, -- first day of the reported month
  totals jsonb not null,
  emailed_at timestamptz,
  generated_at timestamptz not null default now()
);

alter table accounting_monthly_reports enable row level security;

-- Session tokens for the single-owner password-gated /admin/accounting area.
create table if not exists accounting_admin_sessions (
  token text primary key,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists accounting_admin_sessions_expires_idx on accounting_admin_sessions(expires_at);

alter table accounting_admin_sessions enable row level security;
