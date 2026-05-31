create table bookings (
  id                              uuid primary key default gen_random_uuid(),
  created_at                      timestamptz not null default now(),
  property_slug                   text not null,
  hospitable_property_id          text not null,
  guest_name                      text,
  guest_first_name                text,
  guest_last_name                 text,
  guest_email                     text,
  guest_phone                     text,
  check_in                        date not null,
  check_out                       date not null,
  nights                          integer not null,
  guests                          integer not null default 1,
  currency                        text not null default 'USD',
  total_cents                     integer not null,
  deposit_cents                   integer not null,
  balance_cents                   integer not null default 0,
  balance_due_date                date not null,
  deposit_paid                    boolean not null default false,
  balance_paid                    boolean not null default false,
  stripe_customer_id              text,
  stripe_payment_method_id        text,
  stripe_checkout_session_id      text,
  stripe_deposit_payment_intent_id text,
  stripe_balance_payment_intent_id text,
  hospitable_reservation_id       text,
  status                          text not null default 'pending'
                                    check (status in ('pending','confirmed','cancelled','completed')),
  cancellation_date               timestamptz,
  refund_amount_cents             integer,
  stripe_refund_id                text
);

create index bookings_status_idx         on bookings (status);
create index bookings_balance_due_idx    on bookings (balance_due_date) where balance_paid = false;
create index bookings_session_idx        on bookings (stripe_checkout_session_id);
create index bookings_guest_email_idx    on bookings (guest_email);
create index bookings_check_in_idx      on bookings (check_in);
