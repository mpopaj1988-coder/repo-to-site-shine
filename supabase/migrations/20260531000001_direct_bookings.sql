create table if not exists public.direct_bookings (
  id uuid primary key default gen_random_uuid(),
  stripe_session_id text unique not null,
  stripe_payment_intent_id text,
  property_slug text not null,
  property_name text not null,
  hospitable_property_id text,
  check_in date not null,
  check_out date not null,
  nights integer not null,
  total_cents integer not null,
  currency text not null default 'USD',
  guest_name text not null,
  guest_email text not null,
  guest_count integer not null default 1,
  hospitable_reservation_id text,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.direct_bookings enable row level security;

create index direct_bookings_guest_email_idx on public.direct_bookings (guest_email);
create index direct_bookings_property_slug_idx on public.direct_bookings (property_slug);
create index direct_bookings_status_idx on public.direct_bookings (status);
