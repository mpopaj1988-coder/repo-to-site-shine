-- Host leads from the GuestGrowth landing page
create table if not exists guestgrowth_leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  num_properties text,
  listing_url text,
  package text,              -- 'qr-guide' | 'email-automation' | 'booking-site' | 'unsure'
  message text,
  source text default 'guestgrowth-landing',
  created_at timestamptz not null default now()
);

create index if not exists guestgrowth_leads_email_idx on guestgrowth_leads(email);
create index if not exists guestgrowth_leads_created_idx on guestgrowth_leads(created_at desc);

-- No RLS needed — server-side only via service role key
