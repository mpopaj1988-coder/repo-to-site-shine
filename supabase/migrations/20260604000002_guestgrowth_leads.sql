create table if not exists guestgrowth_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  num_properties text,
  listing_url text,
  package text,
  message text,
  source text default 'guestgrowth-landing',
  created_at timestamptz not null default now()
);
