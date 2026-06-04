-- SaaS: host_profiles and host_properties tables
-- Enables multi-tenant WiFi guest guide product

-- Host profiles (one per Supabase auth user)
create table if not exists host_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade unique not null,
  email text not null,
  full_name text,
  stripe_customer_id text unique,
  subscription_status text not null default 'inactive', -- inactive | trialing | active | past_due | canceled
  subscription_id text unique,
  trial_ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table host_profiles enable row level security;

create policy "host_profiles_select_own"
  on host_profiles for select
  using (auth.uid() = user_id);

create policy "host_profiles_insert_own"
  on host_profiles for insert
  with check (auth.uid() = user_id);

create policy "host_profiles_update_own"
  on host_profiles for update
  using (auth.uid() = user_id);

-- Properties managed by hosts
create table if not exists host_properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid references host_profiles(id) on delete cascade not null,
  slug text not null,
  property_name text not null,
  wifi_network text not null default '',
  wifi_password text not null default '',
  check_in_time text not null default '4:00 PM',
  checkout_time text not null default '10:00 AM',
  parking text,
  trash text,
  emergency_contact text not null default '',
  notes jsonb not null default '[]'::jsonb,
  guide_slug text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint host_properties_slug_unique unique (slug)
);

create index if not exists host_properties_host_id_idx on host_properties(host_id);
create index if not exists host_properties_slug_idx on host_properties(slug);

alter table host_properties enable row level security;

-- Hosts manage their own properties
create policy "host_properties_select_own"
  on host_properties for select
  using (
    host_id in (select id from host_profiles where user_id = auth.uid())
  );

create policy "host_properties_insert_own"
  on host_properties for insert
  with check (
    host_id in (select id from host_profiles where user_id = auth.uid())
  );

create policy "host_properties_update_own"
  on host_properties for update
  using (
    host_id in (select id from host_profiles where user_id = auth.uid())
  );

create policy "host_properties_delete_own"
  on host_properties for delete
  using (
    host_id in (select id from host_profiles where user_id = auth.uid())
  );

-- Public read for active properties (WiFi guide lookup)
create policy "host_properties_public_select"
  on host_properties for select
  using (is_active = true);

-- Updated_at trigger (reuse if function exists, else create)
create or replace function handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger host_profiles_updated_at
  before update on host_profiles
  for each row execute function handle_updated_at();

create trigger host_properties_updated_at
  before update on host_properties
  for each row execute function handle_updated_at();
