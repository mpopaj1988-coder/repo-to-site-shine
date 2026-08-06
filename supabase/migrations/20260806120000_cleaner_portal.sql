-- Cleaner portal: job board with race-safe claiming, PIN login, payout tracking
-- All access goes through server functions using the service-role client — no
-- public policies are defined, so RLS denies direct client access by default.

create table if not exists cleaners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique, -- digits only, e.g. 2487669999
  pin_hash text not null, -- "<salt-hex>:<hash-hex>", PBKDF2-SHA256
  active boolean not null default true,
  is_admin boolean not null default false, -- owner's own cleaner row; unlocks the admin view
  created_at timestamptz not null default now()
);

alter table cleaners enable row level security;

create table if not exists cleaner_sessions (
  token text primary key,
  cleaner_id uuid references cleaners(id) on delete cascade not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);

create index if not exists cleaner_sessions_cleaner_id_idx on cleaner_sessions(cleaner_id);

alter table cleaner_sessions enable row level security;

-- Per-property flat payout amount for a completed cleaning job. Owner sets these
-- in the admin view; jobs snapshot the rate at creation time onto cleaning_jobs.
create table if not exists property_cleaning_rates (
  property_slug text primary key,
  amount numeric(10,2) not null default 0,
  updated_at timestamptz not null default now()
);

alter table property_cleaning_rates enable row level security;

create table if not exists cleaning_jobs (
  id uuid primary key default gen_random_uuid(),
  property_slug text not null,
  property_name text not null,
  hospitable_reservation_uuid text unique, -- null for manually created jobs
  checkout_date date not null,
  status text not null default 'open', -- open | claimed | completed | cancelled
  claimed_by uuid references cleaners(id),
  claimed_at timestamptz,
  completed_at timestamptz,
  payout_amount numeric(10,2) not null default 0,
  payout_status text not null default 'unpaid', -- unpaid | paid
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  constraint cleaning_jobs_status_check check (status in ('open', 'claimed', 'completed', 'cancelled')),
  constraint cleaning_jobs_payout_status_check check (payout_status in ('unpaid', 'paid'))
);

create index if not exists cleaning_jobs_status_idx on cleaning_jobs(status);
create index if not exists cleaning_jobs_claimed_by_idx on cleaning_jobs(claimed_by);
create index if not exists cleaning_jobs_checkout_date_idx on cleaning_jobs(checkout_date);

alter table cleaning_jobs enable row level security;

create table if not exists cleaner_push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  cleaner_id uuid references cleaners(id) on delete cascade not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

create index if not exists cleaner_push_subscriptions_cleaner_id_idx on cleaner_push_subscriptions(cleaner_id);

alter table cleaner_push_subscriptions enable row level security;
