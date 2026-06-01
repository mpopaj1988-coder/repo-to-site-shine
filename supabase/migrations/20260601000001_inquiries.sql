create table if not exists inquiries (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  property_interest text,
  check_in date,
  check_out date,
  message text not null,
  source text,
  utm_source text,
  utm_medium text,
  utm_campaign text
);

alter table inquiries enable row level security;

-- Service role can read/write; no public access
create policy "service role full access" on inquiries
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
